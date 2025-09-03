'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import GoBoard from './GoBoard';
import { Board } from '@/lib/board';
import { Engine, Problem } from '@/lib/tsumego';
import { ensureDeviceId } from '@/lib/id';

export type Result = {
  moves: number;
  wrongs: number;
  timeMs: number;
};

export default function ProblemPlayer({ problem, onSolved, submitAttempt = true }: {
  problem: Problem;
  onSolved?: (r: Result) => void;
  submitAttempt?: boolean;
}) {
  const [engine] = useState(() => new Engine(problem));
  const [board, setBoard] = useState<Board>(engine.board.clone());
  const [msg, setMsg] = useState<string>('黒番：正解手を探してください');
  const [moves, setMoves] = useState(0);
  const [wrongs, setWrongs] = useState(0);
  const startRef = useRef<number>(0);

  useEffect(() => { startRef.current = performance.now(); }, []);
  const grid = useMemo(() => board.grid.map(r => r.slice()), [board]);

  function resetWrong() {
    // 不正解後の盤はそのまま（詰め直しに戻す）
    setBoard(engine.board.clone());
  }

  async function submitResult(r: Result) {
    if (!submitAttempt) return;
    try {
      const deviceId = ensureDeviceId();
      await fetch('/api/attempts', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          deviceId, problemId: problem.id,
          solved: true, moves: r.moves, wrongMoves: r.wrongs, timeMs: r.timeMs
        })
      });
    } catch(e){ console.error(e); }
  }

  function onPlay(x:number, y:number) {
    const res = engine.userPlay(x, y);
    if (res.type === 'illegal') {
      setMsg('禁じ手/既着点です');
      return;
    }
    if (res.type === 'wrong') {
      setWrongs(n => n + 1);
      setMsg(res.message ?? 'その手は不正解です。別手を試してください。');
      resetWrong();
      return;
    }
    setMoves(n => n + 1);
    setBoard(engine.board.clone());
    setMsg(res.message ?? '継続');

    if (res.type === 'solved') {
      const end = performance.now();
      const timeMs = Math.round(end - startRef.current);
      const r = { moves: moves + 1, wrongs, timeMs };
      void submitResult(r);
      onSolved?.(r);
      setMsg((res.message ?? '正解！') + `（時間: ${Math.floor(timeMs/1000)}s）`);
    }
  }

  return (
    <div className="stack">
      <div className="card" style={{maxWidth:980, margin:'0 auto'}}>
        <strong style={{fontSize:18}}>{problem.name}</strong>
      </div>

      <div className="center-wrap">
        <div className="board-wrap">
          <GoBoard size={problem.size} grid={grid} onPlay={onPlay}/>
        </div>
      </div>

      <div className="row" style={{gap:16, justifyContent:'center'}}>
        <span className="badge">手数: {moves}</span>
        <span className="badge">ミス: {wrongs}</span>
      </div>

      <div className="panel" style={{maxWidth:980, margin:'0 auto'}}>
        <div className="toast">{msg}</div>
      </div>

      <div className="center-wrap">
        <button onClick={() => location.reload()} style={{minWidth:160}}>最初からやり直す</button>
      </div>
    </div>
  );
}
