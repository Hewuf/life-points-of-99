import { Link } from 'react-router-dom';
import type { YearEntry } from '../../types/year';
import { publicImageUrl } from '../../lib/yearEntryStorage';
import styles from './YearDetailPage.module.css';

interface Props {
  year: number;
  age: number;
  currentYear: number;
  entry: YearEntry | null;
  canEdit: boolean;
  onEdit: () => void;
}

export default function YearDetailView({
  year,
  age,
  currentYear,
  entry,
  canEdit,
  onEdit,
}: Props) {
  const state = year === currentYear ? '当下' : '已度过';

  return (
    <div className={styles.page}>
      <div className={styles.topbar}>
        <Link to="/" className={styles.back}>
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
        {canEdit && (
          <button type="button" className={styles.editButton} onClick={onEdit}>
            编辑
          </button>
        )}
      </div>

      <div className={styles.meta}>
        <span className={`${styles.year} numerals`}>{year}</span>
        <span className={`${styles.age} numerals`}>{age} 岁</span>
        <span>· {state}</span>
      </div>

      {entry?.title ? (
        <h1 className={styles.title}>{entry.title}</h1>
      ) : (
        <p className={styles.placeholder}>这一年还没有记录。</p>
      )}

      {entry?.description && (
        <section className={styles.section}>
          <div className={styles.sectionLabel}>描述</div>
          <p className={styles.description}>{entry.description}</p>
        </section>
      )}

      {entry && entry.keywords.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionLabel}>关键词 · 事件</div>
          <div className={styles.keywords}>
            {entry.keywords.map((k) => (
              <span key={k} className={styles.keyword}>
                {k}
              </span>
            ))}
          </div>
        </section>
      )}

      {entry && entry.tags.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionLabel}>标签</div>
          <div className={styles.tagList}>
            {entry.tags.map((t) => (
              <span key={t} className={styles.tag}>
                #{t}
              </span>
            ))}
          </div>
        </section>
      )}

      {entry && entry.images.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionLabel}>图片</div>
          <div className={styles.images}>
            {entry.images.map((img) => (
              <img
                key={img.path}
                className={styles.image}
                src={publicImageUrl(img.path)}
                alt={img.alt}
                loading="lazy"
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
