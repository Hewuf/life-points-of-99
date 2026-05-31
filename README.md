# 人生 · 99（Life-99）

用 99 个光点串起的一生时间轴。一条蜿蜒向上流动的河承载 99 个里程碑，过去的河面发光，未来的河面向页面顶部收束、消失在地平线外；当下那一年以萤火虫呼吸感的光点呈现，提醒"还在发生"。

<!-- 详细需求与技术方案见 `life-99-requirements.md`。 -->

## 仓库结构

```      
  src/                  # 前端（Vite + React + TypeScript）
    pages/              # 路由页面
    components/         # 河流 / 主题 / 浮卡 等
    lib/                # 河流几何、情绪色等纯函数
    hooks/              # 数据访问 hooks（V1 用 sample data，后续接 Supabase）
    styles/             # CSS 变量、reset、全局
docs/                   # 设计/需求草稿
```

## 本地运行

```bash
pnpm install
pnpm dev
```

打开 http://localhost:5173。

## 隐私与开源

- 出生年、姓名、邮箱、个人记录文本、照片均不进仓库，详见需求文档 §9.4。
- `.env` 已在 `.gitignore`。请按 `apps/web/.env.example` 自行创建本地 `.env`。
- 仓库中只允许出现 Supabase publishable key 占位（最终也由作者自己填）；任何 secret key 都不可入仓。

## 开发阶段

当前已落地（阶段 A + B）：

- pnpm monorepo + Vite + React + TS + React Router 骨架
- 明/暗主题（CSS 变量 + `data-theme` + `prefers-color-scheme` + localStorage）
- SVG 河流主页：蜿蜒中线、99 点三态、加权弧长分布、两段着色、自动定位 present、悬停摘要卡、点击进详情
- 情绪色（mood_score → 色带）
- 详情页查看态占位

后续待做（阶段 C/D/E）：

- 萤火虫呼吸 + reduced-motion 降级（视觉细节）
- Supabase 接入（Postgres + Storage + Magic Link Auth + RLS）
- 详情编辑态 + 图片上传
- 标签筛选、海报导出
