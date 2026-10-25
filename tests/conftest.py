"""Pytest configuration and environment fixtures for ACE test suite.

Supports two tiers:
- Offline (default): fake models and fake clients, no keys, no cost.
- Live (pytest --live): real service calls if API keys are set.
"""

import os
import sys
import pytest

# Ensure src, tests, and root are in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "src")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

try:
    import dotenv
    dotenv.load_dotenv()
except ImportError:
    pass

from fakes import FakeTavilyClient, ScriptedModel


def _is_real(value):
    return bool(value) and not value.startswith("your_")


# Record which real keys exist BEFORE dummies are injected, so a dummy key
# can never make a live test think credentials are present.
REAL_KEYS = {name: _is_real(os.getenv(name)) for name in ("JARVISLABS_API_KEY", "TAVILY_API_KEY")}

# Dummy keys let the package import offline (TavilyClient and the model
# factory validate keys at construction time, without making network calls).
for _name in ("JARVISLABS_API_KEY", "TAVILY_API_KEY", "GROQ_API_KEY", "GOOGLE_API_KEY"):
    if not _is_real(os.getenv(_name)):
        os.environ[_name] = "test-dummy-key"

os.environ.setdefault("TEMPORAL_ADDRESS", "localhost:7233")
os.environ.setdefault("TEMPORAL_TASK_QUEUE", "ace-research-test")

# Tests never send traces to LangSmith unless explicitly enabled in live tests
os.environ["LANGCHAIN_TRACING_V2"] = "false"
os.environ["LANGSMITH_TRACING"] = "false"


# ===== LIVE TEST GATING =====

def pytest_addoption(parser):
    parser.addoption(
        "--live",
        action="store_true",
        default=False,
        help="Run live tests against Jarvislabs and Tavily (spends API credits).",
    )


def pytest_collection_modifyitems(config, items):
    if config.getoption("--live"):
        return
    skip_live = pytest.mark.skip(reason="live test: pass --live to run (spends API credits)")
    for item in items:
        if "live" in item.keywords:
            item.add_marker(skip_live)


@pytest.fixture
def jarvislabs_key():
    """Skip unless a real JARVISLABS_API_KEY is configured."""
    if not REAL_KEYS.get("JARVISLABS_API_KEY"):
        pytest.skip("JARVISLABS_API_KEY not set in environment or .env")


@pytest.fixture
def tavily_key():
    """Skip unless a real TAVILY_API_KEY is configured."""
    if not REAL_KEYS.get("TAVILY_API_KEY"):
        pytest.skip("TAVILY_API_KEY not set in environment or .env")


# ===== FAKE FIXTURES =====

@pytest.fixture
def fake_tavily(monkeypatch):
    """Replace the module-level Tavily client with a fake."""
    from deep_research_from_scratch import utils

    client = FakeTavilyClient()
    monkeypatch.setattr(utils, "tavily_client", client)
    return client


@pytest.fixture
def fake_summarizer(monkeypatch):
    """Replace the webpage summarization model with a scripted fake."""
    from deep_research_from_scratch import utils
    from deep_research_from_scratch.state_research import Summary

    model = ScriptedModel(structured=[Summary(summary=f"summary {i}", key_excerpts=f"excerpt {i}") for i in range(5)])
    monkeypatch.setattr(utils, "summarization_model", model)
    return model
