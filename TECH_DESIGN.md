# TECH_DESIGN.md — MarkFlow 技术设计文档
> **版本**: v1.0.0 | **状态**: 草稿 | **更新日期**: 2025
> **适用**: Cursor / Claude Code 读取，指导代码架构实现

---

## 一、技术栈选型

### 1.1 推荐栈（桌面端优先）

```
┌─────────────────────────────────────────────────────────────┐
│                   MarkFlow 技术栈 (2025)                     │
├──────────────────┬──────────────────────────────────────────┤
│  桌面框架         │  Tauri 2.0 (Rust 核心 + WebView 前端)    │
│  前端框架         │  React 18 + TypeScript 5 (strict)        │
│  编辑器引擎       │  CodeMirror 6                            │
│  Markdown 解析   │  marked.js v12 + highlight.js v11        │
│  HTML 安全       │  DOMPurify                               │
│  数学公式        │  KaTeX                                   │
│  样式方案        │  Tailwind CSS v3 + shadcn/ui             │
│  状态管理        │  Zustand v5 (+ immer + devtools)         │
│  包管理器        │  pnpm v9（禁止 npm/yarn）                 │
│  构建工具        │  Vite 5                                  │
│  测试框架        │  Vitest + @testing-library/react         │
│  PDF 导出        │  系统打印 API（MVP），后期 wkhtmltopdf    │
│  文件系统        │  Tauri fs plugin（原生 Rust 读写）        │
└──────────────────┴──────────────────────────────────────────┘
```

### 1.2 选型决策说明

| 决策点 | 选择 | 放弃 | 核心理由 |
|--------|------|------|---------|
| **桌面框架** | Tauri 2.0 | Electron | 包体 ~8MB vs ~150MB；内存低 60%；安全沙箱 |
| **编辑器** | CodeMirror 6 | Monaco Editor | 比 Monaco 轻 60%；扩展系统现代；移动端友好 |
| **Markdown 解析** | marked.js | remark/unified | 解析速度更快；配置简单；生态成熟 |
| **状态管理** | Zustand | Redux/Jotai | 代码量少 10 倍；TypeScript 友好；无模板代码 |
| **PDF 导出（MVP）** | window.print() | Puppeteer | 零依赖；用户可控；MVP 阶段够用 |

### 1.3 备选方案（Web App 版本）

> 如不需要桌面端，可替换为：

```
Next.js 14 (App Router) + Monaco Editor +
File System Access API (Chrome/Edge) +
jsPDF / html2pdf.js（客户端导出）
```

---

## 二、系统架构

### 2.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                         Tauri Application                        │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                      React Frontend (WebView)              │  │
│  │                                                            │  │
│  │  ┌─────────────┐  ┌──────────────────┐  ┌─────────────┐  │  │
│  │  │   Sidebar   │  │   Editor Panel   │  │   Preview   │  │  │
│  │  │  ─────────  │  │  ─────────────  │  │   Panel     │  │  │
│  │  │  FileTree   │  │  CodeMirror 6   │  │  marked.js  │  │  │
│  │  │  SearchBox  │  │  + Extensions   │  │  + KaTeX    │  │  │
│  │  │  Outline    │  │  Toolbar        │  │  highlight  │  │  │
│  │  └─────────────┘  └──────────────────┘  └─────────────┘  │  │
│  │                                                            │  │
│  │  ┌───────────────────────────────────────────────────┐    │  │
│  │  │              TabBar (多标签管理)                   │    │  │
│  │  └───────────────────────────────────────────────────┘    │  │
│  │                                                            │  │
│  │  ┌───────────────────────────────────────────────────┐    │  │
│  │  │           Zustand Global State Store               │    │  │
│  │  └───────────────────────────────────────────────────┘    │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│                    Tauri IPC Bridge (invoke/emit)                │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Rust Backend                            │  │
│  │                                                            │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐  │  │
│  │  │  fs Commands │  │ File Watcher │  │ Export/Shell   │  │  │
│  │  │  read/write  │  │  (notify)    │  │ Commands       │  │  │
│  │  │  read_dir    │  │  emit events │  │                │  │  │
│  │  └──────────────┘  └──────────────┘  └────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│                       Local File System                          │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 数据流图

