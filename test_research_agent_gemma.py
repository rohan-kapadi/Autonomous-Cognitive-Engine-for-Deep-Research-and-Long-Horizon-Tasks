"""End-to-end smoke test for Gemma 4 integrated research agent."""

import os
import sys
import dotenv

# Ensure UTF-8 output on Windows
if sys.platform.startswith("win"):
    sys.stdout.reconfigure(encoding="utf-8")

# Ensure .env is loaded
dotenv.load_dotenv()

# Explicitly ensure default provider is Gemma for this test
os.environ["RESEARCH_MODEL_PROVIDER"] = "gemma"

from langchain_core.messages import HumanMessage
from deep_research_from_scratch.gemma_model import get_active_model_info
from deep_research_from_scratch.research_agent import researcher_agent

# Instrument Groq to strictly verify no Groq calls occur during Gemma execution
groq_called_count = 0
try:
    from langchain_groq import ChatGroq
    original_groq_invoke = ChatGroq.invoke

    def tracked_groq_invoke(self, *args, **kwargs):
        global groq_called_count
        groq_called_count += 1
        print(f"[ALERT] Groq invoke was called! Count: {groq_called_count}", flush=True)
        return original_groq_invoke(self, *args, **kwargs)

    ChatGroq.invoke = tracked_groq_invoke
except ImportError:
    pass


def run_e2e_research_agent_test():
    print("=" * 70, flush=True)
    print("END-TO-END VERIFICATION: Gemma 4 in Research Agent Path", flush=True)
    print("=" * 70, flush=True)

    # 1. Verify Active Model Selection
    model_info = get_active_model_info()
    print("\n[Step 1/5] Checking active model configuration...", flush=True)
    print(f"  Configured Provider : {model_info['provider'].upper()}", flush=True)
    print(f"  Model Identifier    : {model_info['model']}", flush=True)
    print(f"  Model Class         : {model_info['class']}", flush=True)

    assert model_info["provider"] == "gemma", "Default provider must be Gemma"
    assert "gemma-4" in model_info["model"], "Model must be Gemma 4"
    print("  ✓ Gemma 4 confirmed as the active execution model.", flush=True)

    # 2. Verify LangSmith Tracing Status
    print("\n[Step 2/5] Checking LangSmith Tracing configuration...", flush=True)
    tracing_enabled = os.getenv("LANGSMITH_TRACING", "").lower() == "true"
    project_name = os.getenv("LANGSMITH_PROJECT", "default")
    has_api_key = bool(os.getenv("LANGSMITH_API_KEY"))
    print(f"  LANGSMITH_TRACING : {tracing_enabled}", flush=True)
    print(f"  LANGSMITH_PROJECT : {project_name}", flush=True)
    print(f"  API Key Present   : {has_api_key}", flush=True)
    assert tracing_enabled, "LangSmith tracing should remain enabled in environment"
    print("  ✓ LangSmith live tracing is active.", flush=True)

    # 3. Execute Research Agent with simple query
    print("\n[Step 3/5] Executing research agent workflow with query...", flush=True)
    research_topic = "Key features introduced in Python 3.12"
    initial_state = {
        "researcher_messages": [
            HumanMessage(content=f"Please research and summarize: {research_topic}")
        ],
        "research_topic": research_topic,
        "tool_call_iterations": 0,
        "compressed_research": "",
        "raw_notes": [],
    }

    print(f"  Query: '{research_topic}'", flush=True)
    print("  Running StateGraph stream (llm_call -> tool_node -> compress_research)...", flush=True)

    final_state = {}
    for event in researcher_agent.stream(initial_state):
        node_name = list(event.keys())[0]
        print(f"  --> Completed node: '{node_name}'", flush=True)
        final_state.update(event[node_name])

    # 4. Verify Execution Outputs and Tools
    print("\n[Step 4/5] Analyzing execution results...", flush=True)
    messages = final_state.get("researcher_messages", [])
    compressed = final_state.get("compressed_research", "")
    raw_notes = final_state.get("raw_notes", [])

    print(f"  Total message steps : {len(messages)}", flush=True)
    tool_calls_made = []
    for msg in messages:
        if hasattr(msg, "tool_calls") and msg.tool_calls:
            tool_calls_made.extend([t["name"] for t in msg.tool_calls])

    print(f"  Tools invoked       : {tool_calls_made if tool_calls_made else 'Direct synthesis / think_tool'}", flush=True)
    print(f"  Compressed length   : {len(compressed)} characters", flush=True)
    print(f"  Raw notes count     : {len(raw_notes)}", flush=True)

    # Assertions
    assert isinstance(compressed, str), "Compressed research must be a clean string"
    assert len(compressed) > 50, "Compressed research should contain substantive output"
    print("\n  Summary preview:", flush=True)
    preview_lines = compressed.strip().split("\n")[:4]
    for line in preview_lines:
        print(f"    | {line}", flush=True)

    # 5. Verify Zero Groq Calls
    print("\n[Step 5/5] Verifying zero accidental Groq calls...", flush=True)
    print(f"  Total Groq calls detected: {groq_called_count}", flush=True)
    assert groq_called_count == 0, f"Expected 0 Groq calls in Gemma mode, but got {groq_called_count}!"
    print("  ✓ ZERO Groq calls made. Pure Gemma 4 execution path confirmed!", flush=True)

    print("\n" + "=" * 70, flush=True)
    print("SUCCESS: Gemma 4 research-agent execution path is 100% verified!", flush=True)
    print("=" * 70, flush=True)


if __name__ == "__main__":
    run_e2e_research_agent_test()
