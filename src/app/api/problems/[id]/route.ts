import { NextResponse } from 'next/server';
import sample1 from '@/data/problems/sample1.json';
import sample2 from '@/data/problems/sample2.json';
import { prisma } from '@/lib/db';

function capTags(tags?: string[]) {
  if (!Array.isArray(tags)) return [];
  const uniq = Array.from(new Set(tags.map((t) => `${t}`.trim()).filter(Boolean)));
  return uniq.slice(0, 5);
}

function computeDifficulty(players: number, solvers: number, avgTimeMs: number | null) {
  if (!players || players <= 0) return 500;
  const solveRate = solvers > 0 ? solvers / players : 0;
  const t = avgTimeMs != null ? Math.min(avgTimeMs, 600_000) : 600_000;
  const normT = t / 600_000;
  const score = 1 + 999 * ((0.7 * (1 - solveRate)) + (0.3 * normT));
  return Math.max(1, Math.min(1000, Math.round(score)));
}

const map: Record<string, any> = {
  sample1,
  sample2
};

export async function GET(_req: Request, context: { params: { id: string } }) {
  const { id } = context.params;
  const base = map[id];
  if (!base) return new NextResponse('Not Found', { status: 404 });

  // stats for single problem
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `
    WITH per_user AS (
      SELECT u.deviceId as deviceId,
             a.problemId as problemId,
             MIN(CASE WHEN a.solved THEN a.timeMs END) as bestSolvedTime
      FROM Attempt a
      JOIN User u ON a.userId = u.id
      WHERE a.problemId = $1
      GROUP BY u.deviceId, a.problemId
    )
    SELECT COUNT(*) as players,
           SUM(CASE WHEN bestSolvedTime IS NOT NULL THEN 1 ELSE 0 END) as solvers,
           AVG(CASE WHEN bestSolvedTime IS NOT NULL
                    THEN CASE WHEN bestSolvedTime > 600000 THEN 600000 ELSE bestSolvedTime END
               END) as avgTimeMs
    FROM per_user
    `,
    id
  );
  const r = rows[0] ?? {};
  const players = Number(r.players ?? 0);
  const solvers = Number(r.solvers ?? 0);
  const avgTimeMs: number | null = r.avgTimeMs == null ? null : Number(r.avgTimeMs);
  const accuracy = players > 0 ? Math.round((solvers / players) * 1000) / 10 : 0;
  const difficulty = computeDifficulty(players, solvers, avgTimeMs);

  return NextResponse.json({
    ...base,
    tags: capTags(base.tags),
    stats: { players, solvers, accuracy, avgTimeMs, difficulty }
  });
}
