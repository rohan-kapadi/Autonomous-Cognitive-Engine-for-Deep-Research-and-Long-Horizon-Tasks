"""Temporal durable-execution layer for ACE.

Runs the ACE research pipeline as a Temporal workflow so that long-horizon
research survives worker crashes, waits durably for human approval, and
exposes its cognitive state as a live query.
"""

TASK_QUEUE = "ace-research"
