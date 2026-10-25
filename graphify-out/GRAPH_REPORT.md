# Graph Report - Autonomous-Cognitive-Engine-for-Deep-Research-and-Long-Horizon-Tasks  (2026-10-25)

## Corpus Check
- Corpus is ~32,025 words - fits in a single context window. You may not need a graph.

## Summary
- 535 nodes · 1138 edges · 28 communities (24 shown, 4 thin omitted)
- Extraction: 89% EXTRACTED · 11% INFERRED · 0% AMBIGUOUS · INFERRED: 128 edges (avg confidence: 0.92)
- Token cost: 1,200 input · 800 output

## Community Hubs (Navigation)
- Temporal Activities & Test Harness
- LangSmith Tracing & Observability Demo
- Temporal Durable Execution Demo
- Autonomous Learning & Quizzing Engine
- Interactive Learning Agent Engine
- ACE Cognitive State Runner
- LLM Model Connectors & Schemas
- LangGraph Supervisor & Multi-Agent Coordination
- Search & Evidence Utilities
- MCP Research & Compression Agent
- Research Agent Core Execution
- Console & Notebook Formatting Utilities
- ACE Architectural Foundation & Concepts
- LangGraph Studio Configuration
- Research State & Pydantic Schemas
- MCP Tool Execution & Client
- Docker Compose Service Specifications
- Temporal Worker Service Config
- Docker Infrastructure & Volumes
- Container Environment Configuration
- Container Resource Allocations
- Temporal Server Service Config
- Container Health Checks & Liveness
- Docker Build Contexts
- Durable Execution Concepts
- Core Package Namespace

## God Nodes (most connected - your core abstractions)
1. `ACEResearchWorkflow` - 31 edges
2. `ResearchWorkflowInput` - 28 edges
3. `ACEWorkflowClient` - 19 edges
4. `AgentState` - 18 edges
5. `get_today_str()` - 17 edges
6. `build_temporal_annotated_ace_graph()` - 16 edges
7. `get_temporal_config()` - 16 edges
8. `ScopingOutput` - 15 edges
9. `ResumeResearchInput` - 15 edges
10. `ResearchWorkflowResult` - 15 edges

## Surprising Connections (you probably didn't know these)
- `Sample SF Coffee Shops Benchmark` --references--> `Tier 1: Multi-Agent Deep Research`  [INFERRED]
  src/deep_research_from_scratch/files/coffee_shops_sf.md → PROBLEM_STATEMENT_AND_SOLUTION.md
- `run_interactive_demo()` --calls--> `get_active_model_info()`  [EXTRACTED]
  demo_ace_temporal.py → src/deep_research_from_scratch/gemma_model.py
- `run_interactive_demo()` --calls--> `print_cognitive_state()`  [EXTRACTED]
  demo_ace_temporal.py → src/deep_research_from_scratch/generate_checkpoint.py
- `run_interactive_demo()` --uses--> `ACEWorkflowClient`  [INFERRED]
  demo_ace_temporal.py → temporal_integration/client.py
- `run_interactive_demo()` --calls--> `create_temporal_worker()`  [EXTRACTED]
  demo_ace_temporal.py → temporal_integration/worker.py

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **ACE 3-Tier Foundation (Research + Durability + Observability)** — tier_1_multi_agent_research, tier_2_temporal_durability, tier_3_langsmith_observability [EXTRACTED 0.95]

## Communities (28 total, 4 thin omitted)

### Community 0 - "Temporal Activities & Test Harness"
Cohesion: 0.06
Nodes (28): execute_research_and_report_activity(), execute_single_pass_research_activity(), run_scoping_and_planning_activity(), ApprovalDecision, FinalResearchOutput, ResearchWorkflowInput, ResearchWorkflowResult, ResumeResearchInput (+20 more)

### Community 1 - "LangSmith Tracing & Observability Demo"
Cohesion: 0.06
Nodes (19): final_report_generation(), checkpoint_and_resume(), final_report_generation(), populate_cognitive_state(), save_report_to_file(), clarify_with_user(), get_today_str(), write_research_brief() (+11 more)

### Community 2 - "Temporal Durable Execution Demo"
Cohesion: 0.07
Nodes (7): run_interactive_demo(), ACEWorkflowClient, get_langsmith_plugin(), get_temporal_config(), TemporalConfig, test_langsmith_plugin_creation_and_config(), test_langsmith_plugin_disabled_when_tracing_false()

### Community 3 - "Autonomous Learning & Quizzing Engine"
Cohesion: 0.07
Nodes (20): administer_quiz(), Checkpoint, CheckpointContent, CheckpointItem, CheckpointResponse, ClarifyWithUser, create_content(), decide_next_step() (+12 more)

### Community 4 - "Interactive Learning Agent Engine"
Cohesion: 0.09
Nodes (18): administer_quiz(), Checkpoint, CheckpointContent, CheckpointItem, CheckpointResponse, clarify_with_user(), create_content(), decide_next_step() (+10 more)

### Community 5 - "ACE Cognitive State Runner"
Cohesion: 0.10
Nodes (12): main(), main(), get_active_model_info(), get_cognitive_snapshot(), make_checkpointer(), print_cognitive_state(), snapshot_to_json(), _safe() (+4 more)

