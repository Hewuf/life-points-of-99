import { Link } from 'react-router-dom';

/**
 * Magic Link 登录的真正实现要等 Supabase 接入（阶段 D）。
 * 这里只放占位，避免路由 404。
 */
export default function LoginPage() {
  return (
    <div
      style={{
        maxWidth: 480,
        margin: '0 auto',
        padding: '64px 24px',
        textAlign: 'center',
        color: 'var(--text-secondary)',
      }}
    >
      <h1
        style={{
          fontFamily: 'var(--font-serif-zh)',
          fontSize: 24,
          color: 'var(--text-primary)',
          marginBottom: 12,
        }}
      >
        登录
      </h1>
      <p style={{ lineHeight: 1.8, fontSize: 14 }}>
        Magic Link 登录将随 Supabase 一起接入（见需求 §5.3）。
        <br />
        当前阶段未启用。
      </p>
      <p style={{ marginTop: 32 }}>
        <Link to="/" style={{ color: 'var(--firefly-glow)' }}>
          ← 回到主页
        </Link>
      </p>
    </div>
  );
}
