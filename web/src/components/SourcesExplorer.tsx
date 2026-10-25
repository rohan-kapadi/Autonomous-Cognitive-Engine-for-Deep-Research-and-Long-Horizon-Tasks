import React, { useState } from 'react';
import { Bookmark, Search, ExternalLink, Copy, Check, Filter, Globe } from 'lucide-react';
import { SourceItem } from '../types/research';

interface SourcesExplorerProps {
  sources: SourceItem[];
}

export const SourcesExplorer: React.FC<SourcesExplorerProps> = ({ sources }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const domains = ['ALL', ...Array.from(new Set(sources.map((s) => s.domain)))];

  const filteredSources = sources.filter((s) => {
    const matchesDomain = selectedDomain === 'ALL' || s.domain === selectedDomain;
    const matchesSearch =
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.domain.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDomain && matchesSearch;
  });

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div style={{ padding: 'var(--space-xl)', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <Bookmark size={16} color="var(--accent-lime)" />
          <span className="text-meta" style={{ color: 'var(--accent-lime)' }}>
            EVIDENCE REPOSITORY // SOURCES & BIBLIOGRAPHY
          </span>
        </div>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
          Research Evidence Grounding ({sources.length} Sources Gathered)
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
          Every factual assertion, statistic, and recommendation in the generated ACE reports is
          anchored to extracted source passages from web search, peer literature, and local domain documents.
        </p>
      </div>

      {/* Search & Domain Filter Bar */}
      <div
        style={{
          display: 'flex',
          gap: 'var(--space-sm)',
          marginBottom: 'var(--space-md)',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
          <Search
            size={13}
            color="var(--text-tertiary)"
            style={{ position: 'absolute', left: '10px', top: '10px' }}
          />
          <input
            type="text"
            placeholder="Search sources by title, domain, or extracted excerpt..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              padding: '7px 10px 7px 32px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12px',
              outline: 'none',
            }}
          />
        </div>

        {/* Domain Filter Select */}
        <select
          value={selectedDomain}
          onChange={(e) => setSelectedDomain(e.target.value)}
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
            padding: '7px 12px',
            borderRadius: 'var(--radius-sm)',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            outline: 'none',
          }}
        >
          {domains.map((d) => (
            <option key={d} value={d}>
              DOMAIN: {d}
            </option>
          ))}
        </select>
      </div>

      {/* Sources List / Table */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
        {filteredSources.map((source) => (
          <div
            key={source.id}
            className="border-hairline"
            style={{
              background: 'var(--bg-surface)',
              padding: '12px 16px',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '12px',
              }}
            >
              <div>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-lime)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                >
                  {source.title}
                  <ExternalLink size={11} color="var(--accent-lime)" />
                </a>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                  <span className="mono-data" style={{ color: 'var(--accent-lime)', fontSize: '11px' }}>
                    <Globe size={10} style={{ display: 'inline', marginRight: '3px' }} />
                    {source.domain}
                  </span>
                  <span style={{ color: 'var(--text-tertiary)', fontSize: '10px' }}>•</span>
                  <span className="text-meta" style={{ fontSize: '10px' }}>
                    TASK: {source.taskTitle}
                  </span>
                  <span style={{ color: 'var(--text-tertiary)', fontSize: '10px' }}>•</span>
                  <span className="mono-data tabular" style={{ color: 'var(--text-tertiary)', fontSize: '10px' }}>
                    {source.retrievalTimestamp}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="status-pill completed" style={{ fontSize: '9px' }}>
                  {source.status.replace(/_/g, ' ').toUpperCase()}
                </span>
                <button
                  onClick={() => handleCopy(source.id, source.url)}
                  className="btn btn-secondary"
                  style={{ padding: '3px 6px', fontSize: '10px' }}
                  title="Copy Source URL"
                >
                  {copiedId === source.id ? <Check size={10} /> : <Copy size={10} />}
                  {copiedId === source.id ? 'COPIED' : 'URL'}
                </button>
              </div>
            </div>

            {/* Quoted Excerpt */}
            <div
              style={{
                marginTop: '4px',
                padding: '8px 10px',
                background: 'var(--bg-base)',
                borderLeft: '2px solid var(--accent-lime)',
                borderRadius: 'var(--radius-xs)',
                fontSize: '11px',
                lineHeight: 1.5,
                color: 'var(--text-secondary)',
              }}
            >
              "{source.excerpt}"
            </div>
          </div>
        ))}

        {filteredSources.length === 0 && (
          <div
            className="border-hairline"
            style={{
              padding: '32px',
              textAlign: 'center',
              color: 'var(--text-tertiary)',
              background: 'var(--bg-surface)',
            }}
          >
            No sources found matching current filters.
          </div>
        )}
      </div>
    </div>
  );
};
