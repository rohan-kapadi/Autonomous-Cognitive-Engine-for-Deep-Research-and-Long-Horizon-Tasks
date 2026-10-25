import React, { useEffect, useRef, useState } from 'react';

interface TextmodeCanvasProps {
  colorMode?: 'lime' | 'amber' | 'cyan' | 'mono';
  density?: number; // 8 - 24 px per cell
  showContour?: boolean;
  glyphSet?: 'ascii' | 'blocks' | 'binary' | 'matrix';
  interactive?: boolean;
  className?: string;
  opacity?: number;
}

const GLYPH_RAMPS = {
  ascii: ' .:-=+*#%@',
  blocks: ' ░▒▓█',
  binary: ' 01',
  matrix: ' .·:;+=xX$#',
};

const COLOR_MAP = {
  lime: '#C8F169',
  amber: '#E7B567',
  cyan: '#56E1F5',
  mono: '#E8E8E8',
};

export const TextmodeCanvas: React.FC<TextmodeCanvasProps> = ({
  colorMode = 'lime',
  density = 14,
  showContour = true,
  glyphSet = 'matrix',
  interactive = true,
  className = '',
  opacity = 0.28,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: -100, y: -100 });
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener('resize', handleResize);

    const ramp = GLYPH_RAMPS[glyphSet] || GLYPH_RAMPS.matrix;
    const accentColor = COLOR_MAP[colorMode] || COLOR_MAP.lime;
    let t = 0;

    const render = () => {
      t += 0.035;
      ctx.clearRect(0, 0, width, height);
      ctx.font = `${density}px 'JetBrains Mono', monospace`;
      ctx.textBaseline = 'top';

      const cols = Math.floor(width / density);
      const rows = Math.floor(height / (density * 1.2));

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * density;
          const y = r * density * 1.2;

          // Mathematical generative field: research ripple wave + agent signal pulses
          const nx = c / cols - 0.5;
          const ny = r / rows - 0.5;
          const distFromCenter = Math.sqrt(nx * nx + ny * ny);

          // Interactive cursor gravity
          let cursorDist = 1;
          if (interactive && mousePos.x > 0) {
            const dx = x - mousePos.x;
            const dy = y - mousePos.y;
            cursorDist = Math.max(0.1, Math.sqrt(dx * dx + dy * dy) / 180);
          }

          // Composite wave simulating multi-agent neural computation
          const wave1 = Math.sin(c * 0.18 + t * 0.8) * Math.cos(r * 0.14 - t * 0.6);
          const wave2 = Math.sin(distFromCenter * 14 - t * 1.2);
          const noise = (wave1 + wave2 + 2) / 4;

          const intensity = Math.min(1, Math.max(0, noise / cursorDist));
          const glyphIdx = Math.floor(intensity * (ramp.length - 1));
          const char = ramp[glyphIdx] || ' ';

          if (char !== ' ') {
            // Contour edge illumination
            const isContour = showContour && intensity > 0.65;
            ctx.fillStyle = isContour ? '#FFFFFF' : accentColor;
            ctx.globalAlpha = isContour ? 0.85 : Math.max(0.15, intensity * 0.7);
            ctx.fillText(char, x, y);
          }
        }
      }

      ctx.globalAlpha = 1.0;
      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [colorMode, density, showContour, glyphSet, interactive, mousePos]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: -100, y: -100 });
  };

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: interactive ? 'auto' : 'none',
        opacity,
        overflow: 'hidden',
        zIndex: 0,
      }}
      className={className}
    >
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    </div>
  );
};
