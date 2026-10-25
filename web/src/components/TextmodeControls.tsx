import React, { useState } from 'react';
import { Sliders, Eye, EyeOff, Sparkles, Monitor, X, ChevronDown, ChevronUp } from 'lucide-react';

interface TextmodeControlsProps {
  colorMode: 'lime' | 'amber' | 'cyan' | 'mono';
  setColorMode: (color: 'lime' | 'amber' | 'cyan' | 'mono') => void;
  density: number;
  setDensity: (d: number) => void;
  showContour: boolean;
  setShowContour: (c: boolean) => void;
  glyphSet: 'ascii' | 'blocks' | 'binary' | 'matrix';
  setGlyphSet: (g: 'ascii' | 'blocks' | 'binary' | 'matrix') => void;
  opacity: number;
  setOpacity: (o: number) => void;
  crtEnabled: boolean;
  setCrtEnabled: (e: boolean) => void;
  visible: boolean;
  setVisible: (v: boolean) => void;
}

export const TextmodeControls: React.FC<TextmodeControlsProps> = ({
  colorMode,
  setColorMode,
  density,
  setDensity,
  showContour,
  setShowContour,
  glyphSet,
  setGlyphSet,
  opacity,
  setOpacity,
  crtEnabled,
  setCrtEnabled,
  visible,
  setVisible,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  if (!visible) {
    return (
      <button
        onClick={() => setVisible(true)}
        className="btn btn-secondary font-mono"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 100,
          background: 'var(--bg-surface)',
          borderColor: 'var(--border-color)',
          fontSize: '11px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
        title="Open Textmode Matrix Controls"
      >
        <Sliders size={13} color="var(--accent-lime)" />
        TEXTMODE OVERLAY
      </button>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        width: '300px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-sm)',
        zIndex: 100,
        boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-panel)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={13} color="var(--accent-lime)" />
          <span className="text-meta" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
            TEXTMODE MATRIX FX
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="btn btn-icon btn-secondary"
            style={{ padding: '2px', border: 'none', background: 'transparent' }}
          >
            {collapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button
            onClick={() => setVisible(false)}
            className="btn btn-icon btn-secondary"
            style={{ padding: '2px', border: 'none', background: 'transparent' }}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Body Controls */}
      {!collapsed && (
        <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Color Palettes */}
          <div>
            <div className="text-meta" style={{ marginBottom: '6px' }}>
              PHOSPHOR PALETTE
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {(['lime', 'amber', 'cyan', 'mono'] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setColorMode(c)}
                  className={`btn ${colorMode === c ? 'btn-primary' : 'btn-secondary'}`}
                  style={{
                    flex: 1,
                    padding: '4px',
                    fontSize: '10px',
                    textTransform: 'uppercase',
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Glyph Set */}
          <div>
            <div className="text-meta" style={{ marginBottom: '6px' }}>
              GLYPH RAMP SET
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              {(['matrix', 'ascii', 'blocks', 'binary'] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setGlyphSet(g)}
                  className={`btn ${glyphSet === g ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '4px 6px', fontSize: '10px' }}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Density Slider */}
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '4px',
              }}
            >
              <span className="text-meta">CELL DENSITY</span>
              <span className="font-mono tabular" style={{ fontSize: '11px', color: 'var(--accent-lime)' }}>
                {density}px
              </span>
            </div>
            <input
              type="range"
              min="8"
              max="24"
              step="1"
              value={density}
              onChange={(e) => setDensity(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent-lime)' }}
            />
          </div>

          {/* Opacity Slider */}
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '4px',
              }}
            >
              <span className="text-meta">CANVAS OPACITY</span>
              <span className="font-mono tabular" style={{ fontSize: '11px', color: 'var(--accent-lime)' }}>
                {Math.round(opacity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.8"
              step="0.05"
              value={opacity}
              onChange={(e) => setOpacity(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent-lime)' }}
            />
          </div>

          {/* Toggles */}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
            <button
              onClick={() => setShowContour(!showContour)}
              className={`btn ${showContour ? 'btn-secondary' : 'btn-secondary'}`}
              style={{
                flex: 1,
                fontSize: '10px',
                borderColor: showContour ? 'var(--accent-lime)' : 'var(--border-color)',
                color: showContour ? 'var(--accent-lime)' : 'var(--text-secondary)',
              }}
            >
              {showContour ? <Eye size={12} /> : <EyeOff size={12} />}
              CONTOUR MIX
            </button>
            <button
              onClick={() => setCrtEnabled(!crtEnabled)}
              className={`btn btn-secondary`}
              style={{
                flex: 1,
                fontSize: '10px',
                borderColor: crtEnabled ? 'var(--accent-amber)' : 'var(--border-color)',
                color: crtEnabled ? 'var(--accent-amber)' : 'var(--text-secondary)',
              }}
            >
              <Monitor size={12} />
              CRT SCANLINES
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
