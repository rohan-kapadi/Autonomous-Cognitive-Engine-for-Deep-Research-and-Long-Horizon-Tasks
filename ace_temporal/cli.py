"""Command-line client for driving ACE research workflows.

Usage:
    uv run python -m ace_temporal.cli start "Research topic..." [--auto-approve] [--wait]
    uv run python -m ace_temporal.cli status   <workflow-id>
    uv run python -m ace_temporal.cli clarify  <workflow-id> "answer"
    uv run python -m ace_temporal.cli approve  <workflow-id>
    uv run python -m ace_temporal.cli replan   <workflow-id> "new objective"
    uv run python -m ace_temporal.cli result   <workflow-id>
"""

import argparse
import asyncio
import json
import os
import uuid

import dotenv
from temporalio.client import Client

from ace_temporal import TASK_QUEUE
from ace_temporal.workflows import ACEResearchWorkflow

UI_URL = os.getenv("TEMPORAL_UI_URL", "http://localhost:8233")


async def main() -> None:
    dotenv.load_dotenv()
    parser = argparse.ArgumentParser(description="Drive ACE research workflows on Temporal")
    sub = parser.add_subparsers(dest="cmd", required=True)

    start = sub.add_parser("start", help="start a new research workflow")
    start.add_argument("objective")
    start.add_argument("--auto-approve", action="store_true", help="skip the human checkpoint")
    start.add_argument("--wait", action="store_true", help="block until the report is ready")
    start.add_argument("--id", help="workflow id (default: random)")

    for name in ("status", "approve", "result"):
        sub.add_parser(name).add_argument("workflow_id")
    for name, arg in (("clarify", "answer"), ("replan", "objective")):
        p = sub.add_parser(name)
        p.add_argument("workflow_id")
        p.add_argument(arg)

    args = parser.parse_args()
    namespace = os.getenv("TEMPORAL_NAMESPACE", "default")
    client = await Client.connect(os.getenv("TEMPORAL_ADDRESS", "localhost:7233"), namespace=namespace)

    if args.cmd == "start":
        workflow_id = args.id or f"ace-{uuid.uuid4().hex[:8]}"
        handle = await client.start_workflow(
            ACEResearchWorkflow.run,
            args=[args.objective, args.auto_approve],
            id=workflow_id,
            task_queue=TASK_QUEUE,
        )
        print(f"Started workflow {workflow_id}")
        print(f"Temporal UI: {UI_URL}/namespaces/{namespace}/workflows/{workflow_id}")
        if args.wait:
            result = await handle.result()
            print(f"\nReport saved to: {result['report_path']}\n")
            print(result["report"])
        return

    handle = client.get_workflow_handle(args.workflow_id)
    if args.cmd == "status":
        print(json.dumps(await handle.query(ACEResearchWorkflow.cognitive_state), indent=2))
    elif args.cmd == "clarify":
        await handle.signal(ACEResearchWorkflow.clarify, args.answer)
        print("Clarification sent")
    elif args.cmd == "approve":
        await handle.signal(ACEResearchWorkflow.approve)
        print("Plan approved; research starting")
    elif args.cmd == "replan":
        await handle.signal(ACEResearchWorkflow.replan, args.objective)
        print("Replan sent; ACE will re-scope and pause again")
    elif args.cmd == "result":
        result = await handle.result()
        print(f"Report saved to: {result['report_path']}\n")
        print(result["report"])


if __name__ == "__main__":
    asyncio.run(main())
