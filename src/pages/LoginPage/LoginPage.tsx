import { useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { sendMagicLink, useAuth } from '../../hooks/useAuth';
import styles from './LoginPage.module.css';

type Status = 'idle' | 'sending' | 'sent' | 'error';

export default function LoginPage() {
  const { session, loading, authError } = useAuth();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (loading) {
    return (
      <div className={styles.page}>
        <p className={styles.muted}>正在确认登录状态…</p>
      </div>
    );
  }

  // 已登录直接回主页；非白名单邮箱已被 useAuth 强制下线，这里 session 一定是 null
  if (session) {
    return <Navigate to="/" replace />;
  }

  // 非作者邮箱的 Magic Link 回跳：useAuth signOut 后把消息抬到这里
  const banner = authError ?? errorMsg;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus('sending');
    setErrorMsg(null);
    const { error } = await sendMagicLink(email.trim());
    if (error) {
      setStatus('error');
      setErrorMsg(error);
    } else {
      setStatus('sent');
    }
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>登录</h1>
      <p className={styles.body}>
        输入邮箱获取 Magic Link，点击链接即可登录。仅作者本人需要登录；
        所有访客都可只读浏览。
      </p>

      {status === 'sent' ? (
        <div className={styles.success}>
          已发送 Magic Link 到 <span className={styles.email}>{email}</span>。
          请到邮箱查收并点击链接，登录成功后会自动回到主页。
        </div>
      ) : (
        <form onSubmit={onSubmit} className={styles.form}>
          <label className={styles.label}>
            邮箱
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              className={styles.input}
              disabled={status === 'sending'}
            />
          </label>
          <button
            type="submit"
            disabled={status === 'sending' || !email}
            className={styles.primary}
          >
            {status === 'sending' ? '发送中…' : '发送 Magic Link'}
          </button>
          {banner && <div className={styles.error}>{banner}</div>}
        </form>
      )}

      <p className={styles.muted}>
        仅白名单邮箱可登录；其它邮箱即便点了链接也会被立即下线。
      </p>

      {status !== 'sent' && (
        <Link to="/" className={styles.link}>
          ← 回到主页
        </Link>
      )}
    </div>
  );
}