### Community 6 - "LLM Model Connectors & Schemas"
Cohesion: 0.11
Nodes (4): extract_text_content(), get_cognitive_model(), get_gemma_model(), run_smoke_test()

### Community 7 - "LangGraph Supervisor & Multi-Agent Coordination"
Cohesion: 0.11
Nodes (6): get_notes_from_tool_calls(), supervisor(), supervisor_tools(), ConductResearch, ResearchComplete, SupervisorState

### Community 8 - "Search & Evidence Utilities"
Cohesion: 0.14
Nodes (6): deduplicate_search_results(), format_search_output(), process_search_results(), summarize_webpage_content(), tavily_search(), tavily_search_multiple()

### Community 9 - "MCP Research & Compression Agent"
Cohesion: 0.13
Nodes (6): compress_research(), should_continue(), should_continue(), ResearcherOutputState, ResearcherState, get_current_dir()

### Community 10 - "Research Agent Core Execution"
Cohesion: 0.19
Nodes (5): compress_research(), llm_call(), tool_node(), invoke_with_retry(), get_today_str()

### Community 11 - "Console & Notebook Formatting Utilities"
Cohesion: 0.15
Nodes (5): format_message(), format_message_content(), format_messages(), SafePopen, show_prompt()

### Community 12 - "ACE Architectural Foundation & Concepts"
Cohesion: 0.15
Nodes (13): Autonomous Cognitive Engine (ACE), Dynamic Context Compression, ACE Environment Setup Guide, Human-in-the-Loop Review & Approval, LangSmith Run Tree Tracing, Sample SF Coffee Shops Benchmark, Supervisor-Researcher Multi-Agent Pattern, Temporal State Checkpointing (+5 more)

### Community 13 - "LangGraph Studio Configuration"
Cohesion: 0.15
Nodes (12): dependencies, dockerfile_lines, env, graphs, deep_researcher, learning_agent, research_agent, research_agent_full (+4 more)

### Community 14 - "Research State & Pydantic Schemas"
Cohesion: 0.24
Nodes (3): ClarifyWithUser, ResearchQuestion, Summary

### Community 15 - "MCP Tool Execution & Client"
Cohesion: 0.22
Nodes (5): get_mcp_client(), llm_call(), tool_node(), execute_tools(), think_tool()

### Community 16 - "Docker Compose Service Specifications"
Cohesion: 0.25
Nodes (8): command, container_name, env_file, environment, ports, profiles, volumes, jupyter

### Community 17 - "Temporal Worker Service Config"
Cohesion: 0.25
Nodes (8): temporal-worker, command, container_name, depends_on, env_file, environment, restart, volumes

### Community 18 - "Docker Infrastructure & Volumes"
Cohesion: 0.29
Nodes (6): driver, services, driver, volumes, research_reports, temporal_data

### Community 19 - "Container Environment Configuration"
Cohesion: 0.29
Nodes (7): container_name, env_file, environment, ports, restart, volumes, deep-research

### Community 20 - "Container Resource Allocations"
Cohesion: 0.29
Nodes (7): deploy, resources, deploy, memory, memory, limits, reservations

### Community 21 - "Temporal Server Service Config"
Cohesion: 0.29
Nodes (7): temporal, container_name, environment, image, ports, restart, volumes

### Community 23 - "Container Health Checks & Liveness"
Cohesion: 0.33
Nodes (6): healthcheck, interval, retries, start_period, test, timeout

### Community 24 - "Docker Build Contexts"
Cohesion: 0.60
Nodes (5): context, dockerfile, build, build, build

## Knowledge Gaps
- **10 isolated node(s):** `deep_research_from_scratch`, `Durable Agent Execution`, `Human-in-the-Loop Review & Approval`, `Dynamic Context Compression`, `Temporal Workflow Orchestration` (+5 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 258 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ACEResearchWorkflow` connect `Temporal Activities & Test Harness` to `Temporal Durable Execution Demo`, `Temporal Workflow Queries & Signals`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Are the 16 inferred relationships involving `ACEResearchWorkflow` (e.g. with `ACEWorkflowClient` and `create_temporal_worker()`) actually correct?**
  _`ACEResearchWorkflow` has 16 INFERRED edges - model-reasoned connections that need verification._
- **What connects `deep_research_from_scratch`, `Durable Agent Execution`, `Human-in-the-Loop Review & Approval` to the rest of the system?**
  _10 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Temporal Activities & Test Harness` be split into smaller, more focused modules?**
  _Cohesion score 0.05972288580984233 - nodes in this community are weakly interconnected._
- **Why does `ACEWorkflowClient` connect `Temporal Durable Execution Demo` to `Temporal Activities & Test Harness`?**
  _High betweenness centrality (0.049) - this node is a cross-community bridge._
- **Are the 17 inferred relationships involving `ResearchWorkflowInput` (e.g. with `execute_single_pass_research_activity()` and `run_scoping_and_planning_activity()`) actually correct?**
  _`ResearchWorkflowInput` has 17 INFERRED edges - model-reasoned connections that need verification._
- **Should `LangSmith Tracing & Observability Demo` be split into smaller, more focused modules?**
  _Cohesion score 0.05712050078247261 - nodes in this community are weakly interconnected._