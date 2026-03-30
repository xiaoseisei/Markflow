# AGENTS.md — MarkFlow 项目 AI 开发规范
> **版本**: v1.0.0 | **更新日期**: 2025
> **适用工具**: Cursor / Claude Code / GitHub Copilot / 任何 AI 编程助手
> **配合文档**: 本文档需与 PRD.md、TECH_DESIGN.md 一起读取，三者共同构成完整项目意图。

---

## ⚠️ AI 读取须知

在生成任何代码之前，AI 必须完成以下步骤：

1. **读取 PRD.md** → 理解产品功能边界与用户故事
2. **读取 TECH_DESIGN.md** → 理解架构决策、数据结构、接口规范
3. **读取本文档（AGENTS.md）** → 遵守编码规范与禁止事项
4. **确认任务范围** → 如有歧义，生成前提出问题，不允许自行假设

---

## 一、项目基本信息

| 字段 | 值 |
|------|----|
| **项目名称** | MarkFlow — Markdown Desktop Editor |
| **技术栈** | Tauri 2.0 + React 18 + TypeScript 5 + CodeMirror 6 |
| **包管理器** | pnpm（**禁止**使用 npm 或 yarn） |
| **Node 版本** | >= 20.0.0 |
| **Rust 版本** | >= 1.77.0 (stable channel) |
| **TypeScript** | strict 模式开启 |
| **代码风格** | ESLint + Prettier（配置见项目根目录） |

---

## 二、目录结构规范

```
src/
├── components/         # UI 组件（按功能模块分文件夹）
│   └── {Module}/
│       ├── index.ts    # 统一导出入口（必须存在）
│       ├── {Module}.tsx
│       └── {Module}.test.tsx
├── store/              # Zustand 状态管理（仅此处）
├── hooks/              # 自定义 Hooks（必须以 use 开头）
├── utils/              # 纯函数工具（无副作用，无 React 依赖）
├── types/
│   └── index.ts        # 全局类型定义（唯一来源，集中管理）
├── constants/          # 常量定义（不可在组件内硬编码常量）
└── styles/             # 全局样式文件
```

### 命名规范

| 类型 | 格式 | 示例 |
|------|------|------|
| React 组件文件 | PascalCase | `FileTree.tsx` |
| Hook 文件 | camelCase + `use` 前缀 | `useAutoSave.ts` |
| 工具函数文件 | camelCase | `parseMarkdown.ts` |
| 类型/接口 | PascalCase | `FileNode`, `OpenedTab` |
| 常量 | UPPER_SNAKE_CASE | `DEFAULT_FONT_SIZE` |
| Zustand Store | camelCase + `Store` 后缀 | `useAppStore` |
| 组件 Props 类型 | `{ComponentName}Props` | `FileTreeProps` |
| CSS 变量 | `--kebab-case` | `--editor-bg` |

---

## 三、TypeScript 编码规范

### 3.1 强制规则

```typescript
// 正确：明确类型定义，无 any
interface FileNode {
  id: string
  name: string
  path: string
  type: 'file' | 'dir'
  children?: FileNode[]
}

// 正确：使用联合类型替代枚举
type ViewMode = 'split' | 'editor' | 'preview'
type ThemeMode = 'light' | 'dark' | 'system'

// 正确：函数有明确的返回类型
async function readFile(path: string): Promise<string> {
  return invoke<string>('read_file', { path })
}
```

### 3.2 绝对禁止

```typescript
// 禁止：使用 any 类型
const response: any = await fetch(url)

// 禁止：非空断言（没有确认说明）
const value = maybeNull!.property

// 禁止：忽略 TypeScript 错误
// @ts-ignore
const broken: string = 42

// 禁止：未使用的变量和导入
import { unused } from './module'
```

### 3.3 tsconfig.json 必须包含

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

---

## 四、React 组件规范

### 4.1 标准组件模板

```typescript
import { memo, useCallback } from 'react'
import { cn } from '@/utils/cn'
import type { FileNode } from '@/types'

interface FileTreeProps {
  nodes: FileNode[]
  activeFilePath: string | null
  onFileOpen: (path: string) => void
  className?: string
}

// 使用具名函数 + memo 组合（便于 DevTools 调试）
export const FileTree = memo(function FileTree({
  nodes,
  activeFilePath,
  onFileOpen,
  className,
}: FileTreeProps) {
  const handleNodeClick = useCallback((node: FileNode) => {
    if (node.type === 'file') {
      onFileOpen(node.path)
    }
  }, [onFileOpen])

  return (
    <ul className={cn('flex flex-col gap-0.5', className)} role="tree">
      {nodes.map(node => (
        <FileTreeNode
          key={node.id}
          node={node}
          isActive={node.path === activeFilePath}
          onClick={handleNodeClick}
        />
      ))}
    </ul>
  )
})
```

### 4.2 组件禁止事项