```
用户输入
  │
  ▼
CodeMirror onChange
  │
  ├─► Zustand updateTabContent()   ← 同步更新内存状态
  │
  └─► useAutoSave (debounce 500ms)
          │
          ▼
      invoke('write_file')         ← Tauri IPC 调用
          │
          ▼
      Rust: fs::write()            ← 写入磁盘
          │
          ▼
      Toast "已保存 ✓"             ← 用户反馈
```

---

## 三、数据结构定义

> AI 生成代码时，所有类型必须从 `src/types/index.ts` 导入，不允许在组件内临时定义类型。

```typescript
// src/types/index.ts

// ─── 文件系统 ─────────────────────────────────────────────────

/** 侧边栏文件树节点 */
export interface FileNode {
  id: string;              // SHA1(path) 唯一标识
  name: string;            // 文件/文件夹显示名
  path: string;            // 操作系统绝对路径
  type: 'file' | 'dir';
  ext?: string;            // 文件扩展名，如 'md', 'txt'
  children?: FileNode[];   // 仅 type === 'dir' 时存在
  depth: number;           // 树深度（根为 0）
}

// ─── 编辑器标签页 ──────────────────────────────────────────────

/** 已打开的文件标签页 */
export interface OpenedTab {
  id: string;              // 唯一 ID，使用 nanoid() 生成
  path: string;            // 文件绝对路径
  title: string;           // 显示标题（文件名去扩展名）
  content: string;         // 编辑器当前内容
  savedContent: string;    // 磁盘上的内容（用于 isDirty 判断）
  cursorPos: number;       // CodeMirror 光标位置（字符偏移）
  scrollTop: number;       // 编辑器滚动位置（像素）
  isDirty: boolean;        // true = 有未保存更改
  language: string;        // 编辑器语言（默认 'markdown'）
}

// ─── 应用全局状态 ──────────────────────────────────────────────

/** 视图模式 */
export type ViewMode = 'split' | 'editor' | 'preview';

/** 应用主题 */
export type ThemeMode = 'light' | 'dark' | 'system';

/** 代码块高亮主题 */
export type CodeTheme = 'github-light' | 'one-dark' | 'dracula' | 'nord';

/** 全局应用状态（Zustand Store） */
export interface AppState {
  // 工作区
  workspace: string | null;     // 当前工作区根目录路径
  fileTree: FileNode[];          // 文件树数据

  // 标签页
  openedTabs: OpenedTab[];       // 所有已打开标签
  activeTabId: string | null;    // 当前激活标签 ID

  // UI 状态
  viewMode: ViewMode;
  sidebarVisible: boolean;
  sidebarWidth: number;          // 单位 px，默认 240

  // 偏好设置
  theme: ThemeMode;
  codeTheme: CodeTheme;
  fontSize: number;              // 编辑器字体大小，默认 14
  fontFamily: string;            // 编辑器字体，默认 'monospace'
  lineHeight: number;            // 行高，默认 1.6
  wordWrap: boolean;             // 自动换行，默认 true
}

// ─── 导出配置 ──────────────────────────────────────────────────

export type ExportFormat = 'pdf' | 'html' | 'docx' | 'markdown';
export type PaperSize = 'A4' | 'Letter' | 'A3';
export type Orientation = 'portrait' | 'landscape';

export interface ExportConfig {
  format: ExportFormat;
  paperSize: PaperSize;
  orientation: Orientation;
  includePageNumbers: boolean;
  includeHeader: boolean;
  headerText?: string;
  includeFooter: boolean;
  footerText?: string;
  cssTheme: 'github' | 'minimal' | 'academic';
  outputPath?: string;           // 留空则弹出保存对话框
}

// ─── Tauri 后端共享类型 ─────────────────────────────────────────

/** Tauri Command 统一响应格式 */
export type TauriResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string };

/** 文件变更事件（文件监听 emit） */
export interface FileChangedEvent {
  path: string;
  kind: 'created' | 'modified' | 'deleted' | 'renamed';
  oldPath?: string;              // 仅 kind === 'renamed' 时存在
}

/** 应用持久化配置（存储在 appConfig） */
export interface AppConfig {
  lastWorkspace: string | null;
  lastOpenedTabs: string[];      // 路径列表
  lastActiveTab: string | null;
  theme: ThemeMode;
  codeTheme: CodeTheme;
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  wordWrap: boolean;
  sidebarWidth: number;
}
```

