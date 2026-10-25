"""Temporal Client interface for starting and interacting with ACE Research Workflows."""

import uuid
from typing import Any

from temporalio.client import Client, WorkflowHandle

from temporal_integration.config import (
    TemporalConfig,
    get_langsmith_plugin,
    get_temporal_config,
)
from temporal_integration.schemas import (
    ApprovalDecision,
    ResearchWorkflowInput,
    ResearchWorkflowResult,
)
from temporal_integration.workflows import ACEResearchWorkflow


class ACEWorkflowClient:
    """High-level client for launching, querying, and resuming ACE workflows on Temporal."""

    def __init__(self, client: Client, config: TemporalConfig):
        """Initialize ACEWorkflowClient with connected Temporal client and config."""
        self.client = client
        self.config = config

    @classmethod
    async def connect(cls, config: TemporalConfig | None = None) -> "ACEWorkflowClient":
        """Connect to Temporal Server using configured address, namespace, and LangSmith plugin."""
        if config is None:
            config = get_temporal_config()

        plugins = []
        langsmith_plugin = get_langsmith_plugin(config)
        if langsmith_plugin:
            plugins.append(langsmith_plugin)

        client = await Client.connect(
            config.temporal_address,
            namespace=config.temporal_namespace,
            plugins=plugins,
        )
        return cls(client, config)

    async def start_research(
        self,
        objective: str,
        workflow_id: str | None = None,
        thread_id: str | None = None,
        auto_approve: bool = False,
        max_research_iterations: int = 2,
        metadata: dict[str, str] | None = None,
        tags: list[str] | None = None,
    ) -> WorkflowHandle:
        """Start a new ACE research workflow and return its execution handle."""
        if not workflow_id:
            workflow_id = f"{self.config.workflow_id_prefix}-{uuid.uuid4().hex[:8]}"

        input_data = ResearchWorkflowInput(
            objective=objective,
            thread_id=thread_id or "",
            auto_approve=auto_approve,
            max_research_iterations=max_research_iterations,
            metadata=metadata or {},
            tags=tags or [],
        )

        handle = await self.client.start_workflow(
            ACEResearchWorkflow.run,
            input_data,
            id=workflow_id,
            task_queue=self.config.temporal_task_queue,
        )
        return handle

    def get_handle(self, workflow_id: str) -> WorkflowHandle:
        """Retrieve existing workflow handle by ID."""
        return self.client.get_workflow_handle(workflow_id)

    async def get_cognitive_state(self, workflow_id: str) -> dict[str, Any]:
        """Query the latest cognitive state snapshot from a running or paused workflow."""
        handle = self.get_handle(workflow_id)
        return await handle.query(ACEResearchWorkflow.get_cognitive_state)

    async def get_status(self, workflow_id: str) -> str:
        """Query the current lifecycle status of the workflow."""
        handle = self.get_handle(workflow_id)
        return await handle.query(ACEResearchWorkflow.get_status)

    async def is_waiting_for_approval(self, workflow_id: str) -> bool:
        """Check whether the workflow is paused at the cognitive checkpoint."""
        handle = self.get_handle(workflow_id)
        return await handle.query(ACEResearchWorkflow.is_waiting_for_approval)

    async def submit_approval(
        self,
        workflow_id: str,
        approved: bool = True,
        replan: str | None = None,
        feedback: str | None = None,
    ) -> None:
        """Signal the paused workflow with a human approval, replanning, or rejection decision."""
        handle = self.get_handle(workflow_id)
        decision = ApprovalDecision(approved=approved, replan=replan, feedback=feedback)
        await handle.signal(ACEResearchWorkflow.submit_approval, decision)

    async def wait_for_result(self, workflow_id: str) -> ResearchWorkflowResult:
        """Wait for the workflow to complete execution and return its result."""
        handle = self.get_handle(workflow_id)
        return await handle.result()
