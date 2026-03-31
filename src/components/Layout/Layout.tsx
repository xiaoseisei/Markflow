import { memo, useState, useRef, useCallback, useEffect } from 'react'
import { cn } from '@/utils/cn'

/** 布局 Props */
interface LayoutProps {
  /** 左侧面板内容 */
  sidebar: React.ReactNode
  /** 中间编辑器面板内容 */
  editor: React.ReactNode
  /** 右侧预览面板内容 */
  preview: React.ReactNode
  /** 工具栏（始终可见，不受 viewMode 影响） */
  toolbar: React.ReactNode
  /** 侧边栏是否可见 */
  sidebarVisible: boolean
  /** 视图模式：分屏/编辑/预览 */
  viewMode: 'split' | 'editor' | 'preview'
  /** 底部状态栏 */
  statusBar?: React.ReactNode
}

/** 可拖动分割线组件 - 定义在组件外部以确保稳定 */
const ResizeHandle = memo(function ResizeHandle({
  onDrag,
  onDragStart,
  onDragEnd,
}: {
  onDrag: (delta: number) => void
  onDragStart?: () => void
  onDragEnd?: () => void
}) {
  const draggingRef = useRef(false)
  const startXRef = useRef(0)
  const lastUpdateRef = useRef(0)
  // 节流阈值：33ms ≈ 30fps，在丝滑度和性能间取得平衡
  const THROTTLE_MS = 33

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      draggingRef.current = true
      startXRef.current = e.clientX
      lastUpdateRef.current = Date.now()
      onDragStart?.()

      const handleMouseMove = (e: MouseEvent) => {
        if (!draggingRef.current) return

        const now = Date.now()
        const delta = e.clientX - startXRef.current
        startXRef.current = e.clientX

        // 节流：只在超过阈值时才触发状态更新
        if (now - lastUpdateRef.current >= THROTTLE_MS) {
          lastUpdateRef.current = now
          onDrag(delta)
        }
      }

      const handleMouseUp = () => {
        if (draggingRef.current) {
          draggingRef.current = false
          onDragEnd?.()
        }
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    },
    [onDrag, onDragStart, onDragEnd]
  )

  return (
    <div
      className={cn(
        'group relative flex w-1 cursor-col-resize items-stretch',
        'bg-slate-200 dark:bg-slate-700',
        'transition-colors hover:bg-blue-400/50',
      )}
      onMouseDown={handleMouseDown}
    >
      {/* 拖动手柄指示器 */}
      <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-slate-300 dark:bg-slate-600" />
    </div>
  )
})

export const Layout = memo(function Layout({
  sidebar,
  editor,
  preview,
  toolbar,
  sidebarVisible,
  viewMode,
  statusBar,
}: LayoutProps) {
  // 侧边栏宽度（百分比）
  const [sidebarWidth, setSidebarWidth] = useState(15)
  // 编辑器宽度（百分比）
  const [editorWidth, setEditorWidth] = useState(45)
  // 拖拽状态：用于优化大规模 DOM 更新的卡顿
  const [isDragging, setIsDragging] = useState(false)

  // 拖拽期间使用 ref 存储宽度（避免每次 mousemove 都 setState）
  const sidebarWidthRef = useRef(sidebarWidth)
  const editorWidthRef = useRef(editorWidth)

  // 同步 ref 到 state
  useEffect(() => {
    sidebarWidthRef.current = sidebarWidth
  }, [sidebarWidth])

  useEffect(() => {
    editorWidthRef.current = editorWidth
  }, [editorWidth])

  // 处理侧边栏分割线拖动（节流后的状态更新）
  const handleSidebarDrag = useCallback((delta: number) => {
    const container = window.innerWidth
    const deltaPercent = (delta / container) * 100
    const newWidth = Math.min(30, Math.max(10, sidebarWidthRef.current + deltaPercent))
    sidebarWidthRef.current = newWidth
    setSidebarWidth(newWidth)
  }, [])

  // 处理编辑器/预览分割线拖动（节流后的状态更新）
  const handleEditorDrag = useCallback((delta: number) => {
    const container = window.innerWidth
    const deltaPercent = (delta / container) * 100
    const newWidth = Math.min(70, Math.max(20, editorWidthRef.current + deltaPercent))
    editorWidthRef.current = newWidth
    setEditorWidth(newWidth)
  }, [])

  // 拖拽开始
  const handleDragStart = useCallback(() => {
    setIsDragging(true)
    document.body.style.userSelect = 'none'
  }, [])

  // 拖拽结束
  const handleDragEnd = useCallback(() => {
    setIsDragging(false)
    document.body.style.userSelect = ''
    // 同步最终宽度到 ref（下次拖拽时起点正确）
    sidebarWidthRef.current = sidebarWidth
    editorWidthRef.current = editorWidth
  }, [sidebarWidth, editorWidth])

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      {/* 工具栏 - 始终可见，不受 viewMode 影响 */}
      {toolbar}

      {/* 主内容区 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 侧边栏 */}
        <div
          className={cn(
            'flex-shrink-0 overflow-hidden',
            // 拖拽时移除过渡动画，减少重绘开销
            isDragging ? '' : 'transition-all duration-200',
            // 拖拽时禁用指针事件
            isDragging ? 'pointer-events-none' : '',
            sidebarVisible ? 'opacity-100' : 'opacity-0 pointer-events-none w-0'
          )}
          style={sidebarVisible ? { width: `${sidebarWidth}%` } : undefined}
        >
          <div className="flex h-full flex-col bg-slate-900 text-slate-200">
            {sidebar}
          </div>
        </div>

        {/* 侧边栏分割线 */}
        {sidebarVisible && (
          <ResizeHandle
            onDrag={handleSidebarDrag}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          />
        )}

        {/* 编辑器 */}
        <div
          className={cn(
            'flex flex-col overflow-hidden',
            // 拖拽时移除过渡动画，使用 GPU 加速
            isDragging ? 'will-change-width' : 'transition-all duration-200',
            // 拖拽时禁用指针事件
            isDragging ? 'pointer-events-none' : '',
            viewMode === 'preview' ? 'w-0 opacity-0 pointer-events-none' :
            viewMode === 'editor' ? 'flex-1' : ''
          )}
          style={viewMode === 'split' ? { width: `${editorWidth}%` } : undefined}
        >
          {viewMode !== 'preview' && editor}
        </div>

        {/* 编辑器/预览分割线 */}
        {viewMode === 'split' && (
          <ResizeHandle
            onDrag={handleEditorDrag}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          />
        )}

        {/* 预览 */}
        <div
          className={cn(
            'flex flex-col overflow-hidden',
            // 拖拽时移除过渡动画，使用 GPU 加速
            isDragging ? 'will-change-width' : 'transition-all duration-200',
            // 拖拽时禁用指针事件
            isDragging ? 'pointer-events-none' : '',
            viewMode === 'editor' ? 'w-0 opacity-0 pointer-events-none' :
            viewMode === 'preview' ? 'flex-1' : ''
          )}
          style={viewMode === 'split' ? { width: `${100 - sidebarWidth - editorWidth}%` } : undefined}
        >
          {viewMode !== 'editor' && preview}
        </div>

        {/* 拖拽遮罩层：捕获所有鼠标事件，防止编辑器/预览区在拖拽时重绘 */}
        {isDragging && (
          <div className="pointer-events-auto fixed inset-0 z-50 cursor-col-resize" />
        )}
      </div>

      {/* 状态栏 */}
      {statusBar && (
        <div className="flex-shrink-0 border-t border-[0.5px] border-slate-200 bg-stone-50 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-900">
          {statusBar}
        </div>
      )}
    </div>
  )
})

