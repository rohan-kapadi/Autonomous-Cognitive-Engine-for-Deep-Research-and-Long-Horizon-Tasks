"""Offline tests for provider selection and the Jarvislabs endpoint configuration."""

import pytest
from langchain_core.messages import AIMessage
from langchain_core.outputs import ChatGeneration, ChatResult
from langchain_core.runnables import RunnableWithFallbacks
from langchain_openai import ChatOpenAI

from deep_research_from_scratch import gemma_model
from deep_research_from_scratch.gemma_model import (
    DEFAULT_JARVISLABS_BASE_URL,
    DEFAULT_JARVISLABS_MODEL,
    JarvislabsChatOpenAI,
    extract_text_content,
    get_active_model_info,
    get_cognitive_model,
    get_jarvislabs_model,
)
from deep_research_from_scratch.state_research import Summary


@pytest.fixture
def clean_env(monkeypatch):
    """Start every test from a known provider configuration."""
    for name in ("RESEARCH_MODEL_PROVIDER", "JARVISLABS_MODEL", "JARVISLABS_BASE_URL",
                 "GOOGLE_API_KEY", "GEMINI_API_KEY"):
        monkeypatch.delenv(name, raising=False)
    monkeypatch.setenv("JARVISLABS_API_KEY", "test-jarvis-key")
    monkeypatch.setenv("GROQ_API_KEY", "test-groq-key")
    return monkeypatch


# ===== PROVIDER RESOLUTION =====

def test_default_provider_is_jarvislabs(clean_env):
    model = get_cognitive_model()
    assert isinstance(model, JarvislabsChatOpenAI)
    assert get_active_model_info()["provider"] == "jarvislabs"


def test_explicit_jarvislabs_provider(clean_env):
    clean_env.setenv("RESEARCH_MODEL_PROVIDER", "JarvisLabs")  # case-insensitive
    assert isinstance(get_cognitive_model(), JarvislabsChatOpenAI)


def test_missing_jarvislabs_key_warns_and_falls_back_to_groq(clean_env, capsys):
    clean_env.delenv("JARVISLABS_API_KEY")
    model = get_cognitive_model()
    assert type(model).__name__ == "ChatGroq"
    assert "JARVISLABS_API_KEY is not set" in capsys.readouterr().out
    assert get_active_model_info()["provider"] == "groq"


def test_groq_provider(clean_env):
    clean_env.setenv("RESEARCH_MODEL_PROVIDER", "groq")
    assert type(get_cognitive_model()).__name__ == "ChatGroq"
    assert get_active_model_info()["provider"] == "groq"


def test_gemma_provider_with_key(clean_env):
    clean_env.setenv("RESEARCH_MODEL_PROVIDER", "gemma")
    clean_env.setenv("GOOGLE_API_KEY", "test-google-key")
    assert type(get_cognitive_model()).__name__ == "ChatGoogleGenerativeAI"
    assert get_active_model_info()["provider"] == "gemma"


def test_gemma_provider_without_key_falls_back_to_available_provider(clean_env, capsys):
    clean_env.setenv("RESEARCH_MODEL_PROVIDER", "gemma")
    assert isinstance(get_cognitive_model(), JarvislabsChatOpenAI)
    out = capsys.readouterr().out
    assert "GOOGLE_API_KEY" in out
    assert "Falling back to jarvislabs" in out


def test_placeholder_keys_count_as_missing(clean_env, capsys):
    """Values copied unchanged from .env.example must not be treated as real keys."""
    clean_env.setenv("RESEARCH_MODEL_PROVIDER", "gemma")
    clean_env.setenv("GOOGLE_API_KEY", "your_google_api_key_here")
    assert isinstance(get_cognitive_model(), JarvislabsChatOpenAI)
    assert get_active_model_info()["provider"] == "jarvislabs"


def test_placeholder_jarvislabs_key_raises(clean_env):
    clean_env.setenv("JARVISLABS_API_KEY", "your_jarvislabs_api_key_here")
    with pytest.raises(ValueError, match="JARVISLABS_API_KEY"):
        get_jarvislabs_model()


def test_prefer_gemma_overrides_provider(clean_env):
    clean_env.setenv("GOOGLE_API_KEY", "test-google-key")
    assert type(get_cognitive_model(prefer_gemma=True)).__name__ == "ChatGoogleGenerativeAI"
    assert type(get_cognitive_model(prefer_gemma=False)).__name__ == "ChatGroq"


def test_unknown_provider_falls_back_to_available_provider(clean_env):
    clean_env.setenv("RESEARCH_MODEL_PROVIDER", "not-a-provider")
    assert isinstance(get_cognitive_model(), JarvislabsChatOpenAI)


def test_init_failure_falls_back_to_groq(clean_env, monkeypatch, capsys):
    def boom(**kwargs):
        raise RuntimeError("init failed")

    monkeypatch.setattr(gemma_model, "get_jarvislabs_model", boom)
    assert type(get_cognitive_model()).__name__ == "ChatGroq"
    assert "Failed to initialize Jarvislabs" in capsys.readouterr().out


# ===== JARVISLABS ENDPOINT CONFIGURATION =====

