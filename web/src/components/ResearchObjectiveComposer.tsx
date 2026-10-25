import React, { useState } from 'react';
import { Send, Sparkles, BookOpen, Clock, ShieldCheck, Compass, ArrowRight } from 'lucide-react';
import { ResearchPreset } from '../types/research';

interface ResearchObjectiveComposerProps {
  onSubmit: (topic: string, depth: string, enableTracing: boolean, autoApprove: boolean) => void;
  isLoading: boolean;
}

const PRESETS: ResearchPreset[] = [
  {
    id: 'memory-reliability',
    title: 'Persistent Memory in Autonomous Agents',
    topic:
      'Investigate how persistent memory architectures affect the reliability of autonomous AI agents. Compare major approaches, evidence, limitations, and implementation trade-offs. Recommend an architecture for a research agent that must run for several hours.',
    depth: 'deep',
    estimatedDuration: '4-8 min',
    recommendedAgents: ['Supervisor Agent', 'Research Specialist', 'Context Compressor'],
  },
  {
    id: 'sf-coffee-roasters',
    title: 'San Francisco Specialty Coffee Sourcing',
    topic:
      'Comprehensive market & quality analysis of San Francisco specialty coffee roasters: evaluate sourcing transparency, single-origin offerings, roasting philosophies, and direct-trade sustainability metrics.',
    depth: 'standard',
    estimatedDuration: '3-5 min',
    recommendedAgents: ['Market Researcher', 'Synthesis Agent'],
  },
  {
    id: 'temporal-durability',
    title: 'Temporal Durable Execution vs Message Queues',
    topic:
      'Evaluate Temporal durable execution patterns versus traditional queue-based worker architectures (Celery, BullMQ, SQS) for long-horizon multi-agent workflows. Analyze state replay, determinism constraints, and human-in-the-loop signal handling.',
    depth: 'comprehensive',
    estimatedDuration: '6-10 min',
    recommendedAgents: ['Systems Architect', 'Temporal Specialist', 'Audit Synthesizer'],
  },
];

