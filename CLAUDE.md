# CLAUDE.md

本文件为 Claude Code / 其他 AI 编程助手在 MarkFlow 项目中的协作指引。开始任何实现前，必须先读取并遵守：

1. `PRD.md` — 明确产品边界与功能优先级
2. `TECH_DESIGN.md` — 明确架构、数据结构、模块分层、接口规范
3. `AGENTS.md` — 明确编码规范、禁止事项、测试与提交流程

如三者冲突，以 `TECH_DESIGN.md` 为准，并先向用户确认歧义。

---

## User Preferences（用户偏好设置）

> 此区域记录用户对 AI 助手的长期要求，每次协作时必须遵守

### 协作规范
- **文档优先**：开始任何实现前，必须先读取 `PRD.md`、`TECH_DESIGN.md`、`AGENTS.md`、`CLAUDE.md`
- **记忆更新**：每次重大功能完成或 Session 结束前，必须主动询问是否更新 `CLAUDE.md`
- **提问优先**：任务有歧义时先提问，不自行假设

### 交互偏好
- **简洁输出**：代码和说明要简洁直接，避免冗余
- **中文注释**：代码注释使用中文，说明业务意图
- **错误处理**：用户可见错误必须有明确提示，禁止静默失败

---

## Project Overview

- 项目名：MarkFlow
- 定位：本地优先 Markdown 桌面编辑器
- 技术栈：Tauri 2.0 + React 18 + TypeScript 5 + CodeMirror 6
- 包管理器：`pnpm`（禁止 `npm` / `yarn`）
- Node：>= 20
- Rust：>= 1.77 stable
- TypeScript：必须开启 strict

---

## Source of Truth

### 产品目标
参考 `PRD.md`：
- MVP 核心功能：文件侧边栏、Markdown 编辑器、实时预览、文件操作、导出 PDF
- 目标体验：轻量、专注、本地优先、开箱即用

### 架构目标
参考 `TECH_DESIGN.md`：
- 前端：React + Zustand + Tailwind + shadcn/ui
- 编辑器：CodeMirror 6
- 预览：marked.js + highlight.js + DOMPurify + KaTeX
- 后端：Tauri Rust commands + 文件监听 + 导出/配置能力

### 实现纪律
参考 `AGENTS.md`：
- 所有类型从 `src/types/index.ts` 导入
- 所有 Tauri 调用统一走 `src/utils/tauri.ts`
- 快捷键统一定义在 `src/constants/shortcuts.ts`
- 快捷键统一注册在 `src/hooks/useKeyboardShortcuts.ts`
- 仅使用 `pnpm`

---

## Working Rules

### 必须遵守
- 先读文档，再改代码
- 任务有歧义时先提问，不自行假设
- 优先修改现有文件，避免无必要新增文件
- 保持改动最小，只实现用户明确要求的内容
- 新增代码要与既有目录分层一致
- 用户可见错误必须有明确提示，禁止静默失败

### TypeScript / React
- 禁止 `any`
- 禁止 `@ts-ignore`
- 禁止无说明的非空断言
- 组件必须有完整 Props 类型
- 组件内不要直接定义子组件
- `useEffect` 依赖必须完整
- 优先具名函数 + `memo`

### 状态与副作用
- Zustand store 只管理状态与 action
- store 中不处理 toast / dialog 等 UI 副作用
- 组件订阅 store 时必须精确选择 slice，避免整仓订阅

### Layout 与视图模式
- `Layout` 组件的 props 结构：`sidebar`、`editor`、`preview`、`toolbar`、`sidebarVisible`、`viewMode`、`statusBar`
- **工具栏必须始终可见**：不要把 `EditorToolbar` 放在 `editor` slot 中，会被 `viewMode` 条件渲染隐藏
- 视图显隐控制用 `flex-1` + `w-0 opacity-0 pointer-events-none`，不用百分比宽度
- `ResizeHandle` 等 UI 组件必须定义在模块顶层（`memo` 包装），不能放在父组件内部

### CodeMirror 编辑器
- 使用 `useRef` 存储 EditorView 实例，`prevValueRef` 存储文档内容
- **主题切换时**：必须先从 `view.state.doc.toString()` 读取内容，再销毁重建
- **外部 value 变化时**：使用 `view.dispatch(transaction)` 而非重建视图
- 初始化只在 `container` 首次可用时执行，不依赖 `value`

