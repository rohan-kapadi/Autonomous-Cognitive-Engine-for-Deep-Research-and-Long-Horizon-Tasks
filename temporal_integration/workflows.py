"""Durable Temporal Workflow Orchestrating the Autonomous Cognitive Engine (ACE).

The Workflow acts as the durable coordinator:
- Schedules failure-isolated activities for LLM calls and multi-agent search.
- Durably pauses at the cognitive checkpoint for human approval or replanning.
- Exposes real-time state inspection via Temporal Queries.
- Accepts human decisions via Temporal Signals without busy-polling.
"""

import json
from datetime import timedelta

from temporalio import workflow
from temporalio.common import RetryPolicy

from temporal_integration.schemas import (
    ApprovalDecision,
    FinalResearchOutput,
    ResearchWorkflowInput,
    ResearchWorkflowResult,
    ResumeResearchInput,
    ScopingOutput,
)


@workflow.defn(sandboxed=False)
class ACEResearchWorkflow:
    """Durable workflow coordinating long-horizon ACE research execution."""

    def __init__(self) -> None:
        """Initialize ACEResearchWorkflow instance state."""
        self._status: str = "pending"
        self._objective: str = ""
        self._thread_id: str = ""
        self._scoping_output: ScopingOutput | None = None
        self._final_output: FinalResearchOutput | None = None
        self._approval_decision: ApprovalDecision | None = None
        self._replan_directive: str | None = None

    @workflow.run
    async def run(self, input_data: ResearchWorkflowInput) -> ResearchWorkflowResult:
        """Run the end-to-end durable research workflow."""
        self._objective = input_data.objective
        self._thread_id = input_data.thread_id
        self._status = "scoping"

        workflow_id = workflow.info().workflow_id
        workflow.logger.info(
            f"[Workflow:{workflow_id}] Starting ACE research workflow for objective: "
            f"'{self._objective[:80]}...'"
        )

        # Standard Activity Retry Policy for transient network / model quota hiccups
        activity_retry_policy = RetryPolicy(
            initial_interval=timedelta(seconds=2),
            backoff_coefficient=2.0,
            maximum_attempts=3,
            non_retryable_error_types=["ApplicationError", "ValueError"],
        )

        # -------------------------------------------------------------
        # STAGE 1: Scoping and Cognitive Brief Generation
        # -------------------------------------------------------------
        workflow.logger.info(f"[Workflow:{workflow_id}] Executing scoping activity...")
        self._scoping_output = await workflow.execute_activity(
            "run_scoping_and_planning_activity",
            input_data,
            start_to_close_timeout=timedelta(minutes=10),
            retry_policy=activity_retry_policy,
            result_type=ScopingOutput,
        )

        self._thread_id = self._scoping_output.thread_id

        # If scoping did not pause because it requested clarification from the user
        if not self._scoping_output.is_paused and not self._scoping_output.research_plan:
            self._status = "clarification_needed"
            clarification_msg = self._scoping_output.cognitive_snapshot.get(
                "clarification_question",
                "User clarification is required before generating a research plan."
            )
            workflow.logger.info(
                f"[Workflow:{workflow_id}] Scoping requested user clarification: '{clarification_msg}'"
            )
            return ResearchWorkflowResult(
                workflow_id=workflow_id,
                thread_id=self._thread_id,
                status="clarification_needed",
                objective=self._objective,
                final_report=clarification_msg,
                report_filepath=None,
                cognitive_state=self._scoping_output.cognitive_snapshot,
                approved=False,
                error_message=clarification_msg,
            )

        # -------------------------------------------------------------
        # STAGE 2: Human-in-the-Loop Approval & Replanning Checkpoint
        # -------------------------------------------------------------
        resume_arg = "true"


        if not input_data.auto_approve and self._scoping_output.is_paused:
            self._status = "paused"
            workflow.logger.info(
                f"[Workflow:{workflow_id}] Graph paused at cognitive checkpoint. "
                "Waiting for human approval or replanning signal..."
            )

            # Durable wait: workflow goes to sleep on Temporal server with 0 CPU cost
            await workflow.wait_condition(lambda: self._approval_decision is not None)

            decision = self._approval_decision
            workflow.logger.info(
                f"[Workflow:{workflow_id}] Approval signal received! Approved={decision.approved}, "
                f"Replan='{decision.replan}'"
            )

            if not decision.approved:
                self._status = "rejected"
                return ResearchWorkflowResult(
                    workflow_id=workflow_id,
                    thread_id=self._thread_id,
                    status="rejected",
                    objective=self._objective,
                    final_report="Research was rejected at the human approval checkpoint.",
                    report_filepath=None,
                    cognitive_state=self._scoping_output.cognitive_snapshot,
                    approved=False,
                    replan_instruction=decision.feedback,
                    error_message="User rejected the research plan.",
                )

            if decision.replan:
                self._replan_directive = decision.replan
                resume_arg = json.dumps({"replan": decision.replan})
            else:
                resume_arg = "true"

        # -------------------------------------------------------------
        # STAGE 3: Multi-Agent Research Execution & Final Synthesis
        # -------------------------------------------------------------
        self._status = "researching"
        workflow.logger.info(f"[Workflow:{workflow_id}] Resuming research execution activity...")

        resume_input = ResumeResearchInput(
            thread_id=self._thread_id,
            resume_arg_json=resume_arg,
        )

        self._final_output = await workflow.execute_activity(
            "execute_research_and_report_activity",
            resume_input,
            start_to_close_timeout=timedelta(minutes=30),
            retry_policy=activity_retry_policy,
            result_type=FinalResearchOutput,
        )

        self._status = "complete"
        workflow.logger.info(f"[Workflow:{workflow_id}] ACE research workflow completed successfully!")

        return ResearchWorkflowResult(
            workflow_id=workflow_id,
            thread_id=self._thread_id,
            status=self._final_output.status,
            objective=self._final_output.cognitive_snapshot.get("objective", self._objective),
            final_report=self._final_output.final_report,
            report_filepath=self._final_output.report_filepath,
            cognitive_state=self._final_output.cognitive_snapshot,
            approved=True,
            replan_instruction=self._replan_directive,
        )

    # -----------------------------------------------------------------
    # Signals (External interactions during execution)
    # -----------------------------------------------------------------

    @workflow.signal
    def submit_approval(self, decision: ApprovalDecision) -> None:
        """Signal workflow with human approval or replanning directive."""
        self._approval_decision = decision

    # -----------------------------------------------------------------
    # Queries (Real-time read-only inspection of workflow state)
    # -----------------------------------------------------------------

    @workflow.query
    def get_cognitive_state(self) -> dict:
        """Query the latest ACE cognitive state snapshot."""
        if self._final_output and self._final_output.cognitive_snapshot:
            return self._final_output.cognitive_snapshot
        if self._scoping_output and self._scoping_output.cognitive_snapshot:
            return self._scoping_output.cognitive_snapshot
        return {
            "objective": self._objective,
            "status": self._status,
            "thread_id": self._thread_id,
        }

    @workflow.query
    def get_status(self) -> str:
        """Query current workflow status ('pending', 'scoping', 'paused', 'researching', 'complete')."""
        return self._status

    @workflow.query
    def is_waiting_for_approval(self) -> bool:
        """Query whether the workflow is currently paused awaiting human input."""
        return self._status == "paused" and self._approval_decision is None
