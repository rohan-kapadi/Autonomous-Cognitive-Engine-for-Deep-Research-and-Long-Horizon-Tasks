"""Temporal Workflow and Worker execution tests using Temporal's WorkflowEnvironment."""

import os
import sys

import pytest

# Ensure src and root are in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "src")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from temporalio import activity
from temporalio.client import WorkflowFailureError
from temporalio.exceptions import ApplicationError
from temporalio.testing import WorkflowEnvironment
from temporalio.worker import Worker

from temporal_integration.schemas import (
    FinalResearchOutput,
    ResearchWorkflowInput,
    ResearchWorkflowResult,
    ResumeResearchInput,
    ScopingOutput,
)
from temporal_integration.workflows import ACEResearchWorkflow


# Mocks for activities to ensure automated tests are fast and do not make paid API calls
@activity.defn(name="run_scoping_and_planning_activity")
async def mock_scoping_activity(request: ResearchWorkflowInput) -> ScopingOutput:
    if not request.objective or not request.objective.strip():
        raise ApplicationError("Research objective cannot be empty.", non_retryable=True)

    thread_id = request.thread_id or "test-thread-mock-1"
    return ScopingOutput(
        thread_id=thread_id,
        objective=request.objective,
        research_brief=f"Mock research brief for {request.objective}",
        research_plan=f"Mock plan for {request.objective}",
        status="paused",
        is_paused=True,
        cognitive_snapshot={
            "objective": request.objective,
            "research_plan": f"Mock plan for {request.objective}",
            "status": "paused",
            "_next_nodes": ["checkpoint_and_resume"],
        },
    )


@activity.defn(name="execute_research_and_report_activity")
async def mock_research_activity(input_data: ResumeResearchInput) -> FinalResearchOutput:
    return FinalResearchOutput(
        thread_id=input_data.thread_id,
        final_report=f"# Final Report\n\nCompleted research for thread {input_data.thread_id}.",
        report_filepath=f"/tmp/reports/{input_data.thread_id}.md",
        status="complete",
        cognitive_snapshot={
            "status": "complete",
            "final_report": f"# Final Report\n\nCompleted research for thread {input_data.thread_id}.",
        },
        notes_count=3,
        sources_count=2,
    )


# State for testing activity retries
_transient_attempts = 0

@activity.defn(name="run_scoping_and_planning_activity")
async def mock_failing_then_succeeding_scoping(request: ResearchWorkflowInput) -> ScopingOutput:
    global _transient_attempts
    _transient_attempts += 1
    if _transient_attempts == 1:
        # Simulate transient error (e.g. rate limit / network glitch)
        raise RuntimeError("Transient network error connecting to LLM provider (429)")

    return ScopingOutput(
        thread_id="test-retry-thread",
        objective=request.objective,
        research_brief="Recovered brief after retry",
        research_plan="Recovered plan after retry",
        status="paused",
        is_paused=True,
        cognitive_snapshot={"status": "paused", "objective": request.objective},
    )


@pytest.mark.asyncio
async def test_workflow_start_and_complete_auto_approve():
    """Verify that ACEResearchWorkflow completes end-to-end when auto_approve=True."""
    async with await WorkflowEnvironment.start_time_skipping() as env:
        worker = Worker(
            env.client,
            task_queue="test-ace-queue",
            workflows=[ACEResearchWorkflow],
            activities=[mock_scoping_activity, mock_research_activity],
        )
        async with worker:
            input_data = ResearchWorkflowInput(
                objective="Compare LangGraph and Temporal architectures",
                thread_id="test-run-001",
                auto_approve=True,
            )
            result: ResearchWorkflowResult = await env.client.execute_workflow(
                ACEResearchWorkflow.run,
                input_data,
                id="test-wf-001",
                task_queue="test-ace-queue",
            )

            assert result.status == "complete"
            assert result.approved is True
            assert result.thread_id == "test-run-001"
            assert "Final Report" in result.final_report
            assert result.cognitive_state.get("status") == "complete"


@pytest.mark.asyncio
async def test_invalid_empty_input_fails_non_retryable():
    """Verify that an empty objective immediately raises a non-retryable ApplicationError."""
    async with await WorkflowEnvironment.start_time_skipping() as env:
        worker = Worker(
            env.client,
            task_queue="test-ace-queue",
            workflows=[ACEResearchWorkflow],
            activities=[mock_scoping_activity, mock_research_activity],
        )
        async with worker:
            input_data = ResearchWorkflowInput(
                objective="",  # Empty input
                auto_approve=True,
            )
            with pytest.raises(WorkflowFailureError) as exc_info:
                await env.client.execute_workflow(
                    ACEResearchWorkflow.run,
                    input_data,
                    id="test-wf-invalid-001",
                    task_queue="test-ace-queue",
                )
            from temporalio.exceptions import ActivityError
            assert isinstance(exc_info.value.cause, ActivityError)
            app_err = exc_info.value.cause.cause
            assert isinstance(app_err, ApplicationError)
            assert "Research objective cannot be empty" in str(app_err)
            assert app_err.non_retryable is True


@pytest.mark.asyncio
async def test_transient_activity_failure_is_retried_and_succeeds():
    """Verify that a transient activity failure is retried by Temporal retry policy and succeeds."""
    global _transient_attempts
    _transient_attempts = 0

    async with await WorkflowEnvironment.start_time_skipping() as env:
        worker = Worker(
            env.client,
            task_queue="test-retry-queue",
            workflows=[ACEResearchWorkflow],
            activities=[mock_failing_then_succeeding_scoping, mock_research_activity],
        )
        async with worker:
            input_data = ResearchWorkflowInput(
                objective="Test transient retry resilience",
                thread_id="test-retry-run",
                auto_approve=True,
            )
            result = await env.client.execute_workflow(
                ACEResearchWorkflow.run,
                input_data,
                id="test-wf-retry-001",
                task_queue="test-retry-queue",
            )
            assert _transient_attempts == 2, "Activity should have succeeded on attempt 2"
            assert result.status == "complete"
            assert "Recovered brief" in result.cognitive_state.get("research_plan", "") or result.final_report
