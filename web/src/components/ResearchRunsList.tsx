import React from 'react';
import { History, ArrowRight, FileText, Bookmark, ExternalLink, Clock } from 'lucide-react';
import { ResearchRun } from '../types/research';

interface ResearchRunsListProps {
  runs: ResearchRun[];
  activeRunId: string;
  onSelectRun: (runId: string) => void;
  onViewReport: (runId: string) => void;
}

export const ResearchRunsList: React.FC<ResearchRunsListProps> = ({
  runs,
  activeRunId,
  onSelectRun,
  onViewReport,
}) => {
  return (
    <div style={{ maxWidth: '1040px', margin: '0 auto', padding: 'var(--space-xl) var(--space-lg)' }}>
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <History size={16} color="var(--accent-lime)" />
          <span className="text-meta" style={{ color: 'var(--accent-lime)' }}>
            WORKFLOW ARCHIVE // RESEARCH INVESTIGATIONS
          </span>
        </div>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
          Research Runs & Historical Executions
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
          Every completed and in-flight research mission executed by ACE, backed by Temporal event history
          and LangSmith trace attribution.
        </p>
      </div>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
        {runs.map((run) => {
          const isActive = run.runId === activeRunId;
          return (
            <div
              key={run.runId}
              className="border-hairline"
              style={{
                background: isActive ? 'var(--bg-panel)' : 'var(--bg-surface)',
                borderColor: isActive ? 'var(--accent-lime)' : 'var(--border-color)',
                padding: '16px 20px',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span className="mono-data" style={{ color: 'var(--accent-lime)', fontSize: '11px', fontWeight: 600 }}>
                    {run.runId}
                  </span>
                  <span style={{ color: 'var(--text-tertiary)' }}>•</span>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {run.title}
                  </span>
                  {isActive && (
                    <span className="status-pill running" style={{ fontSize: '9px' }}>
                      ACTIVE RUN
                    </span>
                  )}
                </div>

                <p
                  style={{
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.45,
                    marginBottom: '8px',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {run.researchTopic}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <span className="mono-data tabular" style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                    <Clock size={11} style={{ display: 'inline', marginRight: '3px' }} />
                    {run.startTime}
                  </span>
                  <span style={{ color: 'var(--text-tertiary)' }}>•</span>
                  <span className="text-meta" style={{ fontSize: '10px' }}>
                    {run.sources.length} SOURCES
                  </span>
                  <span style={{ color: 'var(--text-tertiary)' }}>•</span>
                  <span className="text-meta" style={{ fontSize: '10px' }}>
                    {run.stages.filter((s) => s.status === 'completed').length}/{run.stages.length} STAGES COMPLETED
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {run.finalReport && (
                  <button
                    onClick={() => onViewReport(run.runId)}
                    className="btn btn-secondary"
                    style={{ fontSize: '11px', padding: '5px 10px' }}
                  >
                    <FileText size={12} />
                    READ REPORT
                  </button>
                )}
                <button
                  onClick={() => onSelectRun(run.runId)}
                  className={`btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '11px', padding: '5px 12px' }}
                >
                  {isActive ? 'CURRENT RUN' : 'OPEN IN STUDIO'}
                  <ArrowRight size={12} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
