"""Fake models and search client used by the offline tests."""

from langchain_core.messages import AIMessage


def tool_call_msg(name, args, call_id="call_1"):
    """Build an AIMessage carrying a single tool call."""
    return AIMessage(content="", tool_calls=[{"name": name, "args": args, "id": call_id, "type": "tool_call"}])


class _StructuredRunnable:
    """Returned by ScriptedModel.with_structured_output; pops scripted objects."""

    def __init__(self, model, schema):
        self.model = model
        self.schema = schema

    def invoke(self, messages, *args, **kwargs):
        return self.model._next(self.model.structured, self.model.structured_calls, messages)

    async def ainvoke(self, messages, *args, **kwargs):
        return self.invoke(messages)


class ScriptedModel:
    """Fake chat model that returns queued responses in order.

    ``responses`` feed invoke/ainvoke (AIMessage or str); ``structured`` feed
    with_structured_output(...).invoke. An Exception in either queue is raised.
    Every call's input messages are recorded for assertions.
    """

    def __init__(self, responses=None, structured=None):
        self.responses = list(responses or [])
        self.structured = list(structured or [])
        self.calls = []
        self.structured_calls = []
        self.bound_tools = None

    def _next(self, queue, log, messages):
        log.append(messages)
        if not queue:
            raise AssertionError("ScriptedModel ran out of scripted responses")
        item = queue.pop(0)
        if isinstance(item, Exception):
            raise item
        return AIMessage(content=item) if isinstance(item, str) else item

    def invoke(self, messages, *args, **kwargs):
        return self._next(self.responses, self.calls, messages)

    async def ainvoke(self, messages, *args, **kwargs):
        return self.invoke(messages)

    def bind_tools(self, tools, **kwargs):
        self.bound_tools = tools
        return self

    def with_structured_output(self, schema, **kwargs):
        return _StructuredRunnable(self, schema)


FAKE_RESULTS = [
    {
        "url": "https://example.com/a",
        "title": "Source A",
        "content": "Short snippet A",
        "raw_content": "Full page content about solid-state batteries. " * 20,
    },
    {
        "url": "https://example.com/b",
        "title": "Source B",
        "content": "Short snippet B without raw content",
        "raw_content": None,
    },
    # Duplicate URL: must be removed by deduplicate_search_results
    {
        "url": "https://example.com/a",
        "title": "Source A (duplicate)",
        "content": "Duplicate",
        "raw_content": "Duplicate raw",
    },
]


class FakeTavilyClient:
    """Stands in for tavily.TavilyClient; records every search call."""

    def __init__(self, results=None):
        self.results = FAKE_RESULTS if results is None else results
        self.calls = []

    def search(self, query, **kwargs):
        self.calls.append({"query": query, **kwargs})
        return {"query": query, "results": list(self.results)}
