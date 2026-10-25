import React, { useState } from 'react';
import {
  CheckCircle2,
  RotateCcw,
  Edit3,
  ShieldCheck,
  Layers,
  ArrowRight,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface TaskPlanItem {
  id: string;
  title: string;
  agent: string;
  status: 'completed' | 'pending' | 'waiting_for_approval';
  deliverable: string;
}

interface PlanReviewViewProps {
  objective: string;
  brief: string;
  onApprove: (objective: string, depth: string) => void;
  onReplan: (directive: string) => void;
  onEditScope: () => void;
}

export const PlanReviewView: React.FC<PlanReviewViewProps> = ({
  objective,
  brief,
  onApprove,
  onReplan,
  onEditScope,
}) => {
  const [replanOpen, setReplanOpen] = useState<boolean>(false);
  const [replanDirective, setReplanDirective] = useState<string>('');
  const [depth, setDepth] = useState<'standard' | 'deep' | 'comprehensive'>('deep');

  const defaultTasks: TaskPlanItem[] = [
    {
      id: 't-1',
      title: 'Problem Scoping & Constraint Analysis',
      agent: 'Scoping Specialist',
      status: 'completed',
      deliverable: 'Formal research brief and domain boundary definitions.',
    },
    {
      id: 't-2',
      title: 'Supervisor Decomposition & Search Formulation',
      agent: 'Lead Supervisor',
      status: 'pending',
      deliverable: '3 targeted search tracks and parallel query execution.',
    },
    {
      id: 't-3',
      title: 'Multi-Agent Evidence Gathering & Web Retrieval',
      agent: 'Research Specialist Alpha',
      status: 'pending',
      deliverable: 'Extracted empirical citations and web findings from Tavily.',
    },
    {
      id: 't-4',
      title: 'Context Compression & Deduplication',
      agent: 'Context Compressor',
      status: 'pending',
      deliverable: 'Compressed knowledge base preserving vital metrics.',
    },
    {
      id: 't-5',
      title: 'Cognitive Checkpoint Pause (Temporal Signal)',
      agent: 'Human Reviewer',
      status: 'waiting_for_approval',
      deliverable: 'Human decision gate: approve, replan directive, or abort.',
    },
    {
      id: 't-6',
      title: 'Gemma 4 Report Synthesis & Dossier Export',
      agent: 'Report Synthesizer',
      status: 'pending',
      deliverable: 'Publication-grade markdown report saved to /files/.',
    },
  ];

  const handleReplanSubmit = () => {
    if (!replanDirective.trim()) return;
    onReplan(replanDirective.trim());
  };

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100%',
        background: 'var(--bg-base, #090a09)',
        color: 'var(--text-primary, #f0f0e9)',
        fontFamily: 'var(--font-mono, monospace)',
        padding: '36px 40px 60px',
        overflowY: 'auto',
      }}
    >
      {/* Top Breadcrumb */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '11px',
          color: 'var(--text-secondary, #A7A7A0)',
          borderBottom: '1px solid var(--border-color, #343730)',
          paddingBottom: '16px',
          marginBottom: '28px',
        }}
      >
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span>01 / LANDING</span>
          <span>→</span>
          <span>02 / SCOPING</span>
          <span>→</span>
          <span style={{ color: 'var(--accent-lime, #c8f169)', fontWeight: 700 }}>
            03 / PLAN GENERATION & HUMAN APPROVAL
          </span>
        </div>
        <span style={{ color: 'var(--accent-lime, #c8f169)' }}>
          TEMPORAL SIGNAL CHECKPOINT READY
        </span>
      </div>

      {/* Main Title */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ fontSize: '11px', color: '#96988e', letterSpacing: '0.08em' }}>
          REVIEW SPECIFICATION / PRE-FLIGHT VERIFICATION
        </div>
        <h1
          className="pixel"
          style={{
            fontSize: 'clamp(36px, 4.4vw, 64px)',
            lineHeight: 0.95,
            letterSpacing: '-0.04em',
            margin: '12px 0 16px',
            fontWeight: 500,
          }}
        >
          RESEARCH PLAN READY
          <br />
          FOR APPROVAL.
        </h1>
        <p
          style={{
            maxWidth: '680px',
            fontSize: '12px',
            lineHeight: 1.8,
            color: 'var(--text-secondary, #A7A7A0)',
            margin: 0,
          }}
        >
          ACE has structured your question into a multi-agent execution brief. Review the proposed
          tasks, expected deliverables, and unresolved questions before the supervisor launches the
          investigation.
        </p>
      </div>

      {/* Grid: 2 Columns */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr 0.8fr',
          gap: '24px',
          marginBottom: '36px',
        }}
      >
        {/* Left Column: Brief & Tasks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Objective Box */}
          <div
            style={{
              border: '1px solid var(--border-color, #343730)',
              background: '#121411',
              padding: '20px',
            }}
          >
            <div
              style={{
                fontSize: '10px',
                color: 'var(--accent-lime, #c8f169)',
                fontWeight: 700,
                letterSpacing: '0.06em',
                marginBottom: '8px',
              }}
            >
              01 // RESEARCH OBJECTIVE
            </div>
            <div
              style={{
                fontSize: '15px',
                lineHeight: 1.6,
                color: 'var(--text-primary, #f0f0e9)',
                fontWeight: 500,
              }}
            >
              {objective}
            </div>
          </div>

          {/* Research Brief Box */}
          <div
            style={{
              border: '1px solid var(--border-color, #343730)',
              background: '#121411',
              padding: '20px',
            }}
          >
            <div
              style={{
                fontSize: '10px',
                color: 'var(--accent-lime, #c8f169)',
                fontWeight: 700,
                letterSpacing: '0.06em',
                marginBottom: '8px',
              }}
            >
              02 // STRUCTURED RESEARCH BRIEF
            </div>
            <div
              style={{
                fontSize: '12px',
                lineHeight: 1.8,
                color: 'var(--text-secondary, #A7A7A0)',
                whiteSpace: 'pre-wrap',
              }}
            >
              {brief}
            </div>
          </div>

          {/* Decomposed Task Breakdown */}
          <div
            style={{
              border: '1px solid var(--border-color, #343730)',
              background: '#121411',
              padding: '20px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
              }}
            >
              <div
                style={{
                  fontSize: '10px',
                  color: 'var(--accent-lime, #c8f169)',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                }}
              >
                03 // DECOMPOSED EXECUTION TASKS
              </div>
              <span style={{ fontSize: '10px', color: 'var(--text-secondary, #A7A7A0)' }}>
                6 WORKFLOW STAGES
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {defaultTasks.map((t, idx) => (
                <div
                  key={t.id}
                  style={{
                    padding: '12px 14px',
                    border: '1px solid var(--border-color, #343730)',
                    background: 'rgba(16, 17, 16, 0.6)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '12px',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '10px', color: 'var(--accent-lime, #c8f169)' }}>
                        [{idx + 1}]
                      </span>
                      <strong style={{ fontSize: '12px' }}>{t.title}</strong>
                    </div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: 'var(--text-secondary, #A7A7A0)',
                        marginTop: '4px',
                      }}
                    >
                      {t.deliverable}
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: '9px',
                      padding: '2px 6px',
                      border: '1px solid var(--border-color, #343730)',
                      color:
                        t.status === 'completed'
                          ? 'var(--accent-lime, #c8f169)'
                          : t.status === 'waiting_for_approval'
                          ? 'var(--accent-amber, #e7b567)'
                          : 'var(--text-secondary, #A7A7A0)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {t.agent}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Deliverables, Unresolved Questions, & Configuration */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Depth Selection */}
          <div
            style={{
              border: '1px solid var(--border-color, #343730)',
              background: '#121411',
              padding: '20px',
            }}
          >
            <div
              style={{
                fontSize: '10px',
                color: 'var(--accent-lime, #c8f169)',
                fontWeight: 700,
                letterSpacing: '0.06em',
                marginBottom: '12px',
              }}
            >
              INVESTIGATION DEPTH
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              {(['standard', 'deep', 'comprehensive'] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDepth(d)}
                  style={{
                    padding: '10px 8px',
                    border: '1px solid',
                    borderColor:
                      depth === d ? 'var(--accent-lime, #c8f169)' : 'var(--border-color, #343730)',
                    background: depth === d ? 'rgba(200, 241, 105, 0.12)' : 'transparent',
                    color: depth === d ? 'var(--accent-lime, #c8f169)' : 'var(--text-primary, #f0f0e9)',
                    fontSize: '10px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-mono, monospace)',
                  }}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Unresolved Questions */}
          <div
            style={{
              border: '1px solid var(--border-color, #343730)',
              background: '#121411',
              padding: '20px',
            }}
          >
            <div
              style={{
                fontSize: '10px',
                color: 'var(--accent-lime, #c8f169)',
                fontWeight: 700,
                letterSpacing: '0.06em',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <HelpCircle size={13} />
              <span>UNRESOLVED KNOWLEDGE GAPS (EXPLICIT TRACKING)</span>
            </div>
            <ul
              style={{
                margin: 0,
                paddingLeft: '18px',
                fontSize: '11px',
                lineHeight: 1.8,
                color: 'var(--text-secondary, #A7A7A0)',
              }}
            >
              <li>What are the core technical bottlenecks and benchmark trade-offs?</li>
              <li>What empirical metrics differentiate leading vs legacy approaches?</li>
              <li>What concrete architectural recommendations emerge from the search?</li>
            </ul>
          </div>

          {/* Expected Deliverables */}
          <div
            style={{
              border: '1px solid var(--border-color, #343730)',
              background: '#121411',
              padding: '20px',
            }}
          >
            <div
              style={{
                fontSize: '10px',
                color: 'var(--accent-lime, #c8f169)',
                fontWeight: 700,
                letterSpacing: '0.06em',
                marginBottom: '12px',
              }}
            >
              EXPECTED OUTPUTS
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={13} color="var(--accent-lime, #c8f169)" />
                <span>Executive Research Dossier (`report_&lt;id&gt;.md`)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={13} color="var(--accent-lime, #c8f169)" />
                <span>Deduplicated Evidence Bibliography with URLs</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={13} color="var(--accent-lime, #c8f169)" />
                <span>LangSmith Distributed Trace Run Tree</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={13} color="var(--accent-lime, #c8f169)" />
                <span>Temporal Replay-Safe State History</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Replanning Directive Input Drawer (if open) */}
      {replanOpen && (
        <div
          style={{
            border: '1px solid var(--accent-amber, #e7b567)',
            background: 'rgba(231, 181, 103, 0.08)',
            padding: '20px',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              fontSize: '10px',
              color: 'var(--accent-amber, #e7b567)',
              fontWeight: 700,
              letterSpacing: '0.06em',
              marginBottom: '8px',
            }}
          >
            INJECT REPLANNING DIRECTIVE (TEMPORAL SIGNAL)
          </div>
          <p
            style={{
              fontSize: '11px',
              color: 'var(--text-secondary, #A7A7A0)',
              marginBottom: '12px',
            }}
          >
            Provide specific guidance to re-orient the supervisor—e.g., "Prioritize peer-reviewed
            benchmarks and compare implementation complexity."
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={replanDirective}
              onChange={(e) => setReplanDirective(e.target.value)}
              placeholder="Enter replanning instructions for the supervisor agent..."
              style={{
                flex: 1,
                background: '#090a09',
                border: '1px solid var(--border-color, #343730)',
                color: 'var(--text-primary, #f0f0e9)',
                padding: '12px',
                fontSize: '11px',
                fontFamily: 'var(--font-mono, monospace)',
                outline: 'none',
              }}
            />
            <button
              onClick={handleReplanSubmit}
              disabled={!replanDirective.trim()}
              style={{
                background: 'var(--accent-amber, #e7b567)',
                color: '#090a09',
                border: 0,
                padding: '0 20px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: replanDirective.trim() ? 'pointer' : 'not-allowed',
                fontFamily: 'var(--font-mono, monospace)',
              }}
            >
              APPLY & EXECUTE
            </button>
          </div>
        </div>
      )}

      {/* Action Bar */}
      <div
        style={{
          borderTop: '1px solid var(--border-color, #343730)',
          paddingTop: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <button
          onClick={onEditScope}
          style={{
            background: 'transparent',
            border: '1px solid var(--border-color, #343730)',
            color: 'var(--text-secondary, #A7A7A0)',
            padding: '14px 20px',
            fontSize: '11px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontFamily: 'var(--font-mono, monospace)',
          }}
        >
          <Edit3 size={14} />
          <span>EDIT SCOPE (RETURN TO CHAT)</span>
        </button>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setReplanOpen(!replanOpen)}
            style={{
              background: 'transparent',
              border: '1px solid var(--accent-amber, #e7b567)',
              color: 'var(--accent-amber, #e7b567)',
              padding: '14px 22px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontFamily: 'var(--font-mono, monospace)',
            }}
          >
            <RotateCcw size={14} />
            <span>REQUEST REPLAN</span>
          </button>

          <button
            onClick={() => onApprove(objective, depth)}
            style={{
              background: 'var(--accent-lime, #c8f169)',
              color: '#090a09',
              border: '1px solid var(--accent-lime, #c8f169)',
              padding: '14px 28px',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.04em',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontFamily: 'var(--font-mono, monospace)',
            }}
          >
            <span>APPROVE PLAN & EXECUTE</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};
