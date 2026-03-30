export interface FileNode {
  id: string
  name: string
  path: string
  type: 'file' | 'dir'
  ext?: string
  children?: FileNode[]
  depth: number
}

export interface OpenedTab {
  id: string
  path: string
  title: string
  content: string
  savedContent: string
  cursorPos: number
  scrollTop: number
  isDirty: boolean
  language: string
}

export type ViewMode = 'split' | 'editor' | 'preview'

export type ThemeMode = 'light' | 'dark' | 'system'

export type CodeTheme = 'github-light' | 'one-dark' | 'dracula' | 'nord'

export type ExportFormat = 'pdf' | 'html' | 'docx' | 'markdown'
export type PaperSize = 'A4' | 'Letter' | 'A3'
export type Orientation = 'portrait' | 'landscape'

export interface ExportConfig {
  format: ExportFormat
  paperSize: PaperSize
  orientation: Orientation
  includePageNumbers: boolean
  includeHeader: boolean
  headerText?: string
  includeFooter: boolean
  footerText?: string
  cssTheme: 'github' | 'minimal' | 'academic'
  outputPath?: string
}

export interface FileChangedEvent {
  path: string
  kind: 'created' | 'modified' | 'deleted' | 'renamed'
  oldPath?: string
}

/**
 * 搜索结果项
 */
export interface SearchResult {
  /** 文件路径 */
  path: string
  /** 文件名 */
  fileName: string
  /** 匹配的行号（从 1 开始） */
  line: number
  /** 匹配的行内容 */
  content: string
  /** 匹配的文本 */
  match: string
  /** 匹配在行中的起始位置 */
  matchStart: number
  /** 匹配在行中的结束位置 */
  matchEnd: number
}

/**
 * 搜索结果汇总
 */
export interface SearchResultSummary {
  /** 文件路径 */
  path: string
  /** 文件名 */
  fileName: string
  /** 该文件的匹配数量 */
  count: number
  /** 该文件的搜索结果列表 */
  results: SearchResult[]
}

export interface AppConfig {
  lastWorkspace: string | null
  lastOpenedTabs: string[]
  lastActiveTab: string | null
  theme: ThemeMode
  codeTheme: CodeTheme
  fontSize: number
  fontFamily: string
  lineHeight: number
  wordWrap: boolean
  sidebarWidth: number
}

export interface AppState {
  workspace: string | null
  fileTree: FileNode[]
  openedTabs: OpenedTab[]
  activeTabId: string | null
  viewMode: ViewMode
  sidebarVisible: boolean
  sidebarWidth: number
  theme: ThemeMode
  codeTheme: CodeTheme
  fontSize: number
  fontFamily: string
  lineHeight: number
  wordWrap: boolean
}
