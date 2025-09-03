import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: '詰め碁MVP',
  description: '詰め碁 練習＆スコア＆ランキング（MVP）'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="app">
        <header className="app-header">
          <nav className="nav">
            <Link href="/">メニュー</Link>
            <Link href="/practice">練習</Link>
            <Link href="/leaderboard">問題ランキング</Link>
            <Link href="/modes">モードランキング</Link>
          </nav>
        </header>
        <main className="app-main">
          {children}
        </main>
      </body>
    </html>
  );
}
