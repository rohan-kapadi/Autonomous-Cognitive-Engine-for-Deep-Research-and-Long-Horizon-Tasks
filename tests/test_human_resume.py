"""Tests for human approval, checkpoint interruption, and replanning in Temporal ACEResearchWorkflow."""

import asyncio
import os
import sys

import pytest

# Ensure src and root are in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "src")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from temporalio import activity
from temporalio.testing import WorkflowEnvironment
from temporalio.worker import Worker

from temporal_integration.schemas import (
    ApprovalDecision,
    FinalResearchOutput,
    ResearchWorkflowInput,
    ResearchWorkflowResult,
    ResumeResearchInput,
    ScopingOutput,
)
from temporal_integration.workflows import ACEResearchWorkflow


@activity.defn(name="run_scoping_and_planning_activity")
async def mock_scoping_pause_activity(request: ResearchWorkflowInput) -> ScopingOutput:
    return ScopingOutput(
        thread_id=request.thread_id or "test-pause-thread-01",
        objective=request.objective,
        research_brief="Initial brief for AI safety and memory architectures",
        research_plan="Initial plan: Section 1 Memory, Section 2 Safety",
        status="paused",
        is_paused=True,
        cognitive_snapshot={
            "objective": request.objective,
            "research_brief": "Initial brief for AI safety and memory architectures",
            "research_plan": "Initial plan: Section 1 Memory, Section 2 Safety",
            "status": "paused",
            "_next_nodes": ["checkpoint_and_resume"],
        },
    )


_last_received_resume_arg = None

@activity.defn(name="execute_research_and_report_activity")
async def mock_research_track_resume(input_data: ResumeResearchInput) -> FinalResearchOutput:
    global _last_received_resume_arg
    _last_received_resume_arg = input_data.resume_arg_json

    return FinalResearchOutput(
        thread_id=input_data.thread_id,
        final_report=f"# Final Report\n\nResumed with payload: {input_data.resume_arg_json}",
        report_filepath=f"/tmp/reports/{input_data.thread_id}.md",
        status="complete",
        cognitive_snapshot={
            "status": "complete",
            "final_report": f"# Final Report\n\nResumed with payload: {input_data.resume_arg_json}",
        },
    )


@pytest.mark.asyncio
async def test_workflow_pauses_and_resumes_with_approval():
    """Verify that the workflow pauses at the cognitive checkpoint and resumes when approved."""
    async with await WorkflowEnvironment.start_time_skipping() as env:
        worker = Worker(
            env.client,
            task_queue="human-resume-queue",
            workflows=[ACEResearchWorkflow],
            activities=[mock_scoping_pause_activity, mock_research_track_resume],
        )
        async with worker:
            input_data = ResearchWorkflowInput(
                objective="Investigate persistent cognitive checkpoints in agents",
                thread_id="test-pause-resume-thread",
                auto_approve=False,  # Human approval required
            )

            handle = await env.client.start_workflow(
                ACEResearchWorkflow.run,
                input_data,
                id="test-wf-human-001",
                task_queue="human-resume-queue",
            )

            # Wait for workflow to reach paused state
            for _ in range(20):
                is_waiting = await handle.query(ACEResearchWorkflow.is_waiting_for_approval)
                status = await handle.query(ACEResearchWorkflow.get_status)
                if is_waiting and status == "paused":
                    break
                await asyncio.sleep(0.1)

            assert is_waiting is True
            assert status == "paused"

            # Query cognitive state at the pause
            state = await handle.query(ACEResearchWorkflow.get_cognitive_state)
            assert state.get("status") == "paused"
            assert "Initial plan" in state.get("research_plan", "")

            # Send human approval signal
            await handle.signal(
                ACEResearchWorkflow.submit_approval,
                ApprovalDecision(approved=True),
            )

            result: ResearchWorkflowResult = await handle.result()
            assert result.status == "complete"
            assert result.approved is True
            assert result.replan_instruction is None
            assert "Final Report" in result.final_report


@pytest.mark.asyncio
async def test_workflow_resumes_with_replanning_directive():
    """Verify that a replan directive submitted via signal overrides the research direction."""
    global _last_received_resume_arg
    _last_received_resume_arg = None

    async with await WorkflowEnvironment.start_time_skipping() as env:
        worker = Worker(
            env.client,
            task_queue="human-replan-queue",
            workflows=[ACEResearchWorkflow],
            activities=[mock_scoping_pause_activity, mock_research_track_resume],
        )
        async with worker:
            input_data = ResearchWorkflowInput(
                objective="General study of agent memory",
                thread_id="test-replan-thread",
                auto_approve=False,
            )

            handle = await env.client.start_workflow(
                ACEResearchWorkflow.run,
                input_data,
                id="test-wf-replan-001",
                task_queue="human-replan-queue",
            )

            # Wait until paused
            for _ in range(20):
                if await handle.query(ACEResearchWorkflow.is_waiting_for_approval):
                    break
                await asyncio.sleep(0.1)

            # Send replan directive
            replan_instruction = "Narrow focus strictly to Redis vs Postgres for agent checkpoints."
            await handle.signal(
                ACEResearchWorkflow.submit_approval,
                ApprovalDecision(approved=True, replan=replan_instruction),
            )

            result: ResearchWorkflowResult = await handle.result()
            assert result.status == "complete"
            assert result.approved is True
            assert result.replan_instruction == replan_instruction
            assert replan_instruction in _last_received_resume_arg


@pytest.mark.asyncio
async def test_workflow_handles_rejection_cleanly():
    """Verify that rejecting a plan stops execution and does not run research."""
    async with await WorkflowEnvironment.start_time_skipping() as env:
        worker = Worker(
            env.client,
            task_queue="human-reject-queue",
            workflows=[ACEResearchWorkflow],
            activities=[mock_scoping_pause_activity, mock_research_track_resume],
        )
        async with worker:
            input_data = ResearchWorkflowInput(
                objective="A topic that will be rejected by the reviewer",
                thread_id="test-reject-thread",
                auto_approve=False,
            )

            handle = await env.client.start_workflow(
                ACEResearchWorkflow.run,
                input_data,
                id="test-wf-reject-001",
                task_queue="human-reject-queue",
            )

            for _ in range(20):
                if await handle.query(ACEResearchWorkflow.is_waiting_for_approval):
                    break
                await asyncio.sleep(0.1)

            # Reject the plan
            await handle.signal(
                ACEResearchWorkflow.submit_approval,
                ApprovalDecision(approved=False, feedback="Topic out of scope for current sprint"),
            )

            result: ResearchWorkflowResult = await handle.result()
            assert result.status == "rejected"
            assert result.approved is False
            assert "rejected" in result.final_report.lower()
