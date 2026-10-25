# ⚙️ ACE (Autonomous Cognitive Engine) — Setup & Quickstart Guide

This document provides setup instructions for the **Autonomous Cognitive Engine (ACE) for Deep Research and Long-Horizon Tasks**.

For complete system architecture, user personas, durability guarantees, Deep Agents comparison, and observability details, see the canonical [README.md](file:///Users/sukrutdusane/Documents/Projects%20/Sy/Autonomous-Cognitive-Engine-for-Deep-Research-and-Long-Horizon-Tasks/Autonomous-Cognitive-Engine-for-Deep-Research-and-Long-Horizon-Tasks/README.md).

---

## 📋 Prerequisites

- **Python**: 3.11, 3.12, or 3.13 (`>=3.11,<3.14` per `pyproject.toml`)
- **Package Manager**: [uv](https://docs.astral.sh/uv/) (Astral)
- **Node.js** (Optional, LTS): Required only if using Model Context Protocol (MCP) tool servers
- **Temporal CLI** (Recommended for durable execution):
  - macOS: `brew install temporal`
  - Linux / Windows: See [Temporal CLI Installation](https://docs.temporal.io/cli)

### API Keys Required

| Service | Environment Variable | Required For | Where to Obtain |
|---|---|---|---|
| **Google Gemini** | `GOOGLE_API_KEY` | Primary cognitive model & report synthesis | [Google AI Studio](https://aistudio.google.com/app/apikey) |
| **Groq** | `GROQ_API_KEY` | Fast structured scoping & clarification fallback | [Groq Console](https://console.groq.com/keys) |
| **Tavily** | `TAVILY_API_KEY` | Deep multi-agent web retrieval | [Tavily AI](https://tavily.com) |
| **LangSmith** *(Optional)* | `LANGSMITH_API_KEY` | Execution tracing & observability | [LangSmith](https://smith.langchain.com) |

---

## 🚀 Quickstart: Local Development with `uv`

### 1. Clone Repository & Checkout the `temporal` Branch

```bash
git clone -b temporal https://github.com/rohan-kapadi/Autonomous-Cognitive-Engine-for-Deep-Research-and-Long-Horizon-Tasks.git
cd Autonomous-Cognitive-Engine-for-Deep-Research-and-Long-Horizon-Tasks
```

### 2. Install Dependencies

```bash
# Install locked dependencies including temporalio, langgraph, and langchain
uv sync

# Or include development/testing packages
uv sync --extra dev
```

### 3. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your API keys:

```env
# Primary LLM & Web Search
GOOGLE_API_KEY=your_google_api_key_here
GROQ_API_KEY=your_groq_api_key_here
TAVILY_API_KEY=your_tavily_api_key_here

# LangSmith Observability
LANGCHAIN_TRACING_V2=true
LANGSMITH_API_KEY=your_langsmith_key_here
LANGSMITH_PROJECT=ace-temporal-demo

# Temporal Durable Execution
TEMPORAL_ADDRESS=localhost:7233
TEMPORAL_NAMESPACE=default
TEMPORAL_TASK_QUEUE=ace-research
```

---

## 🎯 Running Demonstrations

### Path A: Temporal Durable Research (Recommended)

1. **Start the local Temporal development server** (in terminal 1):
   ```bash
   temporal server start-dev
   ```
   *Web UI becomes accessible at [http://localhost:8233](http://localhost:8233).*

2. **Start the ACE Temporal worker** (in terminal 2):
   ```bash
   uv run python -m temporal_integration.worker
   ```

3. **Run the interactive judge-ready demo** (in terminal 3):
   ```bash
   uv run python demo_ace_temporal.py
   ```
   *The demo submits an objective, runs scoping, pauses at the cognitive checkpoint, displays the full state snapshot, and awaits your input to approve or replan.*

### Path B: Standalone LangGraph Execution (No Temporal Required)

```bash
uv run python demo_ace_run.py
```

### Path C: Live LangSmith Tracing Demo

```bash
uv run python demo_ace_langsmith.py
```

### Path D: LangGraph Studio UI

```bash
uvx --refresh --from "langgraph-cli[inmem]" --with-editable . --python 3.12 langgraph dev --allow-blocking
```
*Open Studio at: `https://smith.langchain.com/studio/?baseUrl=http://localhost:8000`*

---

## 🧪 Running Automated Tests

Run the full automated test suite with zero external API dependencies (all LLM and search calls are mocked):

```bash
uv run pytest tests/
```

Verify specific suites:
```bash
uv run pytest tests/test_existing_behavior.py      # Core graph structure & cognitive state
uv run pytest tests/test_temporal_workflow.py       # Workflow lifecycles, retries, and errors
uv run pytest tests/test_human_resume.py            # Checkpoint pause, resume, and replan
uv run pytest tests/test_langsmith_integration.py   # LangSmith plugin configuration
```

---

## 🐳 Docker Deployment

To run the complete stack including the Temporal server, ACE worker, and LangGraph dev server via Docker Compose:

```bash
# Build and start all services
docker compose up -d

# View worker logs
docker compose logs -f temporal-worker
```

| Service | Address | Purpose |
|---|---|---|
| **Temporal Web UI** | `http://localhost:8233` | Inspect workflow history, activity retries, and signals |
| **Temporal gRPC** | `localhost:7233` | Worker & client execution address |
| **LangGraph Dev API** | `http://localhost:8000` | LangGraph Studio connection endpoint |

---

## 🧩 Registered LangGraph Graphs

Per `langgraph.json`:

| Graph Name | Module Path | Purpose |
|---|---|---|
| `research_agent_full` | `deep_research_from_scratch.research_agent_full:agent` | Full production research pipeline with cognitive checkpoint |
| `scope_research` | `deep_research_from_scratch.research_agent_scope:scope_research` | Scoping and clarification graph |
| `research_agent` | `deep_research_from_scratch.research_agent:researcher_agent` | Tool-calling researcher agent |
| `research_agent_mcp` | `deep_research_from_scratch.research_agent_mcp:agent_mcp` | Model Context Protocol research agent |
| `research_agent_supervisor` | `deep_research_from_scratch.multi_agent_supervisor:supervisor_agent` | Supervisor coordination graph |
| `learning_agent` | `deep_research_from_scratch.learning_agent:learning_agent` | Feynman-based pedagogy agent |
| `deep_researcher` | `deep_research_from_scratch.deep_research_agent:deep_researcher` | Comprehensive research workflow |

---

## 📁 Artifact Storage

Generated research reports are saved to:
`src/deep_research_from_scratch/files/report_<uuid>.md`
