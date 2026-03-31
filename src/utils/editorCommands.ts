/**
 * Markdown 编辑器命令类型定义
 */

export type EditorCommand =
  // 文本格式
  | 'bold'
  | 'italic'
  | 'strikethrough'
  // 标题
  | 'heading-1'
  | 'heading-2'
  | 'heading-3'
  | 'heading-4'
  | 'heading-5'
  | 'heading-6'
  | 'heading-clear'
  // 列表
  | 'unordered-list'
  | 'ordered-list'
  | 'task-list'
  // 代码
  | 'code-inline'
  | 'code-block'
  // 其他
  | 'quote'
  | 'divider'
  | 'link'
  | 'image'

/**
 * Markdown 格式化模板
 * selection: 选中的文本
 * prefix: 前缀符号
 * suffix: 后缀符号（可选）
 * placeholder: 无选中时的占位符
 */
interface FormatTemplate {
  prefix: string
  suffix?: string
  placeholder: string
}

/**
 * 格式化命令映射表
 */
const FORMAT_TEMPLATES: Record<EditorCommand, FormatTemplate> = {
  // 文本格式
  bold: { prefix: '**', suffix: '**', placeholder: '粗体文本' },
  italic: { prefix: '*', suffix: '*', placeholder: '斜体文本' },
  strikethrough: { prefix: '~~', suffix: '~~', placeholder: '删除线文本' },

  // 标题
  'heading-1': { prefix: '# ', placeholder: '一级标题' },
  'heading-2': { prefix: '## ', placeholder: '二级标题' },
  'heading-3': { prefix: '### ', placeholder: '三级标题' },
  'heading-4': { prefix: '#### ', placeholder: '四级标题' },
  'heading-5': { prefix: '##### ', placeholder: '五级标题' },
  'heading-6': { prefix: '###### ', placeholder: '六级标题' },
  'heading-clear': { prefix: '', placeholder: '清除标题格式' },

  // 列表
  'unordered-list': { prefix: '- ', placeholder: '列表项' },
  'ordered-list': { prefix: '1. ', placeholder: '列表项' },
  'task-list': { prefix: '- [ ] ', placeholder: '任务项' },

  // 代码
  'code-inline': { prefix: '`', suffix: '`', placeholder: '代码' },
  'code-block': { prefix: '```\n', suffix: '\n```', placeholder: '代码块' },

  // 其他
  quote: { prefix: '> ', placeholder: '引用文本' },
  divider: { prefix: '\n---\n', placeholder: '' },
  link: { prefix: '[', suffix: '](url)', placeholder: '链接文本' },
  image: { prefix: '![', suffix: '](url)', placeholder: '图片描述' },
}

/**
 * 生成格式化后的文本
 */
export function formatText(command: EditorCommand, selectedText: string): string {
  const template = FORMAT_TEMPLATES[command]

  if (selectedText) {
    // 有选中文本：包裹选中文本
    if (template.suffix) {
      return `${template.prefix}${selectedText}${template.suffix}`
    }
    return `${template.prefix}${selectedText}`
  }

  // 无选中文本：使用占位符
  if (template.suffix) {
    return `${template.prefix}${template.placeholder}${template.suffix}`
  }
  return `${template.prefix}${template.placeholder}`
}

/**
 * 获取格式化后光标应该移动的偏移量
 * 用于在插入占位符后，将光标定位到合适位置
 */
export function getCursorOffset(command: EditorCommand, selectedText: string): number {
  const template = FORMAT_TEMPLATES[command]

  if (selectedText) {
    // 有选中文本：光标移到文本末尾
    if (template.suffix) {
      return template.prefix.length + selectedText.length + template.suffix.length
    }
    return template.prefix.length + selectedText.length
  }

  // 无选中文本：光标定位到占位符之后（方便用户直接输入）
  if (template.suffix) {
    return template.prefix.length + template.placeholder.length
  }

  // 对于前缀类命令（如标题、列表），光标在行尾
  return template.prefix.length + template.placeholder.length
}

/**
 * 格式化命令分组（用于 UI 布局）
 */
export const COMMAND_GROUPS = {
  text: {
    label: '文本格式',
    commands: ['bold', 'italic', 'strikethrough'] as EditorCommand[],
  },
  heading: {
    label: '标题',
    commands: ['heading-1', 'heading-2', 'heading-3', 'heading-clear'] as EditorCommand[],
  },
  list: {
    label: '列表',
    commands: ['unordered-list', 'ordered-list', 'task-list'] as EditorCommand[],
  },
  code: {
    label: '代码',
    commands: ['code-inline', 'code-block'] as EditorCommand[],
  },
  other: {
    label: '其他',
    commands: ['quote', 'divider', 'link', 'image'] as EditorCommand[],
  },
} as const

/**
 * 命令显示名称映射
 */
export const COMMAND_LABELS: Record<EditorCommand, string> = {
  'bold': '加粗',
  'italic': '斜体',
  'strikethrough': '删除线',
  'heading-1': 'H1',
  'heading-2': 'H2',
  'heading-3': 'H3',
  'heading-4': 'H4',
  'heading-5': 'H5',
  'heading-6': 'H6',
  'heading-clear': '清除格式',
  'unordered-list': '无序列表',
  'ordered-list': '有序列表',
  'task-list': '任务列表',
  'code-inline': '行内代码',
  'code-block': '代码块',
  'quote': '引用',
  'divider': '分割线',
  'link': '链接',
  'image': '图片',
}

// 注意：图标已迁移到 EditorToolbar.tsx 中直接使用 lucide-react
// COMMAND_ICONS 已移除，避免与 lucide-react 组件冲突