---

## 四、Tauri Commands 接口规范

### 4.1 文件系统命令

```rust
// src-tauri/src/commands/fs.rs

/// 读取文件内容为 UTF-8 字符串
#[tauri::command]
pub async fn read_file(path: String) -> Result<String, String>

/// 写入内容到文件（自动创建父目录）
#[tauri::command]
pub async fn write_file(path: String, content: String) -> Result<(), String>

/// 递归读取目录，返回文件树（最大深度 5）
#[tauri::command]
pub async fn read_dir_tree(path: String) -> Result<Vec<FileNode>, String>

/// 创建文件（文件已存在时返回错误）
#[tauri::command]
pub async fn create_file(path: String) -> Result<(), String>

/// 创建文件夹（递归创建）
#[tauri::command]
pub async fn create_dir(path: String) -> Result<(), String>

/// 删除文件或文件夹（文件夹递归删除）
#[tauri::command]
pub async fn delete_path(path: String) -> Result<(), String>

/// 重命名/移动文件或文件夹
#[tauri::command]
pub async fn rename_path(old_path: String, new_path: String) -> Result<(), String>

/// 检查路径是否存在
#[tauri::command]
pub async fn path_exists(path: String) -> Result<bool, String>
```

### 4.2 文件监听命令

```rust
// src-tauri/src/commands/watcher.rs

/// 开始监听目录变化（变化时 emit "file-changed" 事件到前端）
#[tauri::command]
pub async fn watch_dir(
    path: String, 
    window: tauri::Window
) -> Result<(), String>

/// 停止监听
#[tauri::command]
pub async fn unwatch_dir(path: String) -> Result<(), String>
```

### 4.3 导出命令

```rust
// src-tauri/src/commands/export.rs

/// 导出 HTML（内联 CSS）
#[tauri::command]
pub async fn export_html(
    html: String,
    config: ExportConfig,
    output_path: String
) -> Result<String, String>

/// 通过 shell 调用系统打印（MVP PDF 方案）
#[tauri::command]
pub async fn open_print_dialog(window: tauri::Window) -> Result<(), String>
```

### 4.4 配置命令

```rust
// src-tauri/src/commands/config.rs

/// 读取应用配置
#[tauri::command]
pub async fn get_app_config() -> Result<AppConfig, String>

/// 保存应用配置
#[tauri::command]
pub async fn save_app_config(config: AppConfig) -> Result<(), String>
```

### 4.5 前端调用规范

```typescript
// src/utils/tauri.ts
// 所有 Tauri Command 调用必须通过此文件的封装函数，不允许在组件中直接调用 invoke

import { invoke } from '@tauri-apps/api/core'
import type { FileNode, AppConfig, ExportConfig } from '@/types'

export async function readFile(path: string): Promise<string> {
  return invoke<string>('read_file', { path })
}

export async function writeFile(path: string, content: string): Promise<void> {
  return invoke<void>('write_file', { path, content })
}

export async function readDirTree(path: string): Promise<FileNode[]> {
  return invoke<FileNode[]>('read_dir_tree', { path })
}

export async function createFile(path: string): Promise<void> {
  return invoke<void>('create_file', { path })
}

export async function createDir(path: string): Promise<void> {
  return invoke<void>('create_dir', { path })
}

export async function deletePath(path: string): Promise<void> {
  return invoke<void>('delete_path', { path })
}

export async function renamePath(oldPath: string, newPath: string): Promise<void> {
  return invoke<void>('rename_path', { oldPath, newPath })
}
```

---

## 五、项目目录结构

