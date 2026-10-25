import React, { useState, useEffect } from 'react';
import { AsciiHeroCanvas } from './AsciiHeroCanvas';
import {
  ArrowRight,
  ArrowDown,
  Terminal,
  Cpu,
  Layers,
  ShieldCheck,
  RefreshCw,
  FileText,
  Search,
  ExternalLink,
  Activity,
  CheckCircle2,
} from 'lucide-react';

interface LandingPageProps {
  onStartChat: () => void;
  onEnterStudio: () => void;
  onStartDemo: (topic: string) => void;
}

interface FeatureItem {
  key: string;
  badge: string;
  title: string;
  subtitle: string;
  displayTitle: string;
  description: string;
  meta: string;
}

const FEATURES: FeatureItem[] = [
  {
    key: 'A',
    badge: '[A]',
    title: 'COGNITIVE STATE',
    subtitle: 'TASKS / SOURCES / DECISIONS',
    displayTitle: 'STATE THAT STAYS VISIBLE.',
    description:
      'Unlike stateless one-shot LLM prompts, ACE maintains an explicit, checkpointable cognitive memory model. It captures the living research objective, dynamic sub-tasks, discovered citations, architectural decisions, and unresolved knowledge gaps as the investigation unfolds.',
    meta: 'AGENTSTATE SCHEMA / 9 FIELDS',
  },
  {
    key: 'B',
    badge: '[B]',
    title: 'RESEARCH PLANNING',
    subtitle: 'OBJECTIVE → LIVING PLAN',
    displayTitle: 'PLAN BEFORE EXECUTION.',
    description:
      'Transforms broad or ambiguous user questions into a structured research brief. Ambiguity detection identifies missing parameters early and establishes bounded scope, deliverables, and search methodology before spawning worker agents.',
    meta: 'MULTI-TURN SCOPING NODE',
  },
  {
    key: 'C',
    badge: '[C]',
    title: 'AGENT WORKFLOWS',
    subtitle: 'LANGGRAPH SUPERVISOR',
    displayTitle: 'ORCHESTRATE THE WORK.',
    description:
      'Stateful multi-agent execution powered by LangGraph. A lead supervisor dynamically spawns researcher agents with isolated context windows to prevent token bloat, executing targeted queries and iterative reflection.',
    meta: 'HIERARCHICAL DELEGATION',
  },
  {
    key: 'D',
    badge: '[D]',
    title: 'HUMAN APPROVAL',
    subtitle: 'PAUSE / REPLAN DIRECTIVES',
    displayTitle: 'HUMANS STAY IN CONTROL.',
    description:
      'Structured cognitive checkpoints interrupt execution between planning and research. Users can inspect the proposed plan, approve continuation, or inject replanning directives to steer the investigation without restarting.',
    meta: 'LANGGRAPH INTERRUPT + TEMPORAL SIGNAL',
  },
  {
    key: 'E',
    badge: '[E]',
    title: 'LONG-RUN EXECUTION',
    subtitle: 'TEMPORAL INTEGRATION',
    displayTitle: 'DESIGNED FOR LONG RUNS.',
    description:
      'Temporal durable execution coordinates scoping, human approval pauses, and multi-agent activities. Workflows sleep with zero CPU overhead, survive worker crashes or network timeouts, and replay deterministically from their event log.',
    meta: 'DURABLE WORKFLOW + RETRIES',
  },
  {
    key: 'F',
    badge: '[F]',
    title: 'RESEARCH REPORTS',
    subtitle: 'STRUCTURED OUTPUT & DOSSIER',
    displayTitle: 'FINDINGS INTO ARTIFACTS.',
    description:
      'Synthesizes compressed findings into publication-grade research dossiers using Google Gemma 4 (gemma-4-26b-a4b-it). Includes executive summaries, comparative tables, limitations, and cited references saved directly to disk.',
    meta: 'GEMMA 4 ON JARVISLABS TOKEN FACTORY',
  },
  {
    key: 'G',
    badge: '[G]',
    title: 'EVIDENCE SEARCH',
    subtitle: 'TAVILY WEB RETRIEVAL',
    displayTitle: 'GROUNDED IN REAL EVIDENCE.',
    description:
      'Autonomous web search with Tavily API integration. Features automated URL deduplication, raw content extraction, and non-blocking summarization to keep context concise and factually anchored.',
    meta: 'DEDUPLICATED WEB CITATIONS',
  },
  {
    key: 'H',
    badge: '[H]',
    title: 'OBSERVABILITY',
    subtitle: 'LANGSMITH RUN TREES',
    displayTitle: 'END-TO-END TRACEABILITY.',
    description:
      'Complete execution transparency via LangSmith distributed tracing. Every agent thought, tool call, token cost, and state diff is tracked and linked directly to Temporal workflow executions for live debugging.',
    meta: 'LANGSMITH PLUGIN V2',
  },
];

