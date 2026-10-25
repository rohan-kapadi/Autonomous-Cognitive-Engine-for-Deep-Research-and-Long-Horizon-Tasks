"""Temporal Activities wrapping the Autonomous Cognitive Engine (ACE).

Each activity represents an external, failure-prone, or nondeterministic operation
(LLM calls, Tavily searches, filesystem writes) executed with explicit timeouts,
bounded retries, and LangSmith tracing correlation.
"""

import json
import uuid

from langchain_core.messages import HumanMessage
from langgraph.types import Command
from temporalio import activity
from temporalio.exceptions import ApplicationError

from deep_research_from_scratch.generate_checkpoint import (
    ace_checkpointer,
    get_cognitive_snapshot,
)
from deep_research_from_scratch.research_agent_full import agent
from deep_research_from_scratch.state_scope import (
    ACE_STATUS_COMPLETE,
    ACE_STATUS_PAUSED,
)
from temporal_integration.schemas import (
    FinalResearchOutput,
    ResearchWorkflowInput,
    ResumeResearchInput,
    ScopingOutput,
)

# Ensure checkpointer is attached to production graph
if not agent.checkpointer:
    agent.checkpointer = ace_checkpointer


@activity.defn
async def run_scoping_and_planning_activity(
    request: ResearchWorkflowInput,
) -> ScopingOutput:
    """Execute ACE scoping, brief generation, and run up to the cognitive checkpoint pause.

    Activities execute in standard Python worker processes where external model calls
    and checkpointer writes can safely occur.
    """
    if not request.objective or not request.objective.strip():
        raise ApplicationError("Research objective cannot be empty.", non_retryable=True)

    thread_id = request.thread_id.strip() if request.thread_id else f"ace-temporal-{uuid.uuid4().hex[:8]}"
    thread_config = {
        "configurable": {"thread_id": thread_id},
        "metadata": {
            "temporal_activity": "run_scoping_and_planning",
            "workflow_managed": "true",
            **request.metadata,
        },
        "tags": ["temporal", "ace", "scoping", *request.tags],
    }

    activity.logger.info(
        f"[Activity:Scoping] Starting ACE scoping for objective: '{request.objective[:80]}...' "
        f"(thread_id={thread_id})"
    )

    # Stream graph execution until the checkpoint_and_resume interrupt is encountered
    initial_input = {"messages": [HumanMessage(content=request.objective)]}
    async for event in agent.astream(initial_input, thread_config, stream_mode="updates"):
        node_name = list(event.keys())[0] if event else "?"
        activity.logger.debug(f"[Activity:Scoping] Completed node: {node_name}")
        activity.heartbeat(f"node_completed:{node_name}")

    # Inspect current state at the checkpoint
    snapshot = get_cognitive_snapshot(agent, thread_config)
    is_paused = bool(snapshot.get("_next_nodes"))

    clarification_question: str | None = None
    if not is_paused:
        state_vals = agent.get_state(thread_config).values if agent.get_state(thread_config) else {}
        messages = state_vals.get("messages", [])
        for msg in reversed(messages):
            if hasattr(msg, "type") and msg.type == "ai":
                clarification_question = str(msg.content)
                break
        if clarification_question:
            snapshot["clarification_question"] = clarification_question

    activity.logger.info(
        f"[Activity:Scoping] Scoping phase ended. Paused at checkpoint: {is_paused}. "
        f"Status: {snapshot.get('status', 'unknown')}"
    )

    status = (
        ACE_STATUS_PAUSED
        if is_paused
        else ("clarification_needed" if clarification_question else snapshot.get("status", "scoping_complete"))
    )

    return ScopingOutput(
        thread_id=thread_id,
        objective=snapshot.get("objective", request.objective),
        research_brief=snapshot.get("research_brief", ""),
        research_plan=snapshot.get("research_plan", ""),
        status=status,
        is_paused=is_paused,
        cognitive_snapshot=snapshot,
    )



@activity.defn
async def execute_research_and_report_activity(
    input_data: ResumeResearchInput,
) -> FinalResearchOutput:
    """Resume the ACE graph from the checkpoint, executing supervisor, researchers, and report generation."""
    thread_id = input_data.thread_id
    if not thread_id:
        raise ApplicationError("thread_id must be provided to resume research.", non_retryable=True)

    thread_config = {
        "configurable": {"thread_id": thread_id},
        "metadata": {
            "temporal_activity": "execute_research_and_report",
            "workflow_managed": "true",
        },
        "tags": ["temporal", "ace", "research", "report"],
    }

    # Parse resume payload
    try:
        resume_payload = json.loads(input_data.resume_arg_json)
    except Exception:
        resume_payload = True

    activity.logger.info(
        f"[Activity:Research] Resuming ACE graph from checkpoint (thread_id={thread_id}, "
        f"resume_payload={resume_payload})"
    )

    # Resume the graph from the interrupt point
    async for event in agent.astream(
        Command(resume=resume_payload),
        thread_config,
        stream_mode="updates",
    ):
        node_name = list(event.keys())[0] if event else "?"
        activity.logger.debug(f"[Activity:Research] Completed node: {node_name}")
        activity.heartbeat(f"node_completed:{node_name}")

    # Inspect final cognitive state
    final_snapshot = get_cognitive_snapshot(agent, thread_config)
    final_report = final_snapshot.get("final_report", "")

    # Locate saved report file if written
    report_filepath: str | None = None
    messages = agent.get_state(thread_config).values.get("messages", [])
    for msg in reversed(messages):
        text = str(getattr(msg, "content", msg))
        if "Report saved to:" in text:
            report_filepath = text.split("Report saved to:")[-1].strip()
            break

    activity.logger.info(
        f"[Activity:Research] Research completed! Final report length={len(final_report)} chars, "
        f"Saved to: {report_filepath}"
    )

    raw_notes = final_snapshot.get("raw_notes", [])
    sources = final_snapshot.get("sources", [])

    return FinalResearchOutput(
        thread_id=thread_id,
        final_report=final_report,
        report_filepath=report_filepath,
        status=final_snapshot.get("status", ACE_STATUS_COMPLETE),
        cognitive_snapshot=final_snapshot,
        notes_count=len(raw_notes),
        sources_count=len(sources),
    )


@activity.defn
async def execute_single_pass_research_activity(
    request: ResearchWorkflowInput,
) -> FinalResearchOutput:
    """Execute the full ACE research pipeline end-to-end without pausing for approval."""
    scoping_res = await run_scoping_and_planning_activity(request)
    if scoping_res.is_paused:
        resume_input = ResumeResearchInput(
            thread_id=scoping_res.thread_id,
            resume_arg_json="true",
        )
        return await execute_research_and_report_activity(resume_input)

    return FinalResearchOutput(
        thread_id=scoping_res.thread_id,
        final_report=scoping_res.research_brief,
        report_filepath=None,
        status="complete",
        cognitive_snapshot=scoping_res.cognitive_snapshot,
    )
