import { NextResponse } from 'next/server';
import sample1 from '@/data/problems/sample1.json';
import sample2 from '@/data/problems/sample2.json';
import { prisma } from '@/lib/db';

type StatRow = {
  problemId: string;
  players: number | bigint;
  solvers: number | bigint;
  avgTimeMs: number | bigint | null;
};

function toNum(v: number | bigint | null | undefined) {
  return v == null ? null : Number(v);
}

function capTags(tags?: string[]) {
  if (!Array.isArray(tags)) return [];
  const uniq = Array.from(new Set(tags.map((t) => `${t}`.trim()).filter(Boolean)));
  return uniq.slice(0, 5);
}

function computeDifficulty(players: number, solvers: number, avgTimeMs: number | null) {
  if (!players || players <= 0) return 500; // 未プレイは中間
  const solveRate = solvers > 0 ? solvers / players : 0;
  const t = avgTimeMs != null ? Math.min(avgTimeMs, 600_000) : 600_000; // 未解は最大扱い
  const normT = t / 600_000;
  const score = 1 + 999 * ((0.7 * (1 - solveRate)) + (0.3 * normT));
  return Math.max(1, Math.min(1000, Math.round(score)));
}

export async function GET() {
  // 端末ID単位で挑戦/解答状況を集約
  const stats = await prisma.$queryRawUnsafe<StatRow[]>(
    `
    WITH per_user AS (
      SELECT u.deviceId as deviceId,
             a.problemId as problemId,
             MIN(CASE WHEN a.solved THEN a.timeMs END) as bestSolvedTime
      FROM Attempt a
      JOIN User u ON a.userId = u.id
      GROUP BY u.deviceId, a.problemId
    )
    SELECT problemId,
           COUNT(*) as players,
           SUM(CASE WHEN bestSolvedTime IS NOT NULL THEN 1 ELSE 0 END) as solvers,
           AVG(CASE WHEN bestSolvedTime IS NOT NULL
                    THEN CASE WHEN bestSolvedTime > 600000 THEN 600000 ELSE bestSolvedTime END
               END) as avgTimeMs
    FROM per_user
    GROUP BY problemId
  `
  );
  const statMap = new Map<string, { players: number; solvers: number; avgTimeMs: number | null }>();
  for (const r of stats) {
    statMap.set(r.problemId, {
      players: Number(r.players ?? 0),
      solvers: Number(r.solvers ?? 0),
      avgTimeMs: toNum(r.avgTimeMs),
    });
  }

  // JSONソースを列挙（後でDB化予定）
  const base = [sample1, sample2].map((p: any) => ({
    ...p,
    tags: capTags(p.tags),
  }));

  const items = base.map((p) => {
    const s = statMap.get(p.id) ?? { players: 0, solvers: 0, avgTimeMs: null as number | null };
    const accuracy = s.players > 0 ? Math.round((s.solvers / s.players) * 1000) / 10 : 0; // 0.1%刻み
    const difficulty = computeDifficulty(s.players, s.solvers, s.avgTimeMs);
    return {
      ...p,
      stats: {
        players: s.players,
        solvers: s.solvers,
        accuracy,          // %
        avgTimeMs: s.avgTimeMs, // ms (null可)
        difficulty         // 1..1000
      }
    };
  });

  return NextResponse.json({ items });
}