/** 侧边栏头部组件 Props */
interface SidebarHeaderProps {
  onRefreshFileTree?: () => void
  onCreateFile?: (parentPath: string) => void
  onCreateFolder?: (parentPath: string) => void
  workspace: string | null
}

/**
 * 侧边栏头部组件（深色主题）
 */
export function SidebarHeader({
  onRefreshFileTree,
  onCreateFile,
  onCreateFolder,
  workspace,
}: SidebarHeaderProps) {
  return (
    <div className="border-b border-slate-700 px-3 py-2.5">
      {/* 标题行 */}
      <div className="mb-1.5 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          文件
        </h2>
        <div className="flex gap-0.5">
          {/* 新建文件 */}
          {onCreateFile && workspace && (
            <button
              className={cn(
                'rounded p-1 text-slate-500 transition-colors',
                'hover:bg-slate-800 hover:text-slate-200',
                'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-500',
              )}
              onClick={() => onCreateFile(workspace)}
              title="新建文件"
              type="button"
            >
              <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          )}
          {/* 新建文件夹 */}
          {onCreateFolder && workspace && (
            <button
              className={cn(
                'rounded p-1 text-slate-500 transition-colors',
                'hover:bg-slate-800 hover:text-slate-200',
                'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-500',
              )}
              onClick={() => onCreateFolder(workspace)}
              title="新建文件夹"
              type="button"
            >
              <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                <path d="M12 11v6M9 14h6" />
              </svg>
            </button>
          )}
          {/* 刷新 */}
          {onRefreshFileTree && (
            <button
              className={cn(
                'rounded p-1 text-slate-500 transition-colors',
                'hover:bg-slate-800 hover:text-slate-200',
                'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-500',
              )}
              onClick={onRefreshFileTree}
              title="刷新"
              type="button"
            >
              <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 4v6h-6M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
            </button>
          )}
        </div>
      </div>
      {/* 工作区名称 */}
      <p className="truncate text-[11px] text-slate-500">
        {workspace ? (
          <span title={workspace}>{workspace.split(/[/\\]/).at(-1)}</span>
        ) : (
          '未选择工作区'
        )}
      </p>
    </div>
  )
}

/** 状态栏 Props */
interface StatusBarProps {
  content: string
  lineCount: number
}

/**
 * 编辑器状态栏
 */
export function StatusBar({ content, lineCount }: StatusBarProps) {
  // 计算字数
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0
  const charCount = content.length

  return (
    <div className="flex h-6 items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <span>{lineCount} 行</span>
        <span>{wordCount} 字</span>
        <span>{charCount} 字符</span>
      </div>
      <div className="flex items-center gap-4">
        <span>UTF-8</span>
        <span>Markdown</span>
      </div>
    </div>
  )
}