```
markflow/
├── src-tauri/                        # Rust 后端
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   └── src/
│       ├── main.rs                   # 程序入口，注册所有 commands
│       ├── lib.rs
│       ├── models.rs                 # 共享数据结构（FileNode 等）
│       └── commands/
│           ├── mod.rs
│           ├── fs.rs                 # 文件系统操作
│           ├── watcher.rs            # 文件变更监听
│           ├── export.rs             # 导出功能
│           └── config.rs             # 应用配置读写
│
├── src/                              # React 前端
│   ├── main.tsx                      # 应用入口
│   ├── App.tsx                       # 根组件，布局组装
│   │
│   ├── types/
│   │   └── index.ts                  # 所有 TypeScript 类型定义
│   │
│   ├── constants/
│   │   ├── shortcuts.ts              # 键盘快捷键定义
│   │   ├── editor.ts                 # 编辑器默认配置
│   │   └── export.ts                 # 导出默认配置
│   │
│   ├── store/
│   │   ├── appStore.ts               # 主 Zustand Store
│   │   └── uiStore.ts                # UI 临时状态（弹窗、toast 等）
│   │
│   ├── hooks/
│   │   ├── useAutoSave.ts            # 自动保存（500ms 防抖）
│   │   ├── useFileWatch.ts           # 监听文件变更事件
│   │   ├── useKeyboardShortcuts.ts   # 全局快捷键注册
│   │   └── useTheme.ts               # 主题切换逻辑
│   │
│   ├── utils/
│   │   ├── tauri.ts                  # Tauri Command 封装（唯一调用层）
│   │   ├── markdown.ts               # marked.js 配置与渲染
│   │   ├── fileTree.ts               # 文件树处理工具函数
│   │   ├── export.ts                 # 导出功能逻辑
│   │   └── cn.ts                     # Tailwind className 合并工具
│   │
│   ├── components/
│   │   ├── Sidebar/
│   │   │   ├── index.ts
│   │   │   ├── Sidebar.tsx           # 侧边栏容器
│   │   │   ├── FileTree.tsx          # 文件树组件
│   │   │   ├── FileTreeNode.tsx      # 单个树节点
│   │   │   ├── FileContextMenu.tsx   # 右键菜单
│   │   │   └── SearchPanel.tsx       # 全局搜索面板
│   │   │
│   │   ├── Editor/
│   │   │   ├── index.ts
│   │   │   ├── MarkdownEditor.tsx    # CodeMirror 6 封装
│   │   │   ├── EditorToolbar.tsx     # 编辑器工具栏
│   │   │   └── extensions/           # CodeMirror 自定义扩展
│   │   │       ├── saveKeymap.ts     # Ctrl+S 保存快捷键扩展
│   │   │       └── markdownSyntax.ts # Markdown 语法增强
│   │   │
│   │   ├── Preview/
│   │   │   ├── index.ts
│   │   │   └── MarkdownPreview.tsx   # marked.js 预览组件
│   │   │
│   │   ├── Tabs/
│   │   │   ├── index.ts
│   │   │   ├── TabBar.tsx            # 标签栏容器
│   │   │   └── Tab.tsx               # 单个标签
│   │   │
│   │   ├── Export/
│   │   │   ├── index.ts
│   │   │   └── ExportDialog.tsx      # 导出配置对话框
│   │   │
│   │   └── ui/                       # shadcn/ui 通用组件
│   │       ├── toast.tsx
│   │       ├── dialog.tsx
│   │       └── tooltip.tsx
│   │
│   └── styles/
│       ├── globals.css               # 全局样式 + CSS 变量
│       ├── markdown.css              # Markdown 预览样式（GitHub 风格）
│       └── print.css                 # 打印/PDF 专用样式
│
├── AGENTS.md                         # AI 开发规范
├── PRD.md                            # 产品需求文档
├── TECH_DESIGN.md                    # 本文档
├── package.json
├── pnpm-lock.yaml
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

---

## 六、核心模块实现规范

### 6.1 CodeMirror 6 编辑器配置

```typescript
// src/components/Editor/MarkdownEditor.tsx
// AI 实现时参考此结构

const extensions = [
  // 语言支持
  markdown({ codeLanguages: languages }),  // Markdown + 内嵌代码语言
  
  // 主题（根据 appStore.theme 动态切换）
  theme === 'dark' ? oneDark : githubLight,
  
  // 编辑器功能
  lineNumbers(),
  highlightActiveLine(),
  highlightActiveLineGutter(),
  history(),
  foldGutter(),
  indentOnInput(),
  bracketMatching(),
  closeBrackets(),
  autocompletion(),
  
  // 自动换行
  EditorView.lineWrapping,
  
  // 快捷键
  keymap.of([
    ...defaultKeymap,
    ...historyKeymap,
    ...closeBracketsKeymap,
    ...completionKeymap,
    { key: 'Ctrl-s', run: handleSave },    // 自定义保存
    { key: 'Mod-s', run: handleSave },     // macOS 兼容
  ]),
  
  // onChange 监听
  EditorView.updateListener.of((update) => {
    if (update.docChanged) {
      onContentChange(update.state.doc.toString())
    }
  }),
]
```

### 6.2 marked.js 配置

```typescript
// src/utils/markdown.ts

