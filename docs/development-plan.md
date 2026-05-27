# Parallel-DDL — 开发任务拆解

> 版本:v0.1
> 更新:2026-05-26
> 配套阅读:[`architecture.md`](./architecture.md)、[`PRD.md`](../PRD.md)
> 总规模:**7 阶段 / 22 任务**,每个任务可独立交付与验证

---

## 总览

### 渐进交付原则
1. **每一个任务都能独立验证**:跑一个命令、curl 一次、或浏览器看一眼就能确认。
2. **后端先于前端**:每段前端工作所依赖的后端接口已在前一阶段就绪。
3. **先骨架后交互**:看板 UI 先静态拆分,再接真实数据,再加交互,再加 AI。
4. **AI 放靠后**:AI 拆解依赖前端创建表单 + 看板基础;放在 Phase 5,前 4 阶段不受其阻塞。

### 阶段地图

| 阶段 | 主题 | 任务数 | 产出 |
| --- | --- | --- | --- |
| Phase 0 | 脚手架与共享层 | 2 | Monorepo + Zod schema |
| Phase 1 | 后端基础设施 | 3 | Hono server + lowdb + 错误规范 |
| Phase 2 | 后端业务接口 | 4 | 全部 REST 端点(除 AI) |
| Phase 3 | 前端基础设施 | 3 | React 骨架 + 真实数据渲染 |
| Phase 4 | 看板交互 | 4 | 增删改查 + 拖拽 + 乐观更新 |
| Phase 5 | 创建表单 + AI 拆解 | 3 | 完整 AI 流程 |
| Phase 6 | 日历 | 3 | 月视图 + 日详情 + 安排 Modal |
| Phase 7 | 收尾 | 2 | 归档区 + 生产构建 |

### 依赖关系

```
T0.1 ─→ T0.2 ─→ T1.1 ─→ T1.2 ─→ T1.3 ─→ T2.1 ─→ T2.2 ─→ T2.3 ─→ T2.4
                                                            │
                                                            └─→ T5.2
                  T0.2 ─→ T3.1 ─→ T3.2 ─→ T3.3 ─→ T4.1 ─→ T4.2 ─→ T4.3 ─→ T4.4
                                                                          │
                                                                          ├─→ T5.1 ─→ T5.3
                                                                          └─→ T6.1 ─→ T6.2 ─→ T6.3
                                                                                              │
                                                                                              ├─→ T7.1
                                                                                              └─→ T7.2
```

**关键并行机会**:Phase 2(后端)与 Phase 3(前端骨架)从 T0.2 起可并行推进。

---

## Phase 0 — 脚手架与共享层

### T0.1 · Monorepo 初始化

**功能**
- 根目录创建:`package.json`、`pnpm-workspace.yaml`、`tsconfig.base.json`、`.gitignore`、`.nvmrc`
- workspaces 声明:`apps/*`、`packages/*`
- 创建空目录:`apps/web/`、`apps/server/`、`packages/shared/`、`data/`
- 顶层脚本:`dev`(并行)、`build`、`typecheck`、`lint`、`seed`
- TS paths:`@parallel-ddl/shared`、`@server/*`、`@web/*`
- `.gitignore` 至少包含:`node_modules`、`dist`、`.env`、`data/db.json`

**验收标准**
- `pnpm install` 成功无错
- 四个目标目录就位
- `pnpm typecheck` 退出码 0(此时无源码,空跑通过即可)
- `git status` 中 `data/db.json` 不会被追踪(可创建空文件验证)

**验证方式**
```bash
pnpm install
pnpm typecheck
touch data/db.json && git status   # 期望:db.json 不出现在变更列表
```

---

### T0.2 · Shared 包:Zod schema 完整实现