def test_jarvislabs_defaults(clean_env):
    model = get_jarvislabs_model()
    assert isinstance(model, ChatOpenAI)
    assert model.model_name == DEFAULT_JARVISLABS_MODEL
    assert model.openai_api_base == DEFAULT_JARVISLABS_BASE_URL
    assert model.openai_api_key.get_secret_value() == "test-jarvis-key"


def test_jarvislabs_env_overrides(clean_env):
    clean_env.setenv("JARVISLABS_MODEL", "deepseek-v4-flash-0731")
    clean_env.setenv("JARVISLABS_BASE_URL", "https://example.test/v1")
    model = get_jarvislabs_model()
    assert model.model_name == "deepseek-v4-flash-0731"
    assert model.openai_api_base == "https://example.test/v1"
    assert get_active_model_info()["model"] == "deepseek-v4-flash-0731"


def test_jarvislabs_explicit_args_win(clean_env):
    model = get_jarvislabs_model(model_name="glm-5.3", api_key="explicit-key", temperature=0.7)
    assert model.model_name == "glm-5.3"
    assert model.openai_api_key.get_secret_value() == "explicit-key"
    assert model.temperature == 0.7


def test_jarvislabs_missing_key_raises(clean_env):
    clean_env.delenv("JARVISLABS_API_KEY")
    with pytest.raises(ValueError, match="JARVISLABS_API_KEY"):
        get_jarvislabs_model()


def _bound_kwargs(structured):
    """Return the kwargs bound to the model inside a structured-output runnable."""
    first = getattr(structured, "first", structured)
    return getattr(first, "kwargs", {})


def test_structured_output_default_is_json_schema_with_function_calling_fallback(clean_env):
    structured = get_jarvislabs_model().with_structured_output(Summary)
    assert isinstance(structured, RunnableWithFallbacks)

    primary = _bound_kwargs(structured.runnable)
    assert primary["response_format"] is Summary, "json_schema mode binds the schema as response_format"
    assert structured.runnable.first.bound.max_tokens == 4096, "json_schema attempt should use the tighter cap"

    fallback = _bound_kwargs(structured.fallbacks[0])
    assert fallback["tools"][0]["function"]["name"] == "Summary"
    assert "response_format" not in fallback


def test_structured_output_explicit_method_has_no_fallback(clean_env):
    structured = get_jarvislabs_model().with_structured_output(Summary, method="function_calling")
    assert not isinstance(structured, RunnableWithFallbacks)
    assert "tools" in _bound_kwargs(structured)


def _fake_generate(responses):
    """Build a _generate replacement: json_schema calls raise, function_calling calls get `responses`."""
    calls = []

    def _generate(self, messages, stop=None, run_manager=None, **kwargs):
        mode = "json_schema" if "response_format" in kwargs else "function_calling"
        calls.append((mode, self.max_tokens))
        if mode == "json_schema":
            raise RuntimeError("Could not parse response content as the length limit was reached")
        return ChatResult(generations=[ChatGeneration(message=responses.pop(0))])

    return _generate, calls


def test_structured_output_falls_back_when_json_schema_fails(clean_env, monkeypatch):
    tool_reply = AIMessage(content="", tool_calls=[{
        "name": "Summary", "args": {"summary": "S", "key_excerpts": "K"}, "id": "t1", "type": "tool_call",
    }])
    fake, calls = _fake_generate([tool_reply])
    monkeypatch.setattr(JarvislabsChatOpenAI, "_generate", fake)

    result = get_jarvislabs_model().with_structured_output(Summary).invoke("summarize")

    assert result == Summary(summary="S", key_excerpts="K")
    assert calls == [("json_schema", 4096), ("function_calling", 8192)]


def test_structured_output_raises_when_every_method_fails(clean_env, monkeypatch):
    fake, calls = _fake_generate([AIMessage(content="Just prose, no tool call.")])
    monkeypatch.setattr(JarvislabsChatOpenAI, "_generate", fake)

    with pytest.raises(Exception):
        get_jarvislabs_model().with_structured_output(Summary).invoke("summarize")
    assert [mode for mode, _ in calls] == ["json_schema", "function_calling"]


def test_structured_max_tokens_env_override(clean_env):
    clean_env.setenv("JARVISLABS_STRUCTURED_MAX_TOKENS", "1024")
    structured = get_jarvislabs_model().with_structured_output(Summary)
    assert structured.runnable.first.bound.max_tokens == 1024


def test_jarvislabs_max_tokens_default_and_override(clean_env):
    assert get_jarvislabs_model().max_tokens == 8192
    clean_env.setenv("JARVISLABS_MAX_TOKENS", "2048")
    assert get_jarvislabs_model().max_tokens == 2048
    assert get_jarvislabs_model(max_tokens=100).max_tokens == 100


# ===== RESPONSE TEXT EXTRACTION =====

@pytest.mark.parametrize(
    ("content", "expected"),
    [
        ("plain text", "plain text"),
        ([{"type": "thinking", "thinking": "hmm"}, {"type": "text", "text": "answer"}], "answer"),
        (["part one ", {"type": "text", "text": "part two"}], "part one part two"),
        ([], ""),
        (42, "42"),
    ],
)
def test_extract_text_content(content, expected):
    assert extract_text_content(content) == expected
