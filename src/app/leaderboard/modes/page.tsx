'use client';
import { useEffect, useState } from 'react';
import { Tier, TIER_LABELS } from '@/lib/score';

export default function ModeLeaderboardPage() {
  const [mode, setMode] = useState<'A'|'B'|'C'|'D'>('A');
  const [tier, setTier] = useState<Tier>('tamago');
  const [rows, setRows] = useState<{ deviceId: string; bestScore: number; bestTime: number }[]>([]);

  useEffect(() => {
    fetch(`/api/sessions/leaderboard?mode=${mode}&tier=${tier}`)
      .then(r => r.json())
      .then(d => setRows(d.items ?? []))
      .catch(() => setRows([]));
  }, [mode, tier]);

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <h1>モードランキング</h1>
      <div style={{ display: 'flex', gap: 12 }}>
        <select value={mode} onChange={e => setMode(e.target.value as any)}>
          <option value="A">A：1分</option>
          <option value="B">B：5分</option>
          <option value="C">C：5問解く</option>
          <option value="D">D：5ミス</option>
        </select>
        <select value={tier} onChange={e => setTier(e.target.value as Tier)}>
          {Object.entries(TIER_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      <table>
        <thead><tr><th>#</th><th>端末ID</th><th>スコア</th><th>最速(ミリ秒)</th></tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.deviceId}>
              <td>{i+1}</td>
              <td>{r.deviceId.slice(0,8)}…</td>
              <td>{r.bestScore}</td>
              <td>{r.bestTime}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
