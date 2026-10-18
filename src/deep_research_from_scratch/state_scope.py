
"""State Definitions and Pydantic Schemas for Research Scoping.

This defines the state objects and structured schemas used for
the research agent scoping workflow, including researcher state management and output schemas.
"""

import operator
from typing_extensions import Optional, Annotated, List, Sequence

from langchain_core.messages import BaseMessage
from langgraph.graph import MessagesState
from langgraph.graph.message import add_messages
from pydantic import BaseModel, Field

# ===== ACE COGNITIVE STATUS VALUES =====
# Valid values for AgentState.status field
ACE_STATUS_PENDING   = "pending"      # Not yet started
ACE_STATUS_SCOPING   = "scoping"      # Clarifying with user
ACE_STATUS_PLANNING  = "planning"     # Writing research brief / plan
ACE_STATUS_RESEARCHING = "researching" # Sub-agents running
ACE_STATUS_PAUSED    = "paused"       # Interrupted / awaiting resume
ACE_STATUS_COMPLETE  = "complete"     # Final report generated

# ===== STATE DEFINITIONS =====

class AgentInputState(MessagesState):
    """Input state for the full agent - only contains messages from user input."""
    pass

class AgentState(MessagesState):
    """
    Main state for the full multi-agent research system.

    Extends MessagesState with additional fields for research coordination.

    ACE Cognitive State fields (new, all optional) make the agent's
    long-horizon execution state explicit and checkpointable:
      - objective         : The original user intent (plain string)
      - research_plan     : Structured plan produced after scoping
      - tasks             : All research sub-tasks identified
      - completed_tasks   : Tasks whose research is finished
      - pending_tasks     : Tasks not yet started or in-progress
      - sources           : URLs / citations collected during research
      - decisions         : Key decisions the agent made during execution
      - unresolved_questions : Open questions not yet answered
      - status            : Lifecycle status (see ACE_STATUS_* constants)

    Existing fields that are reused without duplication:
      - research_brief  → the detailed research plan/brief
      - raw_notes / notes → raw and processed findings
      - final_report    → output artifact
    """

    # Research brief generated from user conversation history
    research_brief: Optional[str]
    # Messages exchanged with the supervisor agent for coordination
    supervisor_messages: Annotated[Sequence[BaseMessage], add_messages]
    # Raw unprocessed research notes collected during the research phase
    raw_notes: Annotated[list[str], operator.add]
    # Processed and structured notes ready for report generation
    notes: Annotated[list[str], operator.add]
    # Final formatted research report
    final_report: str

    # ---- ACE Cognitive State Fields ----
    # Original user intent preserved verbatim for long-horizon context
    objective: Optional[str]
    # High-level research plan text generated after scoping
    research_plan: Optional[str]
    # All research sub-tasks the supervisor identified
    tasks: Annotated[list[str], operator.add]
    # Sub-tasks whose research has been completed
    completed_tasks: Annotated[list[str], operator.add]
    # Sub-tasks still pending execution
    pending_tasks: Annotated[list[str], operator.add]
    # Source URLs / citations discovered during research
    sources: Annotated[list[str], operator.add]
    # Significant decisions made by the agent during execution
    decisions: Annotated[list[str], operator.add]
    # Questions the agent could not answer with available information
    unresolved_questions: Annotated[list[str], operator.add]
    # Current lifecycle status of the ACE run
    status: Optional[str]

# ===== STRUCTURED OUTPUT SCHEMAS =====

class ClarifyWithUser(BaseModel):
    """Schema for user clarification decision and questions."""

    need_clarification: bool = Field(
        description="Whether the user needs to be asked a clarifying question.",
    )
    question: str = Field(
        description="A question to ask the user to clarify the report scope",
    )
    verification: str = Field(
        description="Verify message that we will start research after the user has provided the necessary information.",
    )

class ResearchQuestion(BaseModel):
    """Schema for structured research brief generation."""

    research_brief: str = Field(
        description="A research question that will be used to guide the research.",
    )






