/**
 * 河流主页的几何核心：见需求文档附录 A。
 *
 * 1) 从底部到顶部生成一组 waypoints（小幅左右摆动）。
 * 2) Catmull-Rom 转 cubic Bezier 拼成 SVG path `d`。
 * 3) 用加权累积长度沿 path 分布 99 个点：past/present 等距，future 越远越密。
 *
 * 几何（path d 与 cumulativeT）是纯函数，可在渲染前算好；
 * 真实坐标必须等 path 渲染到 DOM 后用 `getTotalLength` / `getPointAtLength` 获取——
 * 因为 Bezier 实际弧长 ≠ 控制点折线长。
 */

export interface RiverGeometryOptions {
  /** SVG 视图宽度（像素） */
  width: number;
  /** 0..lifespan-1，决定权重切换的位置 */
  currentIndex: number;
  /** 默认 99 */
  count?: number;
  /** past/present 单点理论间距（像素），驱动整条河的高度 */
  pastSpacing?: number;
  /** 未来权重曲线：k = i - currentIndex（k≥1） */
  futureWeight?: (k: number) => number;
}

export interface RiverGeometry {
  width: number;
  height: number;
  /** 99 个点（包含 present 本身） */
  count: number;
  /** SVG `d` 属性 */
  pathD: string;
  /** waypoints（仅用于调试/可视化，不参与点分布） */
  waypoints: Array<{ x: number; y: number }>;
  /**
   * 每个点在 path 上的归一化位置（0 = path 起点 / 底部，1 = path 终点 / 顶部）。
   * 渲染后再乘以真实 totalLength 即可得到 length，喂给 getPointAtLength。
   */
  cumulativeT: number[];
  /** 起点与终点保留的归一化余量，避免点贴在 path 端点 */
  startSlack: number;
  endSlack: number;
  /** 本次几何对应的 currentIndex，方便消费方比对 */
  currentIndex: number;
}

const DEFAULTS = {
  count: 99,
  pastSpacing: 44,
  futureWeight: (k: number) => Math.max(0.24, 0.42 * 0.965 ** k),
  startSlack: 0.018,
  endSlack: 0.04,
  amplitudeRatio: 0.14,
  amplitudeMaxPx: 78,
  amplitudeMinPx: 26,
  oscillations: 2.4,
  /** 顶部 / 底部留白（像素，固定值） */
  marginTop: 96,
  marginBottom: 96,
};

export function buildRiver(opts: RiverGeometryOptions): RiverGeometry {
  const count = opts.count ?? DEFAULTS.count;
  const pastSpacing = opts.pastSpacing ?? DEFAULTS.pastSpacing;
  const futureWeight = opts.futureWeight ?? DEFAULTS.futureWeight;
  const { width, currentIndex } = opts;

  // 1) 每个点的权重
  const weights = new Array<number>(count);
  let totalWeight = 0;
  for (let i = 0; i < count; i++) {
    const w = i <= currentIndex ? 1 : futureWeight(i - currentIndex);
    weights[i] = w;
    totalWeight += w;
  }

  // 2) 根据权重总和估算 path 高度（线性近似，弯曲带来的额外弧长由 endSlack 兜底）
  const inner = pastSpacing * totalWeight;
  const height = inner + DEFAULTS.marginTop + DEFAULTS.marginBottom;

  // 3) waypoints：自下而上、振幅向顶部收敛
  const centerX = width / 2;
  const amplitude = Math.max(
    DEFAULTS.amplitudeMinPx,
    Math.min(DEFAULTS.amplitudeMaxPx, width * DEFAULTS.amplitudeRatio),
  );
  const wpCount = 9;
  const waypoints: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < wpCount; i++) {
    const t = i / (wpCount - 1); // 0 = 底部, 1 = 顶部
    const y = height - DEFAULTS.marginBottom - (height - DEFAULTS.marginTop - DEFAULTS.marginBottom) * t;
    // 振幅随 t 衰减（顶部更窄）；phase 让起点不在中线，更自然
    const phase = 0.18;
    const damping = 1 - t * 0.55;
    const x = centerX + Math.sin(t * Math.PI * DEFAULTS.oscillations + phase) * amplitude * damping;
    waypoints.push({ x, y });
  }

  // 4) Catmull-Rom → cubic Bezier
  const pathD = catmullRomToBezier(waypoints);

  // 5) 累积归一化位置
  const cumulativeT = new Array<number>(count);
  let acc = 0;
  const usableT = 1 - DEFAULTS.startSlack - DEFAULTS.endSlack;
  for (let i = 0; i < count; i++) {
    // 让 i=0 也偏离起点一些（即出生年也在 path 内部）
    acc += weights[i];
    cumulativeT[i] = DEFAULTS.startSlack + (acc / totalWeight) * usableT;
  }
  // 把最后一个点强制收回到 endSlack 处之前
  cumulativeT[count - 1] = DEFAULTS.startSlack + usableT;

  return {
    width,
    height,
    count,
    pathD,
    waypoints,
    cumulativeT,
    startSlack: DEFAULTS.startSlack,
    endSlack: DEFAULTS.endSlack,
    currentIndex,
  };
}

/**
 * Catmull-Rom 样条转 cubic Bezier。
 * 对每段 P[i] → P[i+1]：
 *   cp1 = P[i]   + (P[i+1] − P[i−1]) / 6
 *   cp2 = P[i+1] − (P[i+2] − P[i])   / 6
 * 端点处复制边界点。
 */
function catmullRomToBezier(pts: Array<{ x: number; y: number }>): string {
  if (pts.length < 2) return '';
  const get = (i: number) => pts[Math.max(0, Math.min(pts.length - 1, i))];

  const out: string[] = [];
  out.push(`M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`);

  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = get(i - 1);
    const p1 = get(i);
    const p2 = get(i + 1);
    const p3 = get(i + 2);
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    out.push(
      `C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`,
    );
  }

  return out.join(' ');
}

/**
 * 渲染后调用：把归一化 cumulativeT 换成 path 上的真实坐标。
 */
export function samplePathPoints(
  pathEl: SVGPathElement,
  geometry: RiverGeometry,
): Array<{ x: number; y: number }> {
  const total = pathEl.getTotalLength();
  return geometry.cumulativeT.map((t) => {
    const pt = pathEl.getPointAtLength(t * total);
    return { x: pt.x, y: pt.y };
  });
}

/**
 * past 点半径默认 6；future 点半径随 k 衰减；present 略大。
 */
export function dotRadius(state: 'past' | 'present' | 'future', k: number): number {
  if (state === 'present') return 7;
  if (state === 'past') return 6;
  return Math.max(2.1, 5.4 * 0.972 ** k);
}

/**
 * future 点不透明度随 k 衰减；past / present 满。
 */
export function dotOpacity(state: 'past' | 'present' | 'future', k: number): number {
  if (state === 'present') return 1;
  if (state === 'past') return 0.92;
  return Math.max(0.16, 0.62 * 0.955 ** k);
}
