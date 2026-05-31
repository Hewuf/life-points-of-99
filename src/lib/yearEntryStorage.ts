import { supabase } from './supabase';
import type { ImageRef } from '../types/year';

/**
 * year_entries 与 life-images 的写入端集中放在这一层：
 * - 让组件层只面对纯函数接口（save / upload / delete / publicUrl），
 *   不直接拼 Supabase 调用，便于以后替换或加缓存。
 * - 所有写入都依赖 RLS：未登录或非作者，Supabase 会自行拒绝。
 */

const BUCKET = 'life-images';

export interface SaveYearEntryInput {
  owner_id: string;
  year: number;
  title: string | null;
  description: string | null;
  keywords: string[];
  mood_score: number | null;
  tags: string[];
  images: ImageRef[];
}

export async function saveYearEntry(input: SaveYearEntryInput): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Supabase 未配置' };
  const { error } = await supabase
    .from('year_entries')
    .upsert(input, { onConflict: 'owner_id,year' });
  return { error: error?.message ?? null };
}

export async function uploadYearImage(
  file: File,
  ownerId: string,
  year: number,
): Promise<{ error: string | null; image: ImageRef | null }> {
  if (!supabase) return { error: 'Supabase 未配置', image: null };

  const ext = fileExt(file.name) || 'jpg';
  // 路径必须 owner_id 开头（与 Storage policy 一致），否则 RLS 会挡住写入
  const path = `${ownerId}/${year}/${cryptoRandomId()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type || undefined,
    upsert: false,
  });
  if (error) return { error: error.message, image: null };

  const { w, h } = await readImageDimensions(file);
  return { error: null, image: { path, alt: '', w, h } };
}

export async function deleteYearImage(path: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: null };
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  return { error: error?.message ?? null };
}

/**
 * 把存储 key 解析成可直接喂给 <img src> 的公开 URL。
 * 兼容历史数据里可能直接存了完整 URL 的情况。
 */
export function publicImageUrl(path: string): string {
  if (!path) return '';
  if (/^(https?:|data:|blob:)/i.test(path)) return path;
  if (!supabase) return path;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

function fileExt(name: string): string {
  const dot = name.lastIndexOf('.');
  if (dot <= 0) return '';
  return name.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, '');
}

function cryptoRandomId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function readImageDimensions(file: File): Promise<{ w: number; h: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ w: img.naturalWidth, h: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      resolve({ w: 0, h: 0 });
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}
