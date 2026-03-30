import { memo, useState, useCallback } from 'react'
import type { FileNode } from '@/types'
import { cn } from '@/utils/cn'
import { readDirChildren } from '@/utils/fsAdapter'
import type { ContextMenuPosition, ContextMenuItem } from './FileContextMenu'

interface FileTreeNodeProps {
  node: FileNode
  activePath: string | null
  onOpenFile: (path: string) => void
  onContextMenu?: (position: ContextMenuPosition, node: FileNode) => ContextMenuItem[]
}

export const FileTreeNode = memo(function FileTreeNode({
  node,
  activePath,
  onOpenFile,
  onContextMenu,
}: FileTreeNodeProps) {
  // 【关键修改】默认折叠状态，避免一次性渲染所有节点
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [children, setChildren] = useState<FileNode[] | null>(node.children ?? null)

  const isDirectory = node.type === 'dir'
  const isActive = node.path === activePath

  /**
   * 【懒加载核心】展开目录时动态加载子节点
   *
   * 【实现思路】
   * 1. 首次展开时，如果 children 为 null，调用 Tauri 接口加载
   * 2. 加载完成后缓存到组件 state，避免重复请求
   * 3. 后续展开/折叠直接使用缓存数据
   */
  const handleToggle = useCallback(async () => {
    if (!isDirectory) return

    // 如果已经加载过子节点，直接切换展开状态
    if (children !== null) {
      setExpanded((value) => !value)
      return
    }

    // 首次展开：懒加载子节点
    setLoading(true)
    try {
      const loadedChildren = await readDirChildren(node.path)
      setChildren(loadedChildren)
      setExpanded(true)
    } catch (error) {
      // 【防御性编程】加载失败时给出用户友好的提示
      console.error(`加载目录失败: ${node.path}`, error)
      // TODO: 可以在这里显示 toast 提示用户
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
          'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent',
          isActive && 'bg-accent text-accent-foreground font-medium',
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
        {/* 【体验优化】加载时显示 loading 图标 */}
        <span>
          {isDirectory
            ? loading
              ? '⏳' // 加载中
              : expanded
                ? '📂' // 已展开
                : '📁' // 未展开
            : '📄'}
        </span>
        <span className="truncate">{node.name}</span>
      </button>
      {isDirectory && expanded && children ? (
        <ul className="mt-1 space-y-1">
          {children.map((child) => (
            <FileTreeNode
              activePath={activePath}
              key={child.id}
              node={child}
              onOpenFile={onOpenFile}
              onContextMenu={onContextMenu}
            />
          ))}
        </ul>
      ) : null}
    </li>
  )
})
