import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildRiver, dotOpacity, dotRadius, samplePathPoints } from '../../lib/riverGeometry';
import { moodToColor } from '../../lib/mood';
import type { LifeProfile, RiverPoint, YearEntry } from '../../types/year';
import YearTooltip from './YearTooltip';
import styles from './River.module.css';

interface Props {
  profile: LifeProfile;
  entriesByYear: Map<number, YearEntry>;
  currentYear: number;
  /** 渲染完成、自动滚动到 present 时调用（HomePage 用来初始化定位） */
  onPresentReady?: (presentY: number) => void;
}

export default function River({ profile, entriesByYear, currentYear, onPresentReady }: Props) {
  const navigate = useNavigate();

  const containerRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const [width, setWidth] = useState(0);
  const [points, setPoints] = useState<RiverPoint[] | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const currentIndex = useMemo(
    () => Math.max(0, Math.min(profile.lifespan - 1, currentYear - profile.birth_year)),
    [profile.birth_year, profile.lifespan, currentYear],
  );

  // 测宽：ResizeObserver 跟随容器
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const w = Math.max(280, Math.round(e.contentRect.width));
        setWidth(w);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const geometry = useMemo(() => {
    if (width === 0) return null;
    return buildRiver({
      width,
      currentIndex,
      count: profile.lifespan,
    });
  }, [width, currentIndex, profile.lifespan]);

  // 渲染 path 后用 getPointAtLength 采样真实坐标，再组装 RiverPoint
  useLayoutEffect(() => {
    if (!geometry || !pathRef.current) {
      setPoints(null);
      return;
    }
    const sampled = samplePathPoints(pathRef.current, geometry);
    const built: RiverPoint[] = sampled.map((pt, i) => {
      const state = i < currentIndex ? 'past' : i === currentIndex ? 'present' : 'future';
      const k = i - currentIndex; // 仅 future 有意义
      const year = profile.birth_year + i;
      const entry = entriesByYear.get(year) ?? null;
      return {
        index: i,
        year,
        age: i,
        state,
        x: pt.x,
        y: pt.y,
        radius: dotRadius(state, k),
        opacity: dotOpacity(state, k),
        entry,
      };
    });
    setPoints(built);
  }, [geometry, currentIndex, entriesByYear, profile.birth_year]);

  // 通知外层 present 的 y 坐标，供页面做自动滚动定位
  useEffect(() => {
    if (!points || !onPresentReady) return;
    const present = points.find((p) => p.state === 'present');
    if (!present) return;
    // 容器坐标 = SVG 坐标（svg 宽高 = 容器宽高，无缩放）
    const containerTop = containerRef.current?.getBoundingClientRect().top ?? 0;
    const pageY = containerTop + window.scrollY + present.y;
    onPresentReady(pageY);
  }, [points, onPresentReady]);

  const onActivate = useCallback(
    (p: RiverPoint) => {
      if (p.state === 'future') return;
      navigate(`/year/${p.year}`);
    },
    [navigate],
  );

  // dasharray: lived 段长度 ≈ total * cumulativeT[currentIndex]
  // 因为 cumulativeT 是归一化值，我们用 pathLength 属性把 SVG 内部长度也归一化为 1，
  // 这样可以直接写 stroke-dasharray={cumulativeT[currentIndex]} 1，无需测真实长度。
  const livedFraction = geometry ? geometry.cumulativeT[currentIndex] : 0;

  const hoverPoint = hoverIndex != null ? points?.[hoverIndex] : null;

  return (
    <div className={styles.container} ref={containerRef}>
      {geometry && (
        <svg
          className={styles.svg}
          width={geometry.width}
          height={geometry.height}
          viewBox={`0 0 ${geometry.width} ${geometry.height}`}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="river-lived-gradient" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0" stopColor="var(--river-lived-from)" />
              <stop offset="1" stopColor="var(--river-lived-to)" />
            </linearGradient>
          </defs>

          {/* 未来段：全程淡线 */}
          <path
            ref={pathRef}
            className={styles.futureTrack}
            d={geometry.pathD}
            pathLength={1}
          />
          {/* 已度过段：从 path 起点（底部）画到 present */}
          <path
            className={styles.livedTrack}
            d={geometry.pathD}
            pathLength={1}
            strokeDasharray={`${livedFraction} 1`}
          />

          {/* 99 个点 */}
          {points?.map((p) => {
            if (p.state === 'future') {
              return (
                <circle
                  key={p.index}
                  className={styles.dotFuture}
                  cx={p.x}
                  cy={p.y}
                  r={p.radius}
                  opacity={p.opacity}
                />
              );
            }
            if (p.state === 'present') {
              return (
                <g
                  key={p.index}
                  className={styles.dotPresent}
                  role="button"
                  tabIndex={0}
                  aria-label={`${p.year}（${p.age} 岁，当下）`}
                  onClick={() => onActivate(p)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onActivate(p);
                    }
                  }}
                  onMouseEnter={() => setHoverIndex(p.index)}
                  onMouseLeave={() => setHoverIndex(null)}
                  onFocus={() => setHoverIndex(p.index)}
                  onBlur={() => setHoverIndex(null)}
                >
                  <circle className={styles.dotPresentHalo} cx={p.x} cy={p.y} r={p.radius + 12} />
                  <circle className={styles.dotPresentHalo} cx={p.x} cy={p.y} r={p.radius + 6} />
                  <circle className={styles.dotPresentCore} cx={p.x} cy={p.y} r={p.radius} />
                  <circle className={styles.hitArea} cx={p.x} cy={p.y} r={Math.max(p.radius + 10, 16)} />
                </g>
              );
            }
            // past
            const color = moodToColor(p.entry?.mood_score ?? null);
            return (
              <g
                key={p.index}
                role="button"
                tabIndex={0}
                aria-label={`${p.year}（${p.age} 岁，已度过${p.entry?.title ? `：${p.entry.title}` : ''}）`}
                onClick={() => onActivate(p)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onActivate(p);
                  }
                }}
                onMouseEnter={() => setHoverIndex(p.index)}
                onMouseLeave={() => setHoverIndex(null)}
                onFocus={() => setHoverIndex(p.index)}
                onBlur={() => setHoverIndex(null)}
              >
                <circle
                  className={styles.dotPast}
                  cx={p.x}
                  cy={p.y}
                  r={p.radius}
                  fill={color}
                  style={{ color }}
                  opacity={p.opacity}
                />
                <circle className={styles.hitArea} cx={p.x} cy={p.y} r={Math.max(p.radius + 8, 14)} />
              </g>
            );
          })}
        </svg>
      )}

      {hoverPoint && hoverPoint.state !== 'future' && (
        <YearTooltip
          year={hoverPoint.year}
          age={hoverPoint.age}
          state={hoverPoint.state}
          entry={hoverPoint.entry}
          x={hoverPoint.x}
          y={hoverPoint.y - hoverPoint.radius}
        />
      )}
    </div>
  );
}