### Tauri / Rust
- 前端禁止直接 `invoke()`，统一通过 `src/utils/tauri.ts`
- Rust command 返回 `Result<T, String>`
- Rust 中禁止 `unwrap()`（测试代码除外）
- 文件路径必须考虑 workspace 边界与路径安全

### 安全
- Markdown 渲染输出必须经过 DOMPurify 净化
- 禁止把用户输入拼接为 shell 命令
- 删除、覆盖、重命名等关键操作前必须确认
- 文件访问需遵守 workspace 范围限制

### 样式
- 优先 Tailwind
- 动态 class 用 `cn()`
- 主题值走 CSS 变量
- 除特殊场景外禁止内联 style

---

## Expected Project Structure

目标结构以 `TECH_DESIGN.md` 为准：

- `src/`：React 前端
- `src/components/`：按模块组织 UI
- `src/store/`：Zustand stores
- `src/hooks/`：自定义 hooks
- `src/utils/`：纯工具与 Tauri 封装
- `src/types/index.ts`：全局类型唯一来源
- `src/constants/`：常量与快捷键
- `src/styles/`：全局样式 / markdown / print
- `src-tauri/`：Rust 后端与 commands

如果当前仓库尚未落地完整结构，后续实现也应尽量向该结构收敛。

---

## Implementation Notes

### MVP 优先级
优先完成：
1. 文件树与工作区管理
2. Markdown 编辑体验
3. 实时预览
4. 自动保存 / 手动保存 / 未保存状态
5. PDF 导出

### 关键约束
- 自动保存：500ms 防抖
- 大文件：必要时禁用实时预览
- 预览渲染：必须防 XSS
- 标签页：同一路径文件不得重复打开
- 持久化：偏好设置可持久化，文件内容不持久化进 store

### 测试要求
- `utils/` 覆盖率 > 90%
- `store/` actions 覆盖率 > 80%
- 核心 hooks 覆盖率 > 70%
- 关键 Rust commands 覆盖率 > 80%

---

## Commands

如果项目脚手架已建立，默认使用 `pnpm`：

```bash
pnpm install
pnpm dev
pnpm test
pnpm lint
pnpm build
```

如实际命令与脚手架不同，以仓库当前配置文件为准；不要擅自假设不存在的脚本。

---

## Git / Commit Convention

提交信息遵循：

```text
<type>(<scope>): <subject>
```

示例：
- `feat(editor): 添加 Markdown 语法高亮`
- `fix(autosave): 修复标签切换时自动保存定时器未清除`

---

## Current Status

**更新日期**：2026-03-31（第七次更新 - 视图切换与主题稳定性）

项目已从纯文档状态推进到**MVP 核心功能基本完成阶段**。

### 双模式支持 ✅
- **网页版**：`pnpm dev` → 使用 File System Access API
- **桌面版**：`pnpm tauri dev` → 使用 Tauri 原生 API（需安装 Rust）

### 已完成功能（2026-03-30 第三次更新）

#### 文件操作 ✅
- 打开单个文件/工作区
- 自动保存（500ms 防抖）
- 手动保存（Ctrl+S，带 Toast 提示）
- 未保存标签确认对话框
- 刷新文件树按钮

#### 文件树右键菜单 ✅
- 打开文件
- 新建文件/文件夹
- 重命名
- 复制路径
- 删除（带确认）

#### 多格式导出 ✅
- PDF（系统打印对话框）
- HTML（独立文件，带内联样式）
- Markdown（原始文本）
- 支持纸张大小、方向、样式主题配置

#### 编辑器工具栏 ✅（2026-03-30 第三次更新）
- **文本格式**：加粗、斜体、删除线
- **标题**：H1-H6 快速插入
- **列表**：无序列表、有序列表、任务列表
- **代码**：行内代码、代码块
- **其他**：引用、分割线、链接、图片
- **命令系统**：统一的 EditorCommand 类型定义

#### 快捷键系统 ✅（2026-03-30 第五次更新）
- **文件操作**：Mod+S 保存、Mod+W 关闭标签、Mod+P 打开文件、Mod+N 新建
- **格式化**：Mod+B 加粗、Mod+I 斜体、Mod+1-6 标题、Mod+K 链接等
- **视图切换**：Mod+Shift+1/2/3 编辑器/预览/分屏、Mod+\ 切换侧边栏
- **完整常量定义**：`src/constants/shortcuts.ts` 包含所有快捷键映射

