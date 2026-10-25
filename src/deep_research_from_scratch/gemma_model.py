"""Gemma 4 Model Integration Layer.

This module provides a clean, centralized abstraction for initializing and using
the open-weight Gemma 4 model (gemma-4-26b-a4b-it) within the LangGraph research pipeline,
with non-breaking fallback support for Groq (llama-3.3-70b-versatile).

Providers (selected via RESEARCH_MODEL_PROVIDER):
- ``jarvislabs``: Jarvislabs Token Factory, OpenAI-compatible hosted open models (default).
- ``gemma``: Gemma 4 via Google GenAI.
- ``groq``: Groq, also used as the safe fallback for the other providers.
"""

import os
from typing import Any, Optional, Union

from langchain.chat_models import init_chat_model
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.runnables import RunnableLambda
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_openai import ChatOpenAI

# Validated Gemma 4 instruction-tuned model identifier
DEFAULT_GEMMA_MODEL: str = "gemma-4-26b-a4b-it"
DEFAULT_GROQ_FALLBACK_MODEL: str = "groq:qwen/qwen3.8-27b"

# Jarvislabs Token Factory (OpenAI-compatible endpoint, also hosts Gemma 4)
DEFAULT_JARVISLABS_BASE_URL: str = "https://models.jarvislabs.net/v1"
DEFAULT_JARVISLABS_MODEL: str = "gemma-4-26b-a4b-it"
DEFAULT_JARVISLABS_MAX_TOKENS: int = 8192
# Tighter cap for structured output so a runaway json_schema generation fails fast
DEFAULT_JARVISLABS_STRUCTURED_MAX_TOKENS: int = 4096

# Provider used when RESEARCH_MODEL_PROVIDER is unset
DEFAULT_PROVIDER: str = "jarvislabs"

# API key env vars per provider, in fallback order
PROVIDER_KEYS: dict = {
    "jarvislabs": ("JARVISLABS_API_KEY",),
    "gemma": ("GOOGLE_API_KEY", "GEMINI_API_KEY"),
    "groq": ("GROQ_API_KEY",),
}


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
    resolved_api_key = api_key or _get_key("GOOGLE_API_KEY", "GEMINI_API_KEY")

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


def get_jarvislabs_model(
    model_name: Optional[str] = None,
    temperature: float = 0.2,
    api_key: Optional[str] = None,
    **kwargs: Any,
) -> ChatOpenAI:
    """Initialize a chat model served by Jarvislabs Token Factory.

    Args:
        model_name: Jarvislabs model ID (default: JARVISLABS_MODEL env var or gemma-4-26b-a4b-it).
        temperature: Sampling temperature.
        api_key: Optional API key (falls back to JARVISLABS_API_KEY env var).
        **kwargs: Additional parameters forwarded to ChatOpenAI.

    Returns:
        ChatOpenAI instance pointed at the Jarvislabs OpenAI-compatible endpoint.
    """
    resolved_api_key = api_key or _get_key("JARVISLABS_API_KEY")

    if not resolved_api_key:
        raise ValueError(
            "Jarvislabs API key not found. Please set JARVISLABS_API_KEY in your environment or .env file."
        )

    # Explicit output cap: without one the endpoint truncated answers (finish_reason=length)
    kwargs.setdefault("max_tokens", int(os.getenv("JARVISLABS_MAX_TOKENS", DEFAULT_JARVISLABS_MAX_TOKENS)))

    return JarvislabsChatOpenAI(
        model=model_name or os.getenv("JARVISLABS_MODEL", DEFAULT_JARVISLABS_MODEL),
        base_url=os.getenv("JARVISLABS_BASE_URL", DEFAULT_JARVISLABS_BASE_URL),
        api_key=resolved_api_key,
        temperature=temperature,
        **kwargs,
    )


def _require_parsed(result: Any) -> Any:
    """Raise when structured output parsing produced nothing, so fallbacks can run."""
    if result is None:
        raise ValueError("Structured output returned no parsed result")
    return result


