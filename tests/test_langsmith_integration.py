"""Tests verifying LangSmith observability plugin integration with Temporal workflows and workers."""

import os
import sys
from unittest.mock import patch

import pytest

# Ensure src and root are in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "src")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from temporalio import activity
from temporalio.contrib.langsmith import LangSmithPlugin
from temporalio.testing import WorkflowEnvironment
from temporalio.worker import Worker

from temporal_integration.config import (
    get_langsmith_plugin,
    get_temporal_config,
)
from temporal_integration.schemas import (
    FinalResearchOutput,
    ResearchWorkflowInput,
    ResumeResearchInput,
    ScopingOutput,
)
from temporal_integration.workflows import ACEResearchWorkflow


@activity.defn(name="run_scoping_and_planning_activity")
async def mock_obs_scoping(request: ResearchWorkflowInput) -> ScopingOutput:
    return ScopingOutput(
        thread_id="test-obs-thread",
        objective=request.objective,
        research_brief="Obs brief",
        research_plan="Obs plan",
        status="paused",
        is_paused=True,
        cognitive_snapshot={"objective": request.objective, "status": "paused"},
    )


@activity.defn(name="execute_research_and_report_activity")
async def mock_obs_research(input_data: ResumeResearchInput) -> FinalResearchOutput:
    thread_id = input_data.thread_id if hasattr(input_data, "thread_id") else input_data.get("thread_id", "test-obs-thread")
    return FinalResearchOutput(
        thread_id=thread_id,
        final_report="Observability verified report",
        status="complete",
        cognitive_snapshot={"status": "complete"},
    )


def test_langsmith_plugin_creation_and_config():
    """Verify that LangSmithPlugin initializes with matching project name and add_temporal_runs=True."""
    with patch.dict(os.environ, {
        "LANGSMITH_PROJECT": "ace-test-project",
        "LANGCHAIN_TRACING_V2": "true",
    }):
        config = get_temporal_config()
        assert config.langsmith_project == "ace-test-project"
        assert config.tracing_enabled is True
        assert config.add_temporal_runs is True

        plugin = get_langsmith_plugin(config)
        assert plugin is not None
        assert isinstance(plugin, LangSmithPlugin)


def test_langsmith_plugin_disabled_when_tracing_false():
    """Verify that when tracing is explicitly disabled, get_langsmith_plugin returns None."""
    with patch.dict(os.environ, {
        "LANGCHAIN_TRACING_V2": "false",
    }):
        config = get_temporal_config()
        assert config.tracing_enabled is False
        plugin = get_langsmith_plugin(config)
        assert plugin is None


@pytest.mark.asyncio
async def test_workflow_runs_with_langsmith_plugin_attached():
    """Verify that Temporal Client and Worker execute workflow with LangSmithPlugin attached."""
    project_name = "ace-temporal-test-run"
    plugin = LangSmithPlugin(project_name=project_name, add_temporal_runs=True)

    async with await WorkflowEnvironment.start_time_skipping() as env:
        worker = Worker(
            env.client,
            task_queue="langsmith-queue",
            workflows=[ACEResearchWorkflow],
            activities=[mock_obs_scoping, mock_obs_research],
            plugins=[plugin],
        )
        async with worker:
            input_data = ResearchWorkflowInput(
                objective="Observe Temporal and LangSmith integration traces",
                auto_approve=True,
            )
            result = await env.client.execute_workflow(
                ACEResearchWorkflow.run,
                input_data,
                id="test-wf-obs-001",
                task_queue="langsmith-queue",
            )
            assert result.status == "complete"
            assert result.final_report == "Observability verified report"
