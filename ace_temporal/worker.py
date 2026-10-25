"""Temporal worker that executes ACE workflows and activities.

Usage:
    uv run python -m ace_temporal.worker
"""

import asyncio
import logging
import os

import dotenv
from temporalio.client import Client
from temporalio.worker import Worker

from ace_temporal import TASK_QUEUE
from ace_temporal.activities import ALL_ACTIVITIES
from ace_temporal.workflows import ACEResearchWorkflow


async def main() -> None:
    dotenv.load_dotenv()
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

    address = os.getenv("TEMPORAL_ADDRESS", "localhost:7233")
    client = await Client.connect(address, namespace=os.getenv("TEMPORAL_NAMESPACE", "default"))
    worker = Worker(
        client,
        task_queue=TASK_QUEUE,
        workflows=[ACEResearchWorkflow],
        activities=ALL_ACTIVITIES,
    )
    logging.info("ACE worker connected to %s, polling task queue '%s'", address, TASK_QUEUE)
    await worker.run()


if __name__ == "__main__":
    asyncio.run(main())
