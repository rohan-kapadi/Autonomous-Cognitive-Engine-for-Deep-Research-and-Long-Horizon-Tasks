"""Live end-to-end run of the full ACE graph on Jarvislabs + Tavily.

Run with: pytest --live tests/test_live_e2e.py -s
Takes roughly 1-3 minutes and a few cents of credits.
"""

import uuid

import pytest
from langchain_core.messages import HumanMessage
from langgraph.checkpoint.memory import MemorySaver
from langgraph.types import Command

from deep_research_from_scratch import (
    multi_agent_supervisor,
    research_agent,
    research_agent_full,
    research_agent_scope,
    utils,
)
from deep_research_from_scratch.gemma_model import get_jarvislabs_model

pytestmark = pytest.mark.live

PROMPT = (
    "Write a short research report comparing the gravimetric energy density (Wh/kg) of "
    "solid-state and lithium-ion EV batteries as of 2026. Audience: EV engineers. "
    "Keep it brief, cite sources, no further clarification needed."
)
CLARIFICATION_ANSWER = "No further details: use public sources from 2025-2026, keep it brief, focus only on Wh/kg."


@pytest.fixture
def jarvislabs_everywhere(monkeypatch, tmp_path, jarvislabs_key, tavily_key):
    """Force every model in the pipeline onto Jarvislabs, regardless of RESEARCH_MODEL_PROVIDER."""
    from tavily import TavilyClient

    def jarvis():
        return get_jarvislabs_model(temperature=0.2, timeout=180)

    monkeypatch.setattr(research_agent_scope, "scoping_model", jarvis())
    monkeypatch.setattr(multi_agent_supervisor, "supervisor_model_with_tools",
                        jarvis().bind_tools(multi_agent_supervisor.supervisor_tools))
    monkeypatch.setattr(research_agent, "model_with_tools", jarvis().bind_tools(research_agent.tools))
    monkeypatch.setattr(research_agent, "compress_model", jarvis())
    monkeypatch.setattr(utils, "summarization_model", jarvis())
    monkeypatch.setattr(utils, "tavily_client", TavilyClient())
    monkeypatch.setattr(research_agent_full, "writer_model", jarvis())
    monkeypatch.setattr(research_agent_full, "__file__", str(tmp_path / "research_agent_full.py"))
    return tmp_path / "files"


async def test_full_research_run_on_jarvislabs(jarvislabs_everywhere):
    graph = research_agent_full.deep_researcher_builder.compile(checkpointer=MemorySaver())
    config = {"configurable": {"thread_id": f"live-{uuid.uuid4()}"}}

    await graph.ainvoke({"messages": [HumanMessage(content=PROMPT)]}, config)

    # The scoping model may still ask a question; answer up to twice
    for _ in range(2):
        if graph.get_state(config).next:
            break
        await graph.ainvoke({"messages": [HumanMessage(content=CLARIFICATION_ANSWER)]}, config)

    paused = graph.get_state(config)
    assert paused.next == ("checkpoint_and_resume",), "Graph did not reach the checkpoint after scoping"
    assert paused.values["research_brief"], "Scoping produced no research brief"

    result = await graph.ainvoke(Command(resume=True), config)

    assert result["status"] == "complete"
    assert result["notes"], "Supervisor finished without any research notes (tool calling may not be working)"
    assert len(result["final_report"]) > 200, f"Report too short:\n{result['final_report']}"

    saved = list(jarvislabs_everywhere.glob("report_*.md"))
    assert len(saved) == 1
    print(f"\n[live e2e] Report saved to {saved[0]} ({len(result['final_report'])} chars)")
