"""Minimal smoke test for Gemma 4 model integration."""

import os
import sys
import dotenv
from pydantic import BaseModel, Field

# Ensure UTF-8 output on Windows
if sys.platform.startswith("win"):
    sys.stdout.reconfigure(encoding="utf-8")

# Load environment variables
dotenv.load_dotenv()

from langchain_core.messages import HumanMessage
from langchain_core.tools import tool
from deep_research_from_scratch.gemma_model import (
    DEFAULT_GEMMA_MODEL,
    get_gemma_model,
    get_cognitive_model,
    extract_text_content,
)


def run_smoke_test():
    print("=" * 60)
    print("SMOKE TEST: Gemma 4 Model Integration Layer")
    print(f"Target Model: {DEFAULT_GEMMA_MODEL}")
    print("=" * 60)

    # 1. Verification: Load Model
    print("\n[Step 1/5] Loading Gemma 4 model...")
    try:
        model = get_gemma_model()
        print(f"✓ Model successfully initialized: {type(model).__name__}")
        print(f"✓ Model identifier: {model.model}")
    except Exception as e:
        print(f"✗ Failed to initialize Gemma 4 model: {e}")
        sys.exit(1)

    # 2. Verification: Simple Prompt Execution
    print("\n[Step 2/5] Executing text invocation...")
    prompt = "Reply with exactly: 'Gemma 4 is online.'"
    try:
        raw_response = model.invoke([HumanMessage(content=prompt)])
        print(f"✓ Raw response received (type: {type(raw_response.content).__name__})")
    except Exception as e:
        print(f"✗ Text invocation failed: {e}")
        sys.exit(1)

    # 3. Verification: Response Abstraction (LangGraph compatibility)
    print("\n[Step 3/5] Verifying LangGraph text extraction abstraction...")
    clean_text = extract_text_content(raw_response.content).strip()
    print(f"✓ Clean text extracted: '{clean_text}'")
    assert len(clean_text) > 0, "Extracted text must not be empty"
    print("✓ Output conforms to string interface required by LangGraph state.")

    # 4. Verification: Tool Calling Compatibility
    print("\n[Step 4/5] Verifying tool-calling compatibility...")
    @tool
    def search_archive(topic: str) -> str:
        """Search the internal cognitive archive for a given topic."""
        return f"Results for: {topic}"

    try:
        model_with_tools = model.bind_tools([search_archive])
        tool_response = model_with_tools.invoke("Search the cognitive archive for quantum sensors.")
        print(f"✓ Tool call successfully emitted: {tool_response.tool_calls}")
        assert len(tool_response.tool_calls) > 0, "Model should emit at least one tool call."
        assert tool_response.tool_calls[0]["name"] == "search_archive"
        print("✓ Tool-calling binding conforms to LangGraph multi-agent supervisor requirements.")
    except Exception as e:
        print(f"✗ Tool-calling verification failed: {e}")
        sys.exit(1)

    # 5. Verification: Cognitive Factory & Fallback
    print("\n[Step 5/5] Verifying cognitive factory abstraction...")
    cognitive_model = get_cognitive_model(prefer_gemma=True)
    print(f"✓ Default cognitive model loaded: {type(cognitive_model).__name__}")
    assert isinstance(cognitive_model, type(model)), "Default should be Gemma 4"

    groq_fallback = get_cognitive_model(prefer_gemma=False)
    print(f"✓ Groq fallback model loaded: {type(groq_fallback).__name__}")

    print("\n" + "=" * 60)
    print("ALL TESTS PASSED: Gemma 4 integration layer is 100% operational!")
    print("=" * 60)


if __name__ == "__main__":
    run_smoke_test()
