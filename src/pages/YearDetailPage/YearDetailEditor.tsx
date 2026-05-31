import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { ImageRef, YearEntry } from '../../types/year';
import { saveYearEntry } from '../../lib/yearEntryStorage';
import TextField from '../../components/yearEditor/TextField';
import TextAreaField from '../../components/yearEditor/TextAreaField';
import ChipListEditor from '../../components/yearEditor/ChipListEditor';
import MoodScoreEditor from '../../components/yearEditor/MoodScoreEditor';
import ImagesEditor from '../../components/yearEditor/ImagesEditor';
import pageStyles from './YearDetailPage.module.css';
import styles from './YearDetailEditor.module.css';

const TITLE_MAX = 50;
const KEYWORDS_MAX = 8;
const IMAGES_MAX = 12;

interface Props {
  year: number;
  age: number;
  ownerId: string;
  entry: YearEntry | null;
  onCancel: () => void;
  onSaved: () => void;
}

interface FormState {
  title: string;
  description: string;
  keywords: string[];
  mood_score: number | null;
  tags: string[];
  images: ImageRef[];
}

function initForm(entry: YearEntry | null): FormState {
  return {
    title: entry?.title ?? '',
    description: entry?.description ?? '',
    keywords: entry?.keywords ?? [],
    mood_score: entry?.mood_score ?? null,
    tags: entry?.tags ?? [],
    images: entry?.images ?? [],
  };
}

/**
 * 详情编辑器：表单状态本地维护，保存时一次性 upsert。
 * 图片上传 / 删除是即时操作（直接写存储桶），其他字段在点"保存"时才落库。
 * 这是有意为之：图片上传是重操作，等到 Save 再批量传体验更差；
 * 副作用是用户上传后没点保存就关页面会留下"孤儿图片"，对单作者站点可接受。
 */
export default function YearDetailEditor({
  year,
  age,
  ownerId,
  entry,
  onCancel,
  onSaved,
}: Props) {
  const [form, setForm] = useState<FormState>(() => initForm(entry));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    if (saving) return;
    if (form.title.length > TITLE_MAX) {
      setError(`标题不能超过 ${TITLE_MAX} 字`);
      return;
    }
    setSaving(true);
    setError(null);
    const { error: saveError } = await saveYearEntry({
      owner_id: ownerId,
      year,
      title: form.title.trim() || null,
      description: form.description.trim() || null,
      keywords: form.keywords,
      mood_score: form.mood_score,
      tags: form.tags,
      images: form.images,
    });
    setSaving(false);
    if (saveError) {
      setError(saveError);
      return;
    }
    onSaved();
  }

  return (
    <div className={pageStyles.page}>
      <div className={pageStyles.topbar}>
        <Link to="/" className={pageStyles.back}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M15 6l-6 6 6 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          回到河流
        </Link>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.secondary}
            onClick={onCancel}
            disabled={saving}
          >
            取消
          </button>
          <button
            type="button"
            className={styles.primary}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? '保存中…' : '保存'}
          </button>
        </div>
      </div>

      <div className={pageStyles.meta}>
        <span className={`${pageStyles.year} numerals`}>{year}</span>
        <span className={`${pageStyles.age} numerals`}>{age} 岁</span>
        <span>· 编辑中</span>
      </div>

      <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
        <TextField
          label="标题"
          hint={`一句话总结，最多 ${TITLE_MAX} 字`}
          value={form.title}
          onChange={(v) => update('title', v)}
          maxLength={TITLE_MAX}
          autoFocus
        />

        <TextAreaField
          label="描述"
          hint="不限字数"
          value={form.description}
          onChange={(v) => update('description', v)}
          rows={8}
        />

        <ChipListEditor
          label="关键词 · 事件"
          hint={`每条一句话，最多 ${KEYWORDS_MAX} 条`}
          values={form.keywords}
          onChange={(v) => update('keywords', v)}
          max={KEYWORDS_MAX}
          placeholder="输入后回车添加"
        />

        <MoodScoreEditor
          label="情绪分"
          hint="0 = 低落 / 冷，100 = 高昂 / 暖；留空使用中性色"
          value={form.mood_score}
          onChange={(v) => update('mood_score', v)}
        />

        <ChipListEditor
          label="标签"
          hint="为以后的「标签筛选」准备；可留空"
          values={form.tags}
          onChange={(v) => update('tags', v)}
          placeholder="输入后回车添加"
        />

        <ImagesEditor
          label="图片"
          hint={`最多 ${IMAGES_MAX} 张；删除会立即从存储中永久移除`}
          values={form.images}
          onChange={(v) => update('images', v)}
          ownerId={ownerId}
          year={year}
          max={IMAGES_MAX}
        />

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.footerActions}>
          <button
            type="button"
            className={styles.secondary}
            onClick={onCancel}
            disabled={saving}
          >
            取消
          </button>
          <button
            type="button"
            className={styles.primary}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? '保存中…' : '保存'}
          </button>
        </div>
      </form>
    </div>
  );
}
