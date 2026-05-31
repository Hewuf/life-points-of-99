import { moodToColor } from '../../lib/mood';
import styles from './yearEditor.module.css';

interface Props {
  label: string;
  hint?: string;
  value: number | null;
  onChange: (v: number | null) => void;
}

const DEFAULT_WHEN_EMPTY = 50;

export default function MoodScoreEditor({ label, hint, value, onChange }: Props) {
  const sliderValue = value ?? DEFAULT_WHEN_EMPTY;
  return (
    <div className={styles.field}>
      <div className={styles.fieldHead}>
        <label className={styles.label}>{label}</label>
        <div className={styles.moodReadout}>
          <span
            className={styles.moodSwatch}
            style={{ background: moodToColor(value) }}
            aria-hidden="true"
          />
          <span className={styles.counter}>{value ?? '—'}</span>
        </div>
      </div>
      <div className={styles.moodRow}>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={sliderValue}
          onChange={(e) => onChange(Number.parseInt(e.target.value, 10))}
          className={styles.range}
          aria-label={label}
        />
        <button
          type="button"
          className={styles.clearButton}
          onClick={() => onChange(null)}
          disabled={value === null}
        >
          留空
        </button>
      </div>
      {hint && <p className={styles.hint}>{hint}</p>}
    </div>
  );
}
