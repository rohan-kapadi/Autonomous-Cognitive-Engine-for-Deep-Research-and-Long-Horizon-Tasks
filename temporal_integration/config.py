"""Configuration for Temporal Durable Execution and LangSmith Observability in ACE."""

import os
from dataclasses import dataclass

from dotenv import load_dotenv

# Ensure local .env is loaded if present
load_dotenv(override=False)


@dataclass
class TemporalConfig:
    """Settings for Temporal client, worker, and workflow execution."""

    # Temporal Server connection
    temporal_address: str = "localhost:7233"
    temporal_namespace: str = "default"
    temporal_task_queue: str = "ace-research"
    workflow_id_prefix: str = "ace-research"

    # LangSmith / LangChain Observability
    langsmith_project: str = "ace-temporal-demo"
    langsmith_api_key: str | None = None
    tracing_enabled: bool = True
    add_temporal_runs: bool = True

    # Activity execution policies
    scoping_timeout_seconds: int = 300       # 5 minutes for scoping & brief generation
    research_timeout_seconds: int = 1800     # 30 minutes for multi-agent research & report
    max_activity_retries: int = 3
    retry_initial_interval_seconds: float = 2.0
    retry_backoff_coefficient: float = 2.0


def get_temporal_config() -> TemporalConfig:
    """Build TemporalConfig populated from environment variables with sensible defaults."""
    # Resolve LangSmith API key and project
    langsmith_key = os.getenv("LANGSMITH_API_KEY") or os.getenv("LANGCHAIN_API_KEY")
    langsmith_proj = (
        os.getenv("LANGCHAIN_PROJECT")
        or os.getenv("LANGSMITH_PROJECT")
        or "ace-temporal-demo"
    )
    tracing_val = os.getenv("LANGCHAIN_TRACING_V2", "true").lower()
    tracing_enabled = tracing_val in ("true", "1", "yes")

    return TemporalConfig(
        temporal_address=os.getenv("TEMPORAL_ADDRESS", "localhost:7233"),
        temporal_namespace=os.getenv("TEMPORAL_NAMESPACE", "default"),
        temporal_task_queue=os.getenv("TEMPORAL_TASK_QUEUE", "ace-research"),
        workflow_id_prefix=os.getenv("TEMPORAL_WORKFLOW_ID_PREFIX", "ace-research"),
        langsmith_project=langsmith_proj,
        langsmith_api_key=langsmith_key,
        tracing_enabled=tracing_enabled,
        add_temporal_runs=True,
        scoping_timeout_seconds=int(os.getenv("TEMPORAL_SCOPING_TIMEOUT", "300")),
        research_timeout_seconds=int(os.getenv("TEMPORAL_RESEARCH_TIMEOUT", "1800")),
        max_activity_retries=int(os.getenv("TEMPORAL_MAX_RETRIES", "3")),
    )


def get_langsmith_plugin(config: TemporalConfig | None = None):
    """Instantiate the official Temporal LangSmith plugin if tracing is enabled.

    Returns:
        LangSmithPlugin instance, or None if tracing is disabled or plugin unavailable.
    """
    if config is None:
        config = get_temporal_config()

    if not config.tracing_enabled:
        return None

    try:
        from temporalio.contrib.langsmith import LangSmithPlugin

        return LangSmithPlugin(
            project_name=config.langsmith_project,
            add_temporal_runs=config.add_temporal_runs,
        )
    except Exception as exc:
        print(f"[temporal_config] Notice: LangSmithPlugin could not be loaded ({exc}). Continuing without Temporal-level trace spans.")
        return None
