import { useTheme } from '../../hooks/useTheme';
import styles from './ThemeToggle.module.css';

export default function ThemeToggle() {
  const [theme, setTheme] = useTheme();
  const next = theme === 'dark' ? 'light' : 'dark';
  return (
    <button
      type="button"
      className={styles.button}
      onClick={() => setTheme(next)}
      aria-label={`切换到${next === 'light' ? '亮' : '暗'}色主题`}
      title={`切换到${next === 'light' ? '亮' : '暗'}色主题`}
    >
      <svg className={styles.icon} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        {theme === 'dark' ? (
          // 月
          <path
            d="M20 14.5A8 8 0 0 1 9.5 4a.5.5 0 0 0-.7-.6 9 9 0 1 0 11.8 11.8.5.5 0 0 0-.6-.7Z"
            fill="currentColor"
          />
        ) : (
          // 日
          <>
            <circle cx="12" cy="12" r="4" fill="currentColor" />
            <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <line x1="12" y1="2.5" x2="12" y2="5" />
              <line x1="12" y1="19" x2="12" y2="21.5" />
              <line x1="2.5" y1="12" x2="5" y2="12" />
              <line x1="19" y1="12" x2="21.5" y2="12" />
              <line x1="5" y1="5" x2="6.8" y2="6.8" />
              <line x1="17.2" y1="17.2" x2="19" y2="19" />
              <line x1="5" y1="19" x2="6.8" y2="17.2" />
              <line x1="17.2" y1="6.8" x2="19" y2="5" />
            </g>
          </>
        )}
      </svg>
      <span>{theme === 'dark' ? '夜' : '昼'}</span>
    </button>
  );
}
