import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { YearEntry } from '../types/year';

/**
 * 拉取所有 year_entries（V1 单作者，量极小，一次性全拉即可）。
 * Supabase 未配置时返回空数组，主页将全部年呈现为"未填"。
 */
export function useYearEntries(): {
  entries: YearEntry[];
  byYear: Map<number, YearEntry>;
  loading: boolean;
} {
  const [entries, setEntries] = useState<YearEntry[]>([]);
  const [loading, setLoading] = useState(supabase !== null);

  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;

    (async () => {
      const { data, error } = await supabase
        .from('year_entries')
        .select('*')
        .order('year', { ascending: true });
      if (cancelled) return;
      if (error) {
        console.warn('[useYearEntries] supabase error, falling back to empty', error);
      } else if (data) {
        setEntries(data as YearEntry[]);
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const byYear = useMemo(() => {
    const m = new Map<number, YearEntry>();
    for (const e of entries) m.set(e.year, e);
    return m;
  }, [entries]);

  return { entries, byYear, loading };
}

export function useYearEntry(year: number): { entry: YearEntry | null; loading: boolean } {
  const { byYear, loading } = useYearEntries();
  return { entry: byYear.get(year) ?? null, loading };
}
