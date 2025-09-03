// サーバー側で fetch するときに絶対URLへ変換するヘルパー
// どこからでも import { absoluteUrl } from '@/lib/urls' で使います。

export function getBaseUrl(): string {
  // ブラウザ側は相対パスのままでOK
  if (typeof window !== 'undefined') return '';

  // Vercel 本番など（環境変数はドメインのみが入る想定）
  const vercel = process.env.VERCEL_URL?.replace(/^https?:\/\//, '');
  if (vercel) return `https://${vercel}`;

  // 独自のベースURLを指定している場合（http/https どちらも可）
  let env = process.env.NEXT_PUBLIC_BASE_URL;
  if (env) {
    if (!/^https?:\/\//.test(env)) env = `https://${env}`;
    return env.replace(/\/+$/, '');
  }

  // ローカル開発用デフォルト
  const host = process.env.HOST || 'localhost';
  const port = process.env.PORT || '3000';
  return `http://${host}:${port}`;
}

export function absoluteUrl(path: string): string {
  // すでに絶対URLならそのまま
  if (/^https?:\/\//.test(path)) return path;
  const base = getBaseUrl();
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}
