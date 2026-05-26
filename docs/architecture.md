# Parallel-DDL — 技术架构文档

> 版本:v0.1
> 更新:2026-05-26
> 状态:首版定稿,部分实现细节(AI prompt 文本、schema 升级策略)在开发中迭代
> 配套阅读:[`PRD.md`](../PRD.md)、[`demo-UI/UI.html`](../demo-UI/UI.html)

---

## 1. 总体架构

### 1.1 一句话概览
Monorepo 单仓多包,前端 SPA + 后端 Node 服务,**本地 JSON 文件**作数据库,后端代理 DeepSeek 完成 AI 拆解。前后端共享 Zod schema 实现端到端类型安全。

### 1.2 架构示意

```
┌──────────────────────────┐
│  Browser (localhost:5173)│
│  React + Vite SPA        │
└────────────┬─────────────┘
             │ fetch (Hono RPC client)
             ▼
┌──────────────────────────┐
│  Node Server (:3000)     │
│  Hono + lowdb            │
│  ├─ /api/projects ──────►│  data/db.json (本地 JSON)
│  ├─ /api/steps    ──────►│
│  └─ /api/ai/breakdown ──►│  DeepSeek API
└──────────────────────────┘
```

### 1.3 部署形态
- **开发期**:浏览器访问 `:5173`,Vite dev server 把 `/api/*` proxy 到 `:3000`。
- **生产期(浏览器版)**:server 单端口同时 serve 前端 `dist/` + API,本机访问。
- **后期(桌面化)**:Tauri 替壳,server 逻辑迁入 Rust 主进程或保留为 sidecar,前端代码不动。

---

## 2. 仓库结构

```
parallel-ddl/
├─ package.json                  # 根:workspaces 声明 + 顶层脚本
├─ pnpm-workspace.yaml
├─ tsconfig.base.json            # 共享 TS 配置(strict、paths)
├─ .gitignore                    # data/db.json, .env, node_modules, dist
├─ .nvmrc                        # node 20.x
├─ apps/
│  ├─ web/                       # 前端
│  │  ├─ package.json
│  │  ├─ vite.config.ts
│  │  ├─ tailwind.config.ts
│  │  ├─ index.html
│  │  └─ src/
│  │     ├─ main.tsx
│  │     ├─ App.tsx
│  │     ├─ api/                 # Hono RPC client + react hooks
│  │     ├─ components/          # 跨 feature 共用组件
│  │     ├─ features/
│  │     │  ├─ create/           # 01 任务拆解(创建表单)
│  │     │  ├─ board/            # 02 项目看板(主交互)
│  │     │  ├─ archive/          # 03 已归档
│  │     │  ├─ calendar/         # 04 日历
│  │     │  └─ today/            # 05 当日安排
│  │     ├─ store/               # Zustand store
│  │     ├─ hooks/
│  │     └─ utils/
│  └─ server/                    # 后端
│     ├─ package.json
│     ├─ .env.example            # DEEPSEEK_API_KEY 等
│     ├─ tsconfig.json
│     └─ src/
│        ├─ index.ts             # Hono app entry,导出 AppType
│        ├─ routes/
│        │  ├─ projects.ts
│        │  ├─ steps.ts
│        │  └─ ai.ts
│        ├─ db/
│        │  ├─ index.ts          # lowdb 实例 + 初始化
│        │  └─ migrate.ts        # schema 升级(预留)
│        ├─ services/
│        │  ├─ deepseek.ts       # DeepSeek 调用封装
│        │  └─ status.ts         # overdue 派生
│        └─ middleware/
│           ├─ error.ts
│           └─ logger.ts
├─ packages/
│  └─ shared/                    # 共享 Zod schema + 类型
│     ├─ package.json
│     └─ src/
│        ├─ index.ts             # barrel export
│        ├─ project.ts
│        ├─ step.ts
│        ├─ schedule.ts
│        ├─ status.ts
│        └─ db.ts                # 顶层 DB schema
├─ data/
│  ├─ db.json                    # 运行时数据(.gitignore)
│  └─ db.seed.json               # 种子样例(入仓,首次启动可拷贝为 db.json)
└─ docs/
   ├─ architecture.md            # 本文档
   └─ PRD.md
```

