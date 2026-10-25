"""Tests for the Tavily web search tool and its summarization pipeline."""

import pytest
from fakes import FAKE_RESULTS, ScriptedModel

from deep_research_from_scratch import utils

# ===== DEDUPLICATION / PROCESSING / FORMATTING =====

def test_deduplicate_search_results_keeps_first_per_url():
    unique = utils.deduplicate_search_results([{"results": FAKE_RESULTS}])
    assert list(unique) == ["https://example.com/a", "https://example.com/b"]
    assert unique["https://example.com/a"]["title"] == "Source A"


def test_deduplicate_across_multiple_responses():
    unique = utils.deduplicate_search_results([{"results": FAKE_RESULTS[:1]}, {"results": FAKE_RESULTS}])
    assert len(unique) == 2


def test_process_search_results_summarizes_only_raw_content(monkeypatch):
    summarized_inputs = []

    def fake_summarize(raw):
        summarized_inputs.append(raw)
        return "SUMMARIZED"

    monkeypatch.setattr(utils, "summarize_webpage_content", fake_summarize)
    unique = utils.deduplicate_search_results([{"results": FAKE_RESULTS}])
    processed = utils.process_search_results(unique)

    assert len(summarized_inputs) == 1
    assert processed["https://example.com/a"] == {"title": "Source A", "content": "SUMMARIZED"}
    assert processed["https://example.com/b"]["content"] == "Short snippet B without raw content"


def test_format_search_output_structure():
    output = utils.format_search_output({
        "https://example.com/a": {"title": "Source A", "content": "Alpha"},
        "https://example.com/b": {"title": "Source B", "content": "Beta"},
    })
    assert output.startswith("Search results:")
    assert "--- SOURCE 1: Source A ---" in output
    assert "--- SOURCE 2: Source B ---" in output
    assert "URL: https://example.com/b" in output
    assert "SUMMARY:\nBeta" in output


def test_format_search_output_empty():
    assert "No valid search results found" in utils.format_search_output({})


# ===== WEBPAGE SUMMARIZATION =====

def test_summarize_webpage_content_formats_summary(fake_summarizer):
    result = utils.summarize_webpage_content("Some page content")
    assert result == "<summary>\nsummary 0\n</summary>\n\n<key_excerpts>\nexcerpt 0\n</key_excerpts>"


def test_summarize_webpage_content_truncates_to_5000_chars(fake_summarizer):
    utils.summarize_webpage_content("Z" * 6000)
    prompt = fake_summarizer.structured_calls[0][0].content
    assert "Z" * 5000 in prompt
    assert "Z" * 5001 not in prompt


def test_summarize_webpage_content_falls_back_on_model_error(monkeypatch, capsys):
    monkeypatch.setattr(utils, "summarization_model", ScriptedModel(structured=[RuntimeError("endpoint down")]))
    raw = "R" * 1500
    result = utils.summarize_webpage_content(raw)
    assert result == "R" * 1000 + "..."
    assert "Failed to summarize webpage: endpoint down" in capsys.readouterr().out


def test_summarize_webpage_content_short_fallback_returns_all(monkeypatch):
    monkeypatch.setattr(utils, "summarization_model", ScriptedModel(structured=[RuntimeError("x")]))
    assert utils.summarize_webpage_content("short page") == "short page"


# ===== TAVILY SEARCH TOOL =====

def test_tavily_search_tool_end_to_end(fake_tavily, fake_summarizer):
    output = utils.tavily_search.invoke({"query": "solid-state batteries"})

    assert fake_tavily.calls == [{
        "query": "solid-state batteries",
        "max_results": 3,
        "include_raw_content": True,
        "topic": "general",
    }]
    assert output.count("--- SOURCE") == 2, "Duplicate URL should be removed"
    assert "URL: https://example.com/a" in output
    assert "<summary>\nsummary 0\n</summary>" in output
    assert "Short snippet B without raw content" in output
    assert len(fake_summarizer.structured_calls) == 1


def test_tavily_search_tool_passes_injected_args(fake_tavily, fake_summarizer):
    utils.tavily_search.invoke({"query": "rates", "max_results": 1, "topic": "finance"})
    assert fake_tavily.calls[0]["max_results"] == 1
    assert fake_tavily.calls[0]["topic"] == "finance"


def test_tavily_search_tool_no_results(fake_summarizer, monkeypatch):
    from fakes import FakeTavilyClient

    monkeypatch.setattr(utils, "tavily_client", FakeTavilyClient(results=[]))
    assert "No valid search results found" in utils.tavily_search.invoke({"query": "nothing"})


def test_tavily_search_schema_exposes_only_query():
    properties = utils.tavily_search.tool_call_schema.model_json_schema()["properties"]
    assert set(properties) == {"query"}


def test_think_tool_records_reflection():
    assert utils.think_tool.invoke({"reflection": "Need more sources"}) == "Reflection recorded: Need more sources"


# ===== LIVE: REAL TAVILY + REAL JARVISLABS SUMMARY =====

@pytest.mark.live
def test_live_tavily_search_with_jarvislabs_summary(jarvislabs_key, tavily_key, monkeypatch, capsys):
    from tavily import TavilyClient

    from deep_research_from_scratch.gemma_model import get_jarvislabs_model

    monkeypatch.setattr(utils, "tavily_client", TavilyClient())
    monkeypatch.setattr(utils, "summarization_model", get_jarvislabs_model(temperature=0, timeout=120))

    output = utils.tavily_search.invoke({"query": "solid-state battery energy density 2026", "max_results": 1})

    assert "URL: http" in output, f"No real search results returned:\n{output[:500]}"
    assert "SUMMARY:" in output
    assert "Failed to summarize webpage" not in capsys.readouterr().out, \
        "Summarization fell back to raw text; check structured output on the Jarvislabs model"
