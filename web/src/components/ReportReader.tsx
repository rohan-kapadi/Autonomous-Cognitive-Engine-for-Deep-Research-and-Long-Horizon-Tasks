import React, { useState } from 'react';
import { FileText, Download, Copy, Check, Printer, Clock, ShieldCheck, Share2 } from 'lucide-react';

interface ReportReaderProps {
  reportMarkdown: string;
  topic: string;
  runId: string;
  timestamp: string;
}

export const ReportReader: React.FC<ReportReaderProps> = ({
  reportMarkdown,
  topic,
  runId,
  timestamp,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(reportMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([reportMarkdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ACE_Report_${runId}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Estimate word count & reading time
  const wordCount = reportMarkdown.split(/\s+/).length;
  const readTime = Math.ceil(wordCount / 200);

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: 'var(--space-xl) var(--space-lg)' }}>
      {/* Report Header Metadata Card */}
      <div
        className="border-hairline"
        style={{
          background: 'var(--bg-surface)',
          padding: '18px 24px',
          borderRadius: 'var(--radius-sm)',
          marginBottom: 'var(--space-xl)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={16} color="var(--accent-lime)" />
            <span className="text-meta" style={{ color: 'var(--accent-lime)' }}>
              SYNTHESIZED RESEARCH REPORT // {runId}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleCopy}
              className="btn btn-secondary"
              style={{ padding: '4px 8px', fontSize: '10px' }}
            >
              {copied ? <Check size={11} /> : <Copy size={11} />}
              {copied ? 'COPIED' : 'COPY MARKDOWN'}
            </button>
            <button
              onClick={handleDownload}
              className="btn btn-primary"
              style={{ padding: '4px 10px', fontSize: '10px' }}
            >
              <Download size={11} />
              DOWNLOAD .MD
            </button>
          </div>
        </div>

        <h1
          style={{
            fontSize: '22px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
            marginBottom: '10px',
          }}
        >
          {topic}
        </h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <span className="mono-data tabular" style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>
            <Clock size={11} style={{ display: 'inline', marginRight: '4px' }} />
            {readTime} min read · {wordCount.toLocaleString()} words
          </span>
          <span style={{ color: 'var(--text-tertiary)' }}>•</span>
          <span className="mono-data tabular" style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>
            GENERATED: {timestamp}
          </span>
          <span style={{ color: 'var(--text-tertiary)' }}>•</span>
          <span className="status-pill completed" style={{ fontSize: '9px' }}>
            GROUNDED IN VERIFIED SOURCES
          </span>
        </div>
      </div>

      {/* Rendered Markdown Body */}
      <article
        className="border-hairline"
        style={{
          background: 'var(--bg-surface)',
          padding: '32px 40px',
          borderRadius: 'var(--radius-sm)',
          fontSize: '13px',
          lineHeight: 1.7,
          color: 'var(--text-primary)',
        }}
      >
        <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'var(--font-sans)' }}>
          {reportMarkdown}
        </div>
      </article>
    </div>
  );
};
