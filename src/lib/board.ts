export type Color = 0 | 1 | 2; // 0 空点, 1 黒, 2 白
export type Point = { x: number; y: number };

export class Board {
  size: number;
  grid: Color[][]; // [y][x]

  constructor(size = 19, grid?: Color[][]) {
    this.size = size;
    this.grid = grid ?? Array.from({ length: size }, () => Array<Color>(size).fill(0));
  }

  clone(): Board {
    return new Board(this.size, this.grid.map((row) => row.slice()));
  }

  inBounds(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.size && y < this.size;
  }

  get(x: number, y: number): Color {
    return this.grid[y][x];
  }

  set(x: number, y: number, c: Color) {
    this.grid[y][x] = c;
  }

  neighbors(x: number, y: number): Point[] {
    const cand = [
      { x: x + 1, y },
      { x: x - 1, y },
      { x, y: y + 1 },
      { x, y: y - 1 }
    ];
    return cand.filter((p) => this.inBounds(p.x, p.y));
  }

  // 同色連結成分と呼吸点をDFSで収集
  groupAndLiberties(x: number, y: number): { stones: Point[]; liberties: Set<string> } {
    const color = this.get(x, y);
    if (color === 0) return { stones: [], liberties: new Set() };
    const seen = new Set<string>();
    const lib = new Set<string>();
    const stones: Point[] = [];
    const key = (p: Point) => `${p.x},${p.y}`;
    const stack: Point[] = [{ x, y }];

    while (stack.length) {
      const p = stack.pop()!;
      const k = key(p);
      if (seen.has(k)) continue;
      seen.add(k);
      stones.push(p);
      for (const n of this.neighbors(p.x, p.y)) {
        const c = this.get(n.x, n.y);
        if (c === 0) lib.add(key(n));
        else if (c === color && !seen.has(key(n))) stack.push(n);
      }
    }
    return { stones, liberties: lib };
  }

  // 石を打つ: 禁じ手（自殺手）を簡易回避、取れる相手石は取る
  place(x: number, y: number, color: Color): { ok: boolean; captured: number } {
    if (!this.inBounds(x, y) || this.get(x, y) !== 0 || color === 0) return { ok: false, captured: 0 };
    const opp: Color = color === 1 ? 2 : 1;
    const b = this.clone();
    b.set(x, y, color);

    // 隣接相手群で呼吸点ゼロは提げる（取る）
    let captured = 0;
    for (const n of b.neighbors(x, y)) {
      if (b.get(n.x, n.y) === opp) {
        const g = b.groupAndLiberties(n.x, n.y);
        if (g.liberties.size === 0) {
          for (const s of g.stones) {
            b.set(s.x, s.y, 0);
            captured++;
          }
        }
      }
    }

    // 自群の自殺手チェック
    const self = b.groupAndLiberties(x, y);
    if (self.liberties.size === 0) {
      // 取った結果呼吸ができていれば合法
      if (captured === 0) return { ok: false, captured: 0 };
    }

    // 合法
    this.grid = b.grid;
    return { ok: true, captured };
  }
}
