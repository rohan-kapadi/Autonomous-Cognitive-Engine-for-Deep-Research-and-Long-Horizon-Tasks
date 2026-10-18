"""ACE Cognitive State Checkpoint Utilities.

This module provides utilities for:
1. Creating a MemorySaver checkpointer for LangGraph graphs.
2. Extracting a clean ACE cognitive state snapshot from a graph thread.
3. Pretty-printing the snapshot for logging / demo output.

These are thin wrappers over LangGraph primitives — no new persistence
system is introduced.  The graph must be compiled with the checkpointer
returned by ``make_checkpointer()`` for snapshots to work.
"""

from __future__ import annotations

import json
from typing import Any

from langgraph.checkpoint.memory import MemorySaver

from deep_research_from_scratch.state_scope import (
    ACE_STATUS_PENDING,
    ACE_STATUS_COMPLETE,
)


# ---------------------------------------------------------------------------
# Checkpointer factory
# ---------------------------------------------------------------------------

def make_checkpointer() -> MemorySaver:
    """Return a fresh MemorySaver checkpointer instance.

    A single shared checkpointer can be used across multiple graph threads;
    each thread is isolated by its ``thread_id`` in the configurable dict.
    """
    return MemorySaver()


# Shared checkpointer used by the production graph
# Import and attach to the compiled graph via: graph = builder.compile(checkpointer=ace_checkpointer)
ace_checkpointer = make_checkpointer()


# ---------------------------------------------------------------------------
# Snapshot extraction
# ---------------------------------------------------------------------------

_ACE_COGNITIVE_KEYS = (
    "objective",
    "research_brief",   # reused: serves as the research plan anchor
    "research_plan",
    "tasks",
    "completed_tasks",
    "pending_tasks",
    "raw_notes",        # reused: raw findings accumulator
    "notes",            # reused: processed findings
    "sources",
    "decisions",
    "unresolved_questions",
    "status",
    "final_report",
)


def get_cognitive_snapshot(graph: Any, thread_config: dict) -> dict:
    """Extract the ACE cognitive state from a running or paused graph thread.

    Args:
        graph: A compiled LangGraph StateGraph with a checkpointer attached.
        thread_config: The ``{"configurable": {"thread_id": ...}}`` dict
                       used when invoking the graph.

    Returns:
        A plain dict containing only the ACE cognitive state fields.
        Fields not yet populated are omitted (not present = not started).
    """
    state_snapshot = graph.get_state(thread_config)
    values: dict = state_snapshot.values if state_snapshot else {}

    snapshot: dict = {}
    for key in _ACE_COGNITIVE_KEYS:
        val = values.get(key)
        if val is not None and val != [] and val != "":
            snapshot[key] = val

    # Surface the next node so callers can see where execution is paused
    snapshot["_next_nodes"] = list(state_snapshot.next) if state_snapshot else []
    snapshot["_pending_interrupts"] = [
        task.interrupts[0].value
        for task in (state_snapshot.tasks if state_snapshot else [])
        if task.interrupts
    ]

    return snapshot


# ---------------------------------------------------------------------------
# Pretty-print helpers
# ---------------------------------------------------------------------------

def print_cognitive_state(snapshot: dict, title: str = "ACE Cognitive State") -> None:
    """Pretty-print the ACE cognitive state snapshot to stdout.

    Args:
        snapshot: Dict returned by ``get_cognitive_snapshot()``.
        title: Header string printed above the snapshot.
    """
    divider = "=" * 60
    print(f"\n{divider}")
    print(f"  {title}")
    print(divider)

    field_labels = {
        "objective":            "Objective",
        "status":               "Status",
        "research_brief":       "Research Brief",
        "research_plan":        "Research Plan",
        "tasks":                "Tasks (all)",
        "completed_tasks":      "Completed Tasks",
        "pending_tasks":        "Pending Tasks",
        "sources":              "Sources",
        "decisions":            "Decisions",
        "unresolved_questions": "Unresolved Questions",
        "raw_notes":            "Raw Notes (count)",
        "notes":                "Processed Notes (count)",
        "final_report":         "Final Report",
        "_next_nodes":          "Next Nodes (paused at)",
        "_pending_interrupts":  "Pending Interrupts",
    }

    for key in list(_ACE_COGNITIVE_KEYS) + ["_next_nodes", "_pending_interrupts"]:
        val = snapshot.get(key)
        if val is None:
            continue

        label = field_labels.get(key, key)

        # Summarize long list fields
        if key in ("raw_notes", "notes"):
            print(f"  {label}: {len(val)} item(s)")
        elif isinstance(val, list):
            if val:
                print(f"  {label}:")
                for item in val:
                    preview = str(item)[:120].replace("\n", " ")
                    print(f"    • {preview}")
        elif isinstance(val, str) and len(val) > 200:
            print(f"  {label}: {val[:200].replace(chr(10), ' ')}…")
        else:
            print(f"  {label}: {val}")

    print(divider + "\n")


def snapshot_to_json(snapshot: dict, indent: int = 2) -> str:
    """Serialize a cognitive snapshot to a JSON string.

    Lists of messages or BaseMessage objects are stringified for portability.
    """
    def _safe(obj: Any) -> Any:
        if isinstance(obj, list):
            return [_safe(i) for i in obj]
        if isinstance(obj, dict):
            return {k: _safe(v) for k, v in obj.items()}
        try:
            json.dumps(obj)
            return obj
        except (TypeError, ValueError):
            return str(obj)

    return json.dumps(_safe(snapshot), indent=indent)