class JarvislabsChatOpenAI(ChatOpenAI):
    """ChatOpenAI pointed at Jarvislabs, with a structured output fallback chain.

    Measured against gemma-4-26b-a4b-it on Jarvislabs, no single method works for
    every schema: ``json_schema`` parsed ResearchQuestion 3/3 but ran away to the
    token limit on Summary, while ``function_calling`` handled Summary but answered
    ResearchQuestion in prose (``json_mode`` returned invented fields). So by default
    json_schema is tried first under a tighter token cap, then function_calling.
    """

    def with_structured_output(self, schema: Any = None, *, method: Optional[str] = None, **kwargs: Any):
        """Bind a structured output schema; json_schema with function_calling fallback by default.

        Passing ``method`` explicitly returns exactly that method, without fallback.
        """
        if method is not None:
            return super().with_structured_output(schema, method=method, **kwargs)

        capped = self.model_copy(update={
            "max_tokens": int(os.getenv("JARVISLABS_STRUCTURED_MAX_TOKENS", DEFAULT_JARVISLABS_STRUCTURED_MAX_TOKENS)),
        })
        check = RunnableLambda(_require_parsed) if not kwargs.get("include_raw") else RunnableLambda(lambda r: r)
        primary = ChatOpenAI.with_structured_output(capped, schema, method="json_schema", **kwargs) | check
        fallback = ChatOpenAI.with_structured_output(self, schema, method="function_calling", **kwargs) | check
        return primary.with_fallbacks([fallback])


def _get_key(*names: str) -> Optional[str]:
    """Return the first configured API key, ignoring .env.example placeholders (``your_..._here``)."""
    for name in names:
        value = os.getenv(name)
        if value and not value.startswith("your_"):
            return value
    return None


def _resolve_provider(prefer_gemma: Optional[bool] = None) -> str:
    """Resolve which provider to use, falling back to one that has a real API key.

    prefer_gemma=True forces Gemma, False forces Groq, None respects RESEARCH_MODEL_PROVIDER.
    """
    if prefer_gemma is True:
        requested = "gemma"
    elif prefer_gemma is False:
        requested = "groq"
    else:
        requested = os.getenv("RESEARCH_MODEL_PROVIDER", DEFAULT_PROVIDER).lower()

    if requested in PROVIDER_KEYS and _get_key(*PROVIDER_KEYS[requested]):
        return requested

    fallback = next((p for p in PROVIDER_KEYS if _get_key(*PROVIDER_KEYS[p])), "groq")
    missing = " / ".join(PROVIDER_KEYS.get(requested, ())) or f"a known provider (got '{requested}')"
    print(f"[gemma_model] Warning: {requested} selected but {missing} is not set. Falling back to {fallback}.")
    return fallback


def get_active_model_info() -> dict:
    """Return dictionary describing the active model provider and identifier."""
    provider = _resolve_provider()

    if provider == "jarvislabs":
        return {
            "provider": "jarvislabs",
            "model": os.getenv("JARVISLABS_MODEL", DEFAULT_JARVISLABS_MODEL),
            "class": "ChatOpenAI",
        }
    if provider == "gemma":
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

    Uses Jarvislabs Token Factory by default (RESEARCH_MODEL_PROVIDER=jarvislabs).
    Set RESEARCH_MODEL_PROVIDER to 'gemma' or 'groq' to switch, or pass prefer_gemma
    explicitly (True forces Gemma 4, False forces Groq).
    Falls back safely to Groq if the selected provider fails or lacks credentials.

    Args:
        prefer_gemma: Optional override. If None, respects RESEARCH_MODEL_PROVIDER env var (default: 'jarvislabs').
        temperature: Sampling temperature.
        **kwargs: Extra parameters passed to the model constructor.

    Returns:
        BaseChatModel instance (Jarvislabs, Gemma 4, or Groq fallback).
    """
    provider = _resolve_provider(prefer_gemma)

    if provider == "jarvislabs":
        try:
            return get_jarvislabs_model(temperature=temperature, **kwargs)
        except Exception as e:
            print(f"[gemma_model] Warning: Failed to initialize Jarvislabs ({e}). Falling back to Groq.")

    if provider == "gemma":
        try:
            model_name = os.getenv("GEMMA_MODEL_NAME", DEFAULT_GEMMA_MODEL)
            return get_gemma_model(model_name=model_name, temperature=temperature, **kwargs)
        except Exception as e:
            print(f"[gemma_model] Warning: Failed to initialize Gemma 4 ({e}). Falling back to Groq.")

    # Safe fallback to existing Groq configuration
    groq_model_name = os.getenv("GROQ_MODEL", DEFAULT_GROQ_FALLBACK_MODEL)
    return init_chat_model(groq_model_name, temperature=temperature, **kwargs)

