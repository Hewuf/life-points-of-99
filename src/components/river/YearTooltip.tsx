import type { LifeState, YearEntry } from '../../types/year';
import styles from './YearTooltip.module.css';

interface Props {
  year: number;
  age: number;
  state: LifeState;
  entry: YearEntry | null;
  /** 容器坐标系下的位置（与 SVG 坐标 1:1） */
  x: number;
  y: number;
}

const STATE_LABEL: Record<LifeState, string> = {
  past: '已度过',
  present: '当下',
  future: '未来',
};

export default function YearTooltip({ year, age, state, entry, x, y }: Props) {
  return (
    <div className={styles.tooltip} style={{ left: x, top: y }} role="status">
      <div className={styles.meta}>
        <span className={`${styles.year} numerals`}>{year}</span>
        <span className="numerals">{age} 岁</span>
        <span>· {STATE_LABEL[state]}</span>
      </div>
      {entry?.title ? (
        <div className={styles.title}>{entry.title}</div>
      ) : (
        <div className={`${styles.title} ${styles.placeholder}`}>
          {state === 'present' ? '正在发生' : '还没有记录'}
        </div>
      )}
    </div>
  );
}
