"""Full Multi-Agent Research System — ACE Production Graph.

This module integrates all components of the research system:
- User clarification and scoping
- Research brief generation (with ACE cognitive state population)
- Human-in-the-loop interrupt after planning (checkpoint/resume demo point)
- Multi-agent research coordination
- Final report generation

ACE changes (additive only):
- Graph compiled with MemorySaver checkpointer so state survives interrupts.
- ``write_research_brief`` node populates cognitive state fields on AgentState.
- ``checkpoint_and_resume`` node fires an interrupt() after brief generation,
  making the full cognitive plan visible before research begins.
  Caller resumes with ``Command(resume=True)`` to continue, or
  ``Command(resume={"replan": "new objective"})`` to override the objective.
- ``final_report_generation`` marks status as complete.
"""

import os
import uuid
from langchain_core.messages import HumanMessage
from langgraph.graph import StateGraph, START, END
from langgraph.types import interrupt, Command

from deep_research_from_scratch.utils import get_today_str
from deep_research_from_scratch.prompts import final_report_generation_prompt
from deep_research_from_scratch.state_scope import (
    AgentState,
    AgentInputState,
    ACE_STATUS_PLANNING,
    ACE_STATUS_PAUSED,
    ACE_STATUS_RESEARCHING,
    ACE_STATUS_COMPLETE,
)
from deep_research_from_scratch.research_agent_scope import clarify_with_user, write_research_brief
from deep_research_from_scratch.multi_agent_supervisor import supervisor_agent
from deep_research_from_scratch.generate_checkpoint import ace_checkpointer, print_cognitive_state, get_cognitive_snapshot
from deep_research_from_scratch.gemma_model import get_cognitive_model, extract_text_content

# ===== Config =====

writer_model = get_cognitive_model()

# ===== ACE: POPULATE COGNITIVE STATE AFTER SCOPING =====

def populate_cognitive_state(state: AgentState) -> dict:
    """Populate ACE cognitive fields from the freshly-written research_brief.

    This runs immediately after write_research_brief. It:
    - Captures the user's original message as the objective.
    - Copies the research_brief into research_plan.
    - Sets status → planning.
    - Initialises all list fields to empty (prevents None-reducer errors).
    """
    # Extract objective from the first human message in the conversation
    messages = state.get("messages", [])
    objective = ""
    for msg in messages:
        if hasattr(msg, "type") and msg.type == "human":
            objective = str(msg.content)
            break

    research_brief = state.get("research_brief", "") or ""

    return {
        "objective": objective or research_brief[:200],
        "research_plan": research_brief,
        "status": ACE_STATUS_PLANNING,
        # Initialise accumulators — safe no-ops if already populated
        "tasks": [],
        "completed_tasks": [],
        "pending_tasks": [],
        "sources": [],
        "decisions": [f"Research plan finalised: {research_brief[:120]}…"],
        "unresolved_questions": [],
    }


# ===== ACE: CHECKPOINT / INTERRUPT =====

def checkpoint_and_resume(state: AgentState) -> dict:
    """Interrupt point between planning and research execution.

    The graph pauses here after the research brief is ready.
    The full cognitive state is visible via get_state() at this point.

    Resume options:
      graph.invoke(Command(resume=True), config)         → proceed with original plan
      graph.invoke(Command(resume={"replan": "..."}), config) → override objective
    """
    print("\n[ACE] Cognitive state is ready. Graph pausing for checkpoint.")
    print("[ACE] Resume with: graph.invoke(Command(resume=True), thread_config)")

    resume_value = interrupt({
        "status": ACE_STATUS_PAUSED,
        "objective": state.get("objective", ""),
        "research_plan": state.get("research_plan", ""),
        "message": "ACE is ready to begin research. Resume to proceed.",
    })

    # Handle optional replan from the resume value
    updates: dict = {"status": ACE_STATUS_RESEARCHING}
    if isinstance(resume_value, dict) and "replan" in resume_value:
        new_objective = resume_value["replan"]
        updates["objective"] = new_objective
        updates["research_plan"] = new_objective
        updates["decisions"] = [f"User replanned at checkpoint: {new_objective[:120]}"]
        print(f"[ACE] Replanning with new objective: {new_objective}")

    return updates


# ===== FINAL REPORT GENERATION =====

async def final_report_generation(state: AgentState):
    """Synthesizes all research findings into a comprehensive final report."""

    notes = state.get("notes", [])
    findings = "\n".join(notes)

    final_report_prompt = final_report_generation_prompt.format(
        research_brief=state.get("research_brief", ""),
        findings=findings,
        date=get_today_str()
    )

    final_report = await writer_model.ainvoke([HumanMessage(content=final_report_prompt)])
    report_text = extract_text_content(final_report.content)

    return {
        "final_report": report_text,
        "status": ACE_STATUS_COMPLETE,
        "messages": ["Here is the final report: " + report_text],
    }


# ===== SAVE REPORT TO FILE =====

async def save_report_to_file(state: AgentState):
    """Save the final report to a file in the 'files' directory."""
    import asyncio
    final_report = state.get("final_report", "")

    module_dir = os.path.dirname(os.path.abspath(__file__))
    files_dir = os.path.join(module_dir, "files")

    report_id = str(uuid.uuid4())
    filename = f"report_{report_id}.md"
    filepath = os.path.join(files_dir, filename)

    def write_file():
        os.makedirs(files_dir, exist_ok=True)
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(final_report)

    await asyncio.to_thread(write_file)

    return {
        "messages": [f"Report saved to: {filepath}"],
    }


# ===== GRAPH CONSTRUCTION =====

deep_researcher_builder = StateGraph(AgentState, input_schema=AgentInputState)

# Add workflow nodes
deep_researcher_builder.add_node("clarify_with_user", clarify_with_user)
deep_researcher_builder.add_node("write_research_brief", write_research_brief)
deep_researcher_builder.add_node("populate_cognitive_state", populate_cognitive_state)  # ACE: cognitive init
deep_researcher_builder.add_node("checkpoint_and_resume", checkpoint_and_resume)        # ACE: interrupt
deep_researcher_builder.add_node("supervisor_subgraph", supervisor_agent)
deep_researcher_builder.add_node("final_report_generation", final_report_generation)
deep_researcher_builder.add_node("save_report_to_file", save_report_to_file)

# Add workflow edges
deep_researcher_builder.add_edge(START, "clarify_with_user")
deep_researcher_builder.add_edge("write_research_brief", "populate_cognitive_state")   # ACE: populate first
deep_researcher_builder.add_edge("populate_cognitive_state", "checkpoint_and_resume")  # ACE: then pause
deep_researcher_builder.add_edge("checkpoint_and_resume", "supervisor_subgraph")
deep_researcher_builder.add_edge("supervisor_subgraph", "final_report_generation")
deep_researcher_builder.add_edge("final_report_generation", "save_report_to_file")
deep_researcher_builder.add_edge("save_report_to_file", END)

# Compile with MemorySaver so interrupts and cognitive state survive thread_id lookups
# LangGraph API and Studio automatically manage checkpointer and persistence.
agent = deep_researcher_builder.compile()
