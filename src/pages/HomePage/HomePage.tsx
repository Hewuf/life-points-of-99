import { useMemo } from 'react';
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

  return (
    <div className={styles.stage}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <h1 className={styles.title}>
            人生 · <em className={styles.titleAccent}>九十九</em>
          </h1>
          <p className={styles.subtitle}>一条向前流去的河，每个光点是一年。</p>
        </div>
        <div className={styles.meta}>
          <span className={`${styles.count} numerals`}>
            {currentIndex} / {profile.lifespan} 已点亮
          </span>
          <ThemeToggle />
        </div>
      </header>

      <main className={styles.riverWrapper}>
        <River profile={profile} entriesByYear={byYear} currentYear={currentYear} />
      </main>

      <footer className={styles.footnote}>
        蜿蜒的河 · 过去（亮、正常间距）→ 当下（萤火虫呼吸）→ 未来（暗、渐密、收向远处）。
        <br />
        点的颜色 = 当年情绪色。悬停看一句话总结。
      </footer>
    </div>
  );
}
