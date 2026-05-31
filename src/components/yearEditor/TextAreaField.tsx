import styles from './yearEditor.module.css';

interface Props {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
}

export default function TextAreaField({
  label,
  hint,
  value,
  onChange,
  rows = 6,
  placeholder,
}: Props) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      <textarea
        className={styles.textarea}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {hint && <p className={styles.hint}>{hint}</p>}
    </div>
  );
}
