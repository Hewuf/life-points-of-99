import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from './env';

/**
 * 客户端可能为 null：当本地 .env 没填 Supabase 凭据时（典型场景：
 * 别人 clone 一份空仓库本地跑），整站应仍能以"空人生"渲染，而不是崩。
 * 消费方（hooks）需自行处理 null 分支：返回兜底 profile / 空 entries。
 */
export const supabase: SupabaseClient | null =
  env.supabaseUrl && env.supabaseKey
    ? createClient(env.supabaseUrl, env.supabaseKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    : null;

export const isSupabaseReady = supabase !== null;
