import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  const body = await req.json();
  const { deviceId, problemId, solved, moves, wrongMoves, timeMs } = body as {
    deviceId: string;
    problemId: string;
    solved: boolean;
    moves: number;
    wrongMoves: number;
    timeMs: number;
  };

  // ユーザー取得 or 作成
  let user = await prisma.user.findUnique({ where: { deviceId } });
  if (!user) user = await prisma.user.create({ data: { deviceId } });

  // スコア計算（簡易式）
  // 基礎点1000 + 時間ボーナス(上限500) - ミス*50 - 手数*5
  const timeBonus = Math.max(0, 500 - Math.floor(timeMs / 100));
  const scoreBase = solved ? 1000 : 200;
  const score = Math.max(0, scoreBase + timeBonus - wrongMoves * 50 - moves * 5);

  const attempt = await prisma.attempt.create({
    data: { userId: user.id, problemId, solved, moves, wrongMoves, timeMs, score }
  });

  return NextResponse.json({ ok: true, attempt });
}
