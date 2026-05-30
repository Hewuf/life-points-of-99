import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
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
}

export default function River({ profile, entriesByYear, currentYear }: Props) {
  const navigate = useNavigate();

  const containerRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const [points, setPoints] = useState<RiverPoint[] | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const currentIndex = useMemo(
    () => Math.max(0, Math.min(profile.lifespan - 1, currentYear - profile.birth_year)),
    [profile.birth_year, profile.lifespan, currentYear],
  );

  const geometry = useMemo(
    () => buildRiver({ currentIndex, count: profile.lifespan }),
    [currentIndex, profile.lifespan],
  );

  // 容器宽度跟踪：用于把 SVG userspace 坐标换算为 tooltip 的像素位置
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        setContainerWidth(Math.round(e.contentRect.width));
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // path 渲染后采样 99 个点的真实坐标
  useLayoutEffect(() => {
    if (!pathRef.current) {
      setPoints(null);
      return;
    }
    const sampled = samplePathPoints(pathRef.current, geometry);
    const built: RiverPoint[] = sampled.map((pt, i) => {
      const state = i < currentIndex ? 'past' : i === currentIndex ? 'present' : 'future';
      const k = i - currentIndex;
      const year = profile.birth_year + i;
      return {
        index: i,
        year,
        age: i,
        state,
        x: pt.x,
        y: pt.y,
        radius: dotRadius(state, k),
        opacity: dotOpacity(state, k),
        entry: entriesByYear.get(year) ?? null,
      };
    });
    setPoints(built);
  }, [geometry, currentIndex, entriesByYear, profile.birth_year]);

  const onActivate = useCallback(
    (p: RiverPoint) => {
      if (p.state === 'future') return;
      navigate(`/year/${p.year}`);
    },
    [navigate],
  );

  // pathLength=1 让 dasharray 可以直接写归一化值
  const livedFraction = geometry.cumulativeT[currentIndex];

  // 容器 aspect-ratio 与 viewBox 一致 → SVG 1:1 填满 → 像素 = userspace * scale
  const scale = containerWidth > 0 ? containerWidth / geometry.width : 0;
  const hoverPoint = hoverIndex != null ? points?.[hoverIndex] : null;
  const presentPoint = points?.find((p) => p.state === 'present') ?? null;

  return (
    <div className={styles.container} ref={containerRef}>
      <svg
        className={styles.svg}
        viewBox={`0 0 ${geometry.width} ${geometry.height}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="人生 99 河流时间线"
      >
        <defs>
          <linearGradient
            id="river-lived-gradient"
            x1="0"
            y1="0"
            x2={geometry.width}
            y2={geometry.height}
            gradientUnits="userSpaceOnUse"
          >
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
        {/* 已度过段：起点 → present，暖色渐变 */}
        <path
          className={styles.livedTrack}
          d={geometry.pathD}
          pathLength={1}
          strokeDasharray={`${livedFraction} 1`}
        />
        {/* 流光：散开的点沿已度过段缓慢漂流 */}
        <path
          className={styles.flowTrack}
          d={geometry.pathD}
        />

        {/* past / future 点（present 单独画在上层） */}
        {points?.map((p) => {
          if (p.state === 'present') return null;
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
          const color = moodToColor(p.entry?.mood_score ?? null);
          return (
            <g
              key={p.index}
              className={styles.pastGroup}
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
              <circle
                className={styles.hitArea}
                cx={p.x}
                cy={p.y}
                r={Math.max(p.radius + 8, 14)}
              />
            </g>
          );
        })}

        {/* present 萤火虫：外层组负责定位 + drift 动画，内层 circle 各自呼吸 */}
        {presentPoint && (
          <g
            className={styles.presentGroup}
            transform={`translate(${presentPoint.x} ${presentPoint.y})`}
            role="button"
            tabIndex={0}
            aria-label={`${presentPoint.year}（${presentPoint.age} 岁，当下）`}
            onClick={() => onActivate(presentPoint)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onActivate(presentPoint);
              }
            }}
            onMouseEnter={() => setHoverIndex(presentPoint.index)}
            onMouseLeave={() => setHoverIndex(null)}
            onFocus={() => setHoverIndex(presentPoint.index)}
            onBlur={() => setHoverIndex(null)}
          >
            <g className={styles.presentDrift}>
              <circle className={styles.bloomOuter} r={26} />
              <circle className={styles.bloomInner} r={16} />
              <circle className={styles.presentCore} r={7} />
              <circle className={styles.hitArea} r={20} />
            </g>
          </g>
        )}
      </svg>

      {hoverPoint && hoverPoint.state !== 'future' && scale > 0 && (
        <YearTooltip
          year={hoverPoint.year}
          age={hoverPoint.age}
          state={hoverPoint.state}
          entry={hoverPoint.entry}
          x={hoverPoint.x * scale}
          y={(hoverPoint.y - hoverPoint.radius) * scale}
        />
      )}
    </div>
  );
}
