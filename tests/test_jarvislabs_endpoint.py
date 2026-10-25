"""Live tests against the real Jarvislabs Token Factory endpoint.

Run with: pytest --live tests/test_jarvislabs_endpoint.py
Costs a fraction of a cent per run.
"""

import os

import httpx
import pytest
from langchain_core.messages import HumanMessage, SystemMessage

from deep_research_from_scratch.gemma_model import (
    DEFAULT_JARVISLABS_BASE_URL,
    DEFAULT_JARVISLABS_MODEL,
    extract_text_content,
    get_jarvislabs_model,
)
from deep_research_from_scratch.state_multi_agent_supervisor import (
    ConductResearch,
    ResearchComplete,
)
from deep_research_from_scratch.state_research import Summary
from deep_research_from_scratch.state_scope import ResearchQuestion
from deep_research_from_scratch.utils import think_tool

pytestmark = pytest.mark.live


@pytest.fixture
def model(jarvislabs_key):
    return get_jarvislabs_model(temperature=0, timeout=120)


def test_models_endpoint_lists_configured_model(jarvislabs_key):
    base_url = os.getenv("JARVISLABS_BASE_URL", DEFAULT_JARVISLABS_BASE_URL)
    configured = os.getenv("JARVISLABS_MODEL", DEFAULT_JARVISLABS_MODEL)
    response = httpx.get(
        f"{base_url}/models",
        headers={"Authorization": f"Bearer {os.environ['JARVISLABS_API_KEY']}"},
        timeout=30,
    )
    assert response.status_code == 200, f"Auth or endpoint problem: {response.status_code} {response.text[:200]}"
    model_ids = [m["id"] for m in response.json().get("data", [])]
    assert configured in model_ids, f"{configured} not offered; available: {model_ids}"


def test_text_completion(model):
    response = model.invoke([HumanMessage(content="Reply with exactly the word: online")])
    text = extract_text_content(response.content).strip()
    assert text, "Empty completion"
    assert "online" in text.lower()


def test_long_answer_is_not_truncated(model):
    response = model.invoke([HumanMessage(content="Write a 400-word overview of how lithium-ion batteries work.")])
    finish_reason = response.response_metadata.get("finish_reason")
    assert finish_reason == "stop", f"Answer was cut off (finish_reason={finish_reason}); raise JARVISLABS_MAX_TOKENS"
    assert len(extract_text_content(response.content).split()) > 200


async def test_async_text_completion(model):
    response = await model.ainvoke([HumanMessage(content="What is 2 + 2? Reply with just the number.")])
    assert "4" in extract_text_content(response.content)


def test_tool_calling_with_supervisor_tools(model):
    bound = model.bind_tools([ConductResearch, ResearchComplete, think_tool])
    response = bound.invoke([
        SystemMessage(content="You are a research supervisor. You never answer directly; you delegate research by calling the ConductResearch tool."),
        HumanMessage(content="Research brief: compare the energy density of solid-state and lithium-ion batteries."),
    ])
    names = [call["name"] for call in response.tool_calls]
    assert response.tool_calls, f"Model emitted no tool calls (content: {response.content!r})"
    assert "ConductResearch" in names, f"Expected ConductResearch, got {names}"
    research_call = next(c for c in response.tool_calls if c["name"] == "ConductResearch")
    assert isinstance(research_call["args"].get("research_topic"), str)
    assert research_call["args"]["research_topic"].strip()


def test_structured_output_summary(model):
    page = (
        "Solid-state batteries replace the liquid electrolyte with a solid one. "
        "Toyota has said it plans to commercialise them, citing faster charging and higher energy density."
    )
    result = model.with_structured_output(Summary).invoke([
        HumanMessage(content=f"Summarize this webpage and pull key excerpts:\n\n{page}")
    ])
    assert isinstance(result, Summary)
    assert result.summary.strip()
    assert result.key_excerpts.strip()


def test_structured_output_research_question(model):
    result = model.with_structured_output(ResearchQuestion).invoke([
        HumanMessage(content="Turn this request into a detailed research brief: best coffee shops in Pune for remote work.")
    ])
    assert isinstance(result, ResearchQuestion)
    assert len(result.research_brief) > 20


def test_unknown_model_raises(jarvislabs_key):
    bad_model = get_jarvislabs_model(model_name="this-model-does-not-exist", max_retries=0, timeout=30)
    with pytest.raises(Exception):
        bad_model.invoke([HumanMessage(content="hello")])
