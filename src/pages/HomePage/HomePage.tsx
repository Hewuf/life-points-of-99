import { useCallback, useMemo, useRef } from 'react';
import { useProfile } from '../../hooks/useProfile';
import { useYearEntries } from '../../hooks/useYearEntries';
import River from '../../components/river/River';
import ThemeToggle from '../../components/ThemeToggle/ThemeToggle';
import styles from './HomePage.module.css';

export default function HomePage() {
  const { profile } = useProfile();
  const { byYear } = useYearEntries();

  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const currentIndex = Math.max(
    0,
    Math.min(profile.lifespan - 1, currentYear - profile.birth_year),
  );

  // 仅在首次拿到 present 坐标时滚动一次
  const didScrollRef = useRef(false);
  const handlePresentReady = useCallback((pageY: number) => {
    if (didScrollRef.current) return;
    didScrollRef.current = true;
    // 目标：present 落在视口约 60% 高度处
    const target = pageY - window.innerHeight * 0.6;
    window.scrollTo({ top: Math.max(0, target), behavior: 'auto' });
  }, []);

  const percent = Math.round(((currentIndex + 1) / profile.lifespan) * 100);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <span>人生 · 99</span>
          <span className={styles.subtitle}>{profile.display_name ?? '一段时间轴'}</span>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.progress}>
            {currentIndex + 1} / {profile.lifespan} · 已度过 {percent}%
          </span>
          <ThemeToggle />
        </div>
      </header>

      <main className={styles.riverWrapper}>
        <River
          profile={profile}
          entriesByYear={byYear}
          currentYear={currentYear}
          onPresentReady={handlePresentReady}
        />
        <p className={styles.footnote}>
          底部是出生年。越往上越接近未来；只能向前 / 向上走。
        </p>
      </main>
    </div>
  );
}
