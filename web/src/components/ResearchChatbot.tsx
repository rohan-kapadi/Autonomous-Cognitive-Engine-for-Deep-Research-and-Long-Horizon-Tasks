import React, { useState, useRef, useEffect } from 'react';
import { Send, ArrowRight, CornerDownLeft, Sparkles, X, Terminal, CheckCircle2 } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  suggestedBrief?: string;
  readyForPlan?: boolean;
}

interface ResearchChatbotProps {
  isOpen: boolean;
  onClose?: () => void;
  onProceedToPlan: (objective: string, brief: string) => void;
  isFullView?: boolean;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    role: 'assistant',
    content:
      "Welcome to ACE. I'm your research scoping assistant. Tell me what technical domain or objective you want to investigate. I will detect ambiguities, establish constraints, and formulate a structured brief for your review.",
  },
];

const SUGGESTED_PROMPTS = [
  'Compare solid-state and lithium-ion battery energy density for EV engineers.',
  'Analyze persistent memory architectures in autonomous AI agents and evaluate trade-offs.',
  'Audit compliance requirements under the EU AI Act for multi-agent workflows.',
];

export const ResearchChatbot: React.FC<ResearchChatbotProps> = ({
  isOpen,
  onClose,
  onProceedToPlan,
  isFullView = false,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeBrief, setActiveBrief] = useState<string | null>(null);
  const [activeObjective, setActiveObjective] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    setInput('');
    const userMsg: ChatMessage = { role: 'user', content: query };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsLoading(true);

    if (!activeObjective) {
      setActiveObjective(query);
    }

    try {
      // Call FastAPI backend /api/chat
      const res = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      const replyMsg: ChatMessage = {
        role: 'assistant',
        content: data.reply,
        suggestedBrief: data.suggested_brief,
        readyForPlan: data.ready_for_plan,
      };

      setMessages((prev) => [...prev, replyMsg]);
      if (data.suggested_brief) {
        setActiveBrief(data.suggested_brief);
      }
    } catch {
      // Resilient Scoping Fallback
      const isShort = query.split(' ').length < 4;
      if (isShort) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `"${query}" is quite broad. Could you specify which aspects, target domain, or constraints to focus on? (e.g. application segment, evaluation criteria, or time horizon)`,
          },
        ]);
      } else {
        const fallbackBrief = `RESEARCH BRIEF: Investigation into ${query}\n\n1. Core Objective: Systematically investigate ${query}, establish empirical evidence, and identify trade-offs.\n2. Scope: Analyze architectural patterns, benchmarks, failure modes, and open questions.\n3. Method: Multi-agent supervisor decomposition with isolated context windows and Temporal durability checkpoints.`;
        setActiveBrief(fallbackBrief);
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `Scope established for: "${query}".\n\nI have formulated the research brief. Review the brief below and proceed to plan generation when ready.`,
            suggestedBrief: fallbackBrief,
            readyForPlan: true,
          },
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      style={
        isFullView
          ? {
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              background: 'var(--bg-base, #090a09)',
              color: 'var(--text-primary, #f0f0e9)',
              fontFamily: 'var(--font-mono, monospace)',
            }
          : {
              position: 'fixed',
              right: '68px',
              bottom: '84px',
              width: 'min(460px, calc(100vw - 40px))',
              height: 'min(640px, calc(100vh - 120px))',
              background: 'rgba(16, 18, 16, 0.98)',
              border: '1px solid var(--border-color, #414141)',
              boxShadow: '0 20px 80px rgba(0, 0, 0, 0.85)',
              zIndex: 70,
              display: 'flex',
              flexDirection: 'column',
              fontFamily: 'var(--font-mono, monospace)',
            }
      }
      role="dialog"
      aria-label="ACE Research Assistant"
    >
      {/* Assistant Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-color, #343730)',
          background: 'rgba(24, 26, 23, 0.7)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            style={{
              background: 'var(--accent-lime, #c8f169)',
              color: '#090a09',
              width: '18px',
              height: '18px',
              display: 'grid',
              placeItems: 'center',
              fontSize: '11px',
              fontWeight: 'bold',
            }}
          >
            ▲
          </span>
          <div>
            <strong
              className="pixel"
              style={{
                fontSize: '18px',
                letterSpacing: '-0.01em',
                color: 'var(--text-primary, #f0f0e9)',
              }}
            >
              ACE // RESEARCH ASSISTANT
            </strong>
            <span
              style={{
                display: 'block',
                fontSize: '9px',
                color: 'var(--accent-lime, #c8f169)',
                letterSpacing: '0.06em',
              }}
            >
              STAGE 02 / OBJECTIVE SCOPING
            </span>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: '1px solid var(--border-color, #343730)',
              color: 'var(--text-secondary, #A7A7A0)',
              width: '28px',
              height: '28px',
              display: 'grid',
              placeItems: 'center',
              cursor: 'pointer',
            }}
            title="Close Assistant"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Suggested Prompt Chips */}
      {messages.length <= 2 && (
        <div
          style={{
            padding: '12px 18px',
            borderBottom: '1px solid var(--border-color, #343730)',
            background: 'rgba(16, 17, 16, 0.4)',
            fontSize: '11px',
          }}
        >
          <div
            style={{
              fontSize: '9px',
              color: 'var(--text-secondary, #A7A7A0)',
              marginBottom: '8px',
              letterSpacing: '0.06em',
            }}
          >
            SUGGESTED RESEARCH PROMPTS:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {SUGGESTED_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSend(prompt)}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border-color, #343730)',
                  color: 'var(--text-secondary, #A7A7A0)',
                  padding: '6px 10px',
                  fontSize: '10px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  lineHeight: 1.4,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontFamily: 'var(--font-mono, monospace)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent-lime, #c8f169)';
                  e.currentTarget.style.color = 'var(--text-primary, #f0f0e9)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color, #343730)';
                  e.currentTarget.style.color = 'var(--text-secondary, #A7A7A0)';
                }}
              >
                <Sparkles size={11} color="var(--accent-lime, #c8f169)" />
                <span>{prompt}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Message Stream */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={idx}
              style={{
                alignSelf: isUser ? 'flex-end' : 'flex-start',
                maxWidth: '92%',
                background: isUser ? '#1a1f18' : '#141614',
                border: '1px solid',
                borderColor: isUser ? '#4f683a' : 'var(--border-color, #343730)',
                padding: '12px 14px',
                fontSize: '11px',
                lineHeight: 1.7,
              }}
            >
              <div
                style={{
                  fontSize: '9px',
                  color: isUser ? 'var(--accent-lime, #c8f169)' : 'var(--text-secondary, #A7A7A0)',
                  fontWeight: 700,
                  marginBottom: '4px',
                  letterSpacing: '0.06em',
                }}
              >
                {isUser ? 'YOU / RESEARCH PROMPT' : 'ACE / SCOPING AGENT'}
              </div>

              <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-primary, #f0f0e9)' }}>
                {msg.content}
              </div>

              {/* Ready for Plan Action Banner */}
              {msg.readyForPlan && (
                <div
                  style={{
                    marginTop: '12px',
                    padding: '10px',
                    border: '1px solid var(--accent-lime, #c8f169)',
                    background: 'rgba(200, 241, 105, 0.08)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: 'var(--accent-lime, #c8f169)',
                      fontWeight: 700,
                      fontSize: '10px',
                      marginBottom: '8px',
                    }}
                  >
                    <CheckCircle2 size={13} />
                    <span>RESEARCH BRIEF FORMULATED</span>
                  </div>
                  <button
                    onClick={() =>
                      onProceedToPlan(activeObjective || msg.content, activeBrief || msg.content)
                    }
                    style={{
                      width: '100%',
                      background: 'var(--accent-lime, #c8f169)',
                      color: '#090a09',
                      border: 0,
                      padding: '10px 14px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      letterSpacing: '0.04em',
                    }}
                  >
                    <span>REVIEW RESEARCH PLAN (STAGE 03)</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div
            style={{
              alignSelf: 'flex-start',
              padding: '10px 14px',
              border: '1px solid var(--border-color, #343730)',
              background: '#141614',
              fontSize: '11px',
              color: 'var(--accent-lime, #c8f169)',
            }}
          >
            <span className="terminal-cursor">ACE is evaluating scope & constraints</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div
        style={{
          borderTop: '1px solid var(--border-color, #343730)',
          padding: '12px',
          background: 'rgba(20, 22, 20, 0.9)',
          display: 'flex',
          gap: '8px',
        }}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe your research topic (e.g. Compare solid-state vs Li-ion batteries)..."
          rows={2}
          style={{
            flex: 1,
            background: '#090a09',
            border: '1px solid var(--border-color, #343730)',
            color: 'var(--text-primary, #f0f0e9)',
            padding: '10px',
            fontSize: '11px',
            fontFamily: 'var(--font-mono, monospace)',
            resize: 'none',
            outline: 'none',
          }}
          disabled={isLoading}
        />
        <button
          onClick={() => handleSend()}
          disabled={isLoading || !input.trim()}
          style={{
            background: input.trim() ? 'var(--accent-lime, #c8f169)' : 'var(--border-color, #343730)',
            color: '#090a09',
            border: 0,
            padding: '0 16px',
            fontWeight: 700,
            cursor: input.trim() ? 'pointer' : 'not-allowed',
            display: 'grid',
            placeItems: 'center',
          }}
          title="Send message (Enter)"
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  );
};
