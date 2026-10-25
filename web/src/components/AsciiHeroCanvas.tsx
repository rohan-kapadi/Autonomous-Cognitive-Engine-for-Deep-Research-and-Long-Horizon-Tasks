import React, { useEffect, useRef } from 'react';

interface AsciiHeroCanvasProps {
  opacity?: number;
  color?: string;
}

export const AsciiHeroCanvas: React.FC<AsciiHeroCanvasProps> = ({
  opacity = 0.38,
  color = '#A3A69A',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let frame = 0;
    let cw = 0;
    let ch = 0;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cw = rect.width;
      ch = rect.height;
      canvas.width = Math.floor(cw * dpr);
      canvas.height = Math.floor(ch * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);

    const chars = ['.', '=', '+', '#', '%', '*', ':'];

    const render = () => {
      ctx.clearRect(0, 0, cw, ch);
      const step = 16;
      ctx.font = '11px "Space Mono", monospace';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';

      for (let y = 16; y < ch; y += step) {
        for (let x = 12; x < cw; x += step) {
          const nx = x / cw;
          const ny = y / ch;

          // Multi-frequency wave formula creating topographic / network contour
          const wave1 = Math.sin(nx * 14 + frame * 0.012) * Math.cos(ny * 12 - frame * 0.008);
          const distToCenter = Math.hypot(nx - 0.68, ny - 0.42);
          const wave2 = Math.sin(nx * 24 + ny * 10 + frame * 0.005) * 0.2;
          const val = wave1 * 0.35 + wave2 - distToCenter * 0.45;

          if (val > -0.22) {
            const alpha = Math.max(0.06, Math.min(opacity, (val + 0.32) * opacity * 1.5));
            ctx.fillStyle = color.startsWith('#')
              ? hexToRgba(color, alpha)
              : `rgba(185, 198, 174, ${alpha})`;

            let char = '.';
            if (val > 0.28) char = '#';
            else if (val > 0.16) char = '+';
            else if (val > 0.04) char = '=';
            else if (val > -0.08) char = ':';

            ctx.fillText(char, x, y);
          }
        }
      }

      if (!prefersReducedMotion) {
        frame += 1;
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [opacity, color]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1,
      }}
      aria-hidden="true"
    />
  );
};

function hexToRgba(hex: string, alpha: number): string {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map((x) => x + x).join('');
  }
  const num = parseInt(c, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`;
}
