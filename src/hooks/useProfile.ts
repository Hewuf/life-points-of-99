import { sampleProfile } from '../lib/sampleData';
import type { LifeProfile } from '../types/year';

/**
 * 当前直接返回 sample profile；Supabase 接入后换成从 `life_profile` 表读单行。
 */
export function useProfile(): { profile: LifeProfile; loading: boolean } {
  return { profile: sampleProfile, loading: false };
}
