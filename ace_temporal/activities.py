"""Temporal activities wrapping each ACE phase.

Each activity calls the existing LangGraph nodes / subgraphs unchanged, so the
ACE logic stays in ``src/`` and Temporal only adds durability around it.
Inputs and outputs are plain JSON-serialisable dicts so they show up readably
in the Temporal UI event history.
"""

import asyncio
import logging
import os
import time

import httpx
from langchain_core.callbacks import BaseCallbackHandler
from langchain_google_genai import ChatGoogleGenerativeAI
from temporalio import activity

logger = logging.getLogger(__name__)

# Per-request timeout for Gemma calls. The models in ``src/`` are created without
# one, and a request retried after a 429 can hang forever. Applied as a default
# before ``src/`` is imported (activities import it lazily), so ``src/`` is untouched.
# A timed-out call is retried in place, so one slow response does not throw away
# the whole research attempt (``src/`` only retries rate-limit errors).
GEMMA_REQUEST_TIMEOUT_SECONDS = float(os.getenv("GEMMA_REQUEST_TIMEOUT_SECONDS", "90"))
GEMMA_TIMEOUT_TRIES = 3
_TIMEOUT_ERRORS = (TimeoutError, httpx.TimeoutException)  # async path, sync path

_genai_init = ChatGoogleGenerativeAI.__init__
_genai_generate = ChatGoogleGenerativeAI._generate
_genai_agenerate = ChatGoogleGenerativeAI._agenerate


def _genai_init_with_timeout(self, **kwargs) -> None:
    kwargs.setdefault("timeout", GEMMA_REQUEST_TIMEOUT_SECONDS)
    _genai_init(self, **kwargs)


def _generate_retrying(self, *args, **kwargs):
    for attempt in range(1, GEMMA_TIMEOUT_TRIES + 1):
        try:
            return _genai_generate(self, *args, **kwargs)
        except _TIMEOUT_ERRORS:
            if attempt == GEMMA_TIMEOUT_TRIES:
                raise
            logger.warning("Gemma request timed out (try %s/%s); retrying", attempt, GEMMA_TIMEOUT_TRIES)


async def _agenerate_retrying(self, *args, **kwargs):
    for attempt in range(1, GEMMA_TIMEOUT_TRIES + 1):
        try:
            return await _genai_agenerate(self, *args, **kwargs)
        except _TIMEOUT_ERRORS:
            if attempt == GEMMA_TIMEOUT_TRIES:
                raise
            logger.warning("Gemma request timed out (try %s/%s); retrying", attempt, GEMMA_TIMEOUT_TRIES)


ChatGoogleGenerativeAI.__init__ = _genai_init_with_timeout
ChatGoogleGenerativeAI._generate = _generate_retrying
ChatGoogleGenerativeAI._agenerate = _agenerate_retrying

# Backstop: fail an attempt if no LLM/tool call starts or finishes for this long,
# so anything still hanging triggers a Temporal retry instead of being masked by
# heartbeats until start_to_close expires. Must exceed a call's full timeout-retry
# budget, since in-place retries do not fire LLM callbacks.
STALL_SECONDS = GEMMA_TIMEOUT_TRIES * GEMMA_REQUEST_TIMEOUT_SECONDS + 60


def _to_messages(messages: list[dict]):
    """Convert ``{"role", "content"}`` dicts into LangChain messages."""
    from langchain_core.messages import AIMessage, HumanMessage

    return [
        HumanMessage(content=m["content"]) if m["role"] == "human" else AIMessage(content=m["content"])
        for m in messages
    ]


class _Progress(BaseCallbackHandler):
    """Records when the last LLM/tool call started or finished."""

    run_inline = True

    def __init__(self) -> None:
        self.last = time.monotonic()

    def _tick(self, *args, **kwargs) -> None:
        self.last = time.monotonic()

    on_chat_model_start = on_llm_start = on_llm_end = on_llm_error = _tick
    on_tool_start = on_tool_end = on_tool_error = _tick


async def _run_watched(make_coro, interval: float = 5):
    """Run ``make_coro(callbacks)`` while heartbeating; fail the attempt if it stalls.

    Heartbeats let Temporal detect a dead worker quickly; the stall check catches a
    live worker stuck on a hung model request.
    """
    progress = _Progress()
    task = asyncio.create_task(make_coro([progress]))
    try:
        while True:
            done, _ = await asyncio.wait({task}, timeout=interval)
            if done:
                return task.result()
            activity.heartbeat()
            idle = time.monotonic() - progress.last
            if idle > STALL_SECONDS:
                raise RuntimeError(f"No LLM/tool progress for {idle:.0f}s; failing attempt so Temporal retries")
    finally:
        task.cancel()


@activity.defn
async def scope_objective(messages: list[dict]) -> dict:
    """Phase 1: clarify the request and write the research brief + cognitive plan."""
    from langgraph.graph import END

    from deep_research_from_scratch.research_agent_full import populate_cognitive_state
    from deep_research_from_scratch.research_agent_scope import (
        clarify_with_user,
        write_research_brief,
    )

    state = {"messages": _to_messages(messages)}

    activity.logger.info("ACE scoping: checking whether clarification is needed")
    decision = await clarify_with_user(state)
    reply = decision.update["messages"][0].content
    if decision.goto == END:
        return {"need_clarification": True, "question": reply}

    activity.logger.info("ACE scoping: writing research brief")
    brief = await write_research_brief(state)
    cognitive = populate_cognitive_state({**state, **brief})
    return {
        "need_clarification": False,
        "verification": reply,
        "research_brief": brief["research_brief"],
        "cognitive_state": cognitive,
    }


@activity.defn
async def run_research(research_brief: str) -> dict:
    """Phase 2: run the multi-agent supervisor (parallel researcher sub-agents)."""
    from deep_research_from_scratch.multi_agent_supervisor import supervisor_agent

    activity.logger.info(
        "ACE research: supervisor starting (attempt %s)", activity.info().attempt
    )
    result = await _run_watched(
        lambda callbacks: supervisor_agent.ainvoke({"research_brief": research_brief}, {"callbacks": callbacks})
    )

    tasks = [
        call["args"].get("research_topic", "")
        for msg in result.get("supervisor_messages", [])
        for call in (getattr(msg, "tool_calls", None) or [])
        if call["name"] == "ConductResearch"
    ]
    return {
        "notes": result.get("notes", []),
        "raw_notes_count": len(result.get("raw_notes", [])),
        "tasks": tasks,
    }


@activity.defn
async def write_report(research_brief: str, notes: list[str]) -> str:
    """Phase 3: synthesise all findings into the final report."""
    from langchain_core.runnables import RunnableLambda

    from deep_research_from_scratch.research_agent_full import final_report_generation

    # RunnableLambda propagates the callbacks to the model call inside the node.
    result = await _run_watched(
        lambda callbacks: RunnableLambda(final_report_generation).ainvoke(
            {"research_brief": research_brief, "notes": notes}, {"callbacks": callbacks}
        )
    )
    return result["final_report"]


@activity.defn
async def save_report(report: str) -> str:
    """Phase 4: persist the report as a Markdown artifact and return its path."""
    from deep_research_from_scratch.research_agent_full import save_report_to_file

    result = await save_report_to_file({"final_report": report})
    return result["messages"][0].removeprefix("Report saved to: ")


ALL_ACTIVITIES = [scope_objective, run_research, write_report, save_report]
