"""ACE Cognitive State Execution & Demonstration Script."""
import os
import sys
import asyncio
import dotenv

# Load environment variables from .env
dotenv.load_dotenv()

# Setup environment flags
os.environ["PYTHONIOENCODING"] = "utf-8"
os.environ["PYTHONUTF8"] = "1"
os.environ["LANGCHAIN_TRACING_V2"] = os.getenv("LANGCHAIN_TRACING_V2", "true")
os.environ["LANGCHAIN_PROJECT"] = os.getenv("LANGCHAIN_PROJECT", "deep_research_from_scratch")

sys.path.insert(0, "src")

from langchain_core.messages import HumanMessage, AIMessage
from langgraph.types import Command
from langgraph.checkpoint.memory import MemorySaver
from deep_research_from_scratch.research_agent_full import deep_researcher_builder
from deep_research_from_scratch.generate_checkpoint import print_cognitive_state, get_cognitive_snapshot

async def main():
    print("=" * 60)
    print("  ACE: Autonomous Cognitive Engine - Standalone Demo")
    print("=" * 60)

    graph = deep_researcher_builder.compile(checkpointer=MemorySaver())
    thread_id = "ace-demo-session"
    config = {"configurable": {"thread_id": thread_id}}

    prompt = (
        "I need a comprehensive research report on: "
        "Autonomous Cognitive Engines (ACE) architectures for long-horizon AI agents in 2025-2026. "
        "Target audience is AI engineers. Focus on persistent memory, checkpoint/resume mechanisms, and cognitive replanning. "
        "Provide architectural patterns, component roles, and design trade-offs."
    )

    print(f"\n[Turn 1] Submitting User Prompt...")
    async for event in graph.astream({"messages": [HumanMessage(content=prompt)]}, config):
        for node_name in event.keys():
            print(f"  -> Node completed: {node_name}")

    state = graph.get_state(config)
    last_msg = state.values["messages"][-1]
    
    # If agent asked for clarification (no report produced), provide answer to continue
    if not state.values.get("final_report"):
        print(f"\n[Agent Asked Clarification]:\n{last_msg.content[:200]}...\n")
        answer = "Yes, focus specifically on open-source agent runtime architectures with explicit checkpoint/resume cognitive states."
        print(f"[Turn 2] User Answers:\n{answer}\n")
        async for event in graph.astream({"messages": [HumanMessage(content=answer)]}, config):
            for node_name in event.keys():
                print(f"  -> Node completed: {node_name}")

    # Inspect the persisted cognitive snapshot after the run
    snapshot = get_cognitive_snapshot(graph, config)
    print_cognitive_state(snapshot, title="ACE Cognitive State (Final)")

if __name__ == "__main__":
    asyncio.run(main())
