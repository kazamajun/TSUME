'use client';
import React, { useMemo } from 'react';
import { Color } from '@/lib/board';

type Props = {
  size: number;            // 9/13/19
  grid: Color[][];         // [y][x]
  onPlay?: (x: number, y: number) => void;
};

export default function GoBoard({ size, grid, onPlay }: Props) {
  const cell = 36;  // px
  const pad = 20;   // 盤外余白
  const dim = pad * 2 + cell * (size - 1);

  const stars = useMemo(() => {
    const pts: [number, number][] = [];
    if (size >= 9) {
      const s = size === 9 ? [2, 4, 6] : size === 13 ? [3, 6, 9] : [3, 9, 15];
      for (const x of s) for (const y of s) pts.push([x, y]);
    }
    return pts;
  }, [size]);

  function handleClick(e: React.MouseEvent<SVGSVGElement>) {
    if (!onPlay) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - pad;
    const y = e.clientY - rect.top - pad;
    // グリッドに吸着 + 盤内にクランプ
    const gx = Math.max(0, Math.min(size - 1, Math.round(x / cell)));
    const gy = Math.max(0, Math.min(size - 1, Math.round(y / cell)));
    onPlay(gx, gy);
  }

  return (
    <svg width={dim} height={dim} onClick={handleClick} style={{ touchAction: 'manipulation' }}>
      <rect x={0} y={0} width={dim} height={dim} fill="#DEB887" />
      {Array.from({ length: size }, (_, i) => (
        <g key={i}>
          <line x1={pad} y1={pad + i * cell} x2={dim - pad} y2={pad + i * cell} stroke="#333" />
          <line x1={pad + i * cell} y1={pad} x2={pad + i * cell} y2={dim - pad} stroke="#333" />
        </g>
      ))}
      {stars.map(([ix, iy], i) => (
        <circle key={`s-${i}`} cx={pad + ix * cell} cy={pad + iy * cell} r={3} fill="#333" />
      ))}
      {grid.map((row, y) =>
        row.map((c, x) => {
          if (c === 0) return null;
          const cx = pad + x * cell;
          const cy = pad + y * cell;
          return (
            <circle
              key={`p-${x}-${y}`}
              cx={cx}
              cy={cy}
              r={cell * 0.45}
              fill={c === 1 ? '#000' : '#fff'}
              stroke="#000"
            />
          );
        })
      )}
    </svg>
  );
}
