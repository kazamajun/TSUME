// src/lib/score.ts
// スコア計算・難易度ティア関連のユーティリティをまとめてエクスポートします。

// --- ティア設定（0〜9 の10段階想定。必要なら調整してください） ---
export type Tier = 0|1|2|3|4|5|6|7|8|9;

export const TIER_LABELS: readonly string[] = [
  'E-', 'E', 'E+', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS',
];

// 既存コードの互換用（あればこちらを参照していたコンポーネント向け）
export const TIER_LABELS_UI = TIER_LABELS;

/**
 * 指定ティアの難易度範囲を返す（例: 0 -> [1,100], 1 -> [101,200] ...）
 * 返り値は [min, max] のタプル。
 */
export function difficultyRange(tier: number | string): [number, number] {
  const t = Math.max(0, Math.min(9, Number(tier) || 0));
  const min = t === 0 ? 1 : t * 100 + 1;
  const max = (t + 1) * 100;
  return [min, max];
}

/**
 * 難易度値からティア番号へ（difficulty: 1..1000 を 0..9 に割り当て）
 */
export function toTier(difficulty: number): Tier {
  if (!Number.isFinite(difficulty)) return 0;
  const t = Math.floor((Math.max(1, Math.min(1000, difficulty)) - 1) / 100);
  return (Math.max(0, Math.min(9, t)) as Tier);
}

/**
 * セッション（複数問）のスコアを概算。
 * ModeRunner から渡ってくる形の違いを吸収するため柔軟に受け取ります。
 *
 * 受け取り例:
 * - { items: [{ solved, timeMs?, difficulty? }, ...] }
 * - { correctCount, totalCount?, timeMs? }
 *
 * 返り値は「基礎点 + 難易度ボーナス + 速度ボーナス」の総和にしています。
 * 既存の呼び出し側が number を期待していれば問題なく動きます。
 */
export function computeSessionScore(input: {
  items?: Array<{ solved?: boolean; correct?: boolean; timeMs?: number; difficulty?: number }>;
  correctCount?: number;
  totalCount?: number;
  timeMs?: number;
}): number {
  // items がある場合は 1問ごとに加点
  if (Array.isArray(input.items)) {
    return input.items.reduce((sum, it) => {
      const solved = it.solved ?? it.correct ?? false;
      if (!solved) return sum;

      const diff = Number(it.difficulty ?? 100);   // 未指定は100相当
      const dTier = toTier(diff);
      const base = 100;                             // 正解の基礎点
      const diffBonus = dTier * 20;                 // ティアごとのボーナス
      const t = Number(it.timeMs ?? 0);
      // 10分(600,000ms)以内なら速いほどボーナス（最大+100、最小0）
      const speedBonus = t > 0 ? Math.max(0, 100 - Math.min(100, Math.round(t / 600000 * 100))) : 0;

      return sum + base + diffBonus + speedBonus;
    }, 0);
  }

  // 集計値のみの場合は正解数ベースの簡易スコア
  const correct = Number(input.correctCount ?? 0);
  return correct * 100;
}
