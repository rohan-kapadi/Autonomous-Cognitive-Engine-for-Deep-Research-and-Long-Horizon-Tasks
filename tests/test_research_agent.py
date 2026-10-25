"""Offline tests for the researcher loop: LLM -> search tool -> LLM -> compression."""

import pytest
from fakes import ScriptedModel, tool_call_msg
from langchain_core.messages import AIMessage, HumanMessage, ToolMessage

from deep_research_from_scratch import research_agent


@pytest.fixture
def researcher(monkeypatch, fake_tavily, fake_summarizer):
    """Patch the researcher's models; return them for scripting and assertions."""
    llm = ScriptedModel()
    compressor = ScriptedModel(responses=["COMPRESSED FINDINGS"])
    monkeypatch.setattr(research_agent, "model_with_tools", llm)
    monkeypatch.setattr(research_agent, "compress_model", compressor)
    return llm, compressor


async def _run(topic="solid-state batteries"):
    nodes = []
    final = {}
    async for update in research_agent.researcher_agent.astream(
        {"researcher_messages": [HumanMessage(content=topic)], "research_topic": topic},
        stream_mode="updates",
    ):
        for node, values in update.items():
            nodes.append(node)
            final.update(values or {})
    return nodes, final


# ===== ROUTING =====

def test_should_continue_routes_tool_calls_to_tool_node():
    state = {"researcher_messages": [tool_call_msg("tavily_search", {"query": "x"})]}
    assert research_agent.should_continue(state) == "tool_node"


def test_should_continue_routes_final_answer_to_compression():
    state = {"researcher_messages": [AIMessage(content="I have enough information.")]}
    assert research_agent.should_continue(state) == "compress_research"


# ===== FULL RESEARCHER LOOP =====

async def test_search_then_compress(researcher, fake_tavily):
    llm, compressor = researcher
    llm.responses = [tool_call_msg("tavily_search", {"query": "solid-state energy density"}, "s1"), "Done researching."]

    nodes, final = await _run()

    assert nodes == ["llm_call", "tool_node", "llm_call", "compress_research"]
    assert fake_tavily.calls[0]["query"] == "solid-state energy density"
    assert final["compressed_research"] == "COMPRESSED FINDINGS"

    # The second LLM call must see the search results as a ToolMessage
    second_call = llm.calls[1]
    tool_messages = [m for m in second_call if isinstance(m, ToolMessage)]
    assert len(tool_messages) == 1
    assert tool_messages[0].tool_call_id == "s1"
    assert "URL: https://example.com/a" in tool_messages[0].content

    # Raw notes carry the search output forward to the supervisor
    assert "URL: https://example.com/a" in "\n".join(final["raw_notes"])


async def test_compression_sees_full_research_history(researcher):
    llm, compressor = researcher
    llm.responses = [tool_call_msg("tavily_search", {"query": "q"}, "s1"), "Done."]

    await _run()

    compress_input = compressor.calls[0]
    assert any(isinstance(m, ToolMessage) for m in compress_input)
    assert isinstance(compress_input[-1], HumanMessage), "Compression instruction should come last"


async def test_multiple_search_rounds(researcher, fake_tavily):
    llm, _ = researcher
    llm.responses = [
        tool_call_msg("tavily_search", {"query": "first"}, "s1"),
        tool_call_msg("tavily_search", {"query": "second"}, "s2"),
        "Done.",
    ]

    nodes, _ = await _run()

    assert nodes.count("tool_node") == 2
    assert [c["query"] for c in fake_tavily.calls] == ["first", "second"]


async def test_think_tool_runs_without_search(researcher, fake_tavily):
    llm, _ = researcher
    llm.responses = [tool_call_msg("think_tool", {"reflection": "Plan: search specs"}, "t1"), "Done."]

    nodes, _ = await _run()

    assert nodes == ["llm_call", "tool_node", "llm_call", "compress_research"]
    assert fake_tavily.calls == []
    assert "Reflection recorded: Plan: search specs" in llm.calls[1][-1].content


async def test_immediate_answer_skips_tools(researcher, fake_tavily):
    llm, _ = researcher
    llm.responses = ["No research needed."]

    nodes, final = await _run()

    assert nodes == ["llm_call", "compress_research"]
    assert final["compressed_research"] == "COMPRESSED FINDINGS"