#### 性能优化 ✅（2026-03-30 第三次更新）
- **文件树懒加载**：仅在用户展开目录时加载子节点
- **黑名单过滤**：自动忽略 `node_modules`、`.git`、`target`、`dist` 等目录（双端均实现）
- **默认折叠状态**：避免一次性渲染大量 DOM 节点
- **新增 Tauri 命令**：`read_dir_children` 按需加载子目录

#### 视图与主题稳定性 ✅（2026-03-31 第七次更新）
- **工具栏始终可见**：`EditorToolbar` 提取为 `Layout.toolbar` prop，不受 viewMode 影响
- **视图切换正常**：`split`/`edit`/`preview` 三模式可自由切换
- **主题切换不丢内容**：EditorView 销毁前直接读取 `view.state.doc.toString()`
- **ResizeHandle 稳定**：提升为模块级 `memo` 组件

当前已存在的关键内容：
- 根配置：`package.json`、`tsconfig.json`、`vite.config.ts`、`tailwind.config.ts`、`postcss.config.js`、`eslint.config.js`
- 前端目录：`src/`
- Tauri 后端目录：`src-tauri/`
- 基础测试：`src/utils/markdown.test.ts`、`src/store/appStore.test.ts`
- 全局类型定义：`src/global.d.ts`（File System Access API 类型）
- 编辑器命令系统：`src/utils/editorCommands.ts`（格式化命令定义）

当前已落地的核心能力：
- 基础应用布局：`src/App.tsx`
- 文件侧边栏（含右键菜单）：`src/components/Sidebar/*`
- 标签栏（含关闭确认）：`src/components/Tabs/*`
- Markdown 编辑器：`src/components/Editor/*`
- Markdown 安全预览：`src/components/Preview/MarkdownPreview.tsx`
- 导出对话框（多格式）：`src/components/Export/ExportDialog.tsx`
- 全局类型源：`src/types/index.ts`
- Zustand 状态管理：`src/store/appStore.ts`, `src/store/uiStore.ts`

### 新增适配器层（2026-03-30）
- **环境检测**：`src/utils/env.ts` - 检测 Tauri/浏览器环境
- **文件系统适配器**：`src/utils/fsAdapter.ts` - 统一文件操作接口
- **配置适配器**：`src/utils/configAdapter.ts` - 统一配置持久化接口
- **导出工具**：`src/utils/export.ts` - 多格式导出功能
- **Tauri 调用封装**：`src/utils/tauri.ts` - 保留向后兼容

当前验证状态：
- `pnpm test` 通过
- `pnpm build` 通过
- `pnpm lint` 通过
- `pnpm dev` 通过 ✅（网页版可运行）
- `pnpm tauri dev` 需安装 Rust 环境

当前实现定位：
- **MVP 核心功能基本完成**
- 可在浏览器中预览和测试大部分功能
- 桌面版需要安装 Rust 后才能完整测试

---

## Solved Traps

### 项目规范类
- 生成或修改代码前，必须同时读取 `PRD.md`、`TECH_DESIGN.md`、`AGENTS.md`，不能只看单个文档。
- 文档冲突时，优先以 `TECH_DESIGN.md` 为准，不能自行拍板。
- 不能默认使用 `npm` 或 `yarn`，本项目明确要求 `pnpm`。
- 不能在组件中直接调用 Tauri `invoke()`，必须经适配器层封装。
- 不能在组件或其他位置临时定义共享类型，必须统一放入 `src/types/index.ts`。

### 技术实现类
- ESLint 9 需要使用 `eslint.config.js`，不能再假设 `.eslintrc.*` 生效。
- TypeScript 若使用 `Array.prototype.at()`，`tsconfig.json` 的 `target/lib` 至少要到 `ES2022`。
- 浏览器预览模式下不一定有 Tauri 环境，需要先判断 Tauri 能力是否存在。

### 双模式支持（2026-03-30）
- **Vite 静态分析问题**：即使使用条件导入 `import('@tauri-apps/plugin-dialog')`，Vite 仍会在构建时解析该依赖。
  - **解决**：安装 `@tauri-apps/plugin-dialog` 包，让 Vite 能正确解析。
