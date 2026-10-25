"""Temporal Worker process for ACE Research Workflows with LangSmith Observability."""

import asyncio
import signal
import sys

from temporalio.client import Client
from temporalio.worker import Worker

from temporal_integration.activities import (
    execute_research_and_report_activity,
    execute_single_pass_research_activity,
    run_scoping_and_planning_activity,
)
from temporal_integration.config import (
    TemporalConfig,
    get_langsmith_plugin,
    get_temporal_config,
)
from temporal_integration.workflows import ACEResearchWorkflow


async def create_temporal_worker(
    client: Client,
    config: TemporalConfig | None = None,
) -> Worker:
    """Create a configured Temporal Worker with registered ACE workflows, activities, and plugins."""
    if config is None:
        config = get_temporal_config()

    plugins = []
    langsmith_plugin = get_langsmith_plugin(config)
    if langsmith_plugin:
        plugins.append(langsmith_plugin)

    worker = Worker(
        client,
        task_queue=config.temporal_task_queue,
        workflows=[ACEResearchWorkflow],
        activities=[
            run_scoping_and_planning_activity,
            execute_research_and_report_activity,
            execute_single_pass_research_activity,
        ],
        plugins=plugins,
    )
    return worker


async def run_worker() -> None:
    """Run the standalone Temporal Worker until interrupted."""
    config = get_temporal_config()
    print("=" * 65)
    print("  ACE: AUTONOMOUS COGNITIVE ENGINE — TEMPORAL WORKER")
    print("=" * 65)
    print(f"  • Temporal Server : {config.temporal_address}")
    print(f"  • Namespace       : {config.temporal_namespace}")
    print(f"  • Task Queue      : {config.temporal_task_queue}")
    print(f"  • LangSmith Proj  : {config.langsmith_project}")
    print(f"  • Tracing Active  : {config.tracing_enabled}")
    print("=" * 65)

    client_plugins = []
    langsmith_plugin = get_langsmith_plugin(config)
    if langsmith_plugin:
        client_plugins.append(langsmith_plugin)

    print(f"\n[Worker] Connecting to Temporal server at {config.temporal_address}...")
    try:
        client = await Client.connect(
            config.temporal_address,
            namespace=config.temporal_namespace,
            plugins=client_plugins,
        )
        print("  ✓ Connected successfully!")
    except Exception as e:
        print(f"\n[Worker Error] Could not connect to Temporal at {config.temporal_address}: {e}")
        print("Tip: Start the local Temporal Development Server first:")
        print("     temporal server start-dev\n")
        sys.exit(1)

    worker = await create_temporal_worker(client, config)

    stop_event = asyncio.Event()

    def signal_handler():
        print("\n[Worker] Shutdown signal received. Draining active tasks...")
        stop_event.set()

    loop = asyncio.get_running_loop()
    for sig in (signal.SIGINT, signal.SIGTERM):
        try:
            loop.add_signal_handler(sig, signal_handler)
        except NotImplementedError:
            pass  # Windows fallback

    print(f"[Worker] Listening for research workflows on task queue '{config.temporal_task_queue}'...")
    print("         Press Ctrl+C to stop.\n")

    async with worker:
        await stop_event.wait()

    print("[Worker] Clean shutdown complete.")


if __name__ == "__main__":
    try:
        asyncio.run(run_worker())
    except KeyboardInterrupt:
        print("\n[Worker] Stopped.")
