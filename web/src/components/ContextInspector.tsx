import React, { useState } from 'react';
import { X, ExternalLink, Copy, Check, Terminal, Cpu, Database, FileText, ArrowRight } from 'lucide-react';
import { WorkflowStage, TaskItem, SourceItem, CognitiveStateSnapshot } from '../types/research';

interface ContextInspectorProps {
  stage: WorkflowStage | null;
  tasks: TaskItem[];
  sources: SourceItem[];
  cognitiveState: CognitiveStateSnapshot;
  onClose: () => void;
  onOpenSource: (source: SourceItem) => void;
}

export const ContextInspector: React.FC<ContextInspectorProps> = ({
  stage,
  tasks,
  sources,
  cognitiveState,
  onClose,
  onOpenSource,
}) => {
  const [activeTab, setActiveTab] = useState<'task' | 'agent' | 'sources' | 'state'>('task');
  const [copied, setCopied] = useState(false);

  if (!stage) return null;

  const stageTasks = tasks.filter((t) => t.stageId === stage.id);
  const stageSources = sources.filter((s) => s.taskId === stage.id || stage.id === 'evidence');

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        width: 'var(--inspector-width)',
        minWidth: '320px',
        height: '100%',
        background: 'var(--bg-surface)',
        borderLeft: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 30,
      }}
    >
      {/* Inspector Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-panel)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="font-mono tabular" style={{ color: 'var(--accent-lime)', fontSize: '11px' }}>
            STAGE {stage.stepNumber}
          </span>
          <span style={{ fontWeight: 600, fontSize: '12px', color: 'var(--text-primary)' }}>
            {stage.title}
          </span>
        </div>
        <button onClick={onClose} className="btn btn-icon btn-secondary" style={{ padding: '3px' }}>
          <X size={13} />
        </button>
      </div>

      {/* Tab Selectors */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-surface)',
        }}
      >
        {(['task', 'agent', 'sources', 'state'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: '8px 0',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid var(--accent-lime)' : '2px solid transparent',
              color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              cursor: 'pointer',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Inspector Content Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px' }}>
        {/* TAB 1: TASK DETAILS */}
        {activeTab === 'task' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <span className="text-meta">EXECUTION SCOPE</span>
              <p style={{ marginTop: '4px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {stage.description}
              </p>
            </div>

            <div
              className="border-hairline"
              style={{
                background: 'var(--bg-base)',
                padding: '10px',
                borderRadius: 'var(--radius-xs)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span className="text-meta">NODE IDENTIFIER</span>
                <span className="mono-data" style={{ color: 'var(--accent-lime)', fontSize: '11px' }}>
                  {stage.nodeKey}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span className="text-meta">ASSIGNED ROLE</span>
                <span className="mono-data" style={{ color: 'var(--text-primary)', fontSize: '11px' }}>
                  {stage.agent}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-meta">STAGE STATUS</span>
                <span className="mono-data" style={{ color: 'var(--accent-lime)', fontSize: '11px' }}>
                  {stage.status.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Sub-tasks */}
            <div>
              <span className="text-meta" style={{ display: 'block', marginBottom: '8px' }}>
                SUB-TASKS EXECUTED ({stageTasks.length})
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {stageTasks.length > 0 ? (
                  stageTasks.map((task) => (
                    <div
                      key={task.id}
                      className="border-hairline"
                      style={{
                        background: 'var(--bg-panel)',
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-xs)',
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
                        <span style={{ fontSize: '12px', fontWeight: 600 }}>{task.title}</span>
                        <span className="status-pill completed" style={{ fontSize: '9px' }}>
                          DONE
                        </span>
                      </div>
                      <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                        {task.summary}
                      </p>
                      {task.outputExcerpt && (
                        <div
                          style={{
                            marginTop: '6px',
                            padding: '6px',
                            background: 'var(--bg-base)',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '10px',
                            color: 'var(--text-tertiary)',
                            borderRadius: 'var(--radius-xs)',
                          }}
                        >
                          {task.outputExcerpt}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div style={{ color: 'var(--text-tertiary)', fontStyle: 'italic', fontSize: '11px' }}>
                    No specialized sub-tasks registered for this stage.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: AGENT SPECIFICATION */}
        {activeTab === 'agent' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cpu size={16} color="var(--accent-lime)" />
              <div>
                <span className="text-meta">ACTIVE REASONING AGENT</span>
                <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
                  {stage.agent}
                </div>
              </div>
            </div>

            <div
              className="border-hairline"
              style={{
                background: 'var(--bg-base)',
                padding: '10px',
                borderRadius: 'var(--radius-xs)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span className="text-meta">MODEL ENGINE</span>
                <span className="mono-data" style={{ color: 'var(--accent-lime)', fontSize: '11px' }}>
                  {cognitiveState.activeModel}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span className="text-meta">STATE REPLAY DETERMINISM</span>
                <span className="mono-data" style={{ color: 'var(--accent-lime)', fontSize: '11px' }}>
                  TEMPORAL VERIFIED
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="text-meta">TOKENS PROCESSED</span>
                <span className="mono-data tabular" style={{ color: 'var(--text-primary)', fontSize: '11px' }}>
                  {cognitiveState.tokensProcessed.toLocaleString()} tokens
                </span>
              </div>
            </div>

            <div>
              <span className="text-meta">AVAILABLE SPECIALIST TOOLS</span>
              <div style={{ marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {['tavily_search', 'extract_text_content', 'compress_research', 'save_report'].map(
                  (tool) => (
                    <span
                      key={tool}
                      className="border-hairline"
                      style={{
                        padding: '2px 6px',
                        fontSize: '10px',
                        fontFamily: 'var(--font-mono)',
                        background: 'var(--bg-panel)',
                        color: 'var(--accent-lime)',
                        borderRadius: 'var(--radius-xs)',
                      }}
                    >
                      {tool}()
                    </span>
                  )
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SOURCES & CITATIONS */}
        {activeTab === 'sources' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="text-meta">EVIDENCE RECORDS ({stageSources.length})</span>
            </div>

            {stageSources.length > 0 ? (
              stageSources.map((source) => (
                <div
                  key={source.id}
                  onClick={() => onOpenSource(source)}
                  className="border-hairline"
                  style={{
                    background: 'var(--bg-base)',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-xs)',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent-lime)')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '4px',
                    }}
                  >
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {source.title}
                    </span>
                    <ExternalLink size={11} color="var(--accent-lime)" />
                  </div>
                  <span className="mono-data" style={{ fontSize: '10px', color: 'var(--accent-lime)' }}>
                    {source.domain}
                  </span>
                  <p
                    style={{
                      marginTop: '4px',
                      fontSize: '11px',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.4,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    "{source.excerpt}"
                  </p>
                </div>
              ))
            ) : (
              <div style={{ color: 'var(--text-tertiary)', fontStyle: 'italic', fontSize: '11px' }}>
                No external sources associated with this specific stage.
              </div>
            )}
          </div>
        )}

        {/* TAB 4: COGNITIVE STATE SNAPSHOT */}
        {activeTab === 'state' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="text-meta">AGENTSTATE CHECKPOINT</span>
              <button
                onClick={() => handleCopy(JSON.stringify(cognitiveState, null, 2))}
                className="btn btn-secondary"
                style={{ padding: '2px 6px', fontSize: '10px' }}
              >
                {copied ? <Check size={11} /> : <Copy size={11} />}
                {copied ? 'COPIED' : 'COPY'}
              </button>
            </div>

            <pre
              style={{
                background: 'var(--bg-base)',
                padding: '10px',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-xs)',
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                color: 'var(--accent-lime)',
                lineHeight: 1.45,
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
                maxHeight: '380px',
              }}
            >
              {JSON.stringify(cognitiveState, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
