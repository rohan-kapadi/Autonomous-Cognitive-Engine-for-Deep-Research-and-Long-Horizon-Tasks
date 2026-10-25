import React from 'react';
import {
  Compass,
  Plus,
  Layers,
  FileText,
  Bookmark,
  ShieldCheck,
  Cpu,
  Clock,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { ResearchRun, ResearchPreset } from '../types/research';

interface OverviewDashboardProps {
  currentRun: ResearchRun;
  runs: ResearchRun[];
  onSelectRun: (runId: string) => void;
  onNewResearch: () => void;
  onOpenApproval: () => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  currentRun,
  runs,
  onSelectRun,
  onNewResearch,
  onOpenApproval,
}) => {
  return (
    <div style={{ maxWidth: '1040px', margin: '0 auto', padding: 'var(--space-2xl) var(--space-lg)' }}>
      {/* Hero Welcome / Mission Header */}
      <div
        className="border-hairline"
        style={{
          background: 'var(--bg-surface)',
          padding: '24px 28px',
          borderRadius: 'var(--radius-sm)',
          marginBottom: 'var(--space-xl)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className="text-meta" style={{ color: 'var(--accent-lime)' }}>
                ACE ENGINE // COGNITIVE RESEARCH INSTRUMENT
              </span>
              <span className="status-pill running" style={{ fontSize: '9px' }}>
                ONLINE
              </span>
            </div>
            <h1
              style={{
                fontSize: '24px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
                marginBottom: '8px',
              }}
            >
              Autonomous Cognitive Engine
            </h1>
            <p
              style={{
                color: 'var(--text-secondary)',
                fontSize: '13px',
                maxWidth: '620px',
                lineHeight: 1.6,
              }}
            >
              A fault-tolerant deep-research platform combining LangGraph multi-agent cognitive
              planning with Temporal durable execution and LangSmith tracing. Autonomy is visible,
              inspectable, and steerable.
            </p>
          </div>

          <button
            onClick={onNewResearch}
            className="btn btn-primary"
            style={{ padding: '8px 16px', fontSize: '11px' }}
          >
            <Plus size={13} />
            START INVESTIGATION
          </button>
        </div>
      </div>

      {/* Active Workflow Alert / Status Card */}
      {currentRun.isApprovalRequired && (
        <div
          className="border-hairline"
          style={{
            background: 'var(--accent-amber-dim)',
            borderColor: 'var(--border-amber)',
            padding: '16px 20px',
            borderRadius: 'var(--radius-sm)',
            marginBottom: 'var(--space-xl)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertTriangle size={20} color="var(--accent-amber)" />
            <div>
              <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--accent-amber)' }}>
                WORKFLOW PAUSED: HUMAN REVIEW REQUIRED
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-primary)', marginTop: '2px' }}>
                Run {currentRun.runId} completed scoping and generated a research brief awaiting your approval.
              </div>
            </div>
          </div>
          <button onClick={onOpenApproval} className="btn btn-amber" style={{ padding: '6px 14px' }}>
            REVIEW BRIEF & APPROVE
          </button>
        </div>
      )}

      {/* 3-Pillar Telemetry Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 'var(--space-md)',
          marginBottom: 'var(--space-xl)',
        }}
      >
        {/* Tier 1 */}
        <div
          className="border-hairline"
          style={{
            background: 'var(--bg-surface)',
            padding: '16px',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Layers size={14} color="var(--accent-lime)" />
            <span className="text-meta">TIER 1 // COGNITIVE REASONING</span>
          </div>
          <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>
            LangGraph Multi-Agent DAG
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Supervisor-researcher architecture with dynamic context compression and evidence deduplication.
          </p>
        </div>

        {/* Tier 2 */}
        <div
          className="border-hairline"
          style={{
            background: 'var(--bg-surface)',
            padding: '16px',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Cpu size={14} color="var(--accent-amber)" />
            <span className="text-meta">TIER 2 // DURABLE EXECUTION</span>
          </div>
          <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>
            Temporal Workflow Orchestration
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            State recovery across network drops, automatic activity retries, and human signal handling.
          </p>
        </div>

        {/* Tier 3 */}
        <div
          className="border-hairline"
          style={{
            background: 'var(--bg-surface)',
            padding: '16px',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <ShieldCheck size={14} color="var(--accent-blue)" />
            <span className="text-meta">TIER 3 // OBSERVABILITY & EVAL</span>
          </div>
          <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>
            LangSmith Run Tree Tracing
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            End-to-end trace attribution linking parent Temporal workflows to internal LLM tool calls.
          </p>
        </div>
      </div>

      {/* Recent Investigations History */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span className="text-meta" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
            RECENT RESEARCH RUNS
          </span>
          <span className="mono-data" style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
            {runs.length} RECORDED
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          {runs.map((r) => (
            <div
              key={r.runId}
              onClick={() => onSelectRun(r.runId)}
              className="border-hairline"
              style={{
                background: 'var(--bg-surface)',
                padding: '14px 18px',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'border-color var(--dur-fast) var(--ease-mechanical)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent-lime)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span className="mono-data" style={{ color: 'var(--accent-lime)', fontSize: '11px' }}>
                    {r.runId}
                  </span>
                  <span style={{ color: 'var(--text-tertiary)' }}>•</span>
                  <span style={{ fontWeight: 600, fontSize: '13px' }}>{r.title}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="text-meta" style={{ fontSize: '10px' }}>
                    {r.sources.length} sources gathered
                  </span>
                  <span style={{ color: 'var(--text-tertiary)' }}>•</span>
                  <span className="mono-data tabular" style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>
                    {r.durationSeconds}s duration
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className={`status-pill ${r.status}`} style={{ fontSize: '9px' }}>
                  {r.status.toUpperCase()}
                </span>
                <ArrowRight size={14} color="var(--accent-lime)" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