---

## 3. 技术栈与依赖

### 3.1 全局
| 项 | 选型 | 版本基线 | 说明 |
| --- | --- | --- | --- |
| 包管理 | **pnpm** | 9.x | workspaces 一等公民 |
| 运行时 | **Node** | 20.x LTS | `.nvmrc` 锁定 |
| 语言 | **TypeScript** | 5.4+ | 全仓 strict |
| 构建编排 | pnpm 顶层脚本 | — | 两个 app 暂无须 Turborepo,后期再加 |

### 3.2 前端(`apps/web`)
| 依赖 | 版本基线 | 用途 |
| --- | --- | --- |
| react / react-dom | 18.3 | 主框架 |
| vite | 5.x | 构建/Dev server |
| @vitejs/plugin-react | 4.x | — |
| typescript | 5.4 | — |
| tailwindcss | 3.4 | 样式(已在 demo 中使用) |
| zustand | 4.5 | 状态管理 |
| @dnd-kit/core / @dnd-kit/sortable | 6.x / 8.x | 卡片、步骤拖拽 |
| date-fns | 3.x | 日期工具 |
| react-hook-form | 7.x | 表单 |
| @hookform/resolvers | 3.x | 衔接 zod |
| zod | 3.23+ | 共享 schema(经 `@parallel-ddl/shared` 间接依赖) |
| nanoid | 5.x | 客户端临时 ID |
| hono | 4.x | 仅用 `hono/client` 的 `hc<>` |

### 3.3 后端(`apps/server`)
| 依赖 | 版本基线 | 用途 |
| --- | --- | --- |
| hono | 4.x | Web 框架 |
| @hono/node-server | 1.x | Node 适配器 |
| @hono/zod-validator | 0.2+ | 入参校验中间件 |
| lowdb | 7.x | 本地 JSON 持久化(原子写) |
| zod | 3.23+ | schema |
| dotenv | 16.x | env 加载 |
| nanoid | 5.x | 服务端 ID 生成 |
| tsx | 4.x | dev 运行 TS |
| typescript | 5.4 | — |

### 3.4 共享(`packages/shared`)
仅依赖 `zod`,**不引入运行时副作用**。所有导出物都是 Zod schema 与从中推导的 TS 类型。

---

## 4. 数据模型

### 4.1 Zod Schema(`packages/shared/src`)

```typescript
// status.ts
import { z } from 'zod';
export const ProjectStatus = z.enum([
  'draft',        // 刚创建,未确认拆解
  'in_progress',  // 已确认,有未完成步骤
  'completed',    // 全部步骤勾选
  'archived',     // 用户主动归档
]);
export type ProjectStatus = z.infer<typeof ProjectStatus>;

// 注:overdue 不入库,运行时由 ddl 与当前时间派生(见 §6.2)
export const DerivedStatus = z.enum([
  ...ProjectStatus.options,
  'overdue',
]);
export type DerivedStatus = z.infer<typeof DerivedStatus>;
```

```typescript
// schedule.ts
export const TimeSlot = z.enum(['morning', 'noon', 'evening']);
export const Schedule = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),  // YYYY-MM-DD
  slot: TimeSlot,
});
export type Schedule = z.infer<typeof Schedule>;
```

```typescript
// step.ts
export const Step = z.object({
  id: z.string().min(1),
  content: z.string().min(1).max(200),
  done: z.boolean().default(false),
  order: z.number().int().nonnegative(),
  schedules: z.array(Schedule).default([]),
});
export type Step = z.infer<typeof Step>;
```

```typescript
// project.ts
export const StepSize = z.enum(['5min', '10min', '25min', '45min']);
export const Project = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(100),
  description: z.string().max(500).default(''),
  ddl: z.string().datetime(),                  // ISO 8601
  createdAt: z.string().datetime(),
  status: ProjectStatus,                       // 入库的"用户态"
  order: z.number().int().nonnegative(),
  stepSize: StepSize,
  steps: z.array(Step).default([]),
});
export type Project = z.infer<typeof Project>;
```

