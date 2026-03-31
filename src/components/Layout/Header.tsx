import { memo, useMemo } from 'react'
import { cn } from '@/utils/cn'
import {
  Sun,
  Moon,
  Cloud,
  Settings,
  ChevronRight,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react'

/** Header Props */
interface HeaderProps {
  /** 工作区路径 */
  workspace: string | null
  /** 当前文件路径 */
  activeFilePath: string | null
  /** 当前文件内容（用于面包屑提取） */
  activeContent?: string
  /** 主题状态 */
  isDarkTheme: boolean
  /** 切换主题 */
  onToggleTheme: () => void
  /** 侧边栏可见性 */
  sidebarVisible: boolean
  /** 切换侧边栏 */
  onToggleSidebar: () => void
}

/**
 * 面包屑导航组件
 */
function Breadcrumbs({
  workspace,
  activeFilePath,
}: {
  workspace: string | null
  activeFilePath: string | null
}) {
  const crumbs = useMemo(() => {
    if (!workspace) return []

    const parts = workspace.split(/[/\\]/)
    const result: { label: string; path?: string }[] = []

    // 工作区
    result.push({ label: parts[parts.length - 1] || workspace, path: workspace })

    // 当前文件路径（如果有）
    if (activeFilePath) {
      const relativePath = activeFilePath.replace(workspace, '').replace(/^[/\\]/, '')
      if (relativePath) {
        const fileParts = relativePath.split(/[/\\]/)
        fileParts.forEach((part, index) => {
          const isLast = index === fileParts.length - 1
          result.push({
            label: part,
            path: isLast ? activeFilePath : undefined,
          })
        })
      }
    }

    return result
  }, [workspace, activeFilePath])

  if (!workspace) {
    return (
      <span className="text-[13px] text-slate-400">未选择工作区</span>
    )
  }

  return (
    <nav className="flex items-center gap-1 text-[13px] text-slate-500">
      {crumbs.map((crumb, index) => (
        <span key={index} className="flex items-center gap-1">
          {index > 0 && <ChevronRight className="size-3 text-slate-300" />}
          {crumb.path && index < crumbs.length - 1 ? (
            <button
              className="transition-colors hover:text-slate-700 dark:hover:text-slate-200"
              type="button"
            >
              {crumb.label}
            </button>
          ) : (
            <span className={cn(
              index === crumbs.length - 1
                ? 'text-slate-700 dark:text-slate-100 font-medium'
                : 'text-slate-400'
            )}>
              {crumb.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  )
}

/**
 * 顶部 Header 组件
 * - 左侧：MarkFlow Logo
 * - 中间：面包屑导航
 * - 右侧：同步状态、主题切换、设置
 */
export const Header = memo(function Header({
  workspace,
  activeFilePath,
  isDarkTheme,
  onToggleTheme,
  sidebarVisible,
  onToggleSidebar,
}: HeaderProps) {
  return (
    <header
      className={cn(
        'flex h-12 items-center justify-between px-4',
        'bg-white/80 backdrop-blur-md',
        'border-b border-[0.5px] border-slate-200/80',
        'dark:bg-slate-900/80 dark:border-slate-700/50',
      )}
    >
      {/* 左侧：Logo + 侧边栏切换 */}
      <div className="flex items-center gap-3">
        {/* 侧边栏切换按钮 */}
        <button
          className={cn(
            'flex items-center justify-center rounded-md p-1.5',
            'text-slate-400 transition-colors',
            'hover:bg-slate-100 hover:text-slate-600',
            'dark:hover:bg-slate-800 dark:hover:text-slate-200',
          )}
          onClick={onToggleSidebar}
          title={sidebarVisible ? '隐藏侧边栏' : '显示侧边栏'}
          type="button"
        >
          {sidebarVisible ? (
            <PanelLeftClose className="size-4" />
          ) : (
            <PanelLeft className="size-4" />
          )}
        </button>

        {/* Logo */}
        <div className="flex items-center gap-2">
          <span className={cn(
            'text-[15px] font-semibold tracking-tight',
            'bg-gradient-to-r from-slate-700 to-slate-900',
            'dark:from-slate-100 dark:to-slate-200',
            'bg-clip-text text-transparent',
          )}>
            MarkFlow
          </span>
        </div>
      </div>

      {/* 中间：面包屑导航 */}
      <div className="flex-1 px-8">
        <Breadcrumbs workspace={workspace} activeFilePath={activeFilePath} />
      </div>

      {/* 右侧：状态图标 */}
      <div className="flex items-center gap-1">
        {/* 同步状态 */}
        <button
          className={cn(
            'flex items-center justify-center rounded-md p-1.5',
            'text-slate-400 transition-colors',
            'hover:bg-slate-100 hover:text-slate-600',
            'dark:hover:bg-slate-800 dark:hover:text-slate-200',
          )}
          title="已同步"
          type="button"
        >
          <Cloud className="size-4" />
        </button>

        {/* 主题切换 */}
        <button
          className={cn(
            'flex items-center justify-center rounded-md p-1.5',
            'text-slate-400 transition-colors',
            'hover:bg-slate-100 hover:text-slate-600',
            'dark:hover:bg-slate-800 dark:hover:text-slate-200',
          )}
          onClick={onToggleTheme}
          title={isDarkTheme ? '切换到亮色模式' : '切换到暗色模式'}
          type="button"
        >
          {isDarkTheme ? (
            <Sun className="size-4" />
          ) : (
            <Moon className="size-4" />
          )}
        </button>

        {/* 设置 */}
        <button
          className={cn(
            'flex items-center justify-center rounded-md p-1.5',
            'text-slate-400 transition-colors',
            'hover:bg-slate-100 hover:text-slate-600',
            'dark:hover:bg-slate-800 dark:hover:text-slate-200',
          )}
          title="设置"
          type="button"
        >
          <Settings className="size-4" />
        </button>
      </div>
    </header>
  )
})