const SECTIONS = [
  { id: 'intro', label: '01', title: 'INTRO' },
  { id: 'process', label: '02', title: 'PROCESS' },
  { id: 'features', label: '03', title: 'CAPABILITIES' },
  { id: 'architecture', label: '04', title: 'ARCHITECTURE' },
  { id: 'demo', label: '05', title: 'LIVE DEMO' },
  { id: 'start', label: '06', title: 'START' },
];

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartChat,
  onEnterStudio,
  onStartDemo,
}) => {
  const [selectedFeatureIndex, setSelectedFeatureIndex] = useState<number>(0);
  const [activeSection, setActiveSection] = useState<string>('intro');
  const [selectedArchNode, setSelectedArchNode] = useState<string>('temporal');

  const selectedFeature = FEATURES[selectedFeatureIndex];

  // Intersection Observer for the right-hand numbered rail
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-30% 0px -50% 0px' }
    );

    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-base, #090a09)',
        color: 'var(--text-primary, #f0f0e9)',
        minHeight: '100vh',
        width: '100%',
        position: 'relative',
        overflowX: 'hidden',
        fontFamily: 'var(--font-mono, monospace)',
      }}
    >
      {/* ===================================================================
          1. TOP NAVIGATION BAR (Inspired by extension.textmode.art)
          =================================================================== */}
      <header
        style={{
          height: '64px',
          borderBottom: '1px solid var(--border-color, #343730)',
          display: 'flex',
          alignItems: 'stretch',
          position: 'sticky',
          top: 0,
          background: 'rgba(9, 10, 9, 0.94)',
          backdropFilter: 'blur(10px)',
          zIndex: 60,
        }}
      >
        {/* Brand */}
        <div
          onClick={() => scrollToSection('intro')}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '0 28px',
            gap: '12px',
            fontFamily: 'var(--font-pixel, monospace)',
            fontSize: '18px',
            cursor: 'pointer',
            borderRight: '1px solid var(--border-color, #343730)',
          }}
        >
          <span
            style={{
              background: 'var(--accent-lime, #c8f169)',
              color: '#090a09',
              width: '20px',
              height: '20px',
              display: 'grid',
              placeItems: 'center',
              fontSize: '13px',
              fontWeight: 'bold',
            }}
          >
            ▲
          </span>
          <span style={{ letterSpacing: '0.04em' }}>ACE // RESEARCH ENGINE</span>
          <span
            style={{
              fontSize: '10px',
              color: 'var(--text-secondary, #96988e)',
              marginLeft: '12px',
              fontFamily: 'var(--font-mono, monospace)',
            }}
          >
            V0.1 / OPEN SOURCE
          </span>
        </div>

        {/* Navigation Links */}
        <nav
          style={{
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'stretch',
          }}
        >
          <button
            onClick={() => scrollToSection('process')}
            className="nav-link-btn"
            style={navBtnStyle}
          >
            HOW IT WORKS
          </button>
          <button
            onClick={() => scrollToSection('features')}
            className="nav-link-btn"
            style={navBtnStyle}
          >
            CAPABILITIES
          </button>
          <button
            onClick={() => scrollToSection('architecture')}
            className="nav-link-btn"
            style={navBtnStyle}
          >
            ARCHITECTURE
          </button>
          <button
            onClick={() => scrollToSection('demo')}
            className="nav-link-btn"
            style={navBtnStyle}
          >
            LIVE DEMO
          </button>
          <a
            href="https://github.com/rohan-kapadi/Autonomous-Cognitive-Engine-for-Deep-Research-and-Long-Horizon-Tasks/tree/temporal"
            target="_blank"
            rel="noopener noreferrer"
            style={navBtnStyle}
          >
            GITHUB ↗
          </a>
          <button
            onClick={onStartChat}
            style={{
              ...navBtnStyle,
              background: 'transparent',
              color: 'var(--accent-lime, #c8f169)',
              borderColor: 'var(--accent-lime, #c8f169)',
              fontWeight: 600,
            }}
          >
            ASK ACE ↗
          </button>
          <button
            onClick={onEnterStudio}
            style={{
              ...navBtnStyle,
              background: 'var(--text-primary, #f0f0e9)',
              color: 'var(--bg-base, #090a09)',
              fontWeight: 700,
            }}
          >
            OPEN STUDIO ↗
          </button>
        </nav>
      </header>

      {/* ===================================================================
          2. FIXED NUMBERED SECTION RAIL (Right edge, desktop)
          =================================================================== */}
      <aside
        style={{
          position: 'fixed',
          right: 0,
          top: '64px',
          bottom: 0,
          width: '46px',
          background: 'rgba(9, 10, 9, 0.96)',
          borderLeft: '1px solid var(--border-color, #343730)',
          zIndex: 40,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
        aria-label="Section navigation rail"
      >
        <button
          onClick={() => scrollToSection('intro')}
          style={{
            height: '48px',
            display: 'grid',
            placeItems: 'center',
            fontSize: '11px',
            border: 0,
            borderBottom: '1px solid #272923',
            background: 'transparent',
            color: 'var(--text-secondary, #96988e)',
            cursor: 'pointer',
          }}
          title="Scroll to top"
        >
          ↑
        </button>

        {SECTIONS.map((sec) => {
          const isActive = activeSection === sec.id;
          return (
            <div key={sec.id} style={{ position: 'relative' }}>
              <button
                onClick={() => scrollToSection(sec.id)}
                style={{
                  height: '52px',
                  width: '100%',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: '10px',
                  border: 0,
                  borderBottom: '1px solid #272923',
                  background: isActive ? 'var(--text-primary, #f0f0e9)' : 'transparent',
                  color: isActive ? 'var(--bg-base, #090a09)' : 'var(--text-secondary, #96988e)',
                  cursor: 'pointer',
                  fontWeight: isActive ? 700 : 400,
                  transition: 'all 120ms',
                }}
              >
                {sec.label}
              </button>

              {/* Floating label pill on active section */}
              {isActive && (
                <div
                  style={{
                    position: 'absolute',
                    right: '46px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'var(--text-primary, #f0f0e9)',
                    color: 'var(--bg-base, #090a09)',
                    padding: '4px 10px',
                    fontSize: '9px',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    whiteSpace: 'nowrap',
                    border: '1px solid var(--text-primary, #f0f0e9)',
                    borderRight: '0',
                    pointerEvents: 'none',
                  }}
                >
                  [{sec.title} {sec.label}]
                </div>
              )}
            </div>
          );
        })}
      </aside>

      {/* Main Container (offset 46px right for rail) */}
      <div style={{ marginRight: '46px' }}>
        {/* ===================================================================
            SECTION 01: HERO SECTION
            =================================================================== */}
        <section
          id="intro"
          style={{
            minHeight: 'calc(100vh - 64px)',
            height: 'min(820px, calc(100vh - 64px))',
            position: 'relative',
            borderBottom: '1px solid var(--border-color, #343730)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '24px 32px 36px',
            overflow: 'hidden',
          }}
        >
          {/* Subtle Matrix/Textmode Canvas */}
          <AsciiHeroCanvas opacity={0.35} color="#A3A69A" />

          {/* Top Hero Bar */}
          <div
            style={{
              position: 'relative',
              zIndex: 10,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '11px',
              color: 'var(--text-secondary, #A7A7A0)',
              letterSpacing: '0.08em',
            }}
          >
            <span>AUTONOMOUS COGNITIVE ENGINE // OPEN SOURCE</span>
            <span style={{ color: 'var(--accent-lime, #c8f169)' }}>
              LANGGRAPH + TEMPORAL + GEMMA 4
            </span>
          </div>

          {/* Main Huge Pixel Display Typography */}
          <div style={{ position: 'relative', zIndex: 10, margin: 'auto 0 40px' }}>
            <h1
              className="pixel"
              style={{
                fontSize: 'clamp(56px, 8.4vw, 144px)',
                lineHeight: 0.88,
                letterSpacing: '-0.04em',
                margin: 0,
                color: 'var(--text-primary, #f0f0e9)',
                fontWeight: 600,
                textTransform: 'uppercase',
              }}
            >
              TURN QUESTIONS
              <br />
              INTO <span style={{ color: 'var(--accent-lime, #c8f169)' }}>RESEARCH.</span>
            </h1>
          </div>

          {/* Hero Bottom Split Control Bar */}
          <div
            style={{
              position: 'relative',
              zIndex: 10,
              borderTop: '1px solid var(--border-color, #343730)',
              paddingTop: '24px',
              display: 'grid',
              gridTemplateColumns: '1.4fr 1fr 1fr',
              gap: '24px',
              alignItems: 'center',
            }}
          >
            <p
              style={{
                fontSize: '12px',
                lineHeight: 1.8,
                color: 'var(--text-secondary, #A7A7A0)',
                margin: 0,
                maxWidth: '460px',
              }}
            >
              An autonomous research engine that turns complex objectives into structured
              investigations, coordinates multi-agent workflows, tracks cognitive state, and
              produces verified dossiers with human oversight.
            </p>

            <button
              onClick={onStartChat}
              style={{
                background: 'var(--text-primary, #f0f0e9)',
                color: 'var(--bg-base, #090a09)',
                border: '1px solid var(--text-primary, #f0f0e9)',
                padding: '18px 22px',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'all 120ms',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--accent-lime, #c8f169)';
                e.currentTarget.style.borderColor = 'var(--accent-lime, #c8f169)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--text-primary, #f0f0e9)';
                e.currentTarget.style.borderColor = 'var(--text-primary, #f0f0e9)';
              }}
            >
              <span>START A RESEARCH RUN</span>
              <ArrowRight size={16} />
            </button>

            <button
              onClick={() => scrollToSection('process')}
              style={{
                background: 'transparent',
                color: 'var(--text-primary, #f0f0e9)',
                border: '1px solid var(--border-color, #343730)',
                padding: '18px 22px',
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'all 120ms',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--text-primary, #f0f0e9)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color, #343730)';
              }}
            >
              <span>EXPLORE THE ENGINE</span>
              <ArrowDown size={16} />
            </button>
          </div>
        </section>

        {/* ===================================================================
            SECTION 02: HOW IT WORKS (6-STEP PROCESS GRID)
            =================================================================== */}
        <section
          id="process"
          style={{
            padding: '36px 32px 52px',
            borderBottom: '1px solid var(--border-color, #343730)',
          }}
        >
          <div style={{ fontSize: '11px', color: '#96988e', letterSpacing: '0.08em' }}>
            PROTOCOL 01 / FROM OBJECTIVE TO OUTPUT
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              margin: '20px 0 32px',
              gap: '24px',
            }}
          >
            <h2
              className="pixel"
              style={{
                fontSize: 'clamp(44px, 5.2vw, 84px)',
                lineHeight: 0.9,
                letterSpacing: '-0.04em',
                margin: 0,
                fontWeight: 500,
              }}
            >
              A RESEARCH ENGINE,
              <br />
              NOT ANOTHER CHAT WINDOW.
            </h2>
            <p
              style={{
                maxWidth: '460px',
                fontSize: '12px',
                lineHeight: 1.8,
                color: 'var(--text-secondary, #A7A7A0)',
                margin: 0,
              }}
            >
              Single-prompt LLM assistants fail on multi-hour investigations. ACE decomposes your
              research objective into a structured, visible lifecycle with human steering.
            </p>
          </div>

          {/* 6 Step Process Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 1fr)',
              border: '1px solid var(--border-color, #343730)',
            }}
          >
            {[
              {
                num: '01',
                tag: 'INPUT',
                title: 'DEFINE',
                desc: 'Describe a complex research objective and establish the investigation boundaries.',
              },
              {
                num: '02',
                tag: 'PLAN',
                title: 'DECOMPOSE',
                desc: 'Scoping node assesses ambiguity and builds a living research brief and task graph.',
              },
              {
                num: '03',
                tag: 'INVESTIGATE',
                title: 'SEARCH',
                desc: 'Supervisor coordinates parallel web researchers with isolated context windows.',
              },
              {
                num: '04',
                tag: 'CHECKPOINT',
                title: 'REVIEW',
                desc: 'Workflow pauses at Temporal signal checkpoint for human approval or replanning.',
              },
              {
                num: '05',
                tag: 'SYNTHESIS',
                title: 'COMPRESS',
                desc: 'Iterative context compression aggregates evidence without context rot.',
              },
              {
                num: '06',
                tag: 'DELIVER',
                title: 'REPORT',
                desc: 'Google Gemma 4 compiles the final dossier with full citation bibliography.',
              },
            ].map((step, idx) => (
              <div
                key={step.num}
                style={{
                  minHeight: '260px',
                  padding: '22px 18px',
                  borderRight: idx === 5 ? 'none' : '1px solid var(--border-color, #343730)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  background: 'rgba(24, 26, 23, 0.4)',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: '10px',
                      color: 'var(--accent-lime, #c8f169)',
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      marginBottom: '8px',
                    }}
                  >
                    [{step.num}] / {step.tag}
                  </div>
                  <h3
                    className="pixel"
                    style={{
                      fontSize: '24px',
                      fontWeight: 500,
                      margin: '12px 0 0',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {step.title}
                  </h3>
                </div>
                <p
                  style={{
                    fontSize: '11px',
                    lineHeight: 1.7,
                    color: 'var(--text-secondary, #A7A7A0)',
                    margin: 0,
                  }}
                >
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ===================================================================
            SECTION 03: CAPABILITIES INDEX (Matched to extension.textmode.art Image 2)
            =================================================================== */}
        <section
          id="features"
          style={{
            padding: '36px 32px 52px',
            borderBottom: '1px solid var(--border-color, #343730)',
          }}
        >
          <div style={{ fontSize: '11px', color: '#96988e', letterSpacing: '0.08em' }}>
            CAPABILITY INDEX / SYSTEM FUNCTIONS
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              margin: '20px 0 32px',
              gap: '24px',
            }}
          >
            <h2
              className="pixel"
              style={{
                fontSize: 'clamp(44px, 5.2vw, 84px)',
                lineHeight: 0.9,
                letterSpacing: '-0.04em',
                margin: 0,
                fontWeight: 500,
              }}
            >
              THE WHOLE
              <br />
              RESEARCH LOOP.
            </h2>
            <p
              style={{
                maxWidth: '480px',
                fontSize: '12px',
                lineHeight: 1.8,
                color: 'var(--text-secondary, #A7A7A0)',
                margin: 0,
              }}
            >
              Select any capability to inspect how ACE replaces black-box hallucinations with
              stateful coordination, durable workflows, and human checkpointing.
            </p>
          </div>

          {/* 2-Column Grid: Left 2x4 feature cards, Right reactive display panel */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '46% 54%',
              border: '1px solid var(--border-color, #343730)',
            }}
          >
            {/* Left Column: 2-column feature tiles */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                borderRight: '1px solid var(--border-color, #343730)',
              }}
            >
              {FEATURES.map((feat, idx) => {
                const isSelected = selectedFeatureIndex === idx;
                return (
                  <button
                    key={feat.key}
                    onClick={() => setSelectedFeatureIndex(idx)}
                    style={{
                      background: isSelected
                        ? 'var(--text-primary, #f0f0e9)'
                        : 'rgba(16, 17, 16, 0.6)',
                      color: isSelected ? 'var(--bg-base, #090a09)' : 'var(--text-primary, #f0f0e9)',
                      border: 0,
                      borderRight: idx % 2 === 0 ? '1px solid var(--border-color, #343730)' : 'none',
                      borderBottom:
                        idx < 6 ? '1px solid var(--border-color, #343730)' : 'none',
                      minHeight: '136px',
                      padding: '16px',
                      textAlign: 'left',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 120ms',
                      fontFamily: 'var(--font-mono, monospace)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '10px', opacity: 0.7 }}>{feat.badge}</span>
                      {isSelected && (
                        <span
                          style={{
                            fontSize: '9px',
                            background: '#090a09',
                            color: 'var(--accent-lime, #c8f169)',
                            padding: '1px 6px',
                            fontWeight: 700,
                          }}
                        >
                          SELECTED
                        </span>
                      )}
                    </div>
                    <div>
                      <strong
                        className="pixel"
                        style={{
                          fontSize: '18px',
                          display: 'block',
                          letterSpacing: '-0.01em',
                          fontWeight: 500,
                        }}
                      >
                        {feat.title}
                      </strong>
                      <span
                        style={{
                          fontSize: '9px',
                          opacity: 0.65,
                          marginTop: '4px',
                          display: 'block',
                        }}
                      >
                        {feat.subtitle}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Right Column: Large reactive display panel with radial glow & ASCII watermark */}
            <div
              style={{
                position: 'relative',
                minHeight: '540px',
                padding: '44px 38px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                background:
                  'radial-gradient(ellipse at 75% 20%, #202b1e 0%, #121512 38%, #090a09 75%)',
                overflow: 'hidden',
              }}
            >
              {/* Giant background ASCII decorative watermark */}
              <div
                style={{
                  position: 'absolute',
                  fontSize: '240px',
                  fontFamily: 'var(--font-mono, monospace)',
                  color: 'rgba(200, 241, 105, 0.04)',
                  right: '5%',
                  top: '12%',
                  pointerEvents: 'none',
                  userSelect: 'none',
                }}
              >
                +
              </div>

              {/* Panel Top Meta */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '10px',
                  letterSpacing: '0.08em',
                  color: 'var(--text-secondary, #A7A7A0)',
                  position: 'relative',
                  zIndex: 2,
                }}
              >
                <span>
                  [{selectedFeature.badge}] / CAPABILITY SPECIFICATION
                </span>
                <span style={{ color: 'var(--accent-lime, #c8f169)' }}>
                  {selectedFeature.meta}
                </span>
              </div>

              {/* Panel Center: Big Headline & Description */}
              <div style={{ position: 'relative', zIndex: 2, margin: '50px 0' }}>
                <h3
                  className="pixel"
                  style={{
                    fontSize: 'clamp(38px, 4.2vw, 68px)',
                    lineHeight: 0.92,
                    letterSpacing: '-0.04em',
                    margin: '0 0 24px',
                    maxWidth: '560px',
                    fontWeight: 500,
                  }}
                >
                  {selectedFeature.displayTitle}
                </h3>
                <p
                  style={{
                    fontSize: '13px',
                    lineHeight: 1.9,
                    color: 'var(--text-secondary, #A7A7A0)',
                    maxWidth: '520px',
                    margin: 0,
                  }}
                >
                  {selectedFeature.description}
                </p>
              </div>

              {/* Panel Bottom Action */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderTop: '1px solid var(--border-color, #343730)',
                  paddingTop: '20px',
                  position: 'relative',
                  zIndex: 2,
                }}
              >
                <span style={{ fontSize: '11px', color: 'var(--text-secondary, #A7A7A0)' }}>
                  Active Engine Mode: Temporal Replay Safe
                </span>
                <button
                  onClick={onEnterStudio}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--text-primary, #f0f0e9)',
                    color: 'var(--text-primary, #f0f0e9)',
                    padding: '8px 16px',
                    fontSize: '10px',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    cursor: 'pointer',
                  }}
                >
                  INSPECT IN WORKSPACE ↗
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================================
            SECTION 04: SYSTEM ARCHITECTURE
            =================================================================== */}
        <section
          id="architecture"
          style={{
            padding: '36px 32px 52px',
            borderBottom: '1px solid var(--border-color, #343730)',
          }}
        >
          <div style={{ fontSize: '11px', color: '#96988e', letterSpacing: '0.08em' }}>
            SYSTEM ARCHITECTURE / EXECUTION MODEL
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              margin: '20px 0 32px',
              gap: '24px',
            }}
          >
            <h2
              className="pixel"
              style={{
                fontSize: 'clamp(44px, 5.2vw, 84px)',
                lineHeight: 0.9,
                letterSpacing: '-0.04em',
                margin: 0,
                fontWeight: 500,
              }}
            >
              A COORDINATED
              <br />
              RESEARCH SYSTEM.
            </h2>
            <p
              style={{
                maxWidth: '460px',
                fontSize: '12px',
                lineHeight: 1.8,
                color: 'var(--text-secondary, #A7A7A0)',
                margin: 0,
              }}
            >
              ACE unites LangGraph cognitive intelligence with Temporal durability guarantees.
              Click any architecture node to inspect its execution contract.
            </p>
          </div>

          {/* Interactive Topology Split */}
          <div
            style={{
              border: '1px solid var(--border-color, #343730)',
              background: '#101210',
              display: 'grid',
              gridTemplateColumns: '1.3fr 0.9fr',
              minHeight: '420px',
            }}
          >
            {/* Left: Architecture Topology Nodes */}
            <div
              style={{
                padding: '28px',
                borderRight: '1px solid var(--border-color, #343730)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid var(--border-color, #343730)',
                  paddingBottom: '14px',
                  fontSize: '11px',
                  color: 'var(--text-secondary, #A7A7A0)',
                }}
              >
                <span>TOPOLOGY DIAGRAM</span>
                <span style={{ color: 'var(--accent-lime, #c8f169)' }}>5 ACTIVE LAYERS</span>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  margin: '24px 0',
                }}
              >
                {[
                  {
                    id: 'client',
                    label: '01 / CLIENT & WEB STUDIO',
                    sub: 'FastAPI REST /api/chat + /api/research',
                  },
                  {
                    id: 'temporal',
                    label: '02 / TEMPORAL ORCHESTRATION',
                    sub: 'ACEResearchWorkflow + Activities + Signals',
                  },
                  {
                    id: 'langgraph',
                    label: '03 / COGNITIVE STATE LAYER',
                    sub: 'LangGraph StateGraph + MemorySaver Checkpoints',
                  },
                  {
                    id: 'agents',
                    label: '04 / SUPERVISOR & RESEARCHERS',
                    sub: 'Lead Supervisor + Tavily Search + Context Compressor',
                  },
                  {
                    id: 'synthesis',
                    label: '05 / SYNTHESIS & OBSERVABILITY',
                    sub: 'Google Gemma 4 Report + LangSmith Distributed Tracing',
                  },
                ].map((node) => {
                  const isSelected = selectedArchNode === node.id;
                  return (
                    <button
                      key={node.id}
                      onClick={() => setSelectedArchNode(node.id)}
                      style={{
                        padding: '14px 18px',
                        border: '1px solid',
                        borderColor: isSelected
                          ? 'var(--accent-lime, #c8f169)'
                          : 'var(--border-color, #343730)',
                        background: isSelected ? 'rgba(200, 241, 105, 0.08)' : 'transparent',
                        color: isSelected
                          ? 'var(--accent-lime, #c8f169)'
                          : 'var(--text-primary, #f0f0e9)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontFamily: 'var(--font-mono, monospace)',
                        fontSize: '12px',
                        transition: 'all 120ms',
                      }}
                    >
                      <div>
                        <strong style={{ display: 'block' }}>{node.label}</strong>
                        <span style={{ fontSize: '10px', opacity: 0.7 }}>{node.sub}</span>
                      </div>
                      <span style={{ fontSize: '10px' }}>{isSelected ? '● ACTIVE' : '○'}</span>
                    </button>
                  );
                })}
              </div>

              <div style={{ fontSize: '10px', color: 'var(--text-secondary, #A7A7A0)' }}>
                Deterministic replay safe · Failure-isolated activities · Zero-CPU idle wait
              </div>
            </div>

            {/* Right: Selected Architecture Node Notes */}
            <div
              style={{
                padding: '28px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                background: 'rgba(16, 17, 16, 0.4)',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: '10px',
                    color: 'var(--accent-lime, #c8f169)',
                    fontWeight: 700,
                    marginBottom: '12px',
                  }}
                >
                  LAYER SPECIFICATION
                </div>
                <h4
                  className="pixel"
                  style={{
                    fontSize: '26px',
                    margin: '0 0 16px',
                    fontWeight: 500,
                  }}
                >
                  {selectedArchNode === 'client' && 'Client & Web Studio'}
                  {selectedArchNode === 'temporal' && 'Temporal Durable Engine'}
                  {selectedArchNode === 'langgraph' && 'Cognitive State Model'}
                  {selectedArchNode === 'agents' && 'Hierarchical Multi-Agent'}
                  {selectedArchNode === 'synthesis' && 'Synthesis & Tracing'}
                </h4>
                <p
                  style={{
                    fontSize: '12px',
                    lineHeight: 1.8,
                    color: 'var(--text-secondary, #A7A7A0)',
                    margin: 0,
                  }}
                >
                  {selectedArchNode === 'client' &&
                    'The web studio connects via high-performance REST APIs to FastAPI, providing live telemetry, conversational scoping, plan approval controls, and markdown dossier downloads.'}
                  {selectedArchNode === 'temporal' &&
                    'Coordinates the end-to-end mission across scoping, human checkpoint pause, and research execution activities. If a worker crashes or an LLM call rate-limits, Temporal retries automatically with exponential backoff.'}
                  {selectedArchNode === 'langgraph' &&
                    'Maintains explicit cognitive state across 9 structured fields: objective, research_plan, tasks, sources, decisions, and unresolved questions. Pauses at checkpoint_and_resume node via LangGraph interrupt().'}
                  {selectedArchNode === 'agents' &&
                    'Lead researcher supervisor dynamically breaks briefs into targeted search sub-queries, delegating work to researcher agents with isolated context windows to prevent memory exhaustion.'}
                  {selectedArchNode === 'synthesis' &&
                    'Google Gemma 4 (26B parameters) synthesizes the final dossier. Every agent operation exports OpenTelemetry spans correlated to LangSmith project run trees.'}
                </p>
              </div>

              <div
                style={{
                  borderTop: '1px solid var(--border-color, #343730)',
                  paddingTop: '16px',
                  fontSize: '10px',
                  color: 'var(--text-secondary, #A7A7A0)',
                }}
              >
                Verification: 76 automated offline tests passing
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================================
            SECTION 05: INTERACTIVE DEMO TRIAL
            =================================================================== */}
        <section
          id="demo"
          style={{
            padding: '36px 32px 52px',
            borderBottom: '1px solid var(--border-color, #343730)',
          }}
        >
          <div style={{ fontSize: '11px', color: '#96988e', letterSpacing: '0.08em' }}>
            INTERACTIVE TRIAL / SYSTEM DEMONSTRATION
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              margin: '20px 0 32px',
              gap: '24px',
            }}
          >
            <h2
              className="pixel"
              style={{
                fontSize: 'clamp(44px, 5.2vw, 84px)',
                lineHeight: 0.9,
                letterSpacing: '-0.04em',
                margin: 0,
                fontWeight: 500,
              }}
            >
              TRY A REAL
              <br />
              INVESTIGATION.
            </h2>
            <p
              style={{
                maxWidth: '460px',
                fontSize: '12px',
                lineHeight: 1.8,
                color: 'var(--text-secondary, #A7A7A0)',
                margin: 0,
              }}
            >
              Test the engine with our pre-loaded research benchmark or launch a custom investigation
              using the ACE research assistant.
            </p>
          </div>

          {/* Interactive Benchmark Card */}
          <div
            style={{
              border: '1px solid var(--border-color, #343730)',
              background: '#121411',
              padding: '32px',
              display: 'grid',
              gridTemplateColumns: '1.6fr 1fr',
              gap: '32px',
              alignItems: 'center',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '10px',
                  color: 'var(--accent-lime, #c8f169)',
                  fontWeight: 700,
                  marginBottom: '8px',
                }}
              >
                [PRELOADED BENCHMARK MISSION]
              </div>
              <h3
                style={{
                  fontSize: '18px',
                  lineHeight: 1.5,
                  margin: '0 0 16px',
                  color: 'var(--text-primary, #f0f0e9)',
                }}
              >
                "Investigate how persistent memory architectures affect the reliability of autonomous
                AI agents. Compare major approaches, evidence, limitations, and implementation trade-offs."
              </h3>
              <p
                style={{
                  fontSize: '12px',
                  lineHeight: 1.8,
                  color: 'var(--text-secondary, #A7A7A0)',
                  margin: 0,
                }}
              >
                Decomposes into 3 parallel researcher sub-tracks, pauses at the human approval gate,
                and generates a full comparative matrix of vector storage, checkpointers, and episodic memory.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={() =>
                  onStartDemo(
                    'Investigate how persistent memory architectures affect the reliability of autonomous AI agents. Compare major approaches, evidence, limitations, and implementation trade-offs.'
                  )
                }
                style={{
                  background: 'var(--accent-lime, #c8f169)',
                  color: '#090a09',
                  border: '1px solid var(--accent-lime, #c8f169)',
                  padding: '16px 20px',
                  fontWeight: 700,
                  fontSize: '11px',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>LAUNCH IN RESEARCH STUDIO</span>
                <ArrowRight size={16} />
              </button>

              <button
                onClick={onStartChat}
                style={{
                  background: 'transparent',
                  color: 'var(--text-primary, #f0f0e9)',
                  border: '1px solid var(--border-color, #343730)',
                  padding: '16px 20px',
                  fontWeight: 600,
                  fontSize: '11px',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>FORMULATE CUSTOM OBJECTIVE</span>
                <Terminal size={16} />
              </button>
            </div>
          </div>
        </section>

        {/* ===================================================================
            SECTION 06: FINAL CTA & FOOTER
            =================================================================== */}
        <section
          id="start"
          style={{
            padding: '48px 32px 64px',
            borderBottom: '1px solid var(--border-color, #343730)',
          }}
        >
          <div style={{ fontSize: '11px', color: '#96988e', letterSpacing: '0.08em' }}>
            INITIATE / THE NEXT RESEARCH RUN
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              margin: '20px 0 36px',
              gap: '24px',
            }}
          >
            <h2
              className="pixel"
              style={{
                fontSize: 'clamp(44px, 5.2vw, 84px)',
                lineHeight: 0.9,
                letterSpacing: '-0.04em',
                margin: 0,
                fontWeight: 500,
              }}
            >
              GIVE ACE A QUESTION
              <br />
              <span style={{ color: 'var(--accent-lime, #c8f169)' }}>
                WORTH INVESTIGATING.
              </span>
            </h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '16px',
              maxWidth: '800px',
            }}
          >
            <button
              onClick={onStartChat}
              style={{
                background: 'var(--text-primary, #f0f0e9)',
                color: 'var(--bg-base, #090a09)',
                border: '1px solid var(--text-primary, #f0f0e9)',
                padding: '20px 24px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>OPEN ACE ASSISTANT</span>
              <ArrowRight size={18} />
            </button>

            <button
              onClick={onEnterStudio}
              style={{
                background: 'transparent',
                color: 'var(--text-primary, #f0f0e9)',
                border: '1px solid var(--border-color, #343730)',
                padding: '20px 24px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>EXPLORE WORKSPACE DIRECTLY</span>
              <ExternalLink size={18} />
            </button>
          </div>
        </section>

        {/* Minimal Monochrome Footer */}
        <footer
          style={{
            padding: '40px 32px 80px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '24px',
            fontSize: '11px',
            color: 'var(--text-secondary, #A7A7A0)',
          }}
        >
          <div>
            <strong
              className="pixel"
              style={{
                fontSize: '24px',
                color: 'var(--text-primary, #f0f0e9)',
                display: 'block',
                marginBottom: '8px',
              }}
            >
              ACE // RESEARCH ENGINE
            </strong>
            <p style={{ margin: 0 }}>
              Autonomous Cognitive Engine for Deep Research and Long-Horizon Tasks
            </p>
          </div>

          <div style={{ textAlign: 'right', lineHeight: 1.8 }}>
            BUILT FOR LONG-HORIZON THINKING.
            <br />
            OPEN SOURCE · MIT LICENSE · HUMAN-IN-THE-LOOP
          </div>
        </footer>
      </div>
    </div>
  );
};

const navBtnStyle: React.CSSProperties = {
  border: 0,
  borderLeft: '1px solid var(--border-color, #343730)',
  background: 'transparent',
  padding: '0 24px',
  color: 'var(--text-primary, #f0f0e9)',
  fontSize: '11px',
  letterSpacing: '0.05em',
  display: 'grid',
  placeItems: 'center',
  cursor: 'pointer',
  textDecoration: 'none',
  fontFamily: 'var(--font-mono, monospace)',
  transition: 'all 120ms',
};
