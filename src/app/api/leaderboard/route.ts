import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const runtime = 'nodejs';        // Prisma を使うので Node.js 実行
export const dynamic = 'force-dynamic'; // キャッシュさせない（任意）

const prisma = new PrismaClient();

// API: /api/leaderboard?problemId=sample1&limit=50
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const problemId = searchParams.get('problemId') ?? 'sample1';
  const limit = Number(searchParams.get('limit') ?? '50');

  // Prisma の $queryRaw から返る行の型を定義（DBの大文字/小文字差も吸収）
  type RawRow = {
    deviceId?: string | null;
    deviceid?: string | null;
    bestScore?: number | bigint | null;
    bestscore?: number | bigint | null;
    bestTime?: number | bigint | null;
    besttime?: number | bigint | null;
  };

  // 問題ごとの最高スコア＆最速タイム（同点は時間が短い順）
  const rows = await prisma.$queryRaw<RawRow[]>`
    SELECT u."deviceId" as "deviceId",
           MAX(a.score)     as "bestScore",
           MIN(a."timeMs")  as "bestTime"
    FROM "Attempt" a
    JOIN "User" u ON a."userId" = u.id
    WHERE a."problemId" = ${problemId}
    GROUP BY u."deviceId"
    ORDER BY "bestScore" DESC, "bestTime" ASC
    LIMIT ${limit};
  `;

  // bigint が含まれても Number 化して JSON に安全に載せる
  const items = rows.map((r: RawRow) => ({
    deviceId: String(r.deviceId ?? r.deviceid ?? ''),
    bestScore: Number(r.bestScore ?? r.bestscore ?? 0),
    bestTime: Number(r.bestTime ?? r.besttime ?? 0),
  }));

  return NextResponse.json({ items });
}
