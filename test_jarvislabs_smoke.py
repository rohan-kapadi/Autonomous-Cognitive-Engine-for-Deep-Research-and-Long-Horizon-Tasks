"""Minimal smoke test for Jarvislabs Token Factory model integration."""

import os
import sys
import dotenv

# Ensure UTF-8 output on Windows
if sys.platform.startswith("win"):
    sys.stdout.reconfigure(encoding="utf-8")

# Load environment variables
dotenv.load_dotenv()

from langchain_core.messages import HumanMessage
from langchain_core.tools import tool
from deep_research_from_scratch.gemma_model import (
    get_jarvislabs_model,
    get_cognitive_model,
    get_active_model_info,
    extract_text_content,
)


def run_smoke_test():
    print("=" * 60)
    print("SMOKE TEST: Jarvislabs Token Factory Integration")
    print("=" * 60)

    # 1. Verification: Load Model
    print("\n[Step 1/4] Loading Jarvislabs model...")
    try:
        model = get_jarvislabs_model()
        print(f"✓ Model successfully initialized: {type(model).__name__}")
        print(f"✓ Model identifier: {model.model_name}")
    except Exception as e:
        print(f"✗ Failed to initialize Jarvislabs model: {e}")
        sys.exit(1)

    # 2. Verification: Simple Prompt Execution
    print("\n[Step 2/4] Executing text invocation...")
    try:
        raw_response = model.invoke([HumanMessage(content="Reply with exactly: 'Jarvislabs is online.'")])
        clean_text = extract_text_content(raw_response.content).strip()
        print(f"✓ Clean text extracted: '{clean_text}'")
        assert len(clean_text) > 0, "Extracted text must not be empty"
    except Exception as e:
        print(f"✗ Text invocation failed: {e}")
        sys.exit(1)

    # 3. Verification: Tool Calling Compatibility (required by the supervisor)
    print("\n[Step 3/4] Verifying tool-calling compatibility...")
    @tool
    def search_archive(topic: str) -> str:
        """Search the internal cognitive archive for a given topic."""
        return f"Results for: {topic}"

    try:
        tool_response = model.bind_tools([search_archive]).invoke(
            "Search the cognitive archive for quantum sensors."
        )
        print(f"✓ Tool call emitted: {tool_response.tool_calls}")
        assert len(tool_response.tool_calls) > 0, "Model should emit at least one tool call."
        assert tool_response.tool_calls[0]["name"] == "search_archive"
    except Exception as e:
        print(f"✗ Tool-calling verification failed: {e}")
        print("  Try another model via JARVISLABS_MODEL (e.g. deepseek-v4-flash-0731).")
        sys.exit(1)

    # 4. Verification: Cognitive Factory routing
    print("\n[Step 4/4] Verifying cognitive factory routing...")
    os.environ["RESEARCH_MODEL_PROVIDER"] = "jarvislabs"
    cognitive_model = get_cognitive_model()
    print(f"✓ Active model info: {get_active_model_info()}")
    assert type(cognitive_model).__name__ == "ChatOpenAI", "Factory should route to Jarvislabs"

    print("\n" + "=" * 60)
    print("ALL TESTS PASSED: Jarvislabs integration is operational!")
    print("=" * 60)


if __name__ == "__main__":
    run_smoke_test()