```typescript
// db.ts
export const DBFile = z.object({
  meta: z.object({ version: z.literal(1) }),
  projects: z.array(Project).default([]),
});
export type DBFile = z.infer<typeof DBFile>;
```

### 4.2 状态机

存储字段 `status` 只有四档:`draft / in_progress / completed / archived`。
**`overdue` 是派生态**(见 §6.2),不入库。

| 当前 | 触发 | 下一态 |
| --- | --- | --- |
| draft | 用户确认 AI 拆解结果 | in_progress |
| in_progress | 全部 step.done = true | completed |
| in_progress | 用户取消勾选某步 | in_progress(保持) |
| completed | 用户取消勾选某步 | in_progress |
| completed | 用户点击归档 | archived |
| archived | 用户取消归档 | completed |
| (任意非 archived/completed) | now > ddl | **派生**为 overdue 展示 |

转换由后端 API 单点执行,客户端只发"语义动作"(toggleStep / archive / unarchive),不直接 PATCH status。

### 4.3 物理 JSON 结构

```json
{
  "meta": { "version": 1 },
  "projects": [
    {
      "id": "p_abc123",
      "title": "算法模块功能优化",
      "description": "重构核心评估指标采集逻辑",
      "ddl": "2026-05-29T23:59:59.000Z",
      "createdAt": "2026-05-20T08:00:00.000Z",
      "status": "in_progress",
      "order": 0,
      "stepSize": "25min",
      "steps": [
        {
          "id": "s_001",
          "content": "梳理并对齐评估指标",
          "done": true,
          "order": 0,
          "schedules": [{ "date": "2026-05-21", "slot": "morning" }]
        }
      ]
    }
  ]
}
```

设计取舍:
- 单文件、嵌套结构:一次读全量,单人量级(~几百 project)无压力。
- 步骤不独立成表:与所属 project 强绑定,无跨项目查询需求。
- `meta.version` 预留 schema 演进路径(配合 `db/migrate.ts`)。

---

## 5. API 设计

### 5.1 风格
- **REST 路径 + JSON body**,后端用 Hono `route.get/post/...` 链式声明。
- 通过 `export type AppType = typeof app` 把全部端点类型暴露给前端 `hc<AppType>` 客户端,**调用即类型安全**(无需手写 fetch wrapper)。
- 入参由 `@hono/zod-validator` 用 `packages/shared` 的 schema 校验。

### 5.2 端点清单

| Method | Path | 入参(Zod) | 出参 | 说明 |
| --- | --- | --- | --- | --- |
| GET | `/api/projects` | — | `Project[]`(含派生 status) | 全量列表 |
| POST | `/api/projects` | `{ title, description?, ddl, stepSize }` | `Project`(status=draft) | 仅创建,不触发 AI |
| PATCH | `/api/projects/:id` | `{ title?, description?, ddl?, order?, status? }` | `Project` | 编辑;status 只接受语义状态 |
| POST | `/api/projects/:id/archive` | — | `Project` | completed → archived |
| POST | `/api/projects/:id/unarchive` | — | `Project` | archived → completed |
| DELETE | `/api/projects/:id` | — | `{ ok: true }` | 即时删除,无确认 |
| POST | `/api/projects/:id/steps` | `{ content }` | `Step` | 末尾追加步骤 |
| PATCH | `/api/steps/:id` | `{ content?, done?, order?, schedules? }` | `Step`(+父 project 派生 status) | 通用更新 |
| DELETE | `/api/steps/:id` | — | `{ ok: true }` | — |
| POST | `/api/steps/reorder` | `{ projectId, orderedIds: string[] }` | `Step[]` | 拖拽重排 |
| POST | `/api/projects/reorder` | `{ orderedIds: string[] }` | `Project[]` | 看板卡片重排 |
| POST | `/api/ai/breakdown` | `{ title, description?, ddl, stepSize }` | `{ steps: { content }[] }` | 仅返回拆解结果,不写库 |

