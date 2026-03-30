/**
 * 快捷键常量定义
 *
 * 【按键说明】
 * Mod: Ctrl (Windows/Linux) 或 Cmd (Mac)
 * Shift: Shift 键
 *
 * 【命名规范】
 * 功能域_动作：如 SAVE (保存)、CLOSE_TAB (关闭标签)
 * 格式化：FORMAT_BOLD、FORMAT_ITALIC 等
 */

export const SHORTCUTS = {
  // ========================================
  // 文件操作
  // ========================================
  /** 保存当前文件 */
  SAVE: 'Mod-s',
  /** 关闭当前标签 */
  CLOSE_TAB: 'Mod-w',
  /** 打开文件/工作区 */
  OPEN_FILE: 'Mod-p',
  /** 新建文件 */
  NEW_FILE: 'Mod-n',
  /** 导出 PDF */
  EXPORT_PDF: 'Mod-Shift-e',

  // ========================================
  // 格式化快捷键
  // ========================================
  /** 加粗 */
  FORMAT_BOLD: 'Mod-b',
  /** 斜体 */
  FORMAT_ITALIC: 'Mod-i',
  /** 删除线 */
  FORMAT_STRIKETHROUGH: 'Mod-Shift-x',
  /** 一级标题 */
  FORMAT_HEADING_1: 'Mod-1',
  /** 二级标题 */
  FORMAT_HEADING_2: 'Mod-2',
  /** 三级标题 */
  FORMAT_HEADING_3: 'Mod-3',
  /** 四级标题 */
  FORMAT_HEADING_4: 'Mod-4',
  /** 五级标题 */
  FORMAT_HEADING_5: 'Mod-5',
  /** 六级标题 */
  FORMAT_HEADING_6: 'Mod-6',
  /** 无序列表 */
  FORMAT_UNORDERED_LIST: 'Mod-Shift-8',
  /** 有序列表 */
  FORMAT_ORDERED_LIST: 'Mod-Shift-9',
  /** 任务列表 */
  FORMAT_TASK_LIST: 'Mod-Shift-t',
  /** 行内代码 */
  FORMAT_CODE_INLINE: 'Mod-`',
  /** 代码块 */
  FORMAT_CODE_BLOCK: 'Mod-Shift-c',
  /** 引用 */
  FORMAT_QUOTE: 'Mod-Shift->',
  /** 链接 */
  FORMAT_LINK: 'Mod-k',
  /** 图片 */
  FORMAT_IMAGE: 'Mod-Shift-i',
  /** 撤销 */
  UNDO: 'Mod-z',
  /** 重做 */
  REDO: 'Mod-Shift-z',

  // ========================================
  // 视图切换
  // ========================================
  /** 切换侧边栏 */
  TOGGLE_SIDEBAR: 'Mod-\\',
  /** 仅编辑器 */
  VIEW_EDITOR: 'Mod-Shift-1',
  /** 仅预览 */
  VIEW_PREVIEW: 'Mod-Shift-2',
  /** 分屏视图 */
  VIEW_SPLIT: 'Mod-Shift-3',

  // ========================================
  // 搜索
  // ========================================
  /** 全局搜索 */
  GLOBAL_SEARCH: 'Mod-Shift-f',
  /** 当前文件搜索 */
  FIND_IN_FILE: 'Mod-f',

  // ========================================
  // 其他
  // ========================================
  /** 缩放放大 */
  ZOOM_IN: 'Mod-=',
  /** 缩放缩小 */
  ZOOM_OUT: 'Mod--',
  /** 重置缩放 */
  ZOOM_RESET: 'Mod-0',
} as const

/**
 * 快捷键类型
 */
export type ShortcutKey = keyof typeof SHORTCUTS

/**
 * 快捷键显示标签（用于 UI 显示）
 */
export const SHORTCUT_LABELS: Record<string, string> = {
  'Mod-s': '保存',
  'Mod-w': '关闭标签',
  'Mod-p': '打开文件',
  'Mod-n': '新建文件',
  'Mod-Shift-e': '导出 PDF',
  'Mod-b': '加粗',
  'Mod-i': '斜体',
  'Mod-Shift-x': '删除线',
  'Mod-1': 'H1',
  'Mod-2': 'H2',
  'Mod-3': 'H3',
  'Mod-4': 'H4',
  'Mod-5': 'H5',
  'Mod-6': 'H6',
  'Mod-Shift-8': '无序列表',
  'Mod-Shift-9': '有序列表',
  'Mod-Shift-t': '任务列表',
  'Mod-`': '行内代码',
  'Mod-Shift-c': '代码块',
  'Mod-Shift->': '引用',
  'Mod-k': '链接',
  'Mod-Shift-i': '图片',
  'Mod-z': '撤销',
  'Mod-Shift-z': '重做',
  'Mod-\\': '切换侧边栏',
  'Mod-Shift-1': '仅编辑器',
  'Mod-Shift-2': '仅预览',
  'Mod-Shift-3': '分屏',
  'Mod-Shift-f': '全局搜索',
  'Mod-f': '查找',
  'Mod-=': '放大',
  'Mod--': '缩小',
  'Mod-0': '重置缩放',
}

/**
 * 将快捷键字符串转换为显示标签
 * @example
 * formatShortcutLabel('Mod-s') // 'Ctrl+S' (Windows) / '⌘S' (Mac)
 */
export function formatShortcutLabel(shortcut: string): string {
  const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform)
  return shortcut
    .replace('Mod', isMac ? '⌘' : 'Ctrl')
    .replace('Shift', '⇧')
    .replace('-', isMac ? '' : '+')
}
