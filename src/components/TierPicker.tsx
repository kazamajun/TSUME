'use client';
import { useEffect, useState } from 'react';
import type { Tier } from '@/lib/score';
import { TIER_LABELS } from '@/lib/score';

const KEY_TIER = 'tsume_tier';
const KEY_LOCK = 'tsume_tier_lock';

export default function TierPicker({
  onChange
}: {
  onChange?: (tier: Tier) => void;
}) {
  const [tier, setTier] = useState<Tier>('tamago');
  const [locked, setLocked] = useState<boolean>(false);

  useEffect(() => {
    const t = (localStorage.getItem(KEY_TIER) as Tier) || 'tamago';
    const lk = localStorage.getItem(KEY_LOCK) === '1';
    setTier(t);
    setLocked(lk);
  }, []);

  useEffect(() => {
    localStorage.setItem(KEY_TIER, tier);
    onChange?.(tier);
  }, [tier, onChange]);

  function toggleLock() {
    const next = !locked;
    setLocked(next);
    localStorage.setItem(KEY_LOCK, next ? '1' : '0');
  }

  return (
    <div className="row">
      <select
        className="select"
        value={tier}
        onChange={(e) => setTier(e.target.value as Tier)}
        disabled={locked}
        aria-label="難易度"
      >
        {Object.entries(TIER_LABELS).map(([k, v]) => (
          <option key={k} value={k}>{v}</option>
        ))}
      </select>

      <label
        className="lock"
        data-on={locked}
        onClick={toggleLock}
        title="難易度ロック"
      >
        <span className="dot" aria-hidden />
        <span>{locked ? 'ロック中' : 'ロック'}</span>
      </label>
    </div>
  );
}
