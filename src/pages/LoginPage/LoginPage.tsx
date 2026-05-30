import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { sendMagicLink, signOut, useAuth } from '../../hooks/useAuth';
import styles from './LoginPage.module.css';

type Status = 'idle' | 'sending' | 'sent' | 'error';

export default function LoginPage() {
  const { session, loading, email: signedInEmail } = useAuth();
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

  if (session) {
    return (
      <div className={styles.page}>
        <h1 className={styles.title}>已登录</h1>
        <p className={styles.body}>
          以 <span className={styles.email}>{signedInEmail}</span> 身份登录。
          回到主页即可编辑历年记录（编辑界面将在下一阶段上线）。
        </p>
        <div className={styles.actions}>
          <Link to="/" className={styles.link}>
            ← 回到主页
          </Link>
          <button
            type="button"
            className={styles.secondary}
            onClick={async () => {
              await signOut();
            }}
          >
            退出登录
          </button>
        </div>
      </div>
    );
  }

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
          请到邮箱查收并点击链接完成登录，登录成功会回到此页。
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
          {errorMsg && <div className={styles.error}>{errorMsg}</div>}
        </form>
      )}

      <p className={styles.muted}>
        非作者邮箱也可发送——Magic Link 只是邮箱所有权验证，
        登录后写操作仍由数据库 RLS 拦截。
      </p>

      {status !== 'sent' && (
        <Link to="/" className={styles.link}>
          ← 回到主页
        </Link>
      )}
    </div>
  );
}
