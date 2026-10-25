import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, RotateCcw, X, ShieldAlert, Sparkles, Send } from 'lucide-react';
import { ResearchBrief } from '../types/research';

interface ApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  brief: ResearchBrief | null;
  onApprove: () => void;
  onReplan: (feedbackDirective: string) => void;
  isLoading: boolean;
}

export const ApprovalModal: React.FC<ApprovalModalProps> = ({
  isOpen,
  onClose,
  brief,
  onApprove,
  onReplan,
  isLoading,
}) => {
  const [feedback, setFeedback] = useState('');
  const [isReplanningMode, setIsReplanningMode] = useState(false);

  if (!isOpen) return null;

  const handleReplanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) return;
    onReplan(feedback.trim());
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(16, 17, 16, 0.85)',
        backdropFilter: 'blur(6px)',
        zIndex: 150,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-md)',
      }}
    >
      <div
        className="border-hairline"
        style={{
          width: '100%',
          maxWidth: '680px',
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-sm)',
          boxShadow: '0 16px 48px rgba(0,0,0,0.8)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
          overflow: 'hidden',
          borderColor: 'var(--accent-amber)',
        }}
      >
        {/* Header Alert Bar */}
        <div
          style={{
            padding: '12px 16px',
            background: 'var(--accent-amber-dim)',
            borderBottom: '1px solid var(--border-amber)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={16} color="var(--accent-amber)" />
            <span
              className="text-meta"
              style={{ color: 'var(--accent-amber)', fontWeight: 700, letterSpacing: '0.08em' }}
            >
              HUMAN-IN-THE-LOOP CHECKPOINT // RESEARCH PLAN REVIEW
            </span>
          </div>
          <button
            onClick={onClose}
            className="btn btn-icon btn-secondary"
            style={{ padding: '2px', border: 'none', background: 'transparent' }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '18px', overflowY: 'auto', flex: 1 }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
            {brief?.title || 'Proposed Research Brief & Execution Plan'}
          </h2>

          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '14px' }}>
            The Scoping Agent has evaluated the topic, clarified objectives, and formulated an
            executable research outline. The Temporal workflow has paused and is awaiting your
            explicit directive before autonomous multi-agent search commences.
          </p>

          {/* Research Outline Box */}
          <div
            className="border-hairline"
            style={{
              background: 'var(--bg-base)',
              padding: '14px',
              borderRadius: 'var(--radius-xs)',
              marginBottom: '16px',
            }}
          >
            <div className="text-meta" style={{ marginBottom: '8px', color: 'var(--accent-lime)' }}>
              CORE QUESTIONS & RESEARCH OUTLINE
            </div>
            <ul style={{ paddingLeft: '18px', color: 'var(--text-primary)', fontSize: '12px', lineHeight: 1.6 }}>
              {(brief?.coreQuestions || [
                'Architecture comparisons: persistent state versus queue buffers in long-horizon LLMs',
                'Failure modes, memory leakage, and event loop degradation across 4+ hour runs',
                'Empirical benchmarks on state recovery, deterministic replay, and auditability',
              ]).map((q, idx) => (
                <li key={idx} style={{ marginBottom: '4px' }}>
                  {q}
                </li>
              ))}
            </ul>
          </div>

          {/* Replanning Directive Input (if toggled) */}
          {isReplanningMode && (
            <form onSubmit={handleReplanSubmit} style={{ marginBottom: '14px' }}>
              <label className="text-meta" style={{ display: 'block', marginBottom: '6px', color: 'var(--accent-amber)' }}>
                REPLANNING DIRECTIVE / REFINED INSTRUCTIONS
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="e.g. Prioritize peer-reviewed benchmarks and compare the architectures on crash recovery latency..."
                rows={3}
                required
                style={{
                  width: '100%',
                  background: 'var(--bg-base)',
                  border: '1px solid var(--border-amber)',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '12px',
                  padding: '10px',
                  borderRadius: 'var(--radius-sm)',
                  outline: 'none',
                  marginBottom: '8px',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsReplanningMode(false)}
                  className="btn btn-secondary"
                  style={{ fontSize: '11px' }}
                >
                  CANCEL REPLAN
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !feedback.trim()}
                  className="btn btn-amber"
                  style={{ fontSize: '11px' }}
                >
                  <Send size={12} />
                  TRANSMIT REPLANNING SIGNAL
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Modal Actions Footer */}
        {!isReplanningMode && (
          <div
            style={{
              padding: '12px 18px',
              borderTop: '1px solid var(--border-color)',
              background: 'var(--bg-panel)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <button
              onClick={() => setIsReplanningMode(true)}
              className="btn btn-secondary"
              style={{ fontSize: '11px' }}
              disabled={isLoading}
            >
              <RotateCcw size={12} />
              REVISE & REPLAN
            </button>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={onClose} className="btn btn-secondary" style={{ fontSize: '11px' }}>
                KEEP PAUSED
              </button>
              <button
                onClick={onApprove}
                disabled={isLoading}
                className="btn btn-primary"
                style={{ fontSize: '11px', padding: '6px 16px' }}
              >
                <CheckCircle size={13} />
                APPROVE & RESUME RESEARCH
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
