import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const runtime = 'nodejs';        // Prisma を使うので Node.js 実行
export const dynamic = 'force-dynamic'; // キャッシュさせない（任意）

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const deviceId   = String(body.deviceId ?? '').trim();
    const problemId  = String(body.problemId ?? '').trim();
    const solved     = Boolean(body.solved ?? false);

    const toNum = (v: unknown, fallback = 0) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : fallback;
    };

    const moves      = toNum(body.moves, 0);
    const wrongMoves = toNum(body.wrongMoves, 0);
    const timeMs     = toNum(body.timeMs, 0);
    const score      = toNum(body.score, 0);

    if (!deviceId || !problemId) {
      return NextResponse.json(
        { ok: false, error: 'deviceId and problemId are required' },
        { status: 400 }
      );
    }

    // deviceId でユーザーを find-or-create
    let user = await prisma.user.findUnique({ where: { deviceId } });
    if (!user) {
      user = await prisma.user.create({ data: { deviceId } });
    }

    const attempt = await prisma.attempt.create({
      data: { userId: user.id, problemId, solved, moves, wrongMoves, timeMs, score },
    });

    return NextResponse.json({ ok: true, attempt });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, error: 'internal_error' }, { status: 500 });
  }
}
