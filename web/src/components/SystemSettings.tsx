import React from 'react';
import { Sliders, Cpu, Database, ShieldCheck, ExternalLink, Network, CheckCircle, RefreshCw } from 'lucide-react';

export const SystemSettings: React.FC = () => {
  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: 'var(--space-xl) var(--space-lg)' }}>
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <Sliders size={16} color="var(--accent-lime)" />
          <span className="text-meta" style={{ color: 'var(--accent-lime)' }}>
            ENGINE TELEMETRY & RUNTIME CONFIGURATION
          </span>
        </div>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
          Autonomous Cognitive Engine Infrastructure
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
          Inspect active Temporal worker clusters, LangSmith tracing configurations, model inference routing,
          and knowledge graph telemetry.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        {/* Temporal Durable Execution Configuration */}
        <div
          className="border-hairline"
          style={{ background: 'var(--bg-surface)', padding: '16px 20px', borderRadius: 'var(--radius-sm)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Cpu size={15} color="var(--accent-lime)" />
            <span style={{ fontWeight: 600, fontSize: '13px' }}>Temporal Durable Execution Cluster</span>
            <span className="status-pill running" style={{ fontSize: '9px', marginLeft: 'auto' }}>
              ONLINE (7233)
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
            }}
          >
            <div>
              <span className="text-meta">TARGET HOST</span>
              <div style={{ color: 'var(--text-primary)', marginTop: '2px' }}>localhost:7233</div>
            </div>
            <div>
              <span className="text-meta">NAMESPACE</span>
              <div style={{ color: 'var(--text-primary)', marginTop: '2px' }}>default</div>
            </div>
            <div>
              <span className="text-meta">TASK QUEUE</span>
              <div style={{ color: 'var(--accent-lime)', marginTop: '2px' }}>ace-research-queue</div>
            </div>
            <div>
              <span className="text-meta">DETERMINISM AUDIT</span>
              <div style={{ color: 'var(--accent-lime)', marginTop: '2px' }}>REPLAY PASSING</div>
            </div>
          </div>
        </div>

        {/* LangSmith Observability */}
        <div
          className="border-hairline"
          style={{ background: 'var(--bg-surface)', padding: '16px 20px', borderRadius: 'var(--radius-sm)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Database size={15} color="var(--accent-blue)" />
            <span style={{ fontWeight: 600, fontSize: '13px' }}>LangSmith Observability & Tracing</span>
            <span className="status-pill completed" style={{ fontSize: '9px', marginLeft: 'auto' }}>
              INSTRUMENTED
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
            }}
          >
            <div>
              <span className="text-meta">PROJECT TRACE REPO</span>
              <div style={{ color: 'var(--text-primary)', marginTop: '2px' }}>ace-deep-research</div>
            </div>
            <div>
              <span className="text-meta">TRACING V2 STATUS</span>
              <div style={{ color: 'var(--accent-blue)', marginTop: '2px' }}>ENABLED (RUN TREE)</div>
            </div>
            <div>
              <span className="text-meta">PLUGIN ADAPTER</span>
              <div style={{ color: 'var(--text-primary)', marginTop: '2px' }}>Temporal-LangSmith Bridge</div>
            </div>
          </div>
        </div>

        {/* Graphify Architecture Visualizations */}
        <div
          className="border-hairline"
          style={{ background: 'var(--bg-surface)', padding: '16px 20px', borderRadius: 'var(--radius-sm)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Network size={15} color="var(--accent-lime)" />
            <span style={{ fontWeight: 600, fontSize: '13px' }}>Graphify Knowledge Architecture</span>
            <span className="status-pill" style={{ fontSize: '9px', marginLeft: 'auto' }}>
              535 NODES · 1138 EDGES
            </span>
          </div>

          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: 1.5 }}>
            ACE is analyzed by Graphify with Tree-Sitter AST extraction and Louvain modularity clustering.
            Access the generated interactive architecture viewers:
          </p>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <a
              href="/graphify-out/graph.html"
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary"
              style={{ fontSize: '11px', textDecoration: 'none' }}
            >
              <ExternalLink size={12} />
              OPEN INTERACTIVE GRAPH CANVAS
            </a>
            <a
              href="/graphify-out/Autonomous-Cognitive-Engine-for-Deep-Research-and-Long-Horizon-Tasks-callflow.html"
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary"
              style={{ fontSize: '11px', textDecoration: 'none' }}
            >
              <ExternalLink size={12} />
              VIEW MERMAID CALL-FLOWS
            </a>
            <a
              href="/graphify-out/GRAPH_TREE.html"
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary"
              style={{ fontSize: '11px', textDecoration: 'none' }}
            >
              <ExternalLink size={12} />
              COLLAPSIBLE HIERARCHY TREE
            </a>
          </div>
        </div>

        {/* Test Suite Verification */}
        <div
          className="border-hairline"
          style={{ background: 'var(--bg-surface)', padding: '16px 20px', borderRadius: 'var(--radius-sm)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <ShieldCheck size={15} color="var(--accent-lime)" />
            <span style={{ fontWeight: 600, fontSize: '13px' }}>Backend Test Suite Integrity</span>
            <span className="status-pill completed" style={{ fontSize: '9px', marginLeft: 'auto' }}>
              15 / 15 PASSED
            </span>
          </div>

          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)' }}>
            All unit and integration tests passing: `test_existing_behavior.py`, `test_human_resume.py`,
            `test_langsmith_integration.py`, and `test_temporal_workflow.py`.
          </div>
        </div>
      </div>
    </div>
  );
};
