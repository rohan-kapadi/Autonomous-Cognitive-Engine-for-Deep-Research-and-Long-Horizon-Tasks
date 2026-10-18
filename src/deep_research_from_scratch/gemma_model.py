"""Gemma 4 Model Integration Layer.

This module provides a clean, centralized abstraction for initializing and using
the open-weight Gemma 4 model (gemma-4-26b-a4b-it) within the LangGraph research pipeline,
with non-breaking fallback support for Groq (llama-3.3-70b-versatile).
"""

import os
from typing import Any, Optional, Union
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.chat_models import init_chat_model

# Validated Gemma 4 instruction-tuned model identifier
DEFAULT_GEMMA_MODEL: str = "gemma-4-26b-a4b-it"
DEFAULT_GROQ_FALLBACK_MODEL: str = "groq:qwen/qwen3.8-27b"


def extract_text_content(content: Any) -> str:
    """Extract plain text from LLM response content.

    Gemma 4 models can return a list containing thinking/reasoning blocks
    and text blocks (e.g., [{'type': 'thinking', ...}, {'type': 'text', 'text': '...'}]).
    This utility extracts the clean text portion to ensure seamless compatibility
    with existing LangGraph state updates and string concatenation logic.
    """
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        text_parts = []
        for block in content:
            if isinstance(block, dict) and block.get("type") == "text":
                text_parts.append(block.get("text", ""))
            elif isinstance(block, str):
                text_parts.append(block)
        return "".join(text_parts)
    return str(content)


def get_gemma_model(
    model_name: str = DEFAULT_GEMMA_MODEL,
    temperature: float = 0.2,
    api_key: Optional[str] = None,
    **kwargs: Any,
) -> ChatGoogleGenerativeAI:
    """Initialize the validated Gemma 4 chat model.

    Args:
        model_name: The Gemma model identifier (default: gemma-4-26b-a4b-it).
        temperature: Sampling temperature.
        api_key: Optional Google GenAI API key (falls back to GOOGLE_API_KEY or GEMINI_API_KEY env vars).
        **kwargs: Additional parameters forwarded to ChatGoogleGenerativeAI.

    Returns:
        ChatGoogleGenerativeAI instance configured for Gemma 4.
    """
    resolved_api_key = (
        api_key
        or os.getenv("GOOGLE_API_KEY")
        or os.getenv("GEMINI_API_KEY")
    )

    if not resolved_api_key:
        raise ValueError(
            "Google API key not found. Please set GOOGLE_API_KEY or GEMINI_API_KEY in your environment or .env file."
        )

    return ChatGoogleGenerativeAI(
        model=model_name,
        google_api_key=resolved_api_key,
        temperature=temperature,
        **kwargs,
    )


def get_active_model_info() -> dict:
    """Return dictionary describing the active model provider and identifier."""
    provider = os.getenv("RESEARCH_MODEL_PROVIDER", "gemma").lower()
    google_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")

    if provider == "gemma" and google_key:
        return {
            "provider": "gemma",
            "model": os.getenv("GEMMA_MODEL_NAME", DEFAULT_GEMMA_MODEL),
            "class": "ChatGoogleGenerativeAI",
        }
    return {
        "provider": "groq",
        "model": os.getenv("GROQ_MODEL", DEFAULT_GROQ_FALLBACK_MODEL),
        "class": "ChatGroq",
    }


def get_cognitive_model(
    prefer_gemma: Optional[bool] = None,
    temperature: float = 0.2,
    **kwargs: Any,
) -> BaseChatModel:
    """Get the primary cognitive model for research orchestration.

    Prefers Gemma 4 by default unless RESEARCH_MODEL_PROVIDER is explicitly set to 'groq',
    or if prefer_gemma is explicitly passed as False.
    Falls back safely to Groq if Google GenAI fails or lacks credentials.

    Args:
        prefer_gemma: Optional override. If None, respects RESEARCH_MODEL_PROVIDER env var (default: 'gemma').
        temperature: Sampling temperature.
        **kwargs: Extra parameters passed to the model constructor.

    Returns:
        BaseChatModel instance (either Gemma 4 or Groq fallback).
    """
    configured_provider = os.getenv("RESEARCH_MODEL_PROVIDER", "gemma").lower()
    should_use_gemma = prefer_gemma if prefer_gemma is not None else (configured_provider == "gemma")
    google_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")

    if should_use_gemma and google_key:
        try:
            model_name = os.getenv("GEMMA_MODEL_NAME", DEFAULT_GEMMA_MODEL)
            return get_gemma_model(model_name=model_name, temperature=temperature, **kwargs)
        except Exception as e:
            print(f"[gemma_model] Warning: Failed to initialize Gemma 4 ({e}). Falling back to Groq.")

    # Safe fallback to existing Groq configuration
    groq_model_name = os.getenv("GROQ_MODEL", DEFAULT_GROQ_FALLBACK_MODEL)
    return init_chat_model(groq_model_name, temperature=temperature, **kwargs)

