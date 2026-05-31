/**
 * 集中读 Vite env，避免散落各处。
 */

function num(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
}

function trimOrNull(value: string | undefined): string | null {
  if (!value) return null;
  const t = value.trim();
  return t.length > 0 ? t : null;
}

export const env = {
  birthYear: num(import.meta.env.VITE_BIRTH_YEAR, 1999),
  displayName: trimOrNull(import.meta.env.VITE_DISPLAY_NAME as string | undefined),
  supabaseUrl: trimOrNull(import.meta.env.VITE_SUPABASE_URL as string | undefined),
  supabaseKey: trimOrNull(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined),
  /** 作者邮箱白名单。null = 不限制（仅本地空仓库时）。 */
  authorEmail: trimOrNull(import.meta.env.VITE_AUTHOR_EMAIL as string | undefined),
};
