import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = (searchParams.get('mode') ?? 'A').toUpperCase();
  const tier = searchParams.get('tier') ?? 'tamago';
  const limit = Number(searchParams.get('limit') ?? 20);

  const rows = await prisma.$queryRawUnsafe<any[]>(
    `
      SELECT u.deviceId as deviceId,
             MAX(s.score) as bestScore,
             MIN(s.durationMs) as bestTime
      FROM GameSession s
      JOIN User u ON s.userId = u.id
      WHERE s.mode = $1 AND s.tier = $2
      GROUP BY u.deviceId
      ORDER BY bestScore DESC, bestTime ASC
      LIMIT $3
    `,
    mode, tier, limit
  );

  return NextResponse.json({ items: rows });
}
