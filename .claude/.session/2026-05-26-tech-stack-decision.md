# 2026-05-26 · 技术栈选型敲定

> **议题**:Parallel-DDL v0.1 技术方案确定
> **结论**:Monorepo(pnpm workspaces)+ React/Vite 前端 + Hono 后端 + lowdb(本地 JSON)+ DeepSeek 后端代理。完整技术文档已沉淀至 [`docs/architecture.md`](../../docs/architecture.md)。

---

## 1. 关键决策(本次会话产出)

### 1.1 部署形态
- **从纯前端方案改为"前端 + 后端"双进程**(用户反馈推动)
- 仍以 **monorepo 单仓** 形式管理,不拆为两个 repo
- 数据库继续使用**本地 JSON 文件**(对齐 PRD §5.1)

### 1.2 选型一锤定音

| 维度 | 决定 | 否决/备选 |
| --- | --- | --- |
| Monorepo 工具 | pnpm workspaces | Turborepo(后期再加) |
| 前端框架 | React 18 + TS | Vue / Svelte |
| 构建 | Vite 5 | — |
| 样式 | Tailwind(沿用 demo) | — |
| 状态 | Zustand | Jotai / TanStack Query |
| 拖拽 | @dnd-kit | react-beautiful-dnd(停更) |
| 后端框架 | Hono | Fastify / Express |
| API 风格 | Hono RPC(`hc<AppType>`) | tRPC / 朴素 REST |
| 持久化 | lowdb v7 | 自写 fs + write-file-atomic |
| AI 调用 | **后端代理 DeepSeek** | 前端直连(被否决:既然有后端就走代理) |
| 校验 | Zod(共享包) | — |
| 日期 | date-fns | dayjs |
| ID | nanoid | uuid |

### 1.3 仓库结构
```
apps/web · apps/server · packages/shared · data/
```
- `packages/shared` 只放 Zod schema + 类型,前后端共享,**不放业务逻辑**
- `data/db.json` 入 .gitignore,`data/db.seed.json` 入仓

### 1.4 数据模型重要选择
- **`overdue` 不入库**,运行时由 ddl 与当前时间派生(避免持久化时间敏感字段)
- 入库 status 仅四档:`draft / in_progress / completed / archived`
- 步骤 schedule 用 `(YYYY-MM-DD, slot)` 二元组,允许一个步骤排到多个槽

### 1.5 AI 拆解的事务边界
- `POST /api/ai/breakdown` 设计为**纯函数语义**:只返回拆解结果,不写库
- 前端流程:先 `POST /api/projects` 建 draft → 调 ai/breakdown 拿步骤 → 用户编辑后再批量写步骤 + PATCH 状态为 in_progress
- **失败不留垃圾数据**

---

## 2. 仍待敲定(转入下一轮)

按阻塞优先级:

1. **AI Prompt 文本** — system prompt + few-shot,占位文件 `apps/server/src/services/prompt.ts`
2. **种子数据 `data/db.seed.json`** — 用于首次启动 / 新机器演示
3. **lint/format 配置** — ESLint flat config + Prettier(架构文档未细化)
4. **是否需要 SQLite 迁移路径的具体实现** — 当前仅在 §10 留了"持久化层是唯一入口"的口子

---

## 3. 用户偏好新增观察

- 用户更倾向"工程完整性 > 极简": 在我推荐"纯前端 + localStorage"后主动加入后端,体现对**数据隔离 + key 安全 + 后续扩展**的重视
- 接受将技术决策**沉淀为长文档**(`docs/architecture.md`),粒度细到目录树 + Zod schema 代码 + API 表

---

## 4. 后续开发顺序(详见 architecture.md 附录 A)

脚手架 → shared schema → server 骨架 → web 骨架对接真实 API → CRUD 全套 → 状态机 → 日历 → AI 拆解 → 种子/导出 → 打包验证。
