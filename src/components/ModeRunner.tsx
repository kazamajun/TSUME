'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import ProblemPlayer from './ProblemPlayer';
import { filterByTier, pickRandom } from '@/lib/problems';
import { Tier, Mode, computeSessionScore, TIER_LABELS } from '@/lib/score';
import { ensureDeviceId } from '@/lib/id';
import type { Problem as TsumegoProblem } from '@/lib/tsumego';

// ← ここがポイント：tsumego の Problem を使い、stats を上乗せ
type ProblemWithStats = TsumegoProblem & { stats?: { difficulty?: number } };

const MODE_LIMIT_MS: Record<Mode, number | undefined> = {
  A: 60_000,
  B: 300_000,
  C: undefined,
  D: undefined
};

export default function ModeRunner({
  initialProblems,
  mode,
  tier
}: {
  initialProblems: ProblemWithStats[];
  mode: Mode;
  tier: Tier;
}) {
  const pool = useMemo(() => filterByTier(initialProblems, tier), [initialProblems, tier]);
  const [current, setCurrent] = useState<ProblemWithStats>(() => pickRandom(pool));
  const [solvedCount, setSolved] = useState(0);
  const [wrongCount, setWrong] = useState(0);
  const [running, setRunning] = useState(true);
  const [finished, setFinished] = useState(false);
  const [summary, setSummary] = useState<{ score: number; durationMs: number } | null>(null);

  const startRef = useRef<number>(0);
  const tickRef = useRef<any>(null);

  const limitMs = MODE_LIMIT_MS[mode];

  useEffect(() => {
    startRef.current = performance.now();
    if (limitMs) {
      tickRef.current = setInterval(() => {
        const elapsed = performance.now() - startRef.current;
        if (elapsed >= limitMs) endSession();
      }, 200);
    }
    return () => clearInterval(tickRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, tier]);

  function nextProblem() {
    setCurrent(pickRandom(pool));
  }

  function handleSolved(r: { moves: number; wrongs: number; timeMs: number }) {
    if (!running) return;
    setSolved((s) => s + 1);
    setWrong((w) => w + r.wrongs);

    if (mode === 'C' && solvedCount + 1 >= 5) return endSession();
    if (mode === 'D' && wrongCount + r.wrongs >= 5) return endSession();
    nextProblem();
  }

  function endSession() {
    if (finished) return;
    setRunning(false);
    setFinished(true);
    const durationMs = Math.round(performance.now() - startRef.current);
    const score = computeSessionScore({ mode, solvedCount, wrongCount, limitMs, durationMs });
    setSummary({ score, durationMs });
    const deviceId = ensureDeviceId();
    void fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId, mode, tier, solvedCount, wrongCount, durationMs, score })
    }).catch(() => {});
  }

  const elapsedMs = Math.round(performance.now() - startRef.current);
  const remainMs = Math.max(0, (limitMs ?? 0) - elapsedMs);

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <h1>モード {mode}（{TIER_LABELS[tier]}）</h1>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <div>解いた数: <strong>{solvedCount}</strong></div>
        <div>ミス合計: <strong>{wrongCount}</strong></div>
        {limitMs ? (
          <div>残り時間: <strong>{Math.ceil(remainMs / 1000)}s</strong></div>
        ) : (
          <div>経過: <strong>{Math.floor(elapsedMs / 1000)}s</strong></div>
        )}
      </div>

      {!finished && (
        // ProblemPlayer は tsumego の Problem なのでそのまま渡してOK
        <ProblemPlayer problem={current} onSolved={handleSolved} submitAttempt />
      )}

      {finished && summary && (
        <div style={{ border: '1px solid #e5e5e5', borderRadius: 8, padding: 16 }}>
          <h2>結果</h2>
          <div>スコア: <strong>{summary.score}</strong></div>
          <div>時間: <strong>{summary.durationMs} ms</strong></div>
          <div>解いた数: <strong>{solvedCount}</strong> ／ ミス: <strong>{wrongCount}</strong></div>
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button onClick={() => location.reload()}>もう一度</button>
            <a href={`/leaderboard/modes`}><button>モードランキングを見る</button></a>
          </div>
        </div>
      )}

      {!finished && (mode === 'A' || mode === 'B') && (
        <button onClick={endSession}>途中終了</button>
      )}
    </div>
  );
}
