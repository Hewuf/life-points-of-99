import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export interface AuthState {
  session: Session | null;
  /** 首次 getSession 完成前为 true；之后 onAuthStateChange 会持续维持 false */
  loading: boolean;
  /** 当前 auth.uid()；未登录或 Supabase 未配置时为 null */
  userId: string | null;
  email: string | null;
}

/**
 * 单作者站点，但我们仍走标准 Supabase Auth：
 * - session 持久化在 localStorage（createClient 时已开 persistSession）
 * - onAuthStateChange 让多标签页 / Magic Link 回跳后自动同步
 * - Supabase 未配置时 session 永远是 null，loading 立刻为 false
 */
export function useAuth(): AuthState {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(supabase !== null);

  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;

    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoading(false);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  return {
    session,
    loading,
    userId: session?.user.id ?? null,
    email: session?.user.email ?? null,
  };
}

export async function sendMagicLink(email: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Supabase 未配置（VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY 缺失）' };
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      // 落回 /login，让用户看到"已登录"反馈而不是被静默丢回主页
      emailRedirectTo: `${window.location.origin}/login`,
    },
  });
  return { error: error?.message ?? null };
}

export async function signOut(): Promise<{ error: string | null }> {
  if (!supabase) return { error: null };
  const { error } = await supabase.auth.signOut();
  return { error: error?.message ?? null };
}
