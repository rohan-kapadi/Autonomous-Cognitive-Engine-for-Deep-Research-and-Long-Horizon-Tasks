"""test_ace_checkpoint.py — ACE Cognitive State + Checkpoint Smoke Test.

Verifies:
1. The production graph runs until the interrupt() at checkpoint_and_resume.
2. The ACE cognitive state is populated (objective, research_plan, status, …).
3. The state is readable via graph.get_state() (i.e. MemorySaver is working).
4. Resuming with Command(resume=True) continues to completion.
5. Final status is 'complete'.

Run:
    python test_ace_checkpoint.py
"""

import asyncio
import sys
import os

# Windows asyncio compatibility & UTF-8
if sys.platform.startswith("win"):
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

# Ensure src is in sys.path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "src"))

# Load .env
from dotenv import load_dotenv
load_dotenv(override=True)

from langchain_core.messages import HumanMessage
from langgraph.types import Command

# ---- Import the production graph and checkpoint utilities ----
from deep_research_from_scratch.research_agent_full import agent
from deep_research_from_scratch.generate_checkpoint import ace_checkpointer
if not agent.checkpointer: agent.checkpointer = ace_checkpointer
from deep_research_from_scratch.generate_checkpoint import (
    get_cognitive_snapshot,
    print_cognitive_state,
    snapshot_to_json,
)
from deep_research_from_scratch.state_scope import ACE_STATUS_PAUSED, ACE_STATUS_COMPLETE


THREAD_CONFIG = {"configurable": {"thread_id": "ace-smoke-test-001"}}

TEST_QUERY = "What are the main use cases of persistent AI agent memory in enterprise applications?"


async def main():
    print("\n" + "="*60)
    print("  ACE Cognitive State + Checkpoint Smoke Test")
    print("="*60)

    # ------------------------------------------------------------------
    # PHASE 1: Start the graph — runs until interrupt()
    # ------------------------------------------------------------------
    print(f"\n[1/4] Starting research graph with query:\n      {TEST_QUERY}\n")
    print("      (Graph will pause at checkpoint_and_resume node)\n")

    initial_input = {"messages": [HumanMessage(content=TEST_QUERY)]}

    # Stream events until the graph pauses at interrupt
    async for event in agent.astream(initial_input, THREAD_CONFIG, stream_mode="updates"):
        node_name = list(event.keys())[0] if event else "?"
        print(f"  ✓ Node executed: {node_name}")

    # ------------------------------------------------------------------
    # PHASE 2: Read and verify cognitive state at the interrupt point
    # ------------------------------------------------------------------
    print("\n[2/4] Reading cognitive state from MemorySaver checkpoint...")

    snapshot = get_cognitive_snapshot(agent, THREAD_CONFIG)
    print_cognitive_state(snapshot, title="ACE Cognitive State at Checkpoint")

    # Assertions
    assert snapshot.get("objective"), "FAIL: objective not populated"
    assert snapshot.get("research_plan") or snapshot.get("research_brief"), \
        "FAIL: research_plan/research_brief not populated"
    assert snapshot.get("status") in (ACE_STATUS_PAUSED, "planning"), \
        f"FAIL: unexpected status: {snapshot.get('status')}"
    assert snapshot.get("_next_nodes"), "FAIL: graph did not pause (no next nodes)"

    print("  ✓ Cognitive state verified: objective, research_plan, status all present")
    print(f"  ✓ Graph paused at: {snapshot['_next_nodes']}")
    print(f"  ✓ MemorySaver checkpoint is alive (thread_id: ace-smoke-test-001)")

    # ------------------------------------------------------------------
    # PHASE 3: Dump JSON snapshot for logging
    # ------------------------------------------------------------------
    print("\n[3/4] JSON snapshot of cognitive state:")
    print(snapshot_to_json(snapshot, indent=2))

    # ------------------------------------------------------------------
    # PHASE 4: Resume the graph and run to completion
    # ------------------------------------------------------------------
    print("\n[4/4] Resuming graph with Command(resume=True)...")
    print("      (This will run the full research + report pipeline)\n")

    async for event in agent.astream(
        Command(resume=True),
        THREAD_CONFIG,
        stream_mode="updates",
    ):
        node_name = list(event.keys())[0] if event else "?"
        print(f"  ✓ Node executed: {node_name}")

    # Read final cognitive state
    final_snapshot = get_cognitive_snapshot(agent, THREAD_CONFIG)
    print_cognitive_state(final_snapshot, title="ACE Cognitive State — Final")

    final_status = final_snapshot.get("status", "")
    assert final_status == ACE_STATUS_COMPLETE, \
        f"FAIL: expected status='complete', got '{final_status}'"

    print("\n" + "="*60)
    print("  ALL ASSERTIONS PASSED ✓")
    print("  ACE cognitive state + checkpoint/resume is working.")
    print("="*60 + "\n")


if __name__ == "__main__":
    asyncio.run(main())