import { marked } from 'marked'
import hljs from 'highlight.js'
import DOMPurify from 'dompurify'

// 配置 marked
marked.setOptions({
  gfm: true,          // GitHub Flavored Markdown
  breaks: true,       // 换行符转 <br>
})

// 代码高亮渲染器
const renderer = new marked.Renderer()
renderer.code = ({ text, lang }) => {
  const language = hljs.getLanguage(lang ?? '') ? lang! : 'plaintext'
  const highlighted = hljs.highlight(text, { language }).value
  return `<pre><code class="hljs language-${language}">${highlighted}</code></pre>`
}

marked.use({ renderer })

/** 渲染 Markdown 为安全 HTML */
export function renderMarkdown(content: string): string {
  const rawHtml = marked.parse(content) as string
  return DOMPurify.sanitize(rawHtml, {
    ADD_TAGS: ['math', 'semantics'],   // KaTeX 支持
    ADD_ATTR: ['class', 'aria-label'],
  })
}
```

### 6.3 自动保存 Hook

```typescript
// src/hooks/useAutoSave.ts

import { useEffect, useRef } from 'react'
import { writeFile } from '@/utils/tauri'
import { useAppStore } from '@/store/appStore'

const DEBOUNCE_DELAY = 500 // ms

export function useAutoSave(tabId: string, content: string, path: string) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const markTabSaved = useAppStore(s => s.markTabSaved)

  useEffect(() => {
    // 清除上一次定时器
    if (timerRef.current) clearTimeout(timerRef.current)

    // 设置新的防抖定时器
    timerRef.current = setTimeout(async () => {
      try {
        await writeFile(path, content)
        markTabSaved(tabId, content)
      } catch (error) {
        // 错误由 Tauri 层处理，这里显示 toast
        console.error('[AutoSave] Failed:', error)
        // TODO: 触发错误 toast
      }
    }, DEBOUNCE_DELAY)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [content, path, tabId, markTabSaved])
}
```

---

## 七、键盘快捷键规范

```typescript
// src/constants/shortcuts.ts

export const SHORTCUTS = {
  SAVE:           'Ctrl+S',
  CLOSE_TAB:      'Ctrl+W',
  OPEN_FILE:      'Ctrl+P',
  EXPORT_PDF:     'Ctrl+Shift+P',
  TOGGLE_SIDEBAR: 'Ctrl+\\',
  TOGGLE_VIEW:    'Ctrl+Shift+V',
  GLOBAL_SEARCH:  'Ctrl+Shift+F',
  FIND_IN_FILE:   'Ctrl+F',
  NEW_FILE:       'Ctrl+N',
  ZOOM_IN:        'Ctrl+=',
  ZOOM_OUT:       'Ctrl+-',
  ZOOM_RESET:     'Ctrl+0',
} as const
```

---

## 八、性能优化策略

| 场景 | 策略 |
|------|------|
| **大文件（>5MB）渲染** | 禁用实时预览，仅提供编辑器模式 |
| **文件树大量文件** | 虚拟滚动（react-virtual），仅渲染可见节点 |
| **预览重渲染** | `useMemo` 缓存 `renderMarkdown` 结果，内容不变不重算 |
| **编辑器状态** | `memo` 包裹编辑器组件，仅 `activeTabId` 变化时重载 |
| **自动保存** | 500ms 防抖 + 内容未变化时跳过写入 |
| **文件树刷新** | 文件监听事件触发局部刷新，而非全量重读目录 |

---

## 九、安全规范

| 风险 | 措施 |
|------|------|
| **XSS 攻击** | 所有 Markdown 渲染输出经过 DOMPurify 净化 |
| **路径穿越** | Rust 层校验所有文件路径，必须在 workspace 内 |
| **任意文件读取** | Tauri allowlist 限制文件访问范围 |
| **Shell 注入** | 禁止将用户输入拼接为 shell 命令 |

---

*本文档为 MarkFlow 项目技术设计文档，供 AI 代码生成工具读取分析架构意图。与 PRD.md 和 AGENTS.md 配合使用。*
