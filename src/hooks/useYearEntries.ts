import { useMemo } from 'react';
import { sampleYearEntries } from '../lib/sampleData';
import type { YearEntry } from '../types/year';

/**
 * 返回按 year 索引的字典。Supabase 接入后从 `year_entries` 拉作者数据。
 */
export function useYearEntries(): {
  entries: YearEntry[];
  byYear: Map<number, YearEntry>;
  loading: boolean;
} {
  const byYear = useMemo(() => {
    const m = new Map<number, YearEntry>();
    for (const e of sampleYearEntries) m.set(e.year, e);
    return m;
  }, []);

  return { entries: sampleYearEntries, byYear, loading: false };
}

export function useYearEntry(year: number): { entry: YearEntry | null; loading: boolean } {
  const { byYear, loading } = useYearEntries();
  return { entry: byYear.get(year) ?? null, loading };
}
