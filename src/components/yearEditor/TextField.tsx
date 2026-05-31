import styles from './yearEditor.module.css';

interface Props {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  /** 软限制：超出会提示并把计数变红，但不阻塞输入 */
  maxLength?: number;
  placeholder?: string;
  autoFocus?: boolean;
}

export default function TextField({
  label,
  hint,
  value,
  onChange,
  maxLength,
  placeholder,
  autoFocus,
}: Props) {
  const overLimit = maxLength != null && value.length > maxLength;
  return (
    <div className={styles.field}>
      <div className={styles.fieldHead}>
        <label className={styles.label}>{label}</label>
        {maxLength != null && (
          <span className={overLimit ? styles.counterOver : styles.counter}>
            {value.length} / {maxLength}
          </span>
        )}
      </div>
      <input
        type="text"
        className={styles.input}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
      />
      {hint && <p className={styles.hint}>{hint}</p>}
    </div>
  );
}
