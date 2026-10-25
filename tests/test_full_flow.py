"""Offline end-to-end tests of the full ACE graph with every model faked.

Flow: clarify -> brief -> cognitive state -> supervisor ->
researcher (search -> compress) -> final report -> saved file.
"""

import uuid

import pytest
from fakes import ScriptedModel, tool_call_msg
from langchain_core.messages import HumanMessage
from langgraph.checkpoint.memory import MemorySaver

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


def _nodes_run(graph, config):
    """Node names in execution order, read from the checkpoint history."""
    history = reversed(list(graph.get_state_history(config)))
    return [name for snapshot in history for name in snapshot.next]


async def test_runs_end_to_end_and_saves_report(models, graph, config, fake_tavily):
    result = await graph.ainvoke({"messages": [HumanMessage(content=OBJECTIVE)]}, config)

    # Runs straight through, no pause
    assert graph.get_state(config).next == ()
    assert _nodes_run(graph, config)[-6:] == [
        "clarify_with_user", "write_research_brief", "populate_cognitive_state",
        "supervisor_subgraph", "final_report_generation", "save_report_to_file",
    ]

    # Supervisor received the brief; researcher searched via Tavily
    assert "BRIEF: battery energy density comparison" in models["supervisor"].calls[0][-1].content
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
    assert result["messages"][-1].content.startswith("Report saved to:")


async def test_cognitive_state_is_populated(models, graph, config):
    result = await graph.ainvoke({"messages": [HumanMessage(content=OBJECTIVE)]}, config)

    assert result["objective"] == OBJECTIVE
    assert result["research_brief"] == "BRIEF: battery energy density comparison"
    assert result["research_plan"] == result["research_brief"]
    assert any("Research plan finalised" in d for d in result["decisions"])


async def test_clarification_question_ends_turn(models, graph, config):
    models["scoping"].structured = [
        ClarifyWithUser(need_clarification=True, question="Which vehicle segment?", verification=""),
    ]

    result = await graph.ainvoke({"messages": [HumanMessage(content="Research batteries")]}, config)

    assert result["messages"][-1].content == "Which vehicle segment?"
    assert graph.get_state(config).next == ()
    assert not result.get("final_report")
    assert models["supervisor"].calls == []


async def test_answering_clarification_continues_to_report(models, graph, config):
    models["scoping"].structured = [
        ClarifyWithUser(need_clarification=True, question="Which vehicle segment?", verification=""),
        ClarifyWithUser(need_clarification=False, question="", verification="Starting research."),
        ResearchQuestion(research_brief="BRIEF: battery energy density comparison"),
    ]

    await graph.ainvoke({"messages": [HumanMessage(content="Research batteries")]}, config)
    result = await graph.ainvoke({"messages": [HumanMessage(content="Passenger EVs")]}, config)

    assert result["status"] == "complete"
    clarify_prompt = models["scoping"].structured_calls[1][0].content
    assert "Passenger EVs" in clarify_prompt, "Second turn should see the user's answer in the conversation"
