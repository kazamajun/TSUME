import Link from 'next/link';
import { absoluteUrl } from '@/lib/urls';

async function getProblems() {
  const res = await fetch(absoluteUrl('/api/problems'), { cache: 'no-store' });
  if (!res.ok) throw new Error('failed to load problems');
  return res.json() as Promise<{ items: Array<any> }>;
}

export default async function PracticePage() {
  const data = await getProblems();

  return (
    <main>
      <div className="linkbar">
        <Link href="/">メニュー</Link>
        <span>練習</span>
      </div>

      <h1>練習問題を解く</h1>

      <div className="section">
        {data.items.map((p: any) => (
          <div key={p.id} style={{ borderBottom: '1px solid var(--line)', padding: '14px 0' }}>
            <Link href={`/problem/${p.id}`} style={{ color: '#a8d1ff' }}>
              {p.name} <small style={{ opacity: 0.7 }}>（{p.goal}）</small>
            </Link>

            {/* タグ */}
            {p.tags && p.tags.length > 0 && (
              <div className="tags">
                {p.tags.slice(0, 5).map((t: string) => (
                  <span key={t} className="tag">#{t}</span>
                ))}
              </div>
            )}

            {/* 集計表示 */}
            <div style={{ float: 'right', textAlign: 'right', color: 'var(--muted)' }}>
              <div>正解率：{Math.round((p.stats?.acc ?? 1) * 100)}%</div>
              <div>平均時間：{(p.stats?.avgSec ?? 0).toFixed(1)}s</div>
              <div>難易度：{p.stats?.difficulty ?? 1} / 1000</div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
