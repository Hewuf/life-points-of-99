import { useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useProfile } from '../../hooks/useProfile';
import { useYearEntry } from '../../hooks/useYearEntries';
import YearDetailView from './YearDetailView';
import YearDetailEditor from './YearDetailEditor';

/**
 * 路由层：只做"该不该进这一页 / 用查看态还是编辑态"两件事。
 * 视图与表单各自独立成兄弟组件，互不感知。
 */
export default function YearDetailPage() {
  const { year: yearParam } = useParams<{ year: string }>();
  const year = Number.parseInt(yearParam ?? '', 10);

  const { profile } = useProfile();
  const { userId } = useAuth();
  const { entry, refresh } = useYearEntry(Number.isFinite(year) ? year : 0);
  const [editing, setEditing] = useState(false);

  if (!Number.isFinite(year)) return <Navigate to="/" replace />;

  const age = year - profile.birth_year;
  const currentYear = new Date().getFullYear();
  const inBounds = age >= 0 && age < profile.lifespan;
  const isFuture = year > currentYear;

  // future / 越界一律回主页（§10）
  if (!inBounds || isFuture) return <Navigate to="/" replace />;

  // 编辑入口只是 UX，写入安全由 RLS 兜底（owner_id 必须 = auth.uid()）。
  // 因此判定登录就够：profile 拉取要走网络，等它回来才显示按钮会有 2-3 秒空窗。
  const canEdit = userId !== null;

  if (editing && userId) {
    return (
      <YearDetailEditor
        year={year}
        age={age}
        ownerId={userId}
        entry={entry}
        onCancel={() => setEditing(false)}
        onSaved={() => {
          refresh();
          setEditing(false);
        }}
      />
    );
  }

  return (
    <YearDetailView
      year={year}
      age={age}
      currentYear={currentYear}
      entry={entry}
      canEdit={canEdit}
      onEdit={() => setEditing(true)}
    />
  );
}
