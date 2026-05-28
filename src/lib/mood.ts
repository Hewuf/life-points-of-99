/**
 * mood_score (0..100) → 颜色。
 * 五个色停插值（冷 → 中性 → 暖），与需求 §7.2 一致。
 * mood_score 为空：用中性色（25-50 之间），不要让未填写的年份突兀。
 */

interface Rgb {
  r: number;
  g: number;
  b: number;
}

const STOPS: Array<{ at: number; color: Rgb }> = [
  { at: 0, color: hexToRgb('#6d9dc5') }, // 冷 / 低落
  { at: 25, color: hexToRgb('#82b29a') },
  { at: 50, color: hexToRgb('#c2b27f') }, // 中性
  { at: 75, color: hexToRgb('#e8b04b') },
  { at: 100, color: hexToRgb('#e07a5f') }, // 暖 / 高昂
];

const NEUTRAL_DEFAULT = STOPS[2].color;

export function moodToColor(score: number | null | undefined): string {
  if (score == null || Number.isNaN(score)) return rgbToCss(NEUTRAL_DEFAULT);
  const clamped = Math.max(0, Math.min(100, score));
  // 找包夹的两段
  for (let i = 0; i < STOPS.length - 1; i++) {
    const a = STOPS[i];
    const b = STOPS[i + 1];
    if (clamped >= a.at && clamped <= b.at) {
      const t = (clamped - a.at) / (b.at - a.at);
      return rgbToCss(lerp(a.color, b.color, t));
    }
  }
  return rgbToCss(STOPS[STOPS.length - 1].color);
}

function lerp(a: Rgb, b: Rgb, t: number): Rgb {
  return {
    r: Math.round(a.r + (b.r - a.r) * t),
    g: Math.round(a.g + (b.g - a.g) * t),
    b: Math.round(a.b + (b.b - a.b) * t),
  };
}

function hexToRgb(hex: string): Rgb {
  const s = hex.replace('#', '');
  return {
    r: Number.parseInt(s.slice(0, 2), 16),
    g: Number.parseInt(s.slice(2, 4), 16),
    b: Number.parseInt(s.slice(4, 6), 16),
  };
}

function rgbToCss({ r, g, b }: Rgb): string {
  return `rgb(${r} ${g} ${b})`;
}
