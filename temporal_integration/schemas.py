"""Typed Data Schemas for Temporal Workflows and Activities."""

from dataclasses import dataclass, field
from typing import Any


@dataclass
class ResearchWorkflowInput:
    """Input payload to start an ACE research workflow."""

    objective: str
    thread_id: str = ""
    auto_approve: bool = False
    max_research_iterations: int = 2
    tags: list[str] = field(default_factory=list)
    metadata: dict[str, str] = field(default_factory=dict)


@dataclass
class ApprovalDecision:
    """Human approval or replanning payload sent via Temporal signal."""

    approved: bool = True
    replan: str | None = None  # If provided, triggers ACE cognitive replanning
    feedback: str | None = None


@dataclass
class ScopingOutput:
    """Output from the scoping and research brief generation activity."""

    thread_id: str
    objective: str
    research_brief: str
    research_plan: str
    status: str
    is_paused: bool
    cognitive_snapshot: dict[str, Any] = field(default_factory=dict)


@dataclass
class ResumeResearchInput:
    """Input for resuming research execution after the checkpoint pause."""

    thread_id: str
    resume_arg_json: str = "true"  # JSON encoded True or {"replan": "..."}


@dataclass
class FinalResearchOutput:
    """Output from the multi-agent research and report generation activity."""

    thread_id: str
    final_report: str
    report_filepath: str | None = None
    status: str = "complete"
    cognitive_snapshot: dict[str, Any] = field(default_factory=dict)
    notes_count: int = 0
    sources_count: int = 0


@dataclass
class ResearchWorkflowResult:
    """Final result returned by ACEResearchWorkflow."""

    workflow_id: str
    thread_id: str
    status: str
    objective: str
    final_report: str
    report_filepath: str | None = None
    cognitive_state: dict[str, Any] = field(default_factory=dict)
    approved: bool = True
    replan_instruction: str | None = None
    error_message: str | None = None
