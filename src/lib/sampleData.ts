import type { LifeProfile, YearEntry } from '../types/year';
import { env } from './env';

/**
 * V1 阶段还未接入 Supabase，所有读路径走这里。
 * 后续把 useProfile / useYearEntries 切换到 @supabase/supabase-js 即可。
 */

const NOW_ISO = new Date().toISOString();

export const sampleProfile: LifeProfile = {
  id: 'sample-profile',
  owner_id: null,
  display_name: env.displayName,
  birth_year: env.birthYear,
  lifespan: 99,
  created_at: NOW_ISO,
  updated_at: NOW_ISO,
};

/**
 * 几条占位记录，覆盖最近若干年，帮助主页演示情绪色 / 悬停摘要。
 * 真实仓库不应出现任何作者本人的内容（见需求 §9.4）。
 */
function makeEntry(
  yearOffset: number,
  partial: Partial<Omit<YearEntry, 'id' | 'owner_id' | 'year' | 'created_at' | 'updated_at'>>,
): YearEntry {
  const year = sampleProfile.birth_year + yearOffset;
  return {
    id: `sample-${year}`,
    owner_id: null,
    year,
    title: null,
    description: null,
    keywords: [],
    mood_score: null,
    tags: [],
    images: [],
    created_at: NOW_ISO,
    updated_at: NOW_ISO,
    ...partial,
  };
}

const currentYear = new Date().getFullYear();
const currentIndex = currentYear - sampleProfile.birth_year;

/**
 * 出生年附近一条、几年前一条、去年一条、今年一条。
 * 都是占位文案，开源仓库不放真人故事。
 */
export const sampleYearEntries: YearEntry[] = [
  makeEntry(0, {
    title: '出生',
    description: '一切的开始。',
    mood_score: 70,
    keywords: ['出生'],
  }),
  makeEntry(Math.max(1, currentIndex - 10), {
    title: '十年前的一个示例标题',
    description: '这里会是一段较长的描述，记录这一年的细节。',
    mood_score: 55,
    keywords: ['示例关键词 A', '示例关键词 B'],
  }),
  makeEntry(Math.max(1, currentIndex - 3), {
    title: '三年前',
    mood_score: 35,
    keywords: ['低谷', '调整'],
  }),
  makeEntry(Math.max(1, currentIndex - 1), {
    title: '去年',
    mood_score: 78,
    keywords: ['新方向'],
  }),
  makeEntry(currentIndex, {
    title: '今年',
    description: '正在发生。',
    mood_score: 65,
    keywords: ['进行中'],
  }),
].filter((e, i, arr) => arr.findIndex((x) => x.year === e.year) === i);
