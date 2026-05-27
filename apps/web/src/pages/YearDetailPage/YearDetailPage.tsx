import { Navigate, Link, useParams } from 'react-router-dom';
import { useProfile } from '../../hooks/useProfile';
import { useYearEntry } from '../../hooks/useYearEntries';
import styles from './YearDetailPage.module.css';

export default function YearDetailPage() {
  const { year: yearParam } = useParams<{ year: string }>();
  const { profile } = useProfile();
  const year = Number.parseInt(yearParam ?? '', 10);
  const { entry } = useYearEntry(Number.isFinite(year) ? year : 0);

  if (!Number.isFinite(year)) return <Navigate to="/" replace />;

  const age = year - profile.birth_year;
  const currentYear = new Date().getFullYear();
  const inBounds = age >= 0 && age < profile.lifespan;
  const isFuture = year > currentYear;

  if (!inBounds) return <Navigate to="/" replace />;
  // future 不可进入：直接回主页（与需求 §10 一致）
  if (isFuture) return <Navigate to="/" replace />;

  const state = year === currentYear ? '当下' : '已度过';

  return (
    <div className={styles.page}>
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

      {entry && entry.images.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionLabel}>图片</div>
          <div className={styles.images}>
            {entry.images.map((img) => (
              <img
                key={img.path}
                className={styles.image}
                src={img.path}
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
