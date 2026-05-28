/**
 * 域类型；字段名与 Supabase 表保持一致，便于后续直接换上数据层。
 */

export interface LifeProfile {
  id: string;
  owner_id: string | null;
  display_name: string | null;
  birth_year: number;
  lifespan: number; // 默认 99
  created_at: string;
  updated_at: string;
}

export interface ImageRef {
  path: string;
  alt: string;
  w: number;
  h: number;
}

export interface YearEntry {
  id: string;
  owner_id: string | null;
  year: number;
  title: string | null; // 一句话总结，≤ 50 字
  description: string | null;
  keywords: string[]; // 最多 8 条
  mood_score: number | null; // 0..100
  tags: string[];
  images: ImageRef[]; // 最多 12 张
  created_at: string;
  updated_at: string;
}

/**
 * 已经计算好坐标和三态的"点"——主页 SVG 渲染时直接消费。
 */
export type LifeState = 'past' | 'present' | 'future';

export interface RiverPoint {
  /** 0..98 */
  index: number;
  year: number;
  age: number;
  state: LifeState;
  x: number;
  y: number;
  /** 点半径，已按状态衰减后的最终值 */
  radius: number;
  /** 点透明度 */
  opacity: number;
  /** 该年的数据，可能不存在 */
  entry: YearEntry | null;
}
