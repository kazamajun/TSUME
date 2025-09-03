import { difficultyRange, Tier } from './score';

export function filterByTier<T extends { stats?: { difficulty?: number } }>(items: T[], tier: Tier) {
  const [lo, hi] = difficultyRange(tier);
  return items.filter(p => !p.stats?.difficulty || (p.stats.difficulty >= lo && p.stats.difficulty <= hi));
}

export function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
