import { memo, useState, useCallback } from 'react'
import type { FileNode } from '@/types'
import { cn } from '@/utils/cn'
import { readDirChildren } from '@/utils/fsAdapter'
import type { ContextMenuPosition, ContextMenuItem } from './FileContextMenu'
import {
  ChevronRight,
  File,
  Folder,
  FolderOpen,
  Loader2,
} from 'lucide-react'

interface FileTreeNodeProps {
  node: FileNode
  activePath: string | null
  onOpenFile: (path: string) => void
  onContextMenu?: (position: ContextMenuPosition, node: FileNode) => ContextMenuItem[]
  isDarkMode?: boolean
}

export const FileTreeNode = memo(function FileTreeNode({
  node,
  activePath,
  onOpenFile,
  onContextMenu,
  isDarkMode = false,
}: FileTreeNodeProps) {
  // 默认折叠状态，避免一次性渲染所有节点
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [children, setChildren] = useState<FileNode[] | null>(node.children ?? null)

  const isDirectory = node.type === 'dir'
  const isActive = node.path === activePath

  // 深色模式样式
  const hoverClass = isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
  const activeClass = isDarkMode
    ? 'bg-slate-700 text-slate-100'
    : 'bg-slate-100 text-slate-900'
  const textClass = isDarkMode ? 'text-slate-300' : 'text-slate-600'
  const iconClass = isDarkMode ? 'text-slate-500' : 'text-slate-400'

  /**
   * 懒加载核心：展开目录时动态加载子节点
   */
  const handleToggle = useCallback(async () => {
    if (!isDirectory) return

    if (children !== null) {
      setExpanded((value) => !value)
      return
    }

    setLoading(true)
    try {
      const loadedChildren = await readDirChildren(node.path)
      setChildren(loadedChildren)
      setExpanded(true)
    } catch (error) {
      console.error(`加载目录失败: ${node.path}`, error)
    } finally {
      setLoading(false)
    }
  }, [isDirectory, children, node.path])

  function handleContextMenu(event: React.MouseEvent): void {
    if (!onContextMenu) {
      return
    }
    event.preventDefault()
    event.stopPropagation()

    const position = { x: event.clientX, y: event.clientY }
    onContextMenu(position, node)
  }

  return (
    <li>
      <button
        className={cn(
          'group flex w-full items-center gap-1.5 rounded px-2 py-1 text-left text-[13px] transition-colors',
          hoverClass,
          isActive && activeClass,
          !isActive && !hoverClass && textClass,
        )}
        onClick={() => {
          if (isDirectory) {
            handleToggle()
            return
          }
          onOpenFile(node.path)
        }}
        onContextMenu={handleContextMenu}
        style={{ paddingLeft: `${node.depth * 12 + 8}px` }}
        type="button"
      >
        {/* 图标 */}
        <span className={cn('flex-shrink-0', iconClass)}>
          {loading ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : isDirectory ? (
            expanded ? (
              <FolderOpen className="size-3.5" />
            ) : (
              <Folder className="size-3.5" />
            )
          ) : (
            <File className="size-3.5" />
          )}
        </span>

        {/* 展开箭头（仅目录） */}
        {isDirectory && !loading && (
          <ChevronRight
            className={cn(
              'size-3 flex-shrink-0 transition-transform',
              expanded && 'rotate-90',
            )}
          />
        )}

        {/* 文件名 */}
        <span className={cn('truncate', isActive ? 'font-medium' : 'font-normal')}>
          {node.name}
        </span>
      </button>
      {isDirectory && expanded && children ? (
        <ul className="mt-0.5 space-y-0.5">
          {children.map((child) => (
            <FileTreeNode
              activePath={activePath}
              key={child.id}
              node={child}
              onOpenFile={onOpenFile}
              onContextMenu={onContextMenu}
              isDarkMode={isDarkMode}
            />
          ))}
        </ul>
      ) : null}
    </li>
  )
})
