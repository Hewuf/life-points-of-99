import { useTheme } from '../../hooks/useTheme';
import styles from './ThemeToggle.module.css';

export default function ThemeToggle() {
  const [theme, setTheme] = useTheme();
  const isDark = theme === 'dark';
  const next = isDark ? 'light' : 'dark';
  const label = isDark ? '☀ 切到白天' : '☾ 切到夜晚';
  return (
    <button
      type="button"
      className={styles.button}
      onClick={() => setTheme(next)}
      aria-label={`切换到${isDark ? '亮' : '暗'}色主题`}
      title={`切换到${isDark ? '亮' : '暗'}色主题`}
    >
      {label}
    </button>
  );
}
