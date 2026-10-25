"""Test the ACE Temporal workflow with stub activities (no API keys needed).

Covers: clarification signal, checkpoint pause, replan, approve, activity retry.

    uv run python test_temporal_workflow.py
"""

import asyncio
import uuid

from temporalio import activity
from temporalio.testing import WorkflowEnvironment
from temporalio.worker import Worker

from ace_temporal.workflows import ACEResearchWorkflow

research_attempts = 0


@activity.defn(name="scope_objective")
async def fake_scope(messages: list[dict]) -> dict:
    if len(messages) == 1 and "vague" in messages[0]["content"]:
        return {"need_clarification": True, "question": "Which aspect should I focus on?"}
    objective = messages[0]["content"]
    return {
        "need_clarification": False,
        "verification": "Starting research.",
        "research_brief": f"BRIEF: {messages[-1]['content']}",
        "cognitive_state": {
            "objective": objective,
            "research_plan": f"BRIEF: {messages[-1]['content']}",
            "decisions": ["Research plan finalised"],
        },
    }


@activity.defn(name="run_research")
async def fake_research(brief: str) -> dict:
    global research_attempts
    research_attempts += 1
    if research_attempts == 1:
        raise RuntimeError("simulated worker failure / rate limit")
    return {"notes": [f"note for {brief}"], "raw_notes_count": 1, "tasks": ["topic A"]}


@activity.defn(name="write_report")
async def fake_report(brief: str, notes: list[str]) -> str:
    return f"# Report\n{brief}\n{notes}"


@activity.defn(name="save_report")
async def fake_save(report: str) -> str:
    return "/tmp/report.md"


async def wait_for_status(handle, status: str) -> dict:
    for _ in range(100):
        state = await handle.query(ACEResearchWorkflow.cognitive_state)
        if state["status"] == status:
            return state
        await asyncio.sleep(0.1)
    raise AssertionError(f"workflow never reached status {status!r}, last: {state}")


async def main() -> None:
    async with await WorkflowEnvironment.start_local() as env:
        async with Worker(
            env.client,
            task_queue="test-ace",
            workflows=[ACEResearchWorkflow],
            activities=[fake_scope, fake_research, fake_report, fake_save],
        ):
            handle = await env.client.start_workflow(
                ACEResearchWorkflow.run,
                args=["something vague", False],
                id=f"test-{uuid.uuid4().hex[:6]}",
                task_queue="test-ace",
            )

            state = await wait_for_status(handle, "awaiting_clarification")
            assert state["clarifying_question"] == "Which aspect should I focus on?"
            await handle.signal(ACEResearchWorkflow.clarify, "focus on checkpointing")

            state = await wait_for_status(handle, "paused")
            assert state["research_plan"] == "BRIEF: focus on checkpointing"

            await handle.signal(ACEResearchWorkflow.replan, "durable agents")
            await asyncio.sleep(0.5)
            state = await wait_for_status(handle, "paused")
            assert state["research_plan"] == "BRIEF: durable agents", state

            await handle.signal(ACEResearchWorkflow.approve)
            result = await handle.result()

    assert research_attempts == 2, research_attempts
    assert result["report_path"] == "/tmp/report.md"
    assert result["cognitive_state"]["status"] == "complete"
    assert "BRIEF: durable agents" in result["report"]
    print("Decisions:", *result["cognitive_state"]["decisions"], sep="\n  - ")
    print("\nAll Temporal workflow checks passed")


if __name__ == "__main__":
    asyncio.run(main())
