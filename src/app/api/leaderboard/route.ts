import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

type RawRow = {
  deviceId?: string; deviceid?: string;
  bestScore?: number | bigint; bestscore?: number | bigint;
  bestTime?: number | bigint; besttime?: number | bigint;
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const problemId = searchParams.get('problemId') ?? 'sample1';
  const limit = Number(searchParams.get('limit') ?? 20);

  // 最高スコアでランキング。1端末=ベストスコアに集約
  const rows = await prisma.$queryRawUnsafe<RawRow[]>(
    `SELECT u.deviceId as deviceId, MAX(a.score) as bestScore, MIN(a.timeMs) as bestTime
     FROM Attempt a JOIN User u ON a.userId = u.id
     WHERE a.problemId = $1
     GROUP BY u.deviceId
     ORDER BY bestScore DESC, bestTime ASC
     LIMIT $2`,
    problemId,
    limit
  );

  // SQLite では集計が bigint で返ることがあるので JSON 返却前に number へ変換
  const items = rows.map((r) => ({
    deviceId: String(r.deviceId ?? (r as any).deviceid),
    bestScore: Number(r.bestScore ?? (r as any).bestscore ?? 0),
    bestTime: Number(r.bestTime ?? (r as any).besttime ?? 0)
  }));

  return NextResponse.json({ items });
}
