"""demo_ace_temporal.py — Interactive ACE Demo with Temporal Durable Execution & LangSmith.

Designed for live hackathon demonstrations and judges:
1. Coordinates research execution durably via Temporal workflows & activities.
2. Emits linked observability spans to LangSmith under project 'ace-temporal-demo'.
3. Pauses at the cognitive checkpoint (durable wait with 0 CPU overhead).
4. Allows judges to inspect persistent state in Temporal UI and LangSmith.
5. Interactive human-in-the-loop: Press ENTER to resume, or type a replan directive!
"""

import asyncio
import os
import sys

# Windows asyncio & UTF-8 setup
if sys.platform.startswith("win"):
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

# Ensure src and root are in sys.path
root_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(root_dir, "src"))
sys.path.insert(0, root_dir)

from dotenv import load_dotenv

load_dotenv(override=True)

from deep_research_from_scratch.gemma_model import get_active_model_info
from deep_research_from_scratch.generate_checkpoint import print_cognitive_state
from temporal_integration.client import ACEWorkflowClient
from temporal_integration.config import get_temporal_config
from temporal_integration.worker import create_temporal_worker

DEFAULT_PROMPT = "What are the key benefits and patterns of long-term memory for autonomous AI agents?"


async def run_interactive_demo():
    config = get_temporal_config()
    model_info = get_active_model_info()

    print("\n" + "=" * 75)
    print("   ACE: AUTONOMOUS COGNITIVE ENGINE — TEMPORAL DURABLE DEMO")
    print("=" * 75)
    print(f"  • Primary Model    : {model_info['model']} ({model_info['provider'].upper()})")
    print(f"  • Temporal Server  : {config.temporal_address}")
    print(f"  • Task Queue       : {config.temporal_task_queue}")
    print("  • Temporal UI      : http://localhost:8233")
    print(f"  • LangSmith Proj   : {config.langsmith_project}")
    print("  • LangSmith URL    : https://smith.langchain.com")
    print("=" * 75 + "\n")

    user_query = input(f"Enter research topic (Press ENTER for default):\n[{DEFAULT_PROMPT}]: ").strip()
    if not user_query:
        user_query = DEFAULT_PROMPT

    print(f"\n[Step 1] Connecting to Temporal server at {config.temporal_address}...")
    try:
        client = await ACEWorkflowClient.connect(config)
        print("  ✓ Connected to Temporal successfully.")
    except Exception as exc:
        print(f"\n[Connection Notice] Could not connect to external Temporal server ({exc}).")
        print("Tip: You can start the local development server in another terminal:")
        print("     temporal server start-dev\n")
        return

    # Start an embedded worker for the demo session if desired
    worker = await create_temporal_worker(client.client, config)

    async with worker:
        workflow_id = f"ace-temporal-demo-{os.getpid()}"
        print(f"\n[Step 2] Launching ACEResearchWorkflow on task queue '{config.temporal_task_queue}'...")
        print(f"  • Workflow ID: {workflow_id}")

        await client.start_research(
            objective=user_query,
            workflow_id=workflow_id,
        )

        print("\n>>> Workflow started! Temporal is executing the scoping activity...")
        print("    (Running: clarify_with_user -> write_research_brief -> populate_cognitive_state -> checkpoint)")

        # Poll workflow until it reaches the paused state
        while True:
            status = await client.get_status(workflow_id)
            is_waiting = await client.is_waiting_for_approval(workflow_id)
            if is_waiting or status in ("paused", "complete", "rejected"):
                break
            await asyncio.sleep(1.0)

        # Retrieve and display cognitive snapshot at the checkpoint
        print("\n[Step 3] AGENT PAUSED AT CHECKPOINT!")
        print(">>> Retrieving persistent cognitive state via Temporal query...")
        snapshot = await client.get_cognitive_state(workflow_id)
        print_cognitive_state(snapshot, title="Durable ACE Cognitive State (Temporal Checkpoint)")

        print("-" * 75)
        print("  WHAT TO SHOW TO JUDGES NOW:")
        print("  1. Temporal Web UI: http://localhost:8233")
        print(f"     • Click on workflow '{workflow_id}'")
        print("     • Point out: 'run_scoping_and_planning_activity' completed with full history & retry metadata.")
        print("     • The workflow is currently sleeping/waiting for a Temporal Signal (zero CPU load).")
        print(f"  2. LangSmith Dashboard: https://smith.langchain.com -> Project '{config.langsmith_project}'")
        print("     • Point out the execution run linked directly to this Temporal workflow execution.")
        print("-" * 75 + "\n")

        choice = input("Press ENTER to resume execution (or type 'q' to stop here, or enter a replan directive):\n> ").strip()

        if choice.lower() == 'q':
            print(f"\nDemo paused. Workflow '{workflow_id}' remains durable on Temporal server.")
            return

        replan_arg: str | None = None
        if choice:
            replan_arg = choice
            print(f"\n>>> Sending Temporal Signal with replan directive: '{choice}'...")
        else:
            print("\n>>> Sending Temporal Signal to approve plan and proceed...")

        await client.submit_approval(
            workflow_id=workflow_id,
            approved=True,
            replan=replan_arg,
        )

        print("\n[Step 4] Temporal workflow resuming research & report generation...")
        print("         (Executing: supervisor_subgraph -> final_report_generation -> save_report_to_file)")

        result = await client.wait_for_result(workflow_id)

        print("\n" + "=" * 75)
        print("  ACE RESEARCH EXECUTION COMPLETE! ✓")
        print("=" * 75)
        print(f"  • Final Status     : {result.status}")
        print(f"  • Thread ID        : {result.thread_id}")
        if result.report_filepath:
            print(f"  • Saved Report     : {result.report_filepath}")
        print("\n  Report Preview:")
        preview_lines = result.final_report.strip().split("\n")[:8]
        for line in preview_lines:
            print(f"    | {line}")
        print(f"    ... [{len(result.final_report)} total characters]")
        print("=" * 75 + "\n")


if __name__ == "__main__":
    asyncio.run(run_interactive_demo())
