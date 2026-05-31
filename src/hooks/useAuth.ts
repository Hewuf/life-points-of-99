import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { env } from '../lib/env';
import { supabase } from '../lib/supabase';

export interface AuthState {
  session: Session | null;
  /** 首次 getSession 完成前为 true；之后 onAuthStateChange 会持续维持 false */
  loading: boolean;
  /** 当前 auth.uid()；未登录或 Supabase 未配置时为 null */
  userId: string | null;
  email: string | null;
  /** 非作者邮箱被强制下线时的提示，主要给 LoginPage 显示。 */
  authError: string | null;
}

const UNAUTHORIZED_MESSAGE = '该邮箱没有登录权限';

/**
 * 是否允许此邮箱登录。
 * - 未配置 authorEmail（空仓库自检场景）：放行任何登录，但 RLS 仍兜底；
 * - 配置了：忽略大小写与首尾空格严格比对。
 */
function isAuthorizedEmail(email: string | null | undefined): boolean {
  if (!env.authorEmail) return true;
  if (!email) return false;
  return email.trim().toLowerCase() === env.authorEmail.toLowerCase();
}

/**
 * 单作者站点，但我们仍走标准 Supabase Auth：
 * - session 持久化在 localStorage（createClient 时已开 persistSession）
 * - onAuthStateChange 让多标签页 / Magic Link 回跳后自动同步
 * - Supabase 未配置时 session 永远是 null，loading 立刻为 false
 *
 * 邮箱白名单：若 Magic Link 回跳后 session 邮箱不在白名单，立即 signOut + 暴露 authError。
 */
export function useAuth(): AuthState {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(supabase !== null);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;
    const client = supabase;
    let cancelled = false;

    function settle(next: Session | null) {
      if (cancelled) return;
      if (next && !isAuthorizedEmail(next.user.email)) {
        // 非白名单邮箱：立刻撤销 session，避免任何写入入口出现
        client.auth.signOut();
        setSession(null);
        setAuthError(UNAUTHORIZED_MESSAGE);
      } else {
        setSession(next);
        // 仅在拿到合法 session 时清错；signOut 之后回到 null 不要把刚刚的错误吞掉
        if (next) setAuthError(null);
      }
      setLoading(false);
    }

    client.auth.getSession().then(({ data }) => settle(data.session));
    const { data: sub } = client.auth.onAuthStateChange((_event, next) => settle(next));

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
    authError,
  };
}

export async function sendMagicLink(email: string): Promise<{ error: string | null }> {
  if (!supabase) {
    return { error: 'Supabase 未配置（VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY 缺失）' };
  }
  const target = email.trim();
  // 前置拦截：避免把链接发到非作者邮箱，省一次邮件回路也避免被滥用
  if (env.authorEmail && !isAuthorizedEmail(target)) {
    return { error: UNAUTHORIZED_MESSAGE };
  }
  const { error } = await supabase.auth.signInWithOtp({
    email: target,
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
