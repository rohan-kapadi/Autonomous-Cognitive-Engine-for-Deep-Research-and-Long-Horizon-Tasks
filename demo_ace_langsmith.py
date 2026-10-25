"""demo_ace_langsmith.py — Interactive ACE Demo for LangSmith.

Designed specifically for live demonstrations and hackathon judges.

Features:
- Live tracing directly to LangSmith under project 'ACE-Autonomous-Cognitive-Engine'.
- Shows the state transition: Scoping -> Cognitive Plan -> Research -> Report.
- Interactive: answers the scoping agent's clarifying questions, then runs to completion.
- Prints the exact LangSmith trace URL to open in your browser.
"""

import os
import sys
import asyncio

# Windows asyncio & UTF-8 setup
if sys.platform.startswith("win"):
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

# Ensure src in sys.path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "src"))

# Load environment
from dotenv import load_dotenv
load_dotenv(override=True)

# LangSmith tracing on by default; set LANGCHAIN_TRACING_V2=false in .env to disable
os.environ.setdefault("LANGCHAIN_TRACING_V2", "true")
if os.getenv("LANGSMITH_API_KEY") and not os.getenv("LANGCHAIN_API_KEY"):
    os.environ["LANGCHAIN_API_KEY"] = os.environ["LANGSMITH_API_KEY"]
if not os.getenv("LANGCHAIN_PROJECT"):
    os.environ["LANGCHAIN_PROJECT"] = os.getenv("LANGSMITH_PROJECT", "ACE-Autonomous-Cognitive-Engine")

from langchain_core.messages import HumanMessage

from deep_research_from_scratch.research_agent_full import agent
from deep_research_from_scratch.generate_checkpoint import ace_checkpointer
if not agent.checkpointer: agent.checkpointer = ace_checkpointer
from deep_research_from_scratch.generate_checkpoint import get_cognitive_snapshot, print_cognitive_state
from deep_research_from_scratch.gemma_model import get_active_model_info


THREAD_ID = f"ace-demo-{os.getpid()}"
CONFIG = {
    "configurable": {"thread_id": THREAD_ID},
    "metadata": {
        "engine": "ACE (Autonomous Cognitive Engine)",
        "model": get_active_model_info()["model"],
        "demo": "persistent-cognitive-checkpoint",
    },
    "tags": ["ACE", "Gemma-4", "Checkpoint-Resume", "Hackathon-Demo"],
    "run_name": "ACE-Cognitive-Workflow",
}

DEFAULT_PROMPT = "What are the key benefits and patterns of long-term memory for autonomous AI agents?"


async def stream_nodes(graph_input):
    """Stream the graph asynchronously (scoping nodes are async) and print each completed node."""
    async for event in agent.astream(graph_input, CONFIG, stream_mode="updates"):
        node_name = list(event.keys())[0] if event else "?"
        print(f"  ✓ Completed node: {node_name}")


async def main():
    print("\n" + "=" * 70)
    print("   ACE: AUTONOMOUS COGNITIVE ENGINE — LANGSMITH LIVE DEMO")
    print("=" * 70)

    model_info = get_active_model_info()
    project_name = os.getenv("LANGCHAIN_PROJECT")
    print(f"  • Primary Model  : {model_info['model']} ({model_info['provider'].upper()})")
    print(f"  • LangSmith Proj : {project_name}")
    print(f"  • Session Thread : {THREAD_ID}")
    print(f"  • LangSmith URL  : https://smith.langchain.com")
    print("=" * 70 + "\n")

    user_query = input(f"Enter research topic (Press ENTER for default):\n[{DEFAULT_PROMPT}]: ").strip()
    if not user_query:
        user_query = DEFAULT_PROMPT

    print(f"\n[Step 1] Starting Autonomous Cognitive Engine with query:")
    print(f"         \"{user_query}\"\n")
    print(">>> State graph is executing: scoping -> research -> report...")

    await stream_nodes({"messages": [HumanMessage(content=user_query)]})

    # The scoping agent may ask a clarifying question instead of starting research
    while not agent.get_state(CONFIG).values.get("final_report"):
        question = agent.get_state(CONFIG).values["messages"][-1].content
        print(f"\n[Agent asks] {question}")
        answer = input("Your answer (or 'q' to quit):\n> ").strip()
        if answer.lower() == "q":
            return
        await stream_nodes({"messages": [HumanMessage(content=answer)]})

    print("\n[Step 2] Execution complete! Reading persistent cognitive state from checkpointer...")
    final_snapshot = get_cognitive_snapshot(agent, CONFIG)
    print_cognitive_state(final_snapshot, title="Persistent ACE Cognitive State")

    print(f"\n  • Final Status : {final_snapshot.get('status')}")
    print(f"  • {agent.get_state(CONFIG).values['messages'][-1].content}")
    print(f"  • Report preview: {str(final_snapshot.get('final_report', ''))[:200]}...")

    print("\n" + "-" * 70)
    print("  WHAT TO SHOW IN LANGSMITH NOW:")
    print(f"  1. Go to https://smith.langchain.com -> Project '{project_name}'")
    print("  2. Click on the latest run ('ACE-Cognitive-Workflow')")
    print("  3. Walk through scoping, the supervisor's delegation, each researcher's searches, and the report")
    print("-" * 70)


if __name__ == "__main__":
    asyncio.run(main())