**功能**
- 在 `packages/shared/src/` 实现 [`architecture.md §4`](./architecture.md#4-数据模型) 全部 schema:
  - `status.ts` — `ProjectStatus`、`DerivedStatus`
  - `schedule.ts` — `TimeSlot`、`Schedule`
  - `step.ts` — `Step`
  - `project.ts` — `StepSize`、`Project`
  - `db.ts` — `DBFile`
  - `index.ts` — barrel export
- `package.json` 包名 `@parallel-ddl/shared`,`exports` 字段配 `./src/index.ts`
- 仅依赖 `zod`
- 写最小 vitest 用例:每个 schema 一个 happy + 一个 invalid case

**验收标准**
- `pnpm --filter @parallel-ddl/shared typecheck` 通过
- `pnpm --filter @parallel-ddl/shared test` 通过(全部用例绿)
- 在任意一个 apps 包中 `import { Project } from '@parallel-ddl/shared'`,IDE 能跳转、类型可推

**验证方式**
```bash
pnpm --filter @parallel-ddl/shared typecheck
pnpm --filter @parallel-ddl/shared test
```

---

## Phase 1 — 后端基础设施

### T1.1 · Hono server 启动骨架

**功能**
- `apps/server/src/index.ts`:Hono app + `@hono/node-server`,绑定 `127.0.0.1:3000`
- `GET /api/health` 返回 `{ ok: true, ts: <ISO> }`
- `export type AppType = typeof app` 供前端 `hc<>` 使用
- 启动脚本:`pnpm --filter server dev`(`tsx watch src/index.ts`)
- 生产脚本:`pnpm --filter server build`(`tsc`),`start`(`node dist/index.js`)

**验收标准**
- `pnpm --filter server dev` 启动,控制台打印 `Listening on http://127.0.0.1:3000`
- `curl http://127.0.0.1:3000/api/health` 返回 200 + 合法 JSON
- 修改源码自动重启(tsx watch 生效)

**验证方式**
```bash
pnpm --filter server dev      # 终端 A
curl -s http://127.0.0.1:3000/api/health | jq .
# 期望:{ "ok": true, "ts": "2026-..." }
```

---

### T1.2 · lowdb 持久化层 + 种子数据

**功能**
- `apps/server/src/db/index.ts`:lowdb v7 实例(`JSONFilePreset`),路径取 `process.env.DB_PATH ?? 'data/db.json'`
- 启动期 `DBFile.parse(db.data)` 校验,坏文件直接抛错(消息包含字段路径)
- 启动期若 `data/` 目录或 `db.json` 不存在,自动创建(默认空 `{ meta:{version:1}, projects:[] }`)
- 写 `data/db.seed.json`,含 2-3 个 demo project(覆盖 in_progress / completed / overdue 三态),其中至少一个 project 含步骤 + schedule
- 顶层脚本 `pnpm seed`:`cp data/db.seed.json data/db.json`
- 临时调试端点 `GET /api/_debug/db` 返回 `db.data`(后续会删除,本任务保留)

**验收标准**
- 删除 `data/db.json` 后启动,自动重建为默认空文件
- `pnpm seed` 后启动,`/api/_debug/db` 返回种子数据
- 故意往 `db.json` 写入 `{"projects":[]}`(缺 meta),启动报错且消息包含 `meta`

**验证方式**
```bash
rm -f data/db.json && pnpm --filter server dev
cat data/db.json   # 期望:默认空结构

pnpm seed && pnpm --filter server dev
curl -s localhost:3000/api/_debug/db | jq '.data.projects | length'
# 期望:>= 2

echo '{"projects":[]}' > data/db.json && pnpm --filter server dev
# 期望:启动失败,日志含 "meta"
```

---

### T1.3 · 错误中间件与响应规范

**功能**
- `AppError` class:`code`、`message`、`http`(默认按 code 推断)
- `app.onError(...)`:`AppError` 转 [`architecture.md §5.3`](./architecture.md#53-响应约定) 格式;非 `AppError` 转 `INTERNAL`(500)
- 成功响应 helper `ok(c, data)` → `{ ok: true, data }`
- `@hono/zod-validator` 接入:校验失败自动转 `VALIDATION_ERROR`(400),响应中含 zod issues
- 简单 logger 中间件:`<method> <path> <status> <ms>ms`
- 调试端点 `GET /api/_debug/throw?code=NOT_FOUND` 抛 AppError(后续会删除)

**验收标准**
- `curl /api/_debug/throw?code=NOT_FOUND` → 404 + `{ ok:false, error:"NOT_FOUND", message:"..." }`
- `curl /api/_debug/throw?code=BANANA` → 500 + `{ ok:false, error:"INTERNAL", ... }`(未识别 code 走兜底)
- 任意端点配 zValidator,发送非法 JSON 返回 400 + `VALIDATION_ERROR`
- 控制台每次请求一行 log

**验证方式**
```bash
curl -i 'localhost:3000/api/_debug/throw?code=NOT_FOUND'
curl -i -X POST localhost:3000/api/_debug/validate -d 'not-json' -H 'Content-Type: application/json'
```

---

## Phase 2 — 后端业务接口

### T2.1 · Projects CRUD + 重排

**功能**
- `routes/projects.ts` 实现:
  - `GET /api/projects` — 全量列表(本任务暂不派生 overdue,T2.4 加上)
  - `POST /api/projects` — 入参 `{ title, description?, ddl, stepSize }`,生成 `p_xxx` ID + `createdAt` + `status:'draft'` + `order:末尾`
  - `PATCH /api/projects/:id` — 部分更新 `{ title?, description?, ddl?, order? }`(status 不在此接口直改,留给归档动作)
  - `DELETE /api/projects/:id` — 即时删除,无确认(对齐 PRD §2.5)
  - `POST /api/projects/reorder` — 入参 `{ orderedIds: string[] }`,按数组顺序重写 order
- 全部入参 zValidator 校验
- 所有写操作走 `db.update`,持久化到 `db.json`

**验收标准**
- 创建 → GET 看到 → PATCH 改 title → GET 验证 → DELETE → GET 不再返回:全链路通畅
- 创建返回的 id 形如 `p_xxxxxxxxxx`(10 位 nanoid)
- DELETE 一个不存在的 id 返回 404 + `NOT_FOUND`
- reorder 后 `db.json` 内 order 字段与传入数组顺序一致

**验证方式**
```bash
# 创建
curl -s -X POST localhost:3000/api/projects \
  -H 'Content-Type: application/json' \
  -d '{"title":"test","ddl":"2026-06-01T00:00:00.000Z","stepSize":"25min"}' | jq .

# 列表
curl -s localhost:3000/api/projects | jq '.data | length'

# 删除不存在
curl -i -X DELETE localhost:3000/api/projects/p_nonexistent
```

---

### T2.2 · Steps CRUD + 重排

**功能**
- `routes/steps.ts` 实现:
  - `POST /api/projects/:id/steps` — 入参 `{ content }`,生成 `s_xxx` + `order:末尾` + `done:false`
  - `PATCH /api/steps/:id` — `{ content?, done?, schedules? }`(order 不在此接口直改)
  - `DELETE /api/steps/:id`
  - `POST /api/steps/reorder` — 入参 `{ projectId, orderedIds }`
- DELETE/PATCH 时找不到 step → 404
- schedules 校验:`Schedule[]`,date 格式 YYYY-MM-DD,slot ∈ TimeSlot

**验收标准**
- 完整 CRUD 链路通过 curl 验证
- `schedules` 字段:既能整体替换为 `[{date,slot}]`,也能改为 `[]` 清空
- 非法 slot(如 "afternoon")返回 400 + VALIDATION_ERROR

**验证方式**
```bash
PID=$(curl -s -X POST localhost:3000/api/projects -H 'Content-Type: application/json' \
  -d '{"title":"x","ddl":"2026-06-01T00:00:00.000Z","stepSize":"25min"}' | jq -r .data.id)

SID=$(curl -s -X POST localhost:3000/api/projects/$PID/steps \
  -H 'Content-Type: application/json' -d '{"content":"step1"}' | jq -r .data.id)

curl -s -X PATCH localhost:3000/api/steps/$SID \
  -H 'Content-Type: application/json' \
  -d '{"schedules":[{"date":"2026-05-30","slot":"morning"}]}' | jq .

curl -s localhost:3000/api/projects | jq ".data[] | select(.id==\"$PID\") | .steps"
```

---

### T2.3 · 归档 / 取消归档动作

**功能**
- `POST /api/projects/:id/archive`:仅当 status === `'completed'` 才允许,否则返回 400 + `VALIDATION_ERROR`("仅已完成任务可归档")
- `POST /api/projects/:id/unarchive`:仅当 status === `'archived'`,转回 `'completed'`
- 顺便实现"步骤全勾选自动转 completed":在 `PATCH /api/steps/:id` 中,若该 project 全部步骤 done=true 且 status='in_progress',则联动改为 `'completed'`;反之取消勾选导致非全 done 时,从 `'completed'` 回落 `'in_progress'`

**验收标准**
- 状态非 completed 时调 archive,得 400
- 状态 completed 时调 archive,db.json 内 status 变 archived,主看板 GET 不再返回(可加查询参数 `?include=archived` 留给后续 T7.1)
- 全步骤勾完 → GET 看到 status=completed
- 取消任一勾选 → status 回落 in_progress

**验证方式**:curl + 查 `db.json`

---

### T2.4 · overdue 状态派生

**功能**
- `services/status.ts` 实现 [`architecture.md §6.2`](./architecture.md#62-状态派生-appsserversrcservicesstatusts) 的 `deriveStatus`
- 所有返回 project 的端点统一 map 一遍 deriveStatus
- 优先级:`archived` > `completed`(全步骤 done) > `overdue`(now > ddl) > 入库 status
- 单元测试覆盖 4 种核心场景(in_progress 未到期、in_progress 已到期、completed 已到期、archived 已到期)

**验收标准**
- 种子数据中放一个 ddl 已过的 in_progress project,GET 返回 status=`overdue`
- 把它所有 step 勾选,GET 返回 status=`completed`(覆盖 overdue)
- archived 的 project ddl 已过,GET 仍返回 `archived`
- `pnpm --filter server test` 通过 deriveStatus 单测

**验证方式**
```bash
pnpm --filter server test     # 单测
curl -s localhost:3000/api/projects | jq '.data[] | {id, ddl, status}'
```

---

## Phase 3 — 前端基础设施

### T3.1 · Vite + React + Tailwind 初始化

**功能**
- 用 Vite `react-ts` 模板初始化 `apps/web`
- 接入 Tailwind 3.4,从 demo-UI/UI.html 抽取主题色到 `tailwind.config.ts`(如 `#FAF9F5`、`#8E867E`、`#1F1E1D`)
- 引入 Plus Jakarta Sans + PingFang SC 字体
- `vite.config.ts` 配置 `server.proxy['/api']` 指向 `http://127.0.0.1:3000`
- TS paths 接入 `@parallel-ddl/shared`、`@web/*`

**验收标准**
- `pnpm --filter web dev` 启动,浏览器 `:5173` 看到默认页 + Tailwind class 生效(用一个 `bg-[#FAF9F5]` 验证)
- 在浏览器 console 跑 `fetch('/api/health').then(r=>r.json())` 拿到 200 JSON(后端必须同时跑)
- `import { Project } from '@parallel-ddl/shared'` 类型可推

**验证方式**:浏览器 + DevTools

---

### T3.2 · UI demo 拆解为组件骨架(纯静态)

**功能**
- 把 `demo-UI/UI.html` 拆为 React 组件,**用写死 mock 数据**还原视觉:
  - `<AppLayout>`(header + 12 列 grid)
  - `features/create/<CreateForm>`(01)
  - `features/board/<Board>`、`<BoardCard>`、`<StepRow>`(02)
  - `features/archive/<ArchivedList>`(03)
  - `features/calendar/<CalendarMonth>`(04)
  - `features/today/<TodaySchedule>`(05)
- 4 种卡片态(进行中/已完成/已逾期/AI 拆解中)在 mock 数据里都覆盖
- 抽 `<Skeleton>` 通用组件

**验收标准**
- 浏览器 `:5173` 与 `demo-UI/UI.html` 视觉一致(并排截图比对,差异控制在像素级别)
- 各组件单独存在 features/ 子目录,互相 import 路径清晰

**验证方式**:浏览器并排开 `demo-UI/UI.html` 与本地 `:5173`,人眼对比 + 截图存档

---

### T3.3 · Hono RPC client + 接真实数据

**功能**
- `apps/web/src/api/client.ts`:`import type { AppType } from '@server/index'`(**仅 type-only**)+ `hc<AppType>('/')`
- 用 `client.api.projects.$get()` 替换看板 mock,渲染 `db.seed.json` 真实数据
- 类型链路:点 `client.api.projects` 应自动补全所有方法
- 验证 vite build 不会把 server 代码打进 bundle

**验收标准**
- 启动 server + web,看板从 `db.json` 读真实数据(覆盖 4 种态)
- 手动改 `db.json` 后浏览器刷新,UI 跟着变
- `pnpm --filter web build` 后 `apps/web/dist/` 中 grep 不到 server 代码标志(如 `JSONFilePreset`、`hono/node-server`)

**验证方式**
```bash
pnpm --filter web build
grep -r "JSONFilePreset" apps/web/dist/ ; echo "exit=$?"
# 期望:无匹配,exit=1
```

---

## Phase 4 — 看板交互

### T4.1 · Zustand store + 乐观更新框架

**功能**
- `store/index.ts`:Zustand store(`projects`、`loadingMap`、actions)
- 通用乐观更新 helper:
  ```typescript
  async function optimistic<T>(opts: {
    apply: () => void;       // 立即改 store
    rollback: () => void;    // 失败回滚
    request: () => Promise<T>;
    onError?: (e: unknown) => void;  // 默认 toast
  }): Promise<T | undefined>
  ```
- App mount 时 `useEffect` 调 `fetchAll()` 填充 store,T3.3 的本地 fetch 替换为 store
- 简单 toast 组件(失败回滚提示)

**验收标准**
- 首次进入页面,看板由 store 渲染,React DevTools 看 store 树合理
- toast 组件能在 store action 失败时弹出

**验证方式**:浏览器 + DevTools(临时人为让某个 action 失败,看 toast)

---

### T4.2 · 步骤交互(勾选 / 编辑 / 增删)

**功能**
- 勾选 checkbox → `toggleStep` 乐观更新 + PATCH
- 步骤文字双击进入 `<input>` 编辑态,Enter / blur 提交,Esc 取消
- "+ 添加步骤"按钮 → 末尾追加(POST 后获得真实 id 替换临时 id)
- 步骤 X 删除按钮(无确认,对齐 PRD §2.6)
- 全步骤勾完时,卡片状态联动变 completed(后端 T2.3 已联动,前端拿 GET 后自然变;乐观期由前端临时计算)

**验收标准**
- 勾选立即改样式(line-through),网络 200 后无 visible flicker
- 服务端断网(临时 kill server),勾选回滚 + toast
- 编辑步骤文字 + blur,持久化生效(刷新仍在)
- 增删步骤后 `db.json` 中 steps 数组同步

**验证方式**:浏览器 + Network panel + `cat data/db.json | jq`

---

### T4.3 · 卡片操作(编辑 / 删除 / 归档)

**功能**
- hover 卡片右上角显示编辑/删除/归档按钮
- 编辑标题与描述:点击编辑 → modal 或 inline 表单 → PATCH
- 删除卡片 → DELETE,无确认弹窗,UI 立即移除
- "已完成"态卡片显示"归档此任务"按钮 → POST /archive
- 归档成功后卡片从主看板消失(T7.1 接进 03 区)

**验收标准**
- 卡片 CRUD 全套生效,与 db.json 同步
- 删除无确认弹窗,UI 立即响应
- 归档非 completed 态会得 toast 报错(由后端 T2.3 拦截)

**验证方式**:浏览器全流程

---

### T4.4 · 拖拽(@dnd-kit)

**功能**
- 看板层 DndContext + SortableContext(`rectSortingStrategy`)包卡片
- 卡片内嵌 SortableContext(`verticalListSortingStrategy`)包步骤
- onDragEnd:本地立刻应用新顺序(乐观)→ 调 reorder 接口
- 拖拽期间禁用卡片内 checkbox 的 pointerEvents

**验收标准**
- 拖动卡片改变顺序,刷新页面后顺序保持
- 拖动步骤改变顺序,刷新后保持
- 拖拽过程中无法误触 checkbox(开发者面板 record 一段视频)
- reorder 接口失败时回滚 + toast

**验证方式**:浏览器手动拖拽 + 刷新验证

---

## Phase 5 — 任务创建 + AI 拆解

### T5.1 · 任务创建表单(无 AI)

**功能**
- 01 区表单使用 `react-hook-form` + `zodResolver`,复用 shared schema(派生 `CreateProjectInput`)
- 字段:title(必填)、description、ddl(必填,date input)、stepSize(单选,默认 25min)
- 提交按钮文案沿用 demo:"从最简单的第一步开始吧!"
- 提交 → POST /api/projects(status=draft)→ store 插入 → 看板顶部出现新卡片
- 此任务**不调 AI**,卡片状态停留 draft + 步骤为空 + "+ 添加步骤"按钮可用

**验收标准**
- 必填项空提交时表单内联校验提示
- 成功提交后 form reset + 卡片立刻出现
- 创建后 `db.json` 中能看到新 project,status=draft

**验证方式**:浏览器手动 + 查 db.json

---

### T5.2 · 后端 AI 拆解端点

**功能**
- `apps/server/src/services/prompt.ts`:`SYSTEM_PROMPT` + `buildUserPrompt(input)`(占位文本可先粗糙,文案对齐 PRD §3 后续替换)
- `services/deepseek.ts`:完整调用流程,`response_format: { type: 'json_object' }`,Zod 校验返回值
- `routes/ai.ts`:`POST /api/ai/breakdown`,zValidator 校验 `{ title, description?, ddl, stepSize }`
- env:`apps/server/.env.example` 列出 `DEEPSEEK_API_KEY`、`DEEPSEEK_BASE_URL`、`DEEPSEEK_MODEL`(默认 `deepseek-chat`)
- 错误处理:网络/HTTP 错 → `AI_PROVIDER_ERROR`(502);JSON 解析或 Zod 校验失败 → `AI_PARSE_ERROR`(502)

**验收标准**
- 配好 `.env` 后 curl 拿到非空中文步骤数组
- 把 `DEEPSEEK_BASE_URL` 改坏,curl 返回 502 + `AI_PROVIDER_ERROR`
- 把 model 改成不存在的,curl 返回 502 + `AI_PROVIDER_ERROR`
- 步骤颗粒度直觉上与 stepSize 匹配(5min 比 45min 步骤更碎更多)

**验证方式**
```bash
curl -s -X POST localhost:3000/api/ai/breakdown \
  -H 'Content-Type: application/json' \
  -d '{"title":"准备期末线代复习","ddl":"2026-06-15T23:59:59.000Z","stepSize":"25min"}' \
  | jq '.data.steps'
```

---

### T5.3 · 前端 AI 拆解流程串联

**功能**
- 改造 T5.1 的提交流程:
  1. POST /api/projects 拿 draft project
  2. UI 立即出现卡片,展示"AI 拆解中"骨架(对齐 demo 第 4 张卡)
  3. POST /api/ai/breakdown
  4. 拿到步骤后进入"确认 / 编辑"态:用户可改名/增删/重排步骤(复用 T4.2/T4.4)
  5. 点"确认拆解"按钮 → 批量 POST /api/projects/:id/steps + PATCH project status='in_progress'
- 拆解失败:toast + 卡片保留为 draft 态(用户可手动加步骤)
- 拆解期间卡片不可拖拽不可删除(简化:disabled 整张卡)

**验收标准**
- happy path:填表单 → 卡片出现 + 骨架 → 步骤填入 + 确认按钮 → 点击 → 卡片转 in_progress
- AI 失败 path:toast 显示错误码 + 卡片仍存,可手动加步骤
- 拆解中刷新页面,卡片状态停留在 draft + 0 步骤(因为 AI 接口本就不持久化)

**验证方式**:浏览器全流程演示;开关 .env 模拟失败

---

## Phase 6 — 日历

### T6.1 · 月视图渲染

**功能**
- date-fns 算 6×7 = 42 格(`startOfMonth` + `eachDayOfInterval` + 周首/末填充)
- 标记规则:
  - 当天:深色背景 + 白字
  - 上下月:浅灰
  - 含任意 schedule 的日期:格子下方小圆点
  - 是某 project DDL 且 project 未完成:红色 + ⚠ 角标
- 月份切换按钮(◀ 月份 ▶);初版可先固定本月,留 hooks

**验收标准**
- 种子数据中放某步骤排到 5 月 21 日,日历 21 号有圆点
- 种子中某 project DDL 在本月某天且 status != completed,该天变红
- DDL 在本月但 project 已 completed,**不变红**(已完成不算逾期)

**验证方式**:浏览器 + 调整种子数据多场景验证

---

### T6.2 · 日详情(早 / 中 / 晚)

**功能**
- 点击日历某格 → 选中态(高亮)→ 右侧 05 区切到该日
- 早/中/晚分组,每条展示:
  - 灰色小标题:所属 project title
  - 黑色主文:step content
- 仅展示,无 checkbox(对齐 PRD §4.4)
- 同一步骤被排到多个槽,每个槽都展示

**验收标准**
- 切换日期,05 区内容随之变化
- 跨多 schedule 的步骤在多个槽都展示
- 没有任何 schedule 的日期,05 区显示空态文案"暂无规划 · 自由呼吸时间"

**验证方式**:浏览器 + 切换日期

---

### T6.3 · "安排"Modal

**功能**
- 步骤行的"安排"按钮(对齐 demo 中的 calendar icon)→ 打开 modal
- Modal 内容:
  - 日期 picker(date input,默认今天)
  - 三档时段 checkbox(早/中/晚)
  - 已有 schedules 列表展示,可移除
  - 提交按钮:把当前选择追加到 schedules
- 提交 → PATCH /api/steps/:id { schedules: [...] }

**验收标准**
- 一个步骤排到 (2026-05-21, 早) 和 (2026-05-22, 晚) 后,日历两天都有圆点,日详情都能看到
- 移除某槽后,对应日期标记消失
- 跨日期重复添加同一 (date, slot) 时去重

**验证方式**:浏览器 + 切日历验证

---

## Phase 7 — 收尾

### T7.1 · 已归档区与取消归档

**功能**
- 03 区从 `GET /api/projects?include=archived`(或新增 `GET /api/projects/archived`)拉数据
- 列表展示标题 + 归档时间(可在 schema 加 `archivedAt` 字段;若不愿改 schema,临时按 createdAt 倒序)
- 点击列表项展开详情(可简化为 modal),含"取消归档"按钮
- 取消归档 → POST /unarchive → 列表立刻移除,主看板出现已完成卡片

**验收标准**
- 归档一个 project,从主看板消失 + 03 区列表出现
- 取消归档,从 03 消失,主看板出现且为 completed 态
- 03 区列表条数 = `db.json` 中 status='archived' 的 project 数

**验证方式**:浏览器 + 查 db.json

---

### T7.2 · 生产构建与单端口运行

**功能**
- 顶层 `pnpm build`:并行 `pnpm -r run build`,产出 `apps/server/dist/` + `apps/web/dist/`
- server 检测 `NODE_ENV === 'production'`,挂载 `apps/web/dist` 为静态目录,根路径 fallback 到 `index.html`(SPA 路由兼容)
- 移除所有 `_debug` 临时端点
- 单进程启动:`NODE_ENV=production node apps/server/dist/index.js`

**验收标准**
- `pnpm build` 成功
- 关闭所有 dev 进程,启动单一生产进程,`http://127.0.0.1:3000` 能看到完整 web app
- 全部既有功能(看板 / 创建 / AI / 日历 / 归档)在生产模式下正常
- `_debug` 端点不可访问(404)

**验证方式**
```bash
pnpm build
NODE_ENV=production node apps/server/dist/index.js   # 终端 A
# 浏览器手测全流程

curl -i localhost:3000/api/_debug/db   # 期望:404
```

---

## 跨任务工程实践

### 测试策略
- **不强制每任务都写单测**(单人项目),但以下必须有 vitest 覆盖:
  - 共享 schema 的 happy / invalid case(T0.2)
  - `deriveStatus` 全部分支(T2.4)
  - 任何 30 行以上有分支的纯函数
- 接口验收以 curl 为主,命令固化进每个任务的"验证方式"段
- UI 行为以浏览器人工验证为主

### 提交节奏
- 一个 T 编号 → 一个 PR(单人项目可接受单 commit)
- commit message:`feat: T1.2 lowdb 持久化层` / `fix: T2.4 overdue 优先级`
- 每完成一个 Phase 打 git tag:`v0.1.0-phase1`、`v0.1.0-phase2`...

### 质量门(每个任务结束前)
- `pnpm typecheck` 全仓通过
- `pnpm lint` 通过(若已配)
- 任务"验证方式"中所有命令 / 步骤全绿
- `data/db.json` 无遗留调试数据(可 `pnpm seed` 重置)

### 风险与回退
- **lowdb 写坏文件**:每次启动期 `DBFile.parse` 校验,失败前不写入,坏文件保留供排查
- **AI 接口长时间无响应**:浏览器请求超时由用户感知,不做自动重试(对齐 PRD §3.5)
- **拖拽 reorder 失败**:本地乐观回滚 + toast,不留半状态

### 完成度自检清单(全部任务结束后)
- [ ] PRD §2 所有任务级/步骤级操作可在 UI 完成
- [ ] PRD §3 AI 拆解流程闭环
- [ ] PRD §4 日历月视图 + 日详情 + 安排入口
- [ ] PRD §5 数据全部落到本地 JSON,无外部数据库
- [ ] PRD §6 工作流 6 步可走通
- [ ] PRD 附录 A "不做"清单全部确认未做

---

## 任务索引(便于跨文档引用)

| ID | 主题 |
| --- | --- |
| T0.1 | Monorepo 初始化 |
| T0.2 | Shared 包:Zod schema |
| T1.1 | Hono server 启动骨架 |
| T1.2 | lowdb 持久化层 + 种子数据 |
| T1.3 | 错误中间件与响应规范 |
| T2.1 | Projects CRUD + 重排 |
| T2.2 | Steps CRUD + 重排 |
| T2.3 | 归档 / 取消归档动作 |
| T2.4 | overdue 状态派生 |
| T3.1 | Vite + React + Tailwind 初始化 |
| T3.2 | UI demo 拆解为组件骨架 |
| T3.3 | Hono RPC client + 接真实数据 |
| T4.1 | Zustand store + 乐观更新框架 |
| T4.2 | 步骤交互(勾选 / 编辑 / 增删) |
| T4.3 | 卡片操作(编辑 / 删除 / 归档) |
| T4.4 | 拖拽(@dnd-kit) |
| T5.1 | 任务创建表单(无 AI) |
| T5.2 | 后端 AI 拆解端点 |
| T5.3 | 前端 AI 拆解流程串联 |
| T6.1 | 日历月视图渲染 |
| T6.2 | 日详情(早 / 中 / 晚) |
| T6.3 | "安排"Modal |
| T7.1 | 已归档区与取消归档 |
| T7.2 | 生产构建与单端口运行 |
