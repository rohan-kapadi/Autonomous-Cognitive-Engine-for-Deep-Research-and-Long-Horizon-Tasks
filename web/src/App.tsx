import React, { useState } from 'react';
import { TopBar } from './components/TopBar';
import { NavigationSidebar, ActiveView } from './components/NavigationSidebar';
import { WorkflowCanvas } from './components/WorkflowCanvas';
import { ContextInspector } from './components/ContextInspector';
import { ExecutionActivityDrawer } from './components/ExecutionActivityDrawer';
import { ApprovalModal } from './components/ApprovalModal';
import { TextmodeCanvas } from './components/TextmodeCanvas';
import { TextmodeControls } from './components/TextmodeControls';
import { ResearchObjectiveComposer } from './components/ResearchObjectiveComposer';
import { OverviewDashboard } from './components/OverviewDashboard';
import { ResearchRunsList } from './components/ResearchRunsList';
import { SourcesExplorer } from './components/SourcesExplorer';
import { ReportReader } from './components/ReportReader';
import { SystemSettings } from './components/SystemSettings';
import { INITIAL_RUNS } from './data/mockData';
import { ResearchRun, SourceItem, WorkflowStage } from './types/research';
import { Play, Pause, RotateCcw, FileText, CheckCircle2 } from 'lucide-react';

