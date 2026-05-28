/**
 * 集中读 Vite env，避免散落各处。
 */

function num(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
}

export const env = {
  birthYear: num(import.meta.env.VITE_BIRTH_YEAR, 1999),
  displayName: (import.meta.env.VITE_DISPLAY_NAME as string | undefined) ?? null,
  supabaseUrl: (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? null,
  supabaseKey: (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ?? null,
};