```typescript
// 禁止：在组件内部定义子组件（每次渲染重新创建）
function Parent() {
  function Child() { return <div /> }  // 禁止
  return <Child />
}

// 禁止：在 useEffect 中遗漏依赖项
useEffect(() => {
  doSomething(value)
}, [])  // 禁止：value 未在依赖数组中

// 禁止：在组件中直接调用 Tauri invoke
import { invoke } from '@tauri-apps/api/core'
// 必须通过 src/utils/tauri.ts 封装后调用
```

---

## 五、Zustand Store 规范

### 5.1 Store 结构要求

```typescript
// State 类型和 Actions 类型必须分开定义
interface AppActions {
  openTab: (tab: OpenedTab) => void
  closeTab: (tabId: string) => void
  updateTabContent: (tabId: string, content: string) => void
  markTabSaved: (tabId: string, savedContent: string) => void
}

export const useAppStore = create<AppState & AppActions>()(
  devtools(
    persist(
      immer((set) => ({
        // State 初始值...
        openedTabs: [],
        activeTabId: null,

        // Actions
        openTab: (tab) => set((state) => {
          const exists = state.openedTabs.find(t => t.path === tab.path)
          if (exists) {
            state.activeTabId = exists.id
            return
          }
          state.openedTabs.push(tab)
          state.activeTabId = tab.id
        }),
      })),
      {
        name: 'markflow-app-state',
        // 仅持久化用户偏好，不持久化文件内容
        partialize: (s) => ({ theme: s.theme, fontSize: s.fontSize })
      }
    )
  )
)
```

### 5.2 Store 使用规范

```typescript
// 正确：精确订阅，避免不必要重渲染
const activeTabId = useAppStore(s => s.activeTabId)

// 禁止：订阅整个 store（导致任何变化都重渲染）
const store = useAppStore()
```

---

## 六、Rust/Tauri 后端规范

### 6.1 Command 编写规范

```rust
// 必须：所有 Command 返回 Result<T, String>
// 必须：错误信息对用户友好，包含操作描述
#[command]
pub async fn read_file(path: String) -> Result<String, String> {
    std::fs::read_to_string(&path)
        .map_err(|e| format!("无法读取文件 '{}'：{}", path, e))
}

// 使用 ? 操作符传播错误，禁止 unwrap()
#[command]
pub async fn write_file(path: String, content: String) -> Result<(), String> {
    if let Some(parent) = std::path::Path::new(&path).parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("无法创建目录：{}", e))?;
    }
    std::fs::write(&path, content)
        .map_err(|e| format!("无法写入文件 '{}'：{}", e, path))
}
```

### 6.2 数据结构规范

```rust
// 跨 IPC 传输的结构体必须 derive Serialize/Deserialize/Clone
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FileNode {
    pub id: String,
    pub name: String,
    pub path: String,
    #[serde(rename = "type")]
    pub node_type: NodeType,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub children: Option<Vec<FileNode>>,
    pub depth: u32,
}

// 枚举使用 rename_all 保持与前端一致的命名
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "lowercase")]
pub enum NodeType { File, Dir }
```

---

## 七、样式规范

### 7.1 Tailwind 优先原则

```typescript
// 优先使用 Tailwind 工具类
<div className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent">

// 动态样式使用 cn() 工具函数合并
import { cn } from '@/utils/cn'
<div className={cn(
  'flex items-center gap-2 px-3 py-2 rounded-md transition-colors',
  isActive && 'bg-accent text-accent-foreground font-medium',
)}>

// 禁止：内联 style 对象（动态计算宽度等除外）
<div style={{ color: 'red', padding: '8px' }}>
```

### 7.2 CSS 变量（主题系统）

```css
/* 所有主题相关值必须通过 CSS 变量定义，不允许硬编码颜色 */
:root {
  --editor-bg: #ffffff;
  --editor-fg: #24292e;
  --editor-font-size: 14px;
  --editor-line-height: 1.6;
  --sidebar-width: 240px;
  --tab-height: 36px;
}

.dark {
  --editor-bg: #1e1e2e;
  --editor-fg: #cdd6f4;
  --sidebar-bg: #181825;
}
```

---

## 八、错误处理规范

```typescript
// 正确：所有 Tauri 调用必须有 try/catch，错误通过 toast 通知用户
async function handleSave() {
  try {
    await writeFile(activeTab.path, activeTab.content)
    toast.success('文件已保存')
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    toast.error(`保存失败：${message}`)
  }
}

// 禁止：静默捕获错误（空 catch）
try {
  await writeFile(path, content)
} catch {}  // 禁止！用户无法感知失败
```

### 用户提示规范

| 场景 | 提示方式 | 文案示例 |
|------|---------|---------|
| 成功保存 | Toast（绿色，2s） | "已保存 ✓" |
| 保存失败 | Toast（红色，5s） | "保存失败：磁盘空间不足" |
| 文件被外部修改 | Dialog（需确认） | "文件已被外部修改，是否重新加载？" |
| 关闭未保存文件 | Dialog（需确认） | "是否保存对 xxx.md 的更改？" |
| 删除文件 | Dialog（需确认） | "确认删除 xxx.md？此操作不可撤销。" |

---

## 九、键盘快捷键规范