> 备注:看板上"AI 拆解"流程为:
> 1. 客户端先 `POST /api/projects` 创建 draft;
> 2. 调 `POST /api/ai/breakdown` 拿步骤;
> 3. 用户编辑/确认后,客户端按需 `POST /api/projects/:id/steps` 批量写入,并 PATCH project status 为 `in_progress`。
>
> 这样 AI 接口保持纯函数语义,不持久化中间态,失败也不留垃圾数据。

### 5.3 响应约定

成功:
```json
{ "ok": true, "data": { /* ... */ } }
```

失败:
```json
{ "ok": false, "error": "VALIDATION_ERROR", "message": "ddl 格式错误" }
```

错误码:
- `VALIDATION_ERROR` — 入参校验失败(400)
- `NOT_FOUND` — 资源不存在(404)
- `AI_PROVIDER_ERROR` — DeepSeek 网络/HTTP 错误(502)
- `AI_PARSE_ERROR` — DeepSeek 返回无法解析(502)
- `INTERNAL` — 兜底(500)

---

## 6. 关键模块设计

### 6.1 持久化层 `apps/server/src/db/index.ts`

```typescript
import { JSONFilePreset } from 'lowdb/node';
import { DBFile } from '@parallel-ddl/shared';

const dbPath = process.env.DB_PATH ?? 'data/db.json';

const lowdb = await JSONFilePreset<DBFile>(dbPath, {
  meta: { version: 1 },
  projects: [],
});

// 启动期校验:坏文件直接抛错,不悄悄忽略
DBFile.parse(lowdb.data);

export const db = lowdb;
```

**写操作约定**:
- 一律走 `db.update(state => mutator(state))`,内部 `await db.write()` 自动触发原子写。
- lowdb v7 内部使用 `write-file-atomic`(临时文件 + rename),崩溃不会留下半坏 JSON。
- 单进程单写,**不需要锁**;若日后做后台任务,用 `p-queue { concurrency: 1 }` 串行化。

**目录管理**:
- 启动时若 `data/` 不存在则创建。
- `data/db.json` 不存在时,以默认值初始化(同时给一个"导入种子文件"的脚本 `pnpm seed`)。

### 6.2 状态派生 `apps/server/src/services/status.ts`

```typescript
import type { Project, DerivedStatus } from '@parallel-ddl/shared';

export function deriveStatus(p: Project): DerivedStatus {
  if (p.status === 'archived' || p.status === 'completed') return p.status;
  const allDone = p.steps.length > 0 && p.steps.every(s => s.done);
  if (allDone) return 'completed';
  if (new Date(p.ddl) < new Date()) return 'overdue';
  return p.status;
}
```

调用点:
- `GET /api/projects`、`PATCH /api/steps/:id` 等返回 project 时统一过这个函数。
- 客户端拿到的 `status` 已经是派生态,前端直接按它选样式。

### 6.3 AI 调用层 `apps/server/src/services/deepseek.ts`

```typescript
import { z } from 'zod';

const Output = z.object({
  steps: z.array(z.object({ content: z.string().min(1).max(200) })).min(1),
});

export async function breakdown(input: {
  title: string;
  description?: string;
  ddl: string;
  stepSize: '5min' | '10min' | '25min' | '45min';
}) {
  const res = await fetch(`${process.env.DEEPSEEK_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.DEEPSEEK_MODEL ?? 'deepseek-chat',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(input) },
      ],
    }),
  });

  if (!res.ok) throw new AppError('AI_PROVIDER_ERROR', await res.text());

  const json = await res.json();
  const raw = json.choices?.[0]?.message?.content;
  try {
    return Output.parse(JSON.parse(raw));
  } catch {
    throw new AppError('AI_PARSE_ERROR', '模型返回的 JSON 不符合预期');
  }
}
```

约束(对齐 PRD §3.5):
- **不重试、不超时兜底**;失败直接 502 给前端。
- 仅中文输入输出。
- `SYSTEM_PROMPT` 与 `buildUserPrompt` 文本待 PRD §7.1 敲定后填入(预留位置:`apps/server/src/services/prompt.ts`)。

### 6.4 前端 Store(Zustand)

单 store,按 feature 切分 selector:

```typescript
interface AppState {
  projects: Project[];
  loadingMap: Record<string, boolean>;  // 卡片维度 loading