export const App: React.FC = () => {
  // Application State
  const [runs, setRuns] = useState<ResearchRun[]>(INITIAL_RUNS);
  const [activeRunId, setActiveRunId] = useState<string>(INITIAL_RUNS[0].runId);
  const [activeView, setActiveView] = useState<ActiveView>('studio');
  const [navCollapsed, setNavCollapsed] = useState<boolean>(false);
  const [selectedStageId, setSelectedStageId] = useState<string | null>('scoping');
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState<boolean>(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Textmode Matrix Controls State (extension.textmode.art inspired)
  const [textmodeVisible, setTextmodeVisible] = useState<boolean>(false);
  const [colorMode, setColorMode] = useState<'lime' | 'amber' | 'cyan' | 'mono'>('lime');
  const [density, setDensity] = useState<number>(14);
  const [showContour, setShowContour] = useState<boolean>(true);
  const [glyphSet, setGlyphSet] = useState<'ascii' | 'blocks' | 'binary' | 'matrix'>('matrix');
  const [textmodeOpacity, setTextmodeOpacity] = useState<number>(0.22);
  const [crtEnabled, setCrtEnabled] = useState<boolean>(false);

  // Active Run derived data
  const currentRun = runs.find((r) => r.runId === activeRunId) || runs[0];
  const selectedStage =
    currentRun.stages.find((s) => s.id === selectedStageId) || currentRun.stages[0];

  // Theme Toggle
  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
  };

  // Submit New Research
  const handleStartNewResearch = (
    topic: string,
    depth: string,
    enableTracing: boolean,
    autoApprove: boolean
  ) => {
    const newRunId = `RUN-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const nowStr = new Date().toTimeString().split(' ')[0];

    const newRun: ResearchRun = {
      runId: newRunId,
      title: topic.slice(0, 52) + (topic.length > 52 ? '...' : ''),
      researchTopic: topic,
      status: 'scoping',
      startTime: `${nowStr} UTC`,
      durationSeconds: 0,
      isApprovalRequired: false,
      brief: {
        title: topic,
        scope: `Deep research investigation at ${depth} depth level.`,
        targetAudience: 'Specialists and Decision Makers',
        coreQuestions: [
          `What are the core technical constraints and evidence regarding: ${topic.slice(0, 40)}?`,
          'What are the benchmarked trade-offs, architecture patterns, and reliability metrics?',
          'What synthesis and recommendations emerge from multi-agent search?',
        ],
        methodology: 'Tri-tier LangGraph supervisor with Temporal durability guarantees.',
        expectedOutcomes: ['Evidence bibliography', 'Structured audit synthesis'],
        proposedOutline: ['Overview', 'Evidence Analysis', 'Technical Synthesis', 'Conclusions'],
      },
      cognitiveState: {
        activeModel: 'Google Gemma 2 9B / Gemini 2.5 Flash',
        tokensProcessed: 1200,
        memoryNodesCount: 4,
        unresolvedQuestions: [],
        decisionsMade: ['Initialized research workflow with LangSmith tracing'],
        compressionRatio: '1:1',
        checkpointsSaved: 1,
        temporalReplaySafe: true,
      },
      stages: [
        {
          id: 'scoping',
          stepNumber: '01',
          title: 'Objective & Scoping',
          description: 'Analyzing user prompt and constructing formal research brief.',
          status: 'running',
          agent: 'Scoping Agent',
          nodeKey: 'scoping_node',
          duration: 'Active',
          timestamp: nowStr,
        },
        {
          id: 'planning',
          stepNumber: '02',
          title: 'Research Planning',
          description: 'Supervisor agent decomposes brief into queries.',
          status: 'pending',
          agent: 'Supervisor Agent',
          nodeKey: 'supervisor_node',
        },
        {
          id: 'evidence',
          stepNumber: '03',
          title: 'Evidence Gathering',
          description: 'Specialist researchers perform recursive search.',
          status: 'pending',
          agent: 'Research Specialist Alpha',
          nodeKey: 'researcher_node',
        },
        {
          id: 'compression',
          stepNumber: '04',
          title: 'Synthesis & Compression',
          description: 'Deduplicate findings and compress context.',
          status: 'pending',
          agent: 'Context Compressor',
          nodeKey: 'compress_research',
        },
        {
          id: 'approval',
          stepNumber: '05',
          title: 'Human Review & Approval',
          description: 'Workflow pause checkpoint for human approval.',
          status: 'pending',
          agent: 'Human Reviewer',
          nodeKey: 'pause_for_human_approval',
        },
        {
          id: 'report',
          stepNumber: '06',
          title: 'Final Report Synthesis',
          description: 'Generate publication-grade report.',
          status: 'pending',
          agent: 'Report Synthesizer',
          nodeKey: 'final_report_generation',
        },
      ],
      tasks: [
        {
          id: 'task-new-1',
          stageId: 'scoping',
          title: 'Initial Scope Clarification',
          agent: 'Scoping Agent',
          status: 'running',
          summary: 'Evaluating topic parameters and audience expectations.',
          timestamp: nowStr,
        },
      ],
      sources: [
        {
          id: 'src-init-1',
          title: 'Autonomous Cognitive Engine Architecture Reference',
          domain: 'ace.local',
          url: 'file:///PROBLEM_STATEMENT_AND_SOLUTION.md',
          retrievalTimestamp: nowStr,
          taskId: 'scoping',
          taskTitle: 'Initial Scope Clarification',
          excerpt:
            'Autonomous deep research requires fault-tolerant durable workflows, structured supervisor-researcher multi-agent patterns, and comprehensive run tree tracing.',
          status: 'retrieved',
        },
      ],
      events: [
        {
          id: 'evt-new-1',
          timestamp: nowStr,
          category: 'WORKFLOW',
          level: 'INFO',
          message: `Mission initialized: ${topic.slice(0, 48)}...`,
        },
        {
          id: 'evt-new-2',
          timestamp: nowStr,
          category: 'AGENT',
          level: 'EXEC',
          message: 'Scoping Agent active. Analyzing prompt boundary and constraints.',
        },
      ],
    };

    setRuns([newRun, ...runs]);
    setActiveRunId(newRunId);
    setActiveView('studio');
    setSelectedStageId('scoping');

    // Progressive autonomous simulation
    setTimeout(() => {
      setRuns((prev) =>
        prev.map((r) => {
          if (r.runId !== newRunId) return r;
          return {
            ...r,
            status: 'planning',
            stages: r.stages.map((st) =>
              st.id === 'scoping'
                ? { ...st, status: 'completed', duration: '12s' }
                : st.id === 'planning'
                ? { ...st, status: 'running', duration: 'Active' }
                : st
            ),
            events: [
              ...r.events,
              {
                id: `evt-${Date.now()}`,
                timestamp: new Date().toTimeString().split(' ')[0],
                category: 'WORKFLOW',
                level: 'INFO',
                message: 'Stage 01 completed. Research brief locked. Transitioning to Supervisor.',
              },
            ],
          };
        })
      );
    }, 2800);

    setTimeout(() => {
      setRuns((prev) =>
        prev.map((r) => {
          if (r.runId !== newRunId) return r;
          const isPaused = !autoApprove;
          return {
            ...r,
            status: isPaused ? 'waiting_for_approval' : 'researching',
            isApprovalRequired: isPaused,
            stages: r.stages.map((st) =>
              st.id === 'planning'
                ? { ...st, status: 'completed', duration: '14s' }
                : st.id === 'approval' && isPaused
                ? { ...st, status: 'waiting_for_human', duration: 'Awaiting' }
                : st
            ),
            events: [
              ...r.events,
              {
                id: `evt-pause-${Date.now()}`,
                timestamp: new Date().toTimeString().split(' ')[0],
                category: 'APPROVAL',
                level: 'WARN',
                message: isPaused
                  ? 'Temporal Workflow paused at human review signal. Awaiting approval.'
                  : 'Auto-approve enabled. Commencing multi-agent evidence gathering.',
              },
            ],
          };
        })
      );
      if (!autoApprove) {
        setIsApprovalModalOpen(true);
      }
    }, 5500);
  };

  // Handle Human Approval
  const handleApproveWorkflow = () => {
    setIsApprovalModalOpen(false);
    const nowStr = new Date().toTimeString().split(' ')[0];

    setRuns((prev) =>
      prev.map((r) => {
        if (r.runId !== currentRun.runId) return r;
        return {
          ...r,
          status: 'completed',
          isApprovalRequired: false,
          stages: r.stages.map((st) =>
            st.id === 'approval'
              ? { ...st, status: 'completed', duration: 'Approved' }
              : st.id === 'report'
              ? { ...st, status: 'completed', duration: '18s' }
              : { ...st, status: 'completed' }
          ),
          events: [
            ...r.events,
            {
              id: `evt-appr-${Date.now()}`,
              timestamp: nowStr,
              category: 'APPROVAL',
              level: 'INFO',
              message: 'Human approval signal received. Workflow resumed autonomously.',
            },
            {
              id: `evt-fin-${Date.now()}`,
              timestamp: nowStr,
              category: 'WORKFLOW',
              level: 'INFO',
              message: 'Final publication-grade report synthesized and verified against source evidence.',
            },
          ],
          finalReport:
            r.finalReport ||
            `# Research Synthesis Report: ${r.title}
## Executive Summary
This report presents an empirical analysis of **${r.researchTopic}**. Using the Autonomous Cognitive Engine (ACE), the investigation synthesized findings across multi-agent searches, structural code analysis, and domain literature.

### Key Findings
1. **Architectural Grounding**: Systematic evaluation demonstrates that durable event sourcing eliminates transient failure modes.
2. **Deterministic Resiliency**: Recovering cognitive state from checkpointed event histories maintains multi-step continuity.
3. **Evidence Rigor**: All claims are cross-referenced with retrieved technical documentation and source citations.

### Strategic Recommendations
- Implement granular Temporal activity retries with exponential backoff for external LLM endpoints.
- Establish strict token limits with dynamic context compression before synthesis nodes.
`,
        };
      })
    );
  };

  // Handle Human Replanning
  const handleReplanWorkflow = (directive: string) => {
    setIsApprovalModalOpen(false);
    const nowStr = new Date().toTimeString().split(' ')[0];

    setRuns((prev) =>
      prev.map((r) => {
        if (r.runId !== currentRun.runId) return r;
        return {
          ...r,
          status: 'researching',
          isApprovalRequired: false,
          brief: r.brief
            ? {
                ...r.brief,
                coreQuestions: [...r.brief.coreQuestions, `Directive: ${directive}`],
              }
            : null,
          stages: r.stages.map((st) =>
            st.id === 'approval'
              ? { ...st, status: 'completed', duration: 'Replanned' }
              : st.id === 'evidence'
              ? { ...st, status: 'running', duration: 'Re-searching' }
              : st
          ),
          events: [
            ...r.events,
            {
              id: `evt-replan-${Date.now()}`,
              timestamp: nowStr,
              category: 'APPROVAL',
              level: 'WARN',
              message: `Replanning directive transmitted: "${directive}". Supervisor adjusting queries.`,
            },
          ],
        };
      })
    );
  };

  return (
    <div
      className={`crt-overlay ${crtEnabled ? 'crt-enabled' : ''}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100vw',
        height: '100vh',
        backgroundColor: 'var(--bg-base)',
        color: 'var(--text-primary)',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Live Textmode ASCII Canvas (background overlay) */}
      <TextmodeCanvas
        colorMode={colorMode}
        density={density}
        showContour={showContour}
        glyphSet={glyphSet}
        interactive={true}
        opacity={textmodeOpacity}
      />

      {/* Floating Textmode Controls (extension.textmode.art inspired) */}
      <TextmodeControls
        colorMode={colorMode}
        setColorMode={setColorMode}
        density={density}
        setDensity={setDensity}
        showContour={showContour}
        setShowContour={setShowContour}
        glyphSet={glyphSet}
        setGlyphSet={setGlyphSet}
        opacity={textmodeOpacity}
        setOpacity={setTextmodeOpacity}
        crtEnabled={crtEnabled}
        setCrtEnabled={setCrtEnabled}
        visible={textmodeVisible}
        setVisible={setTextmodeVisible}
      />

      {/* Persistent Top Bar */}
      <TopBar
        runId={currentRun.runId}
        status={currentRun.status}
        isApprovalRequired={currentRun.isApprovalRequired}
        onToggleDrawer={() => setIsDrawerOpen(!isDrawerOpen)}
        isDrawerOpen={isDrawerOpen}
        onToggleTextmode={() => setTextmodeVisible(!textmodeVisible)}
        isTextmodeOpen={textmodeVisible}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Shell Workspace Body */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative', zIndex: 10 }}>
        {/* Navigation Sidebar */}
        <NavigationSidebar
          activeView={activeView}
          setActiveView={setActiveView}
          collapsed={navCollapsed}
          setCollapsed={setNavCollapsed}
          onNewResearch={() => setActiveView('overview')}
        />

        {/* Primary View Routing Canvas */}
        <main
          style={{
            flex: 1,
            height: 'calc(100vh - var(--topbar-height))',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
          }}
        >
          {/* VIEW: STUDIO */}
          {activeView === 'studio' && (
            <div style={{ display: 'flex', flex: 1, height: '100%', overflow: 'hidden' }}>
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                {/* Research Objective Header Banner */}
                <div
                  className="border-b-hairline"
                  style={{
                    background: 'var(--bg-surface)',
                    padding: '16px 20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '16px',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span className="mono-data" style={{ color: 'var(--accent-lime)', fontSize: '11px' }}>
                        ACTIVE INVESTIGATION // {currentRun.runId}
                      </span>
                      <span style={{ color: 'var(--text-tertiary)' }}>•</span>
                      <span className="text-meta" style={{ fontSize: '10px' }}>
                        STARTED: {currentRun.startTime}
                      </span>
                    </div>

                    <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                      {currentRun.title}
                    </h2>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.45, maxWidth: '780px' }}>
                      {currentRun.researchTopic}
                    </p>
                  </div>

                  {/* Top Actions */}
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    {currentRun.finalReport && (
                      <button
                        onClick={() => setActiveView('reports')}
                        className="btn btn-primary"
                        style={{ fontSize: '11px', padding: '6px 12px' }}
                      >
                        <FileText size={12} />
                        VIEW REPORT
                      </button>
                    )}
                    {currentRun.isApprovalRequired && (
                      <button
                        onClick={() => setIsApprovalModalOpen(true)}
                        className="btn btn-amber"
                        style={{ fontSize: '11px', padding: '6px 12px' }}
                      >
                        REVIEW PLAN
                      </button>
                    )}
                  </div>
                </div>

                {/* Workflow Canvas */}
                <WorkflowCanvas
                  stages={currentRun.stages}
                  selectedStageId={selectedStageId}
                  onSelectStage={(id) => setSelectedStageId(id)}
                  isApprovalRequired={currentRun.isApprovalRequired}
                  onOpenApproval={() => setIsApprovalModalOpen(true)}
                />
              </div>

              {/* Contextual Right Inspector */}
              <ContextInspector
                stage={selectedStage}
                tasks={currentRun.tasks}
                sources={currentRun.sources}
                cognitiveState={currentRun.cognitiveState}
                onClose={() => setSelectedStageId(null)}
                onOpenSource={() => setActiveView('sources')}
              />
            </div>
          )}

          {/* VIEW: OVERVIEW */}
          {activeView === 'overview' && (
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <OverviewDashboard
                currentRun={currentRun}
                runs={runs}
                onSelectRun={(id) => {
                  setActiveRunId(id);
                  setActiveView('studio');
                }}
                onNewResearch={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onOpenApproval={() => setIsApprovalModalOpen(true)}
              />

              {/* Objective Composer Embedded in Overview */}
              <div style={{ borderTop: '1px solid var(--border-color)', marginTop: 'var(--space-2xl)' }}>
                <ResearchObjectiveComposer onSubmit={handleStartNewResearch} isLoading={false} />
              </div>
            </div>
          )}

          {/* VIEW: RUNS */}
          {activeView === 'runs' && (
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <ResearchRunsList
                runs={runs}
                activeRunId={activeRunId}
                onSelectRun={(id) => {
                  setActiveRunId(id);
                  setActiveView('studio');
                }}
                onViewReport={(id) => {
                  setActiveRunId(id);
                  setActiveView('reports');
                }}
              />
            </div>
          )}

          {/* VIEW: SOURCES */}
          {activeView === 'sources' && (
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <SourcesExplorer sources={currentRun.sources} />
            </div>
          )}

          {/* VIEW: REPORTS */}
          {activeView === 'reports' && (
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <ReportReader
                reportMarkdown={
                  currentRun.finalReport ||
                  `# Preliminary Research Brief
The report for ${currentRun.runId} is currently being synthesized. Check the Research Studio stage pipeline for live execution status.`
                }
                topic={currentRun.researchTopic}
                runId={currentRun.runId}
                timestamp={currentRun.startTime}
              />
            </div>
          )}

          {/* VIEW: SETTINGS */}
          {activeView === 'settings' && (
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <SystemSettings />
            </div>
          )}
        </main>
      </div>

      {/* Human Approval & Replanning Modal */}
      <ApprovalModal
        isOpen={isApprovalModalOpen}
        onClose={() => setIsApprovalModalOpen(false)}
        brief={currentRun.brief}
        onApprove={handleApproveWorkflow}
        onReplan={handleReplanWorkflow}
        isLoading={false}
      />

      {/* Execution Activity Event Drawer */}
      <ExecutionActivityDrawer
        events={currentRun.events}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onClear={() => {
          setRuns((prev) =>
            prev.map((r) => (r.runId === currentRun.runId ? { ...r, events: [] } : r))
          );
        }}
      />
    </div>
  );
};

export default App;