> 所有快捷键在 `src/constants/shortcuts.ts` 统一定义，
> 在 `src/hooks/useKeyboardShortcuts.ts` 统一注册，
> 禁止在业务组件中散乱绑定 keydown 事件。

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+S` / `Cmd+S` | 保存当前文件 |
| `Ctrl+W` | 关闭当前标签页 |
| `Ctrl+P` | 打开文件/工作区 |
| `Ctrl+Shift+P` | 导出 PDF |
| `Ctrl+\` | 切换侧边栏 |
| `Ctrl+Shift+V` | 切换视图模式 |
| `Ctrl+Shift+F` | 全局搜索 |
| `Ctrl+N` | 新建文件 |

---

## 十、测试规范

### 测试覆盖要求

| 模块 | 最低覆盖率 | 必测项 |
|------|-----------|--------|
| `utils/` | > 90% | 所有导出函数 |
| `store/` actions | > 80% | 所有 action 方法 |
| 核心 Hooks | > 70% | useAutoSave、useFileWatch |
| 关键 Rust commands | > 80% | read_file、write_file、read_dir_tree |

```typescript
// 示例：工具函数测试
import { describe, it, expect } from 'vitest'
import { renderMarkdown } from '../markdown'

describe('renderMarkdown', () => {
  it('renders h1 heading', () => {
    expect(renderMarkdown('# Hello')).toContain('<h1>Hello</h1>')
  })

  it('sanitizes XSS script tags', () => {
    const result = renderMarkdown('<script>alert("xss")</script>')
    expect(result).not.toContain('<script>')
  })
})
```

---

## 十一、全局禁止事项清单

```
代码质量
  ❌ 使用 any 类型
  ❌ 使用 console.log（生产代码路径）
  ❌ 硬编码字符串（路径、颜色、配置值）
  ❌ 创建超过 300 行的单文件（必须拆分）
  ❌ 在 useEffect 中遗漏依赖项

架构纪律
  ❌ 在组件中直接调用 invoke()（必须通过 src/utils/tauri.ts）
  ❌ 在 utils/ 中引入 React（纯函数不依赖 React）
  ❌ 在 store 中处理 UI 副作用（toast、弹窗等由组件层处理）

安全
  ❌ 渲染未经 DOMPurify 净化的 HTML
  ❌ 将用户输入拼接为 shell 命令
  ❌ 在 Rust 中使用 unwrap()（测试代码除外）
  ❌ 静默失败（所有错误必须有用户可见的提示）

体验
  ❌ 遗漏加载状态（耗时操作必须有 loading 提示）
  ❌ 在关键操作（删除、覆盖）前未弹出确认对话框
```

---

## 十二、AI 代码生成检查清单

每次生成代码后，AI 必须自我验证：

- [ ] TypeScript strict 模式无报错
- [ ] 无 `any` 类型使用
- [ ] 所有异步操作有 try/catch 错误处理
- [ ] 组件有完整的 Props 类型定义
- [ ] Tauri 调用通过 `src/utils/tauri.ts` 封装
- [ ] 新组件已在对应模块的 `index.ts` 中导出
- [ ] 新类型已在 `src/types/index.ts` 中注册
- [ ] useEffect 依赖数组完整
- [ ] 涉及删除/覆盖的操作有用户确认弹窗
- [ ] 代码注释使用中文，说明业务意图

---

## 十三、Git 提交规范

```bash
# 格式：<type>(<scope>): <subject>（subject 使用中文）

feat(editor):     添加 CodeMirror Markdown 语法高亮
feat(sidebar):    实现文件树右键上下文菜单
fix(autosave):    修复标签页切换时定时器未清除的问题
refactor(store):  将 appStore 拆分为 fileStore 和 uiStore
style(theme):     统一暗色模式下编辑器背景色变量
test(utils):      为 renderMarkdown 添加 XSS 防护测试
chore(deps):      升级 Tauri 到 2.1.0
```

---

## 十四、记忆维护规则 (Memory Persistence)(用户自己添加的需要特别注意)
- 在每次重大功能完成或 Session 结束前，必须主动询问用户是否更新 `CLAUDE.md`。
- `CLAUDE.md` 必须包含：
  - [Current Status]: 描述最新的代码状态。
  - [Solved Traps]: 记录踩过的坑及解决方案（防止 AI 再次犯错）。
  - [Next Steps]: 待办清单。

---

## 十五、文档关联说明

```
MarkFlow 项目文档体系

  PRD.md          → 定义"做什么"（产品需求、功能边界、UX 流程）
  TECH_DESIGN.md  → 定义"怎么做"（架构、数据结构、接口规范）
  AGENTS.md       → 定义"做的规矩"（编码规范、禁止事项）本文档

三者必须配合读取，缺一不可。
如发现文档间存在冲突，以 TECH_DESIGN.md 为准，并立即提出歧义供人工确认。
```

---

*本文档是 MarkFlow 项目的 AI 开发行为约束文件。任何 AI 工具在修改或新增代码前必须读取并遵守本文档的所有规范。*
