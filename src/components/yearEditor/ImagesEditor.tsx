import { useRef, useState } from 'react';
import type { ImageRef } from '../../types/year';
import {
  deleteYearImage,
  publicImageUrl,
  uploadYearImage,
} from '../../lib/yearEntryStorage';
import ConfirmDialog from '../ConfirmDialog/ConfirmDialog';
import styles from './yearEditor.module.css';

interface Props {
  label: string;
  hint?: string;
  values: ImageRef[];
  onChange: (v: ImageRef[]) => void;
  ownerId: string;
  year: number;
  max: number;
}

/**
 * 图片编辑：
 * - 上传：立即写入存储桶，成功后追加到 values（仍需点保存才会持久化到 year_entries）。
 * - 重排：上 / 下按钮，避免引入拖拽依赖。
 * - 删除：二次确认；先删存储再更新 values，避免留下"页面里没有但桶里还在"的孤儿。
 */
export default function ImagesEditor({
  label,
  hint,
  values,
  onChange,
  ownerId,
  year,
  max,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingDeleteIndex, setPendingDeleteIndex] = useState<number | null>(null);

  const remaining = Math.max(0, max - values.length);
  const atLimit = remaining === 0;

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList).slice(0, remaining);
    if (files.length === 0) return;

    setUploading(true);
    setError(null);

    const next = [...values];
    for (const file of files) {
      const { error: uploadError, image } = await uploadYearImage(file, ownerId, year);
      if (uploadError) {
        setError(uploadError);
        break;
      }
      if (image) next.push(image);
    }
    if (next.length !== values.length) onChange(next);

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= values.length) return;
    const next = values.slice();
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function updateAlt(index: number, alt: string) {
    const next = values.slice();
    next[index] = { ...next[index], alt };
    onChange(next);
  }

  async function performDelete() {
    if (pendingDeleteIndex === null) return;
    const target = values[pendingDeleteIndex];
    const { error: deleteError } = await deleteYearImage(target.path);
    if (deleteError) {
      setError(deleteError);
      setPendingDeleteIndex(null);
      return;
    }
    onChange(values.filter((_, i) => i !== pendingDeleteIndex));
    setPendingDeleteIndex(null);
  }

  return (
    <div className={styles.field}>
      <div className={styles.fieldHead}>
        <label className={styles.label}>{label}</label>
        <span className={styles.counter}>
          {values.length} / {max}
        </span>
      </div>

      {values.length > 0 && (
        <ul className={styles.imageGrid}>
          {values.map((img, i) => (
            <li key={img.path} className={styles.imageItem}>
              <img
                className={styles.imagePreview}
                src={publicImageUrl(img.path)}
                alt={img.alt}
                loading="lazy"
              />
              <input
                type="text"
                value={img.alt}
                onChange={(e) => updateAlt(i, e.target.value)}
                placeholder="图片描述（alt）"
                className={styles.altInput}
              />
              <div className={styles.imageActions}>
                <button
                  type="button"
                  className={styles.iconButton}
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  aria-label="上移"
                >
                  ↑
                </button>
                <button
                  type="button"
                  className={styles.iconButton}
                  onClick={() => move(i, 1)}
                  disabled={i === values.length - 1}
                  aria-label="下移"
                >
                  ↓
                </button>
                <button
                  type="button"
                  className={styles.dangerLink}
                  onClick={() => setPendingDeleteIndex(i)}
                >
                  删除
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />
      <button
        type="button"
        className={styles.uploadButton}
        disabled={uploading || atLimit}
        onClick={() => fileInputRef.current?.click()}
      >
        {uploading
          ? '上传中…'
          : atLimit
            ? '已达上限'
            : `+ 上传图片（还可上传 ${remaining} 张）`}
      </button>

      {hint && <p className={styles.hint}>{hint}</p>}
      {error && <p className={styles.error}>{error}</p>}

      <ConfirmDialog
        open={pendingDeleteIndex !== null}
        title="确认删除这张图片？"
        body="图片会从存储中永久删除，无法撤销。"
        confirmLabel="永久删除"
        danger
        onConfirm={performDelete}
        onCancel={() => setPendingDeleteIndex(null)}
      />
    </div>
  );
}
