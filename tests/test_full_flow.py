"""Offline end-to-end tests of the full ACE graph with every model faked.

Flow: clarify -> brief -> cognitive state -> checkpoint pause -> resume ->
supervisor -> researcher (search -> compress) -> final report -> saved file.
"""

import uuid

import pytest
from fakes import ScriptedModel, tool_call_msg
from langchain_core.messages import HumanMessage
from langgraph.checkpoint.memory import MemorySaver
from langgraph.types import Command

from deep_research_from_scratch import (
    multi_agent_supervisor,
    research_agent,
    research_agent_full,
    research_agent_scope,
)
from deep_research_from_scratch.state_scope import ClarifyWithUser, ResearchQuestion

OBJECTIVE = "Compare solid-state and lithium-ion battery energy density for EV engineers."


@pytest.fixture
def models(monkeypatch, tmp_path, fake_tavily, fake_summarizer):
    """Script every model in the pipeline and redirect saved reports to tmp_path."""
    scoping = ScriptedModel(structured=[
        ClarifyWithUser(need_clarification=False, question="", verification="Starting research."),
        ResearchQuestion(research_brief="BRIEF: battery energy density comparison"),
    ])
    supervisor = ScriptedModel(responses=[
        tool_call_msg("ConductResearch", {"research_topic": "solid-state energy density"}, "c1"),
        tool_call_msg("ResearchComplete", {}, "r1"),
    ])
    researcher = ScriptedModel(responses=[
        tool_call_msg("tavily_search", {"query": "solid-state battery Wh/kg"}, "s1"),
        "Enough information gathered.",
    ])
    compressor = ScriptedModel(responses=["COMPRESSED: solid-state reaches ~400 Wh/kg"])
    writer = ScriptedModel(responses=["# Final Report\n\nSolid-state reaches ~400 Wh/kg."])

    monkeypatch.setattr(research_agent_scope, "scoping_model", scoping)
    monkeypatch.setattr(multi_agent_supervisor, "supervisor_model_with_tools", supervisor)
    monkeypatch.setattr(research_agent, "model_with_tools", researcher)
    monkeypatch.setattr(research_agent, "compress_model", compressor)
    monkeypatch.setattr(research_agent_full, "writer_model", writer)
    # save_report_to_file writes next to the module's __file__
    monkeypatch.setattr(research_agent_full, "__file__", str(tmp_path / "research_agent_full.py"))

    return {"scoping": scoping, "supervisor": supervisor, "researcher": researcher,
            "compressor": compressor, "writer": writer, "files_dir": tmp_path / "files"}


@pytest.fixture
def graph():
    return research_agent_full.deep_researcher_builder.compile(checkpointer=MemorySaver())


@pytest.fixture
def config():
    return {"configurable": {"thread_id": f"test-{uuid.uuid4()}"}}


# ===== PHASE 1: SCOPING + CHECKPOINT =====

async def test_pauses_at_checkpoint_with_cognitive_state(models, graph, config):
    await graph.ainvoke({"messages": [HumanMessage(content=OBJECTIVE)]}, config)

    state = graph.get_state(config)
    assert state.next == ("checkpoint_and_resume",)
    assert state.values["status"] == "planning"
    assert state.values["objective"] == OBJECTIVE
    assert state.values["research_brief"] == "BRIEF: battery energy density comparison"
    assert state.values["research_plan"] == state.values["research_brief"]
    assert any("Research plan finalised" in d for d in state.values["decisions"])

    interrupt_value = state.tasks[0].interrupts[0].value
    assert interrupt_value["status"] == "paused"
    assert interrupt_value["objective"] == OBJECTIVE

    # Nothing beyond scoping ran yet
    assert models["supervisor"].calls == []
    assert models["writer"].calls == []


async def test_clarification_question_ends_turn(models, graph, config):
    models["scoping"].structured = [
        ClarifyWithUser(need_clarification=True, question="Which vehicle segment?", verification=""),
    ]

    result = await graph.ainvoke({"messages": [HumanMessage(content="Research batteries")]}, config)

    assert result["messages"][-1].content == "Which vehicle segment?"
    assert graph.get_state(config).next == ()
    assert models["supervisor"].calls == []


# ===== PHASE 2: RESUME -> RESEARCH -> REPORT =====

async def test_resume_runs_research_and_saves_report(models, graph, config, fake_tavily):
    await graph.ainvoke({"messages": [HumanMessage(content=OBJECTIVE)]}, config)
    result = await graph.ainvoke(Command(resume=True), config)

    # Supervisor received the brief
    assert "BRIEF: battery energy density comparison" in models["supervisor"].calls[0][-1].content

    # Researcher searched via Tavily
    assert fake_tavily.calls[0]["query"] == "solid-state battery Wh/kg"

    # Compressed findings flowed into notes and into the report prompt
    assert any("COMPRESSED: solid-state" in note for note in result["notes"])
    writer_prompt = models["writer"].calls[0][0].content
    assert "COMPRESSED: solid-state" in writer_prompt
    assert "BRIEF: battery energy density comparison" in writer_prompt

    # Final state and saved artifact
    assert result["status"] == "complete"
    assert result["final_report"].startswith("# Final Report")
    saved = list(models["files_dir"].glob("report_*.md"))
    assert len(saved) == 1
    assert saved[0].read_text(encoding="utf-8") == result["final_report"]
    assert graph.get_state(config).next == ()


async def test_replan_updates_objective_and_decisions(models, graph, config):
    await graph.ainvoke({"messages": [HumanMessage(content=OBJECTIVE)]}, config)
    result = await graph.ainvoke(Command(resume={"replan": "Focus on sodium-ion instead"}), config)

    assert result["objective"] == "Focus on sodium-ion instead"
    assert result["research_plan"] == "Focus on sodium-ion instead"
    assert any("User replanned at checkpoint" in d for d in result["decisions"])
    assert result["status"] == "complete"


@pytest.mark.xfail(strict=True, reason="Known gap: replan updates objective/research_plan, "
                   "but the supervisor still reads research_brief, so research direction does not change")
async def test_replan_changes_research_direction(models, graph, config):
    await graph.ainvoke({"messages": [HumanMessage(content=OBJECTIVE)]}, config)
    await graph.ainvoke(Command(resume={"replan": "Focus on sodium-ion instead"}), config)

    assert "sodium-ion" in models["supervisor"].calls[0][-1].content
