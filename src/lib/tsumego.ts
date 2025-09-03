import { Board, Color } from './board';

export type Move = { x: number; y: number; color: 'B' | 'W' };

export type Node = {
  next?: Record<string, Node>; // ユーザーの着手候補（key: "x,y"）に対応する次ノード
  reply?: Move;                // 正解ルート上での相手の応手（自動で着手）
  correct?: boolean;           // クリア判定
  message?: string;            // 任意メッセージ
};

export type Problem = {
  id: string;
  name: string;
  size: number; // 9/13/19
  initial: Move[];
  userColor: 'B' | 'W';
  root: Node;
  goal?: 'live' | 'kill' | 'connect' | 'sente';
  /** ハッシュタグ（最大5個まで使用。API側で超過は切り捨て） */
  tags?: string[];
};

export function applyInitial(board: Board, initial: Move[]) {
  for (const m of initial) {
    board.place(m.x, m.y, m.color === 'B' ? 1 : 2);
  }
}

export function keyOf(x: number, y: number) {
  return `${x},${y}`;
}

export type StepResult =
  | { type: 'illegal'; reason: string }
  | { type: 'wrong'; message?: string }
  | { type: 'progress'; message?: string }
  | { type: 'solved'; message?: string };

export class Engine {
  problem: Problem;
  board: Board;
  node: Node;
  userColor: Color; // 1=黒,2=白

  constructor(problem: Problem) {
    this.problem = problem;
    this.board = new Board(problem.size);
    applyInitial(this.board, problem.initial);
    this.node = problem.root;
    this.userColor = problem.userColor === 'B' ? 1 : 2;
  }

  userPlay(x: number, y: number): StepResult {
    const placed = this.board.place(x, y, this.userColor);
    if (!placed.ok) return { type: 'illegal', reason: '禁じ手/既着点' };

    const k = keyOf(x, y);
    const next = this.node.next?.[k];
    if (!next) return { type: 'wrong', message: 'その手は不正解です。別手を試してください。' };

    if (next.reply) {
      const c: Color = next.reply.color === 'B' ? 1 : 2;
      const ok = this.board.place(next.reply.x, next.reply.y, c).ok;
      if (!ok) {
        return { type: 'wrong', message: '応手が不合法です（問題データ要修正）。' };
      }
    }

    this.node = next;
    if (next.correct) return { type: 'solved', message: next.message ?? '正解！' };
    return { type: 'progress', message: next.message };
  }
}
