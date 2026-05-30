import { useEffect, useState } from 'react';
import { env } from '../lib/env';
import { supabase } from '../lib/supabase';
import type { LifeProfile } from '../types/year';

/**
 * 兜底 profile：当 Supabase 未配置 / 表里还没作者行时，让主页仍能渲染一条
 * "空人生"（99 个未填的点）。出生年取自 env，无值时退到 1999 占位。
 */
function fallbackProfile(): LifeProfile {
  const now = new Date().toISOString();
  return {
    id: 'fallback',
    owner_id: null,
    display_name: env.displayName,
    birth_year: env.birthYear,
    lifespan: 99,
    created_at: now,
    updated_at: now,
  };
}

export function useProfile(): { profile: LifeProfile; loading: boolean } {
  const [profile, setProfile] = useState<LifeProfile>(fallbackProfile);
  const [loading, setLoading] = useState(supabase !== null);

  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;

    (async () => {
      const { data, error } = await supabase
        .from('life_profile')
        .select('*')
        .limit(1)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        console.warn('[useProfile] supabase error, falling back', error);
      } else if (data) {
        setProfile(data as LifeProfile);
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { profile, loading };
}
