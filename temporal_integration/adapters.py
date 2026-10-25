"""Adapters bridging LangGraph StateGraph nodes with Temporal LangGraphPlugin and Activities."""

from datetime import timedelta
from typing import Dict

from langgraph.graph import END, START, StateGraph
from temporalio.common import RetryPolicy

from deep_research_from_scratch.multi_agent_supervisor import supervisor_agent
from deep_research_from_scratch.research_agent_full import (
    checkpoint_and_resume,
    final_report_generation,
    populate_cognitive_state,
    save_report_to_file,
)
from deep_research_from_scratch.research_agent_scope import (
    clarify_with_user,
    write_research_brief,
)
from deep_research_from_scratch.state_scope import AgentInputState, AgentState


async def supervisor_subgraph_node(state: AgentState) -> dict:
    """Activity-wrapped entrypoint into the multi-agent supervisor subgraph."""
    return await supervisor_agent.ainvoke(state)


def build_temporal_annotated_ace_graph() -> StateGraph:
    """Build a StateGraph identical to ACE's production graph, annotated with metadata for Temporal LangGraphPlugin.

    Execution Node Mapping:
    - clarify_with_user:         execute_in="activity" (LLM structured output)
    - write_research_brief:      execute_in="activity" (LLM structured brief)
    - populate_cognitive_state:  execute_in="workflow" (pure deterministic state transformation)
    - checkpoint_and_resume:     execute_in="workflow" (pure state interrupt)
    - supervisor_subgraph:       execute_in="activity" (multi-agent coordination & tool execution)
    - final_report_generation:   execute_in="activity" (LLM report synthesis)
    - save_report_to_file:       execute_in="activity" (disk I/O)
    """
    builder = StateGraph(AgentState, input_schema=AgentInputState)

    standard_retry = RetryPolicy(
        initial_interval=timedelta(seconds=2),
        backoff_coefficient=2.0,
        maximum_attempts=3,
        non_retryable_error_types=["ValueError", "ApplicationError"],
    )

    # Scoping & planning nodes
    builder.add_node(
        "clarify_with_user",
        clarify_with_user,
        metadata={
            "execute_in": "activity",
            "start_to_close_timeout": timedelta(minutes=5),
            "retry_policy": standard_retry,
        },
    )
    builder.add_node(
        "write_research_brief",
        write_research_brief,
        metadata={
            "execute_in": "activity",
            "start_to_close_timeout": timedelta(minutes=5),
            "retry_policy": standard_retry,
        },
    )
    builder.add_node(
        "populate_cognitive_state",
        populate_cognitive_state,
        metadata={"execute_in": "workflow"},
    )
    builder.add_node(
        "checkpoint_and_resume",
        checkpoint_and_resume,
        metadata={"execute_in": "workflow"},
    )

    # Research and reporting nodes
    builder.add_node(
        "supervisor_subgraph",
        supervisor_subgraph_node,
        metadata={
            "execute_in": "activity",
            "start_to_close_timeout": timedelta(minutes=20),
            "retry_policy": standard_retry,
        },
    )
    builder.add_node(
        "final_report_generation",
        final_report_generation,
        metadata={
            "execute_in": "activity",
            "start_to_close_timeout": timedelta(minutes=10),
            "retry_policy": standard_retry,
        },
    )
    builder.add_node(
        "save_report_to_file",
        save_report_to_file,
        metadata={
            "execute_in": "activity",
            "start_to_close_timeout": timedelta(minutes=2),
        },
    )

    # Edges preserving the existing ACE execution flow
    builder.add_edge(START, "clarify_with_user")
    builder.add_edge("write_research_brief", "populate_cognitive_state")
    builder.add_edge("populate_cognitive_state", "checkpoint_and_resume")
    builder.add_edge("checkpoint_and_resume", "supervisor_subgraph")
    builder.add_edge("supervisor_subgraph", "final_report_generation")
    builder.add_edge("final_report_generation", "save_report_to_file")
    builder.add_edge("save_report_to_file", END)

    return builder


def get_langgraph_plugin_instance(graphs: Dict[str, StateGraph] | None = None):
    """Instantiate the official Temporal LangGraphPlugin with the annotated ACE graph."""
    try:
        from temporalio.contrib.langgraph import LangGraphPlugin

        if graphs is None:
            graphs = {"ace_research": build_temporal_annotated_ace_graph()}

        return LangGraphPlugin(graphs=graphs)
    except Exception as exc:
        import logging
        logging.getLogger(__name__).debug(f"[adapters] Notice: LangGraphPlugin not initialized ({exc}).")
        return None