export const ResearchObjectiveComposer: React.FC<ResearchObjectiveComposerProps> = ({
  onSubmit,
  isLoading,
}) => {
  const [topic, setTopic] = useState('');
  const [depth, setDepth] = useState<'standard' | 'deep' | 'comprehensive'>('deep');
  const [enableTracing, setEnableTracing] = useState(true);
  const [autoApprove, setAutoApprove] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    onSubmit(topic.trim(), depth, enableTracing, autoApprove);
  };

  const handleSelectPreset = (preset: ResearchPreset) => {
    setTopic(preset.topic);
    setDepth(preset.depth);
  };

  return (
    <div
      style={{
        maxWidth: '840px',
        margin: '0 auto',
        padding: 'var(--space-2xl) var(--space-lg)',
      }}
    >
      {/* Header Banner */}
      <div style={{ marginBottom: 'var(--space-xl)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Compass size={16} color="var(--accent-lime)" />
          <span className="text-meta" style={{ color: 'var(--accent-lime)' }}>
            AUTONOMOUS COGNITIVE ENGINE // MISSION INITIALIZATION
          </span>
        </div>
        <h1
          style={{
            fontSize: '24px',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: 'var(--text-primary)',
            marginBottom: '8px',
          }}
        >
          Formulate Research Objective
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.6 }}>
          Define an investigation objective for the multi-agent cognitive hierarchy. ACE will
          clarify scope, construct a research brief, dispatch specialized researchers, gather web and
          document evidence, pause for human approval, and synthesize an audit-grade report.
        </p>
      </div>

      {/* Main Composer Form */}
      <form
        onSubmit={handleSubmit}
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-sm)',
          padding: 'var(--space-lg)',
          marginBottom: 'var(--space-2xl)',
        }}
      >
        <div style={{ marginBottom: 'var(--space-md)' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '6px',
            }}
          >
            <label className="text-meta" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
              RESEARCH PROBLEM STATEMENT & SCOPE
            </label>
            <span className="mono-data" style={{ color: 'var(--text-tertiary)', fontSize: '11px' }}>
              {topic.length} characters
            </span>
          </div>

          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Investigate the scalability and failure recovery mechanisms of distributed multi-agent systems when performing deep scientific research..."
            rows={5}
            required
            style={{
              width: '100%',
              background: 'var(--bg-base)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-sans)',
              fontSize: '13px',
              lineHeight: 1.6,
              padding: '12px',
              borderRadius: 'var(--radius-sm)',
              outline: 'none',
              resize: 'vertical',
            }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--accent-lime)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--border-color)')}
          />
        </div>

        {/* Configuration Bar */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 'var(--space-md)',
            paddingTop: 'var(--space-md)',
            borderTop: '1px solid var(--border-color)',
            marginBottom: 'var(--space-lg)',
          }}
        >
          {/* Investigation Depth */}
          <div>
            <label className="text-meta" style={{ display: 'block', marginBottom: '6px' }}>
              INVESTIGATION DEPTH
            </label>
            <div style={{ display: 'flex', gap: '4px' }}>
              {(['standard', 'deep', 'comprehensive'] as const).map((d) => (
                <button
                  type="button"
                  key={d}
                  onClick={() => setDepth(d)}
                  className={`btn ${depth === d ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, padding: '4px 6px', fontSize: '10px' }}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Human Checkpoint */}
          <div>
            <label className="text-meta" style={{ display: 'block', marginBottom: '6px' }}>
              HUMAN APPROVAL GATE
            </label>
            <button
              type="button"
              onClick={() => setAutoApprove(!autoApprove)}
              className="btn btn-secondary"
              style={{
                width: '100%',
                padding: '5px 8px',
                fontSize: '10px',
                borderColor: !autoApprove ? 'var(--accent-lime)' : 'var(--border-color)',
                color: !autoApprove ? 'var(--accent-lime)' : 'var(--text-secondary)',
              }}
            >
              {!autoApprove ? 'PAUSE FOR HUMAN APPROVAL' : 'AUTO-APPROVE PLAN'}
            </button>
          </div>

          {/* LangSmith Tracing */}
          <div>
            <label className="text-meta" style={{ display: 'block', marginBottom: '6px' }}>
              OBSERVABILITY
            </label>
            <button
              type="button"
              onClick={() => setEnableTracing(!enableTracing)}
              className="btn btn-secondary"
              style={{
                width: '100%',
                padding: '5px 8px',
                fontSize: '10px',
                borderColor: enableTracing ? 'var(--accent-blue)' : 'var(--border-color)',
                color: enableTracing ? 'var(--accent-blue)' : 'var(--text-secondary)',
              }}
            >
              <ShieldCheck size={12} />
              {enableTracing ? 'LANGSMITH TRACING ON' : 'TRACING OFF'}
            </button>
          </div>
        </div>

        {/* Submit Action */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px' }}>
          <span className="text-meta" style={{ fontSize: '10px' }}>
            DURABLE ENGINE: TEMPORAL + GEMMA / GEMINI
          </span>
          <button
            type="submit"
            disabled={isLoading || !topic.trim()}
            className="btn btn-primary"
            style={{ padding: '8px 20px', fontSize: '12px' }}
          >
            {isLoading ? (
              <span className="terminal-cursor">DISPATCHING WORKFLOW</span>
            ) : (
              <>
                <Send size={13} />
                INITIALIZE RESEARCH MISSION
              </>
            )}
          </button>
        </div>
      </form>

      {/* Curated Presets / Benchmark Scenarios */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
          <Sparkles size={14} color="var(--accent-lime)" />
          <span className="text-meta" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
            CURATED BENCHMARK OBJECTIVES
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          {PRESETS.map((preset) => (
            <div
              key={preset.id}
              onClick={() => handleSelectPreset(preset)}
              className="border-hairline"
              style={{
                background: 'var(--bg-surface)',
                padding: '12px 16px',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                transition: 'border-color var(--dur-fast) var(--ease-mechanical), transform var(--dur-fast)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-lime)';
                e.currentTarget.style.transform = 'translateX(2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.transform = 'none';
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '4px',
                }}
              >
                <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
                  {preset.title}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="status-pill" style={{ fontSize: '9px' }}>
                    {preset.depth}
                  </span>
                  <span className="mono-data" style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>
                    <Clock size={10} style={{ display: 'inline', marginRight: '3px' }} />
                    {preset.estimatedDuration}
                  </span>
                  <ArrowRight size={13} color="var(--accent-lime)" />
                </div>
              </div>
              <p
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '12px',
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                {preset.topic}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
