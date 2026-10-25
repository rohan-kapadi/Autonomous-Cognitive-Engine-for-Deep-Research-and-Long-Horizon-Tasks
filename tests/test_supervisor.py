"""Offline tests for the supervisor's delegation logic (supervisor_tools)."""

from fakes import tool_call_msg
from langchain_core.messages import AIMessage, HumanMessage, ToolMessage
from langgraph.graph import END

from deep_research_from_scratch import multi_agent_supervisor as sup


class FakeResearcher:
    """Stands in for the compiled researcher_agent subgraph."""

    def __init__(self, result=None, error=None):
        self.result = result or {"compressed_research": "FINDINGS", "raw_notes": ["raw search output"]}
        self.error = error
        self.calls = []

    async def ainvoke(self, payload):
        self.calls.append(payload)
        if self.error:
            raise self.error
        return self.result


def _state(*messages, iterations=1):
    return {
        "supervisor_messages": [HumanMessage(content="Research Brief: batteries"), *messages],
        "research_brief": "batteries",
        "research_iterations": iterations,
    }


# ===== CONDUCT RESEARCH =====

async def test_conduct_research_delegates_to_researcher(monkeypatch):
    researcher = FakeResearcher(result={"compressed_research": "A" * 3000, "raw_notes": ["raw 1"]})
    monkeypatch.setattr(sup, "researcher_agent", researcher)

    command = await sup.supervisor_tools(_state(tool_call_msg("ConductResearch", {"research_topic": "energy density"}, "c1")))

    assert command.goto == "supervisor"
    assert researcher.calls[0]["research_topic"] == "energy density"
    assert researcher.calls[0]["researcher_messages"][0].content == "energy density"

    tool_message = command.update["supervisor_messages"][0]
    assert isinstance(tool_message, ToolMessage)
    assert tool_message.tool_call_id == "c1"
    assert len(tool_message.content) == 1500, "Findings should be truncated to 1500 chars"
    assert command.update["raw_notes"] == ["raw 1"]


async def test_parallel_conduct_research_calls(monkeypatch):
    researcher = FakeResearcher()
    monkeypatch.setattr(sup, "researcher_agent", researcher)
    message = AIMessage(content="", tool_calls=[
        {"name": "ConductResearch", "args": {"research_topic": "topic 1"}, "id": "c1", "type": "tool_call"},
        {"name": "ConductResearch", "args": {"research_topic": "topic 2"}, "id": "c2", "type": "tool_call"},
    ])

    command = await sup.supervisor_tools(_state(message))

    assert sorted(c["research_topic"] for c in researcher.calls) == ["topic 1", "topic 2"]
    assert [m.tool_call_id for m in command.update["supervisor_messages"]] == ["c1", "c2"]


async def test_researcher_error_becomes_tool_message(monkeypatch):
    monkeypatch.setattr(sup, "researcher_agent", FakeResearcher(error=ValueError("boom")))

    command = await sup.supervisor_tools(_state(tool_call_msg("ConductResearch", {"research_topic": "t"}, "c1")))

    assert command.goto == "supervisor"
    assert command.update["supervisor_messages"][0].content == "Error: Research failed: boom"


async def test_rate_limited_researcher_is_retried_then_reported(monkeypatch):
    researcher = FakeResearcher(error=RuntimeError("Error code: 429 - rate limit"))
    monkeypatch.setattr(sup, "researcher_agent", researcher)
    sleeps = []

    async def no_sleep(seconds):
        sleeps.append(seconds)

    monkeypatch.setattr(sup.asyncio, "sleep", no_sleep)

    command = await sup.supervisor_tools(_state(tool_call_msg("ConductResearch", {"research_topic": "t"}, "c1")))

    assert len(researcher.calls) == 2
    assert len(sleeps) == 1
    assert "rate limits" in command.update["supervisor_messages"][0].content


# ===== RESEARCH COMPLETE =====

async def test_premature_research_complete_forces_retry():
    command = await sup.supervisor_tools(_state(tool_call_msg("ResearchComplete", {}, "r1")))

    assert command.goto == "supervisor"
    assert command.update["research_iterations"] == 0
    assert "cannot call ResearchComplete" in command.update["supervisor_messages"][0].content


async def test_research_complete_after_research_ends_with_notes():
    state = _state(
        tool_call_msg("ConductResearch", {"research_topic": "t"}, "c1"),
        ToolMessage(content="Finding about batteries", name="ConductResearch", tool_call_id="c1"),
        tool_call_msg("ResearchComplete", {}, "r1"),
        iterations=2,
    )

    command = await sup.supervisor_tools(state)

    assert command.goto == END
    assert command.update["notes"] == ["Finding about batteries"]
    assert command.update["research_brief"] == "batteries"


# ===== NO ACTION / LIMITS =====

async def test_no_tool_calls_on_first_turn_forces_retry():
    command = await sup.supervisor_tools(_state(AIMessage(content="Here is my answer without research.")))

    assert command.goto == "supervisor"
    assert "MUST call the ConductResearch tool" in command.update["supervisor_messages"][0].content


async def test_think_only_continues_before_limit():
    command = await sup.supervisor_tools(_state(tool_call_msg("think_tool", {"reflection": "plan"}, "t1"), iterations=1))

    assert command.goto == "supervisor"
    assert command.update["supervisor_messages"][0].content == "Reflection recorded: plan"


async def test_iteration_limit_ends_research():
    state = _state(
        ToolMessage(content="Earlier finding", name="ConductResearch", tool_call_id="c0"),
        tool_call_msg("think_tool", {"reflection": "wrap up"}, "t1"),
        iterations=sup.max_researcher_iterations,
    )

    command = await sup.supervisor_tools(state)

    assert command.goto == END
    assert command.update["notes"] == ["Earlier finding"]


# ===== NOTE EXTRACTION =====

def test_get_notes_from_tool_calls_filters_messages():
    messages = [
        HumanMessage(content="brief"),
        AIMessage(content="thinking"),
        ToolMessage(content="note 1", tool_call_id="a"),
        ToolMessage(content="Error synthesizing research report", tool_call_id="b"),
        ToolMessage(content="", tool_call_id="c"),
        ToolMessage(content="note 2", tool_call_id="d"),
    ]
    assert sup.get_notes_from_tool_calls(messages) == ["note 1", "note 2"]
