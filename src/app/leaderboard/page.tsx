import { absoluteUrl } from '@/lib/urls';

async function getBoard() {
  const res = await fetch(
    absoluteUrl('/api/leaderboard?problemId=sample1'),
    { cache: 'no-store' }
  );
  if (!res.ok) throw new Error('failed to load leaderboard');
  return res.json();
}

export default async function LeaderboardPage() {
  const data = await getBoard();
  const rows = (data.items as {
    deviceid: string; deviceId?: string;
    bestscore: number; bestScore?: number;
    besttime: number; bestTime?: number;
  }[]).map(r => ({
    deviceId: r.deviceId ?? (r as any).deviceid,
    bestScore: r.bestScore ?? (r as any).bestscore,
    bestTime: r.bestTime ?? (r as any).besttime,
  }));

  return (
    <div className="stack">
      <h1 className="page-title">ランキング</h1>

      <div className="card" style={{ maxWidth: 980, margin: '0 auto' }}>
        <table className="table">
          <thead>
            <tr><th>#</th><th>端末ID</th><th>スコア</th><th>最速(ミリ秒)</th></tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.deviceId}>
                <td>{i + 1}</td>
                <td>{(r.deviceId ?? '').slice(0, 8)}…</td>
                <td>{r.bestScore}</td>
                <td>{r.bestTime}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
