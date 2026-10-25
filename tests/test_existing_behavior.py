"""Regression tests ensuring existing ACE research graph behavior, schemas, and cognitive state remain intact."""

import os
import sys
from unittest.mock import patch

# Ensure src and root are in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "src")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from langchain_core.messages import HumanMessage

from deep_research_from_scratch.gemma_model import get_active_model_info
from deep_research_from_scratch.generate_checkpoint import (
    get_cognitive_snapshot,
    make_checkpointer,
    snapshot_to_json,
)
from deep_research_from_scratch.research_agent_full import (
    deep_researcher_builder,
    populate_cognitive_state,
)
from deep_research_from_scratch.state_scope import (
    ACE_STATUS_PLANNING,
)


def test_graph_structure_and_nodes():
    """Verify that all core ACE nodes and transitions exist in deep_researcher_builder."""
    nodes = deep_researcher_builder.nodes
    expected_nodes = {
        "clarify_with_user",
        "write_research_brief",
        "populate_cognitive_state",
        "checkpoint_and_resume",
        "supervisor_subgraph",
        "final_report_generation",
        "save_report_to_file",
    }
    for node in expected_nodes:
        assert node in nodes, f"Expected node '{node}' not found in deep_researcher_builder"


def test_populate_cognitive_state():
    """Verify that populate_cognitive_state extracts the objective and copies research brief."""
    state = {
        "messages": [HumanMessage(content="Investigate AI Agent Architecture in 2026")],
        "research_brief": "Detailed brief for AI Agent Architecture",
    }
    updates = populate_cognitive_state(state)

    assert updates["objective"] == "Investigate AI Agent Architecture in 2026"
    assert updates["research_plan"] == "Detailed brief for AI Agent Architecture"
    assert updates["status"] == ACE_STATUS_PLANNING
    assert isinstance(updates["tasks"], list)
    assert isinstance(updates["sources"], list)
    assert len(updates["decisions"]) > 0


def test_cognitive_snapshot_extraction():
    """Verify snapshot extraction and JSON serialization from a compiled graph."""
    checkpointer = make_checkpointer()
    graph = deep_researcher_builder.compile(checkpointer=checkpointer)
    config = {"configurable": {"thread_id": "test-thread-reg-1"}}

    # Snapshot on an uninitialized thread
    snapshot = get_cognitive_snapshot(graph, config)
    assert isinstance(snapshot, dict)
    assert "_next_nodes" in snapshot
    assert "_pending_interrupts" in snapshot

    # JSON serialization
    json_str = snapshot_to_json(snapshot)
    assert isinstance(json_str, str)
    assert "{" in json_str


def test_active_model_info():
    """Verify that get_active_model_info returns expected provider details."""
    with patch.dict(os.environ, {"RESEARCH_MODEL_PROVIDER": "groq", "GROQ_MODEL": "groq:qwen/qwen3.8-27b"}):
        info = get_active_model_info()
        assert info["provider"] == "groq"
        assert "qwen" in info["model"]


def test_temporal_annotated_ace_graph_and_plugin():
    """Verify that build_temporal_annotated_ace_graph sets execute_in metadata on all nodes and instantiates LangGraphPlugin."""
    from temporal_integration.adapters import (
        build_temporal_annotated_ace_graph,
        get_langgraph_plugin_instance,
    )

    graph = build_temporal_annotated_ace_graph()
    for node_name, node in graph.nodes.items():
        meta = getattr(node, "metadata", None)
        assert meta is not None, f"Node {node_name} missing metadata"
        assert "execute_in" in meta, f"Node {node_name} missing 'execute_in'"
        assert meta["execute_in"] in ("activity", "workflow")

    plugin = get_langgraph_plugin_instance({"ace_research": graph})
    assert plugin is not None
