import { useState, type KeyboardEvent } from 'react';
import styles from './yearEditor.module.css';

interface Props {
  label: string;
  hint?: string;
  values: string[];
  onChange: (v: string[]) => void;
  /** 上限；不传则不限。达到上限后输入框置为禁用态。 */
  max?: number;
  placeholder?: string;
}

/**
 * 关键词 / 标签共用的 chip 列表编辑器：
 * - Enter 或失焦时把草稿提交为一条
 * - Backspace 在空输入下删除最后一项
 * - 自动去重，去重时静默丢弃而不是报错
 */
export default function ChipListEditor({
  label,
  hint,
  values,
  onChange,
  max,
  placeholder,
}: Props) {
  const [draft, setDraft] = useState('');
  const atLimit = max != null && values.length >= max;

  function commit() {
    const v = draft.trim();
    setDraft('');
    if (!v || atLimit || values.includes(v)) return;
    onChange([...values, v]);
  }

  function remove(index: number) {
    onChange(values.filter((_, i) => i !== index));
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      commit();
    } else if (e.key === 'Backspace' && draft === '' && values.length > 0) {
      onChange(values.slice(0, -1));
    }
  }

  return (
    <div className={styles.field}>
      <div className={styles.fieldHead}>
        <label className={styles.label}>{label}</label>
        {max != null && (
          <span className={styles.counter}>
            {values.length} / {max}
          </span>
        )}
      </div>
      <div className={styles.chipBox}>
        {values.map((v, i) => (
          <span key={`${v}-${i}`} className={styles.chip}>
            <span className={styles.chipText}>{v}</span>
            <button
              type="button"
              className={styles.chipRemove}
              onClick={() => remove(i)}
              aria-label={`移除 ${v}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          className={styles.chipInput}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={commit}
          placeholder={atLimit ? '已达上限' : placeholder}
          disabled={atLimit}
        />
      </div>
      {hint && <p className={styles.hint}>{hint}</p>}
    </div>
  );
}
