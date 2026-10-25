import React from 'react';
import {
  Compass,
  FileSearch,
  Users,
  Cpu,
  UserCheck,
  FileCheck2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Play,
  RotateCcw,
} from 'lucide-react';
import { WorkflowStage, StageStatus } from '../types/research';

interface WorkflowCanvasProps {
  stages: WorkflowStage[];
  selectedStageId: string | null;
  onSelectStage: (id: string) => void;
  isApprovalRequired: boolean;
  onOpenApproval: () => void;
}

const STAGE_ICONS: Record<string, React.ElementType> = {
  scoping: Compass,
  planning: Users,
  evidence: FileSearch,
  compression: Cpu,
  approval: UserCheck,
  report: FileCheck2,
};

export const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({
  stages,
  selectedStageId,
  onSelectStage,
  isApprovalRequired,
  onOpenApproval,
}) => {
  const getStatusIcon = (status: StageStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 size={13} color="var(--accent-lime)" />;
      case 'running':
        return <span className="status-pill running" style={{ padding: '1px 5px', fontSize: '9px' }}>RUNNING</span>;
      case 'waiting_for_human':
        return <AlertTriangle size={13} color="var(--accent-amber)" />;
      case 'pending':
      default:
        return <Clock size={13} color="var(--text-tertiary)" />;
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-lg)',
        padding: 'var(--space-lg)',
        width: '100%',
      }}
    >
      {/* Visual Canvas Subheader */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="text-meta">COGNITIVE STAGE FLOW</span>
          <span className="mono-data" style={{ color: 'var(--text-tertiary)', fontSize: '11px' }}>
            [LANGGRAPH DIRECTED ACYCLIC GRAPH]
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="mono-data" style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>
            STATUS:
          </span>
          {isApprovalRequired ? (
            <button
              onClick={onOpenApproval}
              className="btn btn-amber"
              style={{ padding: '3px 8px', fontSize: '10px', animation: 'pulse-dot 1s infinite alternate' }}
            >
              ⚠ ACTION REQUIRED: APPROVAL
            </button>
          ) : (
            <span className="mono-data" style={{ fontSize: '11px', color: 'var(--accent-lime)' }}>
              AUTONOMOUS EXECUTION
            </span>
          )}
        </div>
      </div>

      {/* Connected Stage Nodes Pipeline */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 'var(--space-md)',
          position: 'relative',
        }}
      >
        {stages.map((stage, idx) => {
          const Icon = STAGE_ICONS[stage.id] || Compass;
          const isSelected = selectedStageId === stage.id;
          const isWaiting = stage.status === 'waiting_for_human';
          const isRunning = stage.status === 'running';
          const isCompleted = stage.status === 'completed';

          return (
            <div
              key={stage.id}
              onClick={() => onSelectStage(stage.id)}
              className="border-hairline"
              style={{
                background: isSelected ? 'var(--bg-panel)' : 'var(--bg-surface)',
                borderColor: isWaiting
                  ? 'var(--accent-amber)'
                  : isSelected
                  ? 'var(--accent-lime)'
                  : isRunning
                  ? 'var(--accent-lime-border)'
                  : 'var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                padding: 'var(--space-md)',
                cursor: 'pointer',
                position: 'relative',
                boxShadow: isSelected ? '0 0 0 1px var(--accent-lime)' : 'none',
                transition: 'all var(--dur-fast) var(--ease-mechanical)',
              }}
            >
              {/* Top Step Number & Status */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    className="font-mono tabular"
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: isSelected ? 'var(--accent-lime)' : 'var(--text-tertiary)',
                    }}
                  >
                    STAGE {stage.stepNumber}
                  </span>
                  {idx < stages.length - 1 && (
                    <span style={{ color: 'var(--text-tertiary)', fontSize: '10px' }}>→</span>
                  )}
                </div>
                <div>{getStatusIcon(stage.status)}</div>
              </div>

              {/* Title & Icon */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <Icon
                  size={16}
                  color={
                    isWaiting
                      ? 'var(--accent-amber)'
                      : isRunning || isSelected
                      ? 'var(--accent-lime)'
                      : 'var(--text-secondary)'
                  }
                />
                <h3
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: isSelected ? 'var(--text-primary)' : 'var(--text-primary)',
                  }}
                >
                  {stage.title}
                </h3>
              </div>

              {/* Description */}
              <p
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '11px',
                  lineHeight: 1.45,
                  marginBottom: '10px',
                  minHeight: '32px',
                }}
              >
                {stage.description}
              </p>

              {/* Footer Meta: Agent & Duration */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '6px',
                  borderTop: '1px solid var(--border-subtle)',
                }}
              >
                <span className="text-meta" style={{ fontSize: '9px', color: 'var(--text-tertiary)' }}>
                  {stage.agent}
                </span>
                {stage.duration && (
                  <span className="mono-data" style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                    {stage.duration}
                  </span>
                )}
              </div>

              {/* Approval Interruption Action Button */}
              {isWaiting && (
                <div style={{ marginTop: '8px' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenApproval();
                    }}
                    className="btn btn-amber"
                    style={{ width: '100%', fontSize: '10px', padding: '4px' }}
                  >
                    REVIEW & APPROVE PLAN
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
