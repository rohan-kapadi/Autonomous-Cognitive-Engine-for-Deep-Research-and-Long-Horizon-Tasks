import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Copy, Check, Pause, Play, Trash2, X, ChevronUp, ChevronDown } from 'lucide-react';
import { LogEvent } from '../types/research';

interface ExecutionActivityDrawerProps {
  events: LogEvent[];
  isOpen: boolean;
  onClose: () => void;
  onClear: () => void;
}

export const ExecutionActivityDrawer: React.FC<ExecutionActivityDrawerProps> = ({
  events,
  isOpen,
  onClose,
  onClear,
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const logContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [events, autoScroll]);

  if (!isOpen) return null;

  const filteredEvents =
    filterCategory === 'ALL'
      ? events
      : events.filter((e) => e.category === filterCategory);

  const handleCopyLogs = () => {
    const text = filteredEvents
      .map((e) => `[${e.timestamp}] [${e.level}] [${e.category}] ${e.message}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'EXEC':
        return 'var(--accent-lime)';
      case 'WARN':
        return 'var(--accent-amber)';
      case 'ERROR':
        return 'var(--accent-red)';
      case 'TRACE':
        return 'var(--accent-blue)';
      case 'INFO':
      default:
        return 'var(--text-secondary)';
    }
  };

  return (
    <div
      style={{
        height: 'var(--drawer-height)',
        background: 'var(--bg-base)',
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 45,
        position: 'relative',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.5)',
      }}
    >
      {/* Drawer Control Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 14px',
          background: 'var(--bg-panel)',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Terminal size={13} color="var(--accent-lime)" />
            <span className="text-meta" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
              EXECUTION EVENT STREAM ({filteredEvents.length})
            </span>
          </div>

          <div style={{ width: '1px', height: '12px', background: 'var(--border-color)' }} />

          {/* Category Filter Pills */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {(['ALL', 'WORKFLOW', 'AGENT', 'SEARCH', 'APPROVAL', 'ERROR'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                style={{
                  background: filterCategory === cat ? 'var(--bg-surface)' : 'transparent',
                  border: filterCategory === cat ? '1px solid var(--border-active)' : '1px solid transparent',
                  color: filterCategory === cat ? 'var(--accent-lime)' : 'var(--text-tertiary)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '9px',
                  padding: '2px 6px',
                  borderRadius: 'var(--radius-xs)',
                  cursor: 'pointer',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className="btn btn-secondary"
            style={{ padding: '2px 6px', fontSize: '10px' }}
            title={autoScroll ? 'Pause Auto-Scroll' : 'Resume Auto-Scroll'}
          >
            {autoScroll ? <Pause size={10} /> : <Play size={10} />}
            {autoScroll ? 'AUTO-SCROLL' : 'PAUSED'}
          </button>

          <button
            onClick={handleCopyLogs}
            className="btn btn-secondary"
            style={{ padding: '2px 6px', fontSize: '10px' }}
          >
            {copied ? <Check size={10} /> : <Copy size={10} />}
            {copied ? 'COPIED' : 'COPY'}
          </button>

          <button
            onClick={onClear}
            className="btn btn-icon btn-secondary"
            style={{ padding: '3px' }}
            title="Clear Stream"
          >
            <Trash2 size={11} />
          </button>

          <button
            onClick={onClose}
            className="btn btn-icon btn-secondary"
            style={{ padding: '3px' }}
            title="Close Drawer"
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Log Rows Container */}
      <div
        ref={logContainerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px 14px',
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          lineHeight: 1.5,
          color: 'var(--text-primary)',
        }}
      >
        {filteredEvents.map((event) => (
          <div
            key={event.id}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '2px 0',
              borderBottom: '1px solid rgba(255,255,255,0.02)',
            }}
          >
            <span className="mono-data tabular" style={{ color: 'var(--text-tertiary)', fontSize: '10px', flexShrink: 0 }}>
              {event.timestamp}
            </span>
            <span
              style={{
                color: getLevelColor(event.level),
                fontWeight: 600,
                fontSize: '9px',
                width: '40px',
                flexShrink: 0,
              }}
            >
              [{event.level}]
            </span>
            <span
              style={{
                color: 'var(--text-tertiary)',
                fontSize: '9px',
                width: '74px',
                flexShrink: 0,
              }}
            >
              {event.category}
            </span>
            <span style={{ color: 'var(--text-primary)', wordBreak: 'break-word', flex: 1 }}>
              {event.message}
            </span>
          </div>
        ))}
        {filteredEvents.length === 0 && (
          <div style={{ color: 'var(--text-tertiary)', fontStyle: 'italic', padding: '12px 0' }}>
            No log events recorded matching the selected filter.
          </div>
        )}
      </div>
    </div>
  );
};
