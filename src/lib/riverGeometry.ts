/**
 * 河流主页几何：横向蛇形 + 一屏 SVG（参照 ux/life-99-river-prototype.html）。
 *
 * 1) 在固定 viewBox 1000×680 内按 5 行 ltr/rtl 交替生成 waypoints，
 *    行与行之间用 bow 连接形成"S 形"绕回。
 * 2) Catmull-Rom 转 cubic Bezier 拼成 SVG path `d`。
 * 3) 用加权累积长度沿 path 分布 99 个点：past/present 等距，future 越远越密。
 *
 * 真实坐标必须在 path 渲染到 DOM 之后用 `getTotalLength` / `getPointAtLength` 获取。
 */

export interface RiverGeometryOptions {
  currentIndex: number;
  count?: number;
}

export interface RiverGeometry {
  width: number;
  height: number;
  count: number;
  pathD: string;
  waypoints: Array<{ x: number; y: number }>;
  cumulativeT: number[];
  currentIndex: number;
}

const VIEWBOX = {
  width: 1000,
  height: 680,
  marginTop: 64,
  marginBottom: 70,
  marginLeft: 70,
  marginRight: 70,
  rows: 5,
  segmentsPerRow: 5,
  wobbleAmplitude: 22,
  bowOffset: 46,
  usableFraction: 0.985,
};

const futureWeight = (k: number): number => Math.max(0.24, 0.42 * 0.965 ** k);

export function buildRiver(opts: RiverGeometryOptions): RiverGeometry {
  const count = opts.count ?? 99;
  const { currentIndex } = opts;
  const {
    width,
    height,
    marginTop,
    marginBottom,
    marginLeft,
    marginRight,
    rows,
    segmentsPerRow,
    wobbleAmplitude,
    bowOffset,
    usableFraction,
  } = VIEWBOX;

  const xL = marginLeft;
  const xR = width - marginRight;
  const usableW = xR - xL;
  const rowGap = (height - marginTop - marginBottom) / (rows - 1);

  const waypoints: Array<{ x: number; y: number }> = [];
  for (let r = 0; r < rows; r++) {
    const y0 = marginTop + r * rowGap;
    const ltr = r % 2 === 0;
    for (let k = 0; k <= segmentsPerRow; k++) {
      const fx = k / segmentsPerRow;
      const x = ltr ? xL + fx * usableW : xR - fx * usableW;
      const y = y0 + Math.sin(fx * Math.PI * 1.6 + r * 1.3) * wobbleAmplitude;
      waypoints.push({ x, y });
    }
    if (r < rows - 1) {
      const tx = ltr ? xR : xL;
      const bow = ltr ? bowOffset : -bowOffset;
      waypoints.push({ x: tx + bow, y: y0 + rowGap * 0.5 });
    }
  }

  const pathD = catmullRomToBezier(waypoints);

  const weights = new Array<number>(count);
  let totalWeight = 0;
  for (let i = 0; i < count; i++) {
    const w = i <= currentIndex ? 1 : futureWeight(i - currentIndex);
    weights[i] = w;
    totalWeight += w;
  }

  const cumulativeT = new Array<number>(count);
  let acc = 0;
  for (let i = 0; i < count; i++) {
    acc += weights[i];
    cumulativeT[i] = (acc / totalWeight) * usableFraction;
  }

  return {
    width,
    height,
    count,
    pathD,
    waypoints,
    cumulativeT,
    currentIndex,
  };
}

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

export function dotRadius(state: 'past' | 'present' | 'future', k: number): number {
  if (state === 'present') return 7;
  if (state === 'past') return 6;
  return Math.max(2.1, 5.4 * 0.972 ** k);
}

export function dotOpacity(state: 'past' | 'present' | 'future', k: number): number {
  if (state === 'present') return 1;
  if (state === 'past') return 0.95;
  return Math.max(0.16, 0.62 * 0.955 ** k);
}
