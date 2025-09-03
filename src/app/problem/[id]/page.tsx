import ProblemPlayer from '@/components/ProblemPlayer';
import { Problem } from '@/lib/tsumego';
import { absoluteUrl } from '@/lib/urls';

async function getProblem(id: string): Promise<Problem> {
  const res = await fetch(absoluteUrl(`/api/problems/${id}`), { cache: 'no-store' });
  if (!res.ok) throw new Error('not found');
  return res.json();
}

export default async function ProblemPage({ params }: { params: { id: string } }) {
  const problem = await getProblem(params.id);
  return (
    <div className="stack">
      <ProblemPlayer problem={problem} />
    </div>
  );
}
