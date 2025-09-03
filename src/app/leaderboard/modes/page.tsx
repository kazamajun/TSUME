'use client';

import { useEffect, useState } from 'react';
import type { Tier } from '@/lib/score';

type Row = { deviceId: string; bestScore: number; bestTime: number };

/** string/number → Tier への安全変換（数値化してからキャスト） */
const toTier = (v: string | number): Tier => {
  const n = typeof v === 'number' ? v : Number(v);
  return (Number.isFinite(n) ? n : 0) as unknown as Tier;
};

export default function ModeLeaderboardPage() {
  const [mode, setMode] = useState<'A' | 'B' | 'C' | 'D'>('A');
  // ここがポイント：文字列 'tamago' は使わず、数値を Tier に正規化
  const [tier, setTier] = useState<Tier>(toTier(0));
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      const res = await fetch(`/api/leaderboard?problemId=sample1`, {
        cache: 'no-store',
        signal: ac.signal,
      });
      if (!res.ok) return;
      const data = await res.json();
      const items = (data.items as any[]).map((r) => ({
        deviceId: String(r.deviceId ?? r.deviceid ?? ''),
        bestScore: Number(r.bestScore ?? r.bestscore ?? 0),
        bestTime: Number(r.bestTime ?? r.besttime ?? 0),
      }));
      setRows(items);
    })().catch(() => {});
    return () => ac.abort();
  }, [mode, tier]);

  return (
    <div className="stack">
      <h1 className="page-title">モード別ランキング</h1>

      <div className="row" style={{ gap: 12, marginBottom: 16 }}>
        {/* モード選択 */}
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as 'A' | 'B' | 'C' | 'D')}
        >
          {(['A', 'B', 'C', 'D'] as const).map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        {/* ティア選択（value は number、onChange で toTier） */}
        <select
          value={Number(tier)}
          onChange={(e) => setTier(toTier(e.target.value))}
          title="難易度ティア"
        >
          {[0, 1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              Tier {n}
            </option>
          ))}
        </select>
      </div>

      <div className="card" style={{ maxWidth: 980, margin: '0 auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>端末ID</th>
              <th>スコア</th>
              <th>最速(ミリ秒)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={`${r.deviceId}-${i}`}>
                <td>{i + 1}</td>
                <td>{r.deviceId.slice(0, 8)}…</td>
                <td>{r.bestScore}</td>
                <td>{r.bestTime}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
