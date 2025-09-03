import ModeRunner from '@/components/ModeRunner';
import { getBaseUrl } from '@/lib/urls';
import type { Tier } from '@/lib/score';

export default async function ModePage({
  params,
  searchParams
}: {
  params: { mode: string };
  searchParams: { tier?: Tier };
}) {
  const mode = (params.mode ?? 'a').toUpperCase() as 'A' | 'B' | 'C' | 'D';
  const tier = (searchParams.tier ?? 'tamago') as Tier;

  const res = await fetch(`${getBaseUrl()}/api/problems`, { cache: 'no-store' });
  const data = await res.json();
  return <ModeRunner initialProblems={data.items} mode={mode} tier={tier} />;
}