- **Tauri dialog 插件配置**：需要在 `tauri.conf.json` 的 `plugins` 字段中注册，Rust 后端已在 `lib.rs` 中初始化。
- **File System Access API 兼容性**：只支持 Chrome/Edge 86+，Safari/Firefox 支持有限。
  - **解决**：通过 `supportsFileSystemAccessAPI()` 检测，不支持的浏览器显示提示信息。
- **网页版路径问题**：浏览器无法访问真实文件系统路径，使用虚拟路径（如 `/filename.md`）。
  - **解决**：使用 `Map` 存储 `FileSystemHandle`，通过虚拟路径映射句柄。

### 功能实现（2026-03-30 第二次更新）
- **右键菜单状态管理**：需要在 Sidebar 组件中管理菜单位置和选中节点状态，点击外部或 ESC 关闭菜单。
- **导出降级方案**：File System Access API 不被支持时，需要降级到传统的 `<a>` 标签下载方式。
- **打印窗口权限**：导出 PDF 时打开新窗口可能被浏览器拦截，需要提示用户允许弹窗。
- **删除操作确认**：删除文件/文件夹是危险操作，必须弹出确认对话框，防止误删。

### 性能优化（2026-03-30 第三次更新）
- **文件树懒加载**：Rust 后端使用 `max_depth(1)` 仅扫描第一层，新增 `read_dir_children` 命令按需加载子节点。
- **黑名单过滤**：在 `fs.rs` 中定义 `IGNORED_DIRECTORIES` 常量，自动跳过 `node_modules`、`.git` 等目录。
- **前端默认折叠**：`FileTreeNode` 组件使用 `useState(false)` 避免一次性渲染大量 DOM。
- **类型定义补充**：在 `src/global.d.ts` 中添加 File System Access API 类型定义（`FileSystemDirectoryHandle.values()` 等）。

### 编辑器修复（2026-03-30 第三次更新）
- **光标丢失修复**：`MarkdownEditor.tsx` 使用 `useRef` 存储 EditorView 实例，避免因 `value` 变化而销毁重建视图。
- **Transaction 更新**：外部 value 变化时使用 `view.dispatch()` 而非重建视图。
- **分离 Theme 处理**：只有 theme 变化时才重建 EditorView。

### 视图与主题修复（2026-03-31）
- **工具栏被隐藏**：工具栏放在 `Layout` 的 `editor` slot 中，导致 `viewMode === 'preview'` 时工具栏随编辑器一起隐藏。解决：提取 `EditorToolbar` 为独立的 `toolbar` prop，始终渲染在 Layout 最外层。
- **视图切换失效**：使用百分比宽度控制显隐在 flex 布局中不生效。解决：改用 `flex-1` + `w-0 opacity-0 pointer-events-none` 组合。
- **主题切换内容丢失**：theme effect 依赖 `prevValueRef.current`，但该 ref 只在用户输入（`updateListener` 触发）时更新。解决：在销毁 EditorView **前**直接从 `view.state.doc.toString()` 读取当前内容。
- **ResizeHandle 稳定性**：`ResizeHandle` 组件定义在 `Layout` 内部，每次渲染创建新函数引用。解决：提升为模块级 `memo` 组件。
- **浏览器版黑名单**：`fsAdapter.ts` 的 `buildFileTreeFromHandle` 递归扫描时未过滤黑名单，导致浏览器版加载工作区极慢。解决：添加 `isIgnoredDirectory` 过滤。

---

## Next Steps

### 短期（优先级高）
- [ ] 安装 Rust 环境，验证 `pnpm tauri dev` 桌面版正常运行
- [ ] 测试网页版完整工作流：打开→编辑→保存→导出
- [ ] 测试桌面版文件操作：验证 Tauri dialog 插件正常工作
- [x] 添加编辑器工具栏按钮（加粗、斜体、标题等）✅
- [x] 实现快捷键系统（文件操作、格式化、视图切换）✅

### 中期（功能完善）
- [ ] 接入文件监听实现外部变更刷新（桌面版）
- [ ] 实现大纲面板（H1-H6 提取）
- [ ] 实现全局搜索（跨文件全文搜索）
- [ ] 完善配置持久化（保存编辑器偏好）

### 长期（架构优化）
- [ ] 继续扩充测试覆盖，优先覆盖 `store`、`utils`、关键 Tauri commands
- [ ] 网页版部署到 GitHub Pages
- [ ] Safari/Firefox 浏览器降级方案
- [ ] 性能优化：大文件处理、代码分割
