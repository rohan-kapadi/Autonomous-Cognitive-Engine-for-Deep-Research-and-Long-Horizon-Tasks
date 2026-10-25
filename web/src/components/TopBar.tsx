import { Terminal, Activity, Sparkles, Sun, Moon, Cpu, Database, Compass, Layers, FileCheck } from 'lucide-react';
import { WorkflowStatus } from '../types/research';
import { ActiveView } from './NavigationSidebar';

interface TopBarProps {
  runId: string;
  status: WorkflowStatus;
  isApprovalRequired: boolean;
  onToggleDrawer: () => void;
  isDrawerOpen: boolean;
  onToggleTextmode: () => void;
  isTextmodeOpen: boolean;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  activeView?: ActiveView;
  onNavigateView?: (view: ActiveView) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  runId,
  status,
  isApprovalRequired,
  onToggleDrawer,
  isDrawerOpen,
  onToggleTextmode,
  isTextmodeOpen,
  theme,
  onToggleTheme,
  activeView,
  onNavigateView,
}) => {
  const getStatusBadge = () => {
    if (isApprovalRequired) {
      return <span className="status-pill waiting">⚠ WAITING FOR APPROVAL</span>;
    }
    switch (status) {
      case 'scoping':
      case 'planning':
      case 'researching':
      case 'compressing':
        return <span className="status-pill running">● {status.toUpperCase()}</span>;
      case 'completed':
        return <span className="status-pill completed">✓ COMPLETED</span>;
      case 'failed':
        return <span className="status-pill failed">✕ FAILED</span>;
      case 'idle':
      default:
        return <span className="status-pill">STANDBY</span>;
    }
  };

  return (
    <header
      style={{
        height: 'var(--topbar-height)',
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 var(--space-lg)',
        zIndex: 50,
        position: 'relative',
      }}
    >
      {/* Brand & Workspace ID */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '18px',
              height: '18px',
              backgroundColor: 'var(--accent-lime)',
              color: 'var(--bg-base)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              borderRadius: 'var(--radius-xs)',
            }}
          >
            ▲
          </div>
          <span
            className="font-mono"
            style={{
              fontSize: '13px',
              fontWeight: 700,
              letterSpacing: '0.04em',
              color: 'var(--text-primary)',
            }}
          >
            ACE <span style={{ color: 'var(--text-tertiary)' }}>//</span> RESEARCH STUDIO
          </span>
        </div>

        <div style={{ width: '1px', height: '16px', background: 'var(--border-color)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="text-meta" style={{ color: 'var(--text-tertiary)' }}>
            RUN:
          </span>
          <span className="mono-data" style={{ color: 'var(--accent-lime)', fontSize: '11px' }}>
            {runId}
          </span>
        </div>

        <div>{getStatusBadge()}</div>
      </div>

      {/* Middle Stage Navigation Shortcuts */}
      {onNavigateView && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            onClick={() => onNavigateView('landing')}
            className={`btn ${activeView === 'landing' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '3px 8px', fontSize: '10px' }}
            title="Stage 01: Landing Page"
          >
            01 / LANDING
          </button>
          <button
            onClick={() => onNavigateView('chat')}
            className={`btn ${activeView === 'chat' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '3px 8px', fontSize: '10px' }}
            title="Stage 02: AI Scoping Assistant"
          >
            02 / SCOPING
          </button>
          <button
            onClick={() => onNavigateView('plan')}
            className={`btn ${activeView === 'plan' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '3px 8px', fontSize: '10px' }}
            title="Stage 03: Plan Review"
          >
            03 / PLAN
          </button>
          <button
            onClick={() => onNavigateView('studio')}
            className={`btn ${activeView === 'studio' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '3px 8px', fontSize: '10px' }}
            title="Stage 04: Research Studio"
          >
            04 / STUDIO
          </button>
          <button
            onClick={() => onNavigateView('reports')}
            className={`btn ${activeView === 'reports' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '3px 8px', fontSize: '10px' }}
            title="Stage 05: Final Report"
          >
            05 / REPORT
          </button>
        </div>
      )}

      {/* Telemetry & Action Toggles */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
        {/* Backend State Indicator */}
        <div
          className="border-hairline"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '3px 8px',
            background: 'var(--bg-base)',
            borderRadius: 'var(--radius-xs)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Cpu size={11} color="var(--accent-lime)" />
            <span className="text-meta" style={{ fontSize: '10px' }}>
              TEMPORAL: <span style={{ color: 'var(--accent-lime)' }}>LIVE</span>
            </span>
          </div>
          <div style={{ width: '1px', height: '10px', background: 'var(--border-color)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Database size={11} color="var(--accent-blue)" />
            <span className="text-meta" style={{ fontSize: '10px' }}>
              LANGSMITH: <span style={{ color: 'var(--accent-blue)' }}>TRACE</span>
            </span>
          </div>
        </div>

        {/* Textmode Overlay Toggle */}
        <button
          onClick={onToggleTextmode}
          className={`btn btn-secondary ${isTextmodeOpen ? 'btn-primary' : ''}`}
          style={{ padding: '4px 8px', fontSize: '10px' }}
          title="Toggle Textmode ASCII Canvas"
        >
          <Sparkles size={12} />
          TEXTMODE
        </button>

        {/* Console Log Drawer Toggle */}
        <button
          onClick={onToggleDrawer}
          className={`btn btn-secondary ${isDrawerOpen ? 'btn-primary' : ''}`}
          style={{ padding: '4px 8px', fontSize: '10px' }}
          title="Toggle Event Log Console"
        >
          <Terminal size={12} />
          CONSOLE
        </button>

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className="btn btn-icon btn-secondary"
          title="Toggle Theme"
          style={{ padding: '5px' }}
        >
          {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
        </button>
      </div>
    </header>
  );
};
