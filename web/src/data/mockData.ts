import { ResearchRun, WorkflowStage, TaskItem, SourceItem, LogEvent } from '../types/research';

export const INITIAL_RUNS: ResearchRun[] = [
  {
    runId: 'RUN-2026-0492',
    title: 'Persistent Memory Architectures in Autonomous AI Agents',
    researchTopic:
      'Investigate how persistent memory architectures affect the reliability of autonomous AI agents. Compare major approaches, evidence, limitations, and implementation trade-offs. Recommend an architecture for a research agent that must run for several hours.',
    status: 'waiting_for_approval',
    startTime: '2026-10-25 15:42:10 UTC',
    durationSeconds: 184,
    isApprovalRequired: true,
    brief: {
      title: 'Persistent Memory Architectures in Autonomous AI Agents',
      scope:
        'Comparative evaluation of state persistence (Temporal Event Replay, Vector Memory, LangGraph MemorySaver, and Relational Checkpoints) over long-horizon agent execution.',
      targetAudience: 'AI Systems Engineers and Autonomous Agent Architects',
      coreQuestions: [
        'How do uncheckpointed multi-agent execution loops degrade during network timeouts and node crashes?',
        'What are the determinism constraints of Temporal workflow event history when wrapping LLM tool calls?',
        'How does dynamic context compression prevent token window exhaustion during recursive research steps?',
      ],
      methodology:
        'Tri-pillar analysis across LangGraph supervision, Temporal durable activity orchestration, and LangSmith trace evaluation.',
      expectedOutcomes: [
        'Deterministic fault recovery benchmarks',
        'State explosion mitigation metrics',
        'Recommended 3-tier production reference architecture',
      ],
      proposedOutline: [
        'Executive Summary & Failure Taxonomy',
        'Analysis of Traditional In-Memory and Queue Architectures',
        'Temporal Event Sourcing & Durable Execution Guarantees',
        'Empirical Benchmarks: Context Compression & Recovery Latency',
        'Architectural Recommendations for Production Deployment',
      ],
    },
    cognitiveState: {
      activeModel: 'Google Gemma 2 9B / Gemini 2.5 Flash',
      tokensProcessed: 48920,
      memoryNodesCount: 18,
      unresolvedQuestions: [
        'Quantify checkpoint serialization overhead when state exceeds 2MB',
      ],
      decisionsMade: [
        'Adopted Temporal Workflow signals for human-in-the-loop interruption',
        'Isolated dynamic context compression into a dedicated LangGraph activity',
      ],
      compressionRatio: '3.4:1',
      checkpointsSaved: 4,
      temporalReplaySafe: true,
    },
    stages: [
      {
        id: 'scoping',
        stepNumber: '01',
        title: 'Objective & Scoping',
        description: 'Ingest user objective, clarify ambiguities, and synthesize structured research brief.',
        status: 'completed',
        agent: 'Scoping Agent',
        nodeKey: 'scoping_node',
        duration: '14s',
        timestamp: '15:42:24 UTC',
      },
      {
        id: 'planning',
        stepNumber: '02',
        title: 'Research Planning',
        description: 'Supervisor agent decomposes brief into parallel investigation queries and assigns tasks.',
        status: 'completed',
        agent: 'Supervisor Agent',
        nodeKey: 'supervisor_node',
        duration: '18s',
        timestamp: '15:42:42 UTC',
      },
      {
        id: 'evidence',
        stepNumber: '03',
        title: 'Evidence Gathering',
        description: 'Specialist researchers perform recursive search across web literature and local data.',
        status: 'completed',
        agent: 'Research Specialist Alpha',
        nodeKey: 'researcher_node',
        duration: '76s',
        timestamp: '15:43:58 UTC',
      },
      {
        id: 'compression',
        stepNumber: '04',
        title: 'Synthesis & Compression',
        description: 'Compress voluminous research notes, deduplicate evidence, and evaluate source grounding.',
        status: 'completed',
        agent: 'Context Compressor',
        nodeKey: 'compress_research',
        duration: '22s',
        timestamp: '15:44:20 UTC',
      },
      {
        id: 'approval',
        stepNumber: '05',
        title: 'Human Review & Approval',
        description: 'Workflow paused at Temporal signal checkpoint awaiting human approval or replanning directive.',
        status: 'waiting_for_human',
        agent: 'Human Reviewer',
        nodeKey: 'pause_for_human_approval',
        duration: 'Awaiting',
        timestamp: '15:44:22 UTC',
      },
      {
        id: 'report',
        stepNumber: '06',
        title: 'Final Report Synthesis',
        description: 'Generate publication-grade markdown report with executive takeaways and verified citations.',
        status: 'pending',
        agent: 'Report Synthesizer',
        nodeKey: 'final_report_generation',
      },
    ],
    tasks: [
      {
        id: 'task-1',
        stageId: 'scoping',
        title: 'Clarification & Scope Boundary Validation',
        agent: 'Scoping Agent',
        status: 'completed',
        summary: 'Parsed prompt and confirmed multi-hour agent durability as core investigation focus.',
        outputExcerpt: 'Scope verified: Focus on persistent state, determinism, and Temporal event sourcing.',
        timestamp: '15:42:20',
      },
      {
        id: 'task-2',
        stageId: 'planning',
        title: 'Supervisor Sub-Task Decomposition',
        agent: 'Supervisor Agent',
        status: 'completed',
        summary: 'Generated 3 parallel sub-tracks: failure modes, Temporal event replay, and compression ratios.',
        outputExcerpt: 'Dispatched 3 search tasks to Research Specialist Alpha.',
        timestamp: '15:42:38',
      },
      {
        id: 'task-3',
        stageId: 'evidence',
        title: 'Failure Taxonomy of Long-Horizon Agents',
        agent: 'Research Specialist Alpha',
        status: 'completed',
        summary: 'Analyzed silent crash patterns, socket timeouts, and memory leakage across 24-hour agent runs.',
        outputExcerpt: '82% of multi-agent run failures stem from uncheckpointed state during transient HTTP retries.',
        timestamp: '15:43:12',
      },
      {
        id: 'task-4',
        stageId: 'evidence',
        title: 'Temporal Durable Execution Benchmarks',
        agent: 'Temporal Specialist',
        status: 'completed',
        summary: 'Examined Temporal event history serialization and replay constraints for LangGraph state.',
        outputExcerpt: 'Temporal workflows guarantee zero state loss on worker restart with <120ms replay time.',
        timestamp: '15:43:50',
      },
      {
        id: 'task-5',
        stageId: 'compression',
        title: 'Dynamic Context Compression',
        agent: 'Context Compressor',
        status: 'completed',
        summary: 'Compressed 24,000 raw token evidence pool down to 7,050 tokens with zero citation loss.',
        outputExcerpt: 'Compression ratio 3.4:1 achieved using recursive semantic summarization.',
        timestamp: '15:44:18',
      },
    ],
    sources: [
      {
        id: 'src-1',
        title: 'Temporal Architecture Documentation: Workflows & Determinism',
        domain: 'docs.temporal.io',
        url: 'https://docs.temporal.io/workflows',
        retrievalTimestamp: '15:43:02',
        taskId: 'evidence',
        taskTitle: 'Temporal Durable Execution Benchmarks',
        excerpt:
          'A Temporal Workflow Execution is durable, reliable, and scalable. Temporal preserves the complete event history, allowing the workflow to resume seamlessly from the exact line of execution after infrastructure failures.',
        status: 'used_in_synthesis',
      },
      {
        id: 'src-2',
        title: 'LangGraph Persistence & Memory Architecture',
        domain: 'langchain-ai.github.io',
        url: 'https://langchain-ai.github.io/langgraph/concepts/persistence/',
        retrievalTimestamp: '15:43:15',
        taskId: 'evidence',
        taskTitle: 'Failure Taxonomy of Long-Horizon Agents',
        excerpt:
          'Checkpointers allow saving graph state at every super-step. When combined with durable workflow orchestrators like Temporal, LangGraph nodes execute with idempotency and fault-tolerance.',
        status: 'used_in_synthesis',
      },
      {
        id: 'src-3',
        title: 'LangSmith Distributed Tracing for Agentic Workflows',
        domain: 'docs.smith.langchain.com',
        url: 'https://docs.smith.langchain.com/tracing',
        retrievalTimestamp: '15:43:28',
        taskId: 'evidence',
        taskTitle: 'Temporal Durable Execution Benchmarks',
        excerpt:
          'Run Trees capture the full hierarchical execution graph of nested agents, tool calls, and LLM requests, enabling systematic debugging of cost, latency, and reasoning drift.',
        status: 'used_in_synthesis',
      },
    ],
    events: [
      {
        id: 'evt-1',
        timestamp: '15:42:10',
        category: 'WORKFLOW',
        level: 'INFO',
        message: 'Research workflow initialized with Temporal WorkflowID: ace-research-run-2026-0492',
      },
      {
        id: 'evt-2',
        timestamp: '15:42:15',
        category: 'AGENT',
        level: 'EXEC',
        message: 'Scoping Agent active. Analyzing prompt boundaries and audience requirements.',
      },
      {
        id: 'evt-3',
        timestamp: '15:42:24',
        category: 'WORKFLOW',
        level: 'INFO',
        message: 'Stage 01 completed. Research brief formulated.',
      },
      {
        id: 'evt-4',
        timestamp: '15:42:42',
        category: 'AGENT',
        level: 'EXEC',
        message: 'Supervisor Agent generated 3 execution sub-tracks.',
      },
      {
        id: 'evt-5',
        timestamp: '15:43:05',
        category: 'SEARCH',
        level: 'INFO',
        message: 'Retrieved 8 technical sources across docs.temporal.io and langchain-ai.github.io.',
      },
      {
        id: 'evt-6',
        timestamp: '15:44:20',
        category: 'AGENT',
        level: 'EXEC',
        message: 'Dynamic context compression completed. Evidence compressed 3.4:1.',
      },
      {
        id: 'evt-7',
        timestamp: '15:44:22',
        category: 'APPROVAL',
        level: 'WARN',
        message: 'Workflow paused at Human-in-the-Loop checkpoint. Awaiting user signal.',
      },
    ],
    finalReport: `# Persistent Memory Architectures in Autonomous AI Agents
## Executive Summary

Autonomous cognitive agents tasked with long-horizon research (hours to days) face severe failure modes when architected using standard in-memory event loops or simple message queues:
1. **Memory Fragmentation & Token Blowout**: Accumulating raw search results degrades context windows.
2. **Process Volatility**: Container restarts, socket timeouts, or rate limits terminate the entire mission.
3. **Lack of Deterministic Auditability**: Troubleshooting hallucinations requires replayable state history.

### The Recommended Tri-Tier Architecture
- **Cognitive Layer (LangGraph)**: Multi-agent supervisor coordinating specialized researchers with recursive context compression.
- **Durability Layer (Temporal)**: Wraps agent nodes into activities and workflows, providing automatic retry, heartbeating, and zero-loss state recovery.
- **Observability Layer (LangSmith)**: Attaches distributed run trees to Temporal workflows for prompt tracking and latency evaluation.

### Key Conclusions & Metrics
- **State Recovery**: Replay overhead is <120ms with zero loss of collected research notes.
- **Compression Efficiency**: Dynamic context compression reduces token footprint by 65-75% while preserving 100% of primary citations.
- **Human Governance**: Temporal signal handlers allow seamless pausing, user reviews, and plan redirections without server restart.
`,
  },
  {
    runId: 'RUN-2026-0418',
    title: 'San Francisco Specialty Coffee Sourcing & Third-Wave Roasters',
    researchTopic:
      'Comprehensive market & quality analysis of San Francisco specialty coffee roasters: evaluate sourcing transparency, single-origin offerings, roasting philosophies, and direct-trade sustainability metrics.',
    status: 'completed',
    startTime: '2026-10-25 14:15:00 UTC',
    completionTime: '2026-10-25 14:18:45 UTC',
    durationSeconds: 225,
    isApprovalRequired: false,
    brief: {
      title: 'San Francisco Specialty Coffee Sourcing & Third-Wave Roasters',
      scope: 'Benchmarking top 5 specialty coffee institutions across San Francisco.',
      targetAudience: 'Specialty Coffee Connoisseurs & Market Analysts',
      coreQuestions: [
        'What direct-trade relationships distinguish top SF roasteries?',
        'How do roasting profiles compare between Sightglass, Blue Bottle, Ritual, Philz, and Four Barrel?',
      ],
      methodology: 'Local database extraction & third-wave coffee index analysis.',
      expectedOutcomes: ['Comparative roaster profiles', 'Sourcing transparency rankings'],
      proposedOutline: ['Introduction', 'Profiles of Key Roasters', 'Direct Trade Analysis', 'Synthesis'],
    },
    cognitiveState: {
      activeModel: 'Google Gemma 2 9B',
      tokensProcessed: 32400,
      memoryNodesCount: 14,
      unresolvedQuestions: [],
      decisionsMade: ['Synthesized all 5 roasters from validated local files'],
      compressionRatio: '2.8:1',
      checkpointsSaved: 6,
      temporalReplaySafe: true,
    },
    stages: [
      { id: 'scoping', stepNumber: '01', title: 'Objective & Scoping', description: 'Scope verified.', status: 'completed', agent: 'Scoping Agent', nodeKey: 'scoping_node', duration: '12s' },
      { id: 'planning', stepNumber: '02', title: 'Research Planning', description: 'Plan generated.', status: 'completed', agent: 'Supervisor Agent', nodeKey: 'supervisor_node', duration: '16s' },
      { id: 'evidence', stepNumber: '03', title: 'Evidence Gathering', description: 'Gathered SF roaster data.', status: 'completed', agent: 'Research Specialist', nodeKey: 'researcher_node', duration: '84s' },
      { id: 'compression', stepNumber: '04', title: 'Synthesis & Compression', description: 'Compressed roaster profiles.', status: 'completed', agent: 'Context Compressor', nodeKey: 'compress_research', duration: '20s' },
      { id: 'approval', stepNumber: '05', title: 'Human Review & Approval', description: 'Approved by operator.', status: 'completed', agent: 'Operator', nodeKey: 'pause_for_human_approval', duration: '5s' },
      { id: 'report', stepNumber: '06', title: 'Final Report Synthesis', description: 'Report generated.', status: 'completed', agent: 'Report Synthesizer', nodeKey: 'final_report_generation', duration: '18s' },
    ],
    tasks: [
      {
        id: 't-1',
        stageId: 'evidence',
        title: 'SF Specialty Coffee Sourcing Extraction',
        agent: 'Research Specialist',
        status: 'completed',
        summary: 'Extracted profiles for Blue Bottle, Philz, Sightglass, Ritual, and Four Barrel.',
        timestamp: '14:16:30',
      },
    ],
    sources: [
      {
        id: 'src-sf-1',
        title: 'San Francisco Coffee Shops Research Archive',
        domain: 'local.coffee.archive',
        url: 'file:///src/deep_research_from_scratch/files/coffee_shops_sf.md',
        retrievalTimestamp: '14:16:15',
        taskId: 'evidence',
        taskTitle: 'SF Specialty Coffee Sourcing Extraction',
        excerpt:
          'Sightglass: Founded 2009, SOMA flagship, known for third-wave coffee and roasting transparency with large viewing windows.',
        status: 'used_in_synthesis',
      },
      {
        id: 'src-sf-2',
        title: 'Ritual Coffee Roasters Direct Trade Dossier',
        domain: 'local.coffee.archive',
        url: 'file:///src/deep_research_from_scratch/files/coffee_shops_sf.md',
        retrievalTimestamp: '14:16:20',
        taskId: 'evidence',
        taskTitle: 'SF Specialty Coffee Sourcing Extraction',
        excerpt:
          'Ritual: Founded 2005, pioneer in direct-trade relationships and seasonal micro-lot offerings across the Mission and Castro.',
        status: 'used_in_synthesis',
      },
    ],
    events: [
      { id: 'e-1', timestamp: '14:15:00', category: 'WORKFLOW', level: 'INFO', message: 'Mission initialized.' },
      { id: 'e-2', timestamp: '14:16:30', category: 'SEARCH', level: 'INFO', message: 'Extracted 5 third-wave roaster dossiers.' },
      { id: 'e-3', timestamp: '14:17:10', category: 'APPROVAL', level: 'INFO', message: 'Plan approved by human operator.' },
      { id: 'e-4', timestamp: '14:18:45', category: 'WORKFLOW', level: 'INFO', message: 'Report written to disk: report_coffee_shops_sf.md.' },
    ],
    finalReport: `# San Francisco Specialty Coffee Roasters: Sourcing & Roasting Analysis
## Executive Summary
San Francisco remains a global epicenter for third-wave coffee innovation. This investigation benchmarks five premier roasting operations, analyzing their sourcing transparency, relationship coffee models, and roasting profiles.

### 1. Sightglass Coffee (SOMA)
- **Founded**: 2009
- **Core Philosophy**: Absolute roasting transparency. Flagship facility on 7th St features open industrial roasters allowing patrons to witness the roasting process.
- **Sourcing**: Direct partnerships with Ethiopian and Colombian washing stations.

### 2. Ritual Coffee Roasters (Mission District)
- **Founded**: 2005
- **Core Philosophy**: Pioneer in single-origin direct trade. Pays premiums significantly above Fair Trade baseline.
- **Profile**: Light-to-medium Scandinavian-influenced roasts emphasizing bright fruit acidity.

### 3. Four Barrel Coffee (Valencia St)
- **Founded**: 2008
- **Core Philosophy**: Analog craftsmanship using vintage Probat roasters.
- **Profile**: Complex balance of sweetness and clarity.

### 4. Blue Bottle Coffee (Founded 2002)
- **Founded**: 2002 in Oakland, expanded citywide.
- **Notable**: Extreme freshness guarantee (serving within strict days of roasting).

### 5. Philz Coffee (Mission District)
- **Founded**: 2003
- **Notable**: Custom personalized blending focused on heavy body and complex aroma over single-origin acidity.
`,
  },
];
