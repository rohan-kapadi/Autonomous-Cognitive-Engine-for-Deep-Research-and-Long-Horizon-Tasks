"""User Clarification and Research Brief Generation.

This module implements the scoping phase of the research workflow, where we:
1. Assess if the user's request needs clarification
2. Generate a detailed research brief from the conversation

Uses the shared cognitive model (Jarvislabs Token Factory by default) for structured output in scoping steps.
"""

from datetime import datetime
from typing_extensions import Literal

from langchain_core.messages import HumanMessage, AIMessage, get_buffer_string
from langgraph.graph import StateGraph, START, END
from langgraph.types import Command

from deep_research_from_scratch.prompts import clarify_with_user_instructions, transform_messages_into_research_topic_prompt
from deep_research_from_scratch.state_scope import AgentState, ClarifyWithUser, ResearchQuestion, AgentInputState
from deep_research_from_scratch.retry_utils import ainvoke_with_retry
from deep_research_from_scratch.gemma_model import get_cognitive_model

# ===== UTILITY FUNCTIONS =====

def get_today_str() -> str:
    """Get current date in a human-readable format."""
    try:
        return datetime.now().strftime("%a %b %#d, %Y")
    except ValueError:
        return datetime.now().strftime("%a %b %-d, %Y")

# ===== CONFIGURATION =====
# Shared cognitive model (Jarvislabs by default, Groq fallback)
scoping_model = get_cognitive_model()

# ===== WORKFLOW NODES =====

async def clarify_with_user(state: AgentState) -> Command[Literal["write_research_brief", "__end__"]]:
    """
    Determine if the user's request contains sufficient information to proceed.
    Async to avoid blocking the LangGraph server event loop.
    """
    structured_output_model = scoping_model.with_structured_output(ClarifyWithUser)

    response = await ainvoke_with_retry(
        structured_output_model,
        [HumanMessage(content=clarify_with_user_instructions.format(
            messages=get_buffer_string(messages=state["messages"]),
            date=get_today_str()
        ))]
    )

    if response.need_clarification:
        return Command(
            goto=END,
            update={"messages": [AIMessage(content=response.question)]}
        )

    return Command(
        goto="write_research_brief",
        update={"messages": [AIMessage(content=response.verification)]}
    )


async def write_research_brief(state: AgentState):
    """
    Transform conversation history into a structured research brief.
    Async to avoid blocking the LangGraph server event loop.
    """
    structured_output_model = scoping_model.with_structured_output(ResearchQuestion)

    response = await ainvoke_with_retry(
        structured_output_model,
        [HumanMessage(content=transform_messages_into_research_topic_prompt.format(
            messages=get_buffer_string(state.get("messages", [])),
            date=get_today_str()
        ))]
    )

    return {
        "research_brief": response.research_brief
    }


deep_researcher_builder = StateGraph(AgentState, input_schema=AgentInputState)

# Add workflow nodes
deep_researcher_builder.add_node("clarify_with_user", clarify_with_user)
deep_researcher_builder.add_node("write_research_brief", write_research_brief)

# Add workflow edges
deep_researcher_builder.add_edge(START, "clarify_with_user")
deep_researcher_builder.add_edge("write_research_brief", END)

# Compile the workflow
scope_research = deep_researcher_builder.compile()
