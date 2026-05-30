import type { LifeState, YearEntry } from '../../types/year';
import styles from './YearTooltip.module.css';

interface Props {
  year: number;
  age: number;
  state: LifeState;
  entry: YearEntry | null;
  /** 容器坐标系下的位置（已乘以 SVG-to-px 缩放） */
  x: number;
  y: number;
}

const STATE_LABEL: Record<LifeState, string> = {
  past: '已度过',
  present: '正在进行',
  future: '尚未抵达',
};

export default function YearTooltip({ year, age, state, entry, x, y }: Props) {
  const placeholder = state === 'present' ? '正在写的这一年，还没有结局。' : '这一年还没有故事。';
  return (
    <div className={styles.tooltip} style={{ left: x, top: y }} role="status">
      <div className={`${styles.year} numerals`}>{year}</div>
      <div className={styles.sub}>
        <span className={`${styles.badge} ${styles[`badge_${state}`]}`} aria-hidden="true" />
        <span className="numerals">{age} 岁</span>
        <span className={styles.dot}>·</span>
        <span>{STATE_LABEL[state]}</span>
      </div>
      {entry?.title ? (
        <p className={styles.summary}>{entry.title}</p>
      ) : (
        <p className={`${styles.summary} ${styles.placeholder}`}>{placeholder}</p>
      )}
    </div>
  );
}
