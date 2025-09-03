// src/components/HomeMenu.tsx
'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { TIER_LABELS, type Tier } from '@/lib/score';

/** TIER_LABELS が配列/Record どちらでも扱えるように Record に寄せる */
type LabelsRecord = Record<number, string>;
function toLabelsRecord(src: unknown): LabelsRecord {
  if (Array.isArray(src)) {
    const r: LabelsRecord = {};
    (src as readonly string[]).forEach((v, i) => {
      r[i] = v;
    });
    return r;
  }
  return src as LabelsRecord;
}

const LABELS: LabelsRecord = toLabelsRecord(TIER_LABELS);

/** 利用可能な Tier 値（数値キー）を抽出して昇順に */
const TIER_VALUES: number[] = Object.keys(LABELS)
  .map((k) => Number(k))
  .filter((n) => Number.isFinite(n))
  .sort((a, b) => a - b);

const MIN_TIER = TIER_VALUES[0] ?? 0;
const MAX_TIER = TIER_VALUES[TIER_VALUES.length - 1] ?? 0;

/** 任意の値を安全に Tier のレンジへ寄せる */
function parseTier(v: unknown): Tier {
  const n = Math.round(Number(v));
  const clamped = Number.isFinite(n)
    ? Math.min(MAX_TIER, Math.max(MIN_TIER, n))
    : MIN_TIER;
  return (clamped as unknown) as Tier;
}

const DEFAULT_TIER = (MIN_TIER as unknown) as Tier;

export default function HomeMenu() {
  const [tier, setTier] = useState<Tier>(DEFAULT_TIER);
  const [locked, setLocked] = useState(false);

  // 初回ロードで保存値を復元
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = window.localStorage.getItem('tier');
    if (saved != null) setTier(parseTier(saved));
    setLocked(window.localStorage.getItem('tier_lock') === '1');
  }, []);

  // tier / ロック状態を保存
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('tier_lock', locked ? '1' : '0');
    if (locked) {
      window.localStorage.setItem('tier', String((tier as unknown) as number));
    }
  }, [tier, locked]);

  const tierOptions = useMemo(
    () =>
      TIER_VALUES.map((t) => (
        <option key={t} value={t}>
          {LABELS[t]}
        </option>
      )),
    []
  );

  return (
    <main
      className="stack"
      style={{ maxWidth: 920, margin: '0 auto', padding: '28px 16px 48px' }}
    >
      <h1
        className="page-title neon neon-aqua"
        style={{ textAlign: 'center', marginBottom: 18 }}
      >
        詰碁ミニ
      </h1>

      <section className="card neonable" style={{ marginBottom: 16 }}>
        <div
          className="row"
          style={{
            display: 'grid',
            gridTemplateColumns: 'auto 1fr auto',
            gap: 12,
            alignItems: 'center',
          }}
        >
          <label htmlFor="tier" style={{ color: 'var(--muted)' }}>
            難易度
          </label>

          <select
            id="tier"
            value={((tier as unknown) as number) ?? MIN_TIER}
            disabled={locked}
            title={locked ? '前回の難易度を保持します（ロック中）' : '難易度を選択できます'}
            onChange={(e) => setTier(parseTier(e.target.value))}
          >
            {tierOptions}
          </select>

          <button
            type="button"
            className={`btn ${locked ? 'is-on' : ''}`}
            aria-pressed={locked}
            onClick={() => setLocked((v) => !v)}
            title={locked ? 'ロック解除' : '難易度をロック'}
            style={{
              background: '#0f1115',
              color: '#cbd5e1',
              border: '1px solid #2d3640',
              padding: '8px 12px',
              borderRadius: 10,
            }}
          >
            {locked ? '🔒 ロック中' : '🔓 ロック'}
          </button>
        </div>

        <p className="muted" style={{ marginTop: 8 }}>
          選んだ難易度はブラウザに保存され、ロック中は次回以降も自動で適用されます。
        </p>
      </section>

      <div
        className="grid"
        style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr', marginTop: 8 }}
      >
        <Link href="/practice" className="card neonable neon-aqua" style={{ textDecoration: 'none' }}>
          <h2 style={{ margin: '0 0 8px' }}>練習問題を解く</h2>
          <p className="muted">基本〜実戦まで。平均時間や正解率の統計付き。</p>
        </Link>

        <Link href="/modes" className="card neonable neon-pink" style={{ textDecoration: 'none' }}>
          <h2 style={{ margin: '0 0 8px' }}>モード選択</h2>
          <p className="muted">スプリントやタイムアタックなど、遊び方を切り替え。</p>
        </Link>

        <Link href="/leaderboard" className="card neonable neon-gold" style={{ textDecoration: 'none' }}>
          <h2 style={{ margin: '0 0 8px' }}>ランキング</h2>
          <p className="muted">端末別ベストスコア・最速タイム。上位に食い込もう！</p>
        </Link>
      </div>
    </main>
  );
}