  fetchAll: () => Promise<void>;
  createProject: (input: CreateInput) => Promise<Project>;
  runAIBreakdown: (projectId: string) => Promise<void>;
  toggleStep: (stepId: string) => Promise<void>;     // 乐观更新
  reorderSteps: (projectId, orderedIds) => Promise<void>;
  reorderProjects: (orderedIds) => Promise<void>;
  // ...
}
```

策略:
- **乐观更新**:勾选、拖拽、重排立即改本地 state,失败回滚 + Toast。
- **AI 拆解过程**:`loadingMap[projectId] = true`,卡片渲染骨架(对齐 demo-UI 中"AI 拆解中"状态)。
- 不引入 TanStack Query;单进程单源数据,Zustand + 手写 fetch 已足够。

### 6.5 拖拽实现(@dnd-kit)

两套独立的 SortableContext:

| 场景 | 容器 | items | 拖完后 |
| --- | --- | --- | --- |
| 看板卡片重排 | 看板 grid | `projects.map(p => p.id)` | `POST /api/projects/reorder` |
| 步骤重排 | 单卡片内 | `project.steps.map(s => s.id)` | `POST /api/steps/reorder { projectId, orderedIds }` |

技巧:
- `closestCenter` collisionDetection,横向卡片拖拽用 `rectSortingStrategy`。
- 拖拽期间禁用卡片内的 checkbox `pointerEvents`(避免误触)。

### 6.6 日历(`features/calendar`)

- **月视图**:6×7 = 42 格,date-fns `startOfMonth / endOfMonth / eachDayOfInterval` 计算,标记每个日期是否有任意步骤的 schedule(小圆点)、是否是 DDL(警示色)。
- **日详情**:接收当日所有 schedule 关联的 step,分早 / 中 / 晚三段渲染。**只读**(对齐 PRD §4.4)。
- **"安排"入口**:卡片步骤上的"安排"按钮 → Modal,日期 picker + 三档时段勾选 → `PATCH /api/steps/:id { schedules: [...] }`。

---

## 7. 开发流程

### 7.1 环境准备
```bash
node -v  # 20.x
pnpm -v  # 9.x
```

### 7.2 初始化
```bash
pnpm install
cp apps/server/.env.example apps/server/.env
# 编辑 apps/server/.env,填入 DEEPSEEK_API_KEY
cp data/db.seed.json data/db.json   # 可选:用种子数据起步
```

### 7.3 启动开发
```bash
pnpm dev
```
顶层脚本并行起两个进程:
- `apps/server`:`tsx watch src/index.ts` → `:3000`
- `apps/web`:`vite` → `:5173`,`vite.config.ts` 中配置 `proxy: { '/api': 'http://localhost:3000' }`

### 7.4 构建
```bash
pnpm build
# apps/server: tsc → dist/
# apps/web:    vite build → dist/
```

### 7.5 生产运行(单机)
```bash
NODE_ENV=production node apps/server/dist/index.js
```
server 同时挂载 `apps/web/dist` 为静态目录,单端口对外。

### 7.6 常用脚本(根 `package.json`)
```json
{
  "scripts": {
    "dev": "pnpm -r --parallel run dev",
    "build": "pnpm -r run build",
    "typecheck": "pnpm -r run typecheck",
    "lint": "pnpm -r run lint",
    "seed": "cp data/db.seed.json data/db.json"
  }
}
```

---

## 8. 编码约定

### 8.1 TypeScript
- 全仓 `strict: true`
- 路径别名(`tsconfig.base.json`):
  - `@parallel-ddl/shared` → `packages/shared/src`
  - `@server/*` → `apps/server/src/*`(server 内部使用)
  - `@web/*` → `apps/web/src/*`(web 内部使用)
- 前端导入 server 类型时**只导入 type**(`import type { AppType } ...`),避免把后端代码打进 bundle。

### 8.2 命名
- 文件:kebab-case(`project-card.tsx`)
- React 组件:PascalCase(`<ProjectCard />`)
- hooks:`useXxx`
- Zod schema:PascalCase(`Project`)
- TS 类型:PascalCase,通常与 schema 同名(用 `z.infer` 推导)

### 8.3 校验
- **后端**:每个 route 用 `zValidator('json', SomeSchema)` 中间件,失败自动 400。
- **前端表单**:`react-hook-form` + `zodResolver(SomeSchema)`,**复用同一个 schema**。
- 前后端共用 schema 是 monorepo 的核心收益,**禁止在 apps 内自行定义业务数据 schema**。

### 8.4 时间
- 存储 / 传输:统一 ISO 8601 字符串(`new Date().toISOString()`)。
- 展示:前端用 date-fns 格式化(中文 locale)。
- `Schedule.date` 单独用 `YYYY-MM-DD`(无时区,语义是"哪一天")。

### 8.5 ID
- 服务端用 `nanoid(10)` 生成,带前缀:`p_xxx`(project)、`s_xxx`(step),便于日志辨识。

### 8.6 Git
- 主分支 `main`,功能分支 `feat/xxx`、修复分支 `fix/xxx`。
- `data/db.json`、`apps/server/.env` 永远不提交。

---

## 9. 安全与隐私

- 后端默认绑定 `127.0.0.1`,**不暴露到公网**。
- `DEEPSEEK_API_KEY` 仅出现在 `apps/server/.env`,前端 bundle 不可见。
- 单人本地版,**不做** CSRF token、JWT、登录态。
- 数据 100% 留在本机 `data/db.json`,除 AI 拆解请求外无任何外部传输。

---

## 10. 未来扩展(v0.1 不做,但代码结构需保留迁移空间)

| 方向 | 影响点 | 迁移策略 |
| --- | --- | --- |
| Tauri 桌面化 | 持久化路径、AI 调用 | server 保留为 Rust sidecar,或把 routes 改成 Tauri command;前端代码不动 |
| JSON 导入/导出 | 新增 `/api/db/export`、`/api/db/import` | export 直接序列化 `db.data`;import 走 `DBFile.parse` 再覆盖写 |
| schema 升级 | `meta.version` + `db/migrate.ts` | 启动时检测 version,跑迁移函数,版本号 +1 后写回 |
| 切换到 SQLite | 持久化层 | `db/index.ts` 是唯一入口,替换实现即可,routes/services 不动 |

---

## 11. 与 PRD 待办的对接

| PRD §7 待办 | 本文档对应 | 状态 |
| --- | --- | --- |
| AI Prompt 设计 | §6.3 + `apps/server/src/services/prompt.ts` | 占位,待文本敲定 |
| 技术栈选型 | 全文 | ✅ 本文档定稿 |
| JSON 数据 schema | §4 | ✅ 已定 |
| UI 视觉与交互稿 | `demo-UI/UI.html` | ✅ 已有 |
| 是否需要 JSON 导入/导出 | §10 | 暂缓 |
| AI 调用安全 | §9(后端代理 + .env) | ✅ 已定 |
| 个人衡量目标的具体表述 | 不在技术范畴 | — |

---

## 附录 A:第一阶段开发顺序建议

1. **脚手架**:仓库结构、pnpm workspaces、tsconfig、基础 lint。
2. **shared 包**:Zod schema 定型(§4),前后端可同时引用。
3. **server 骨架**:Hono app + lowdb + 错误中间件 + `GET /api/projects`(读种子数据)。
4. **web 骨架**:把 `demo-UI/UI.html` 拆解为 React 组件,接 `GET /api/projects` 渲染真实数据。
5. **CRUD**:projects + steps 全套接口与前端联动(乐观更新 + 拖拽)。
6. **状态机**:overdue 派生、归档/取消归档动作。
7. **日历**:月视图 + 日详情 + "安排"Modal。
8. **AI 拆解**:`POST /api/ai/breakdown` + 前端 loading 骨架。
9. **种子/导出脚本**:`pnpm seed`,以及简单的备份命令。
10. **打包与单机生产运行**验证。
