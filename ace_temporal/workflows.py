"""ACE research workflow: durable, human-in-the-loop, long-horizon research.

Activities are referenced by name so this module never imports LangChain,
keeping the workflow sandbox deterministic and fast.

Interaction (see ``ace_temporal.cli``):
  - signal ``clarify(answer)``      answer the agent's clarifying question
  - signal ``approve()``            approve the research plan at the checkpoint
  - signal ``replan(objective)``    replace the objective; ACE re-plans and pauses again
  - query  ``cognitive_state()``    live ACE cognitive state snapshot
"""

from datetime import timedelta

from temporalio import workflow
from temporalio.common import RetryPolicy

LLM_RETRY = RetryPolicy(
    initial_interval=timedelta(seconds=5),
    backoff_coefficient=2.0,
    maximum_interval=timedelta(minutes=1),
    maximum_attempts=5,
)


@workflow.defn
class ACEResearchWorkflow:
    """Scope -> human checkpoint -> multi-agent research -> report -> save."""

    def __init__(self) -> None:
        self._messages: list[dict] = []
        self._pending_answer: str | None = None
        self._approved = False
        self._replan: str | None = None
        self._state: dict = {
            "status": "pending",
            "objective": "",
            "research_plan": "",
            "tasks": [],
            "completed_tasks": [],
            "decisions": [],
            "clarifying_question": None,
            "report_path": None,
        }

    # ----- signals & queries -----

    @workflow.signal
    def clarify(self, answer: str) -> None:
        self._pending_answer = answer

    @workflow.signal
    def approve(self) -> None:
        self._approved = True

    @workflow.signal
    def replan(self, objective: str) -> None:
        self._replan = objective

    @workflow.query
    def cognitive_state(self) -> dict:
        return self._state

    # ----- helpers -----

    def _decide(self, decision: str) -> None:
        self._state["decisions"].append(decision)

    async def _scope_until_planned(self) -> str:
        """Run scoping, looping through clarifying questions until a brief exists."""
        while True:
            self._state["status"] = "scoping"
            result = await workflow.execute_activity(
                "scope_objective",
                self._messages,
                start_to_close_timeout=timedelta(minutes=5),
                retry_policy=LLM_RETRY,
            )
            if not result["need_clarification"]:
                break

            question = result["question"]
            self._messages.append({"role": "ai", "content": question})
            self._state.update(status="awaiting_clarification", clarifying_question=question)
            await workflow.wait_condition(lambda: self._pending_answer is not None)
            self._messages.append({"role": "human", "content": self._pending_answer})
            self._decide(f"User clarified: {self._pending_answer[:120]}")
            self._pending_answer = None
            self._state["clarifying_question"] = None

        cognitive = result["cognitive_state"]
        self._state.update(
            status="planning",
            objective=cognitive["objective"],
            research_plan=cognitive["research_plan"],
        )
        self._decide(cognitive["decisions"][0])
        return result["research_brief"]

    # ----- main flow -----

    @workflow.run
    async def run(self, objective: str, auto_approve: bool = False) -> dict:
        self._messages = [{"role": "human", "content": objective}]
        brief = await self._scope_until_planned()

        # Human-in-the-loop checkpoint. Temporal persists this wait, so the
        # workflow can sit here for minutes or days and survive restarts.
        while not auto_approve:
            self._state["status"] = "paused"
            await workflow.wait_condition(lambda: self._approved or self._replan is not None)
            if self._approved:
                self._decide("User approved the research plan at checkpoint")
                break
            new_objective, self._replan = self._replan, None
            self._decide(f"User replanned at checkpoint: {new_objective[:120]}")
            self._messages = [{"role": "human", "content": new_objective}]
            brief = await self._scope_until_planned()

        self._state["status"] = "researching"
        research = await workflow.execute_activity(
            "run_research",
            brief,
            start_to_close_timeout=timedelta(minutes=90),
            heartbeat_timeout=timedelta(seconds=20),
            retry_policy=LLM_RETRY,
        )
        self._state.update(tasks=research["tasks"], completed_tasks=research["tasks"])
        self._decide(f"Research finished: {len(research['notes'])} note(s) from {len(research['tasks'])} sub-task(s)")

        self._state["status"] = "writing_report"
        report = await workflow.execute_activity(
            "write_report",
            args=[brief, research["notes"]],
            start_to_close_timeout=timedelta(minutes=10),
            heartbeat_timeout=timedelta(seconds=20),
            retry_policy=LLM_RETRY,
        )

        path = await workflow.execute_activity(
            "save_report",
            report,
            start_to_close_timeout=timedelta(minutes=1),
        )
        self._state.update(status="complete", report_path=path)
        return {"report_path": path, "report": report, "cognitive_state": self._state}
