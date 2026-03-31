import { memo, useState } from 'react'
import { FileTree } from '@/components/Sidebar/FileTree'
import { FileContextMenu, type ContextMenuPosition, type ContextMenuItem } from '@/components/Sidebar/FileContextMenu'
import type { FileNode } from '@/types'
import { cn } from '@/utils/cn'
import { FolderOpen } from 'lucide-react'

interface SidebarProps {
  workspace: string | null
  nodes: FileNode[]
  activePath: string | null
  visible: boolean
  isDarkMode?: boolean
  onPickWorkspace: () => void
  onPickFile?: () => void
  onOpenFile: (path: string) => void
  onRefreshFileTree?: () => void
  onCreateFile?: (parentPath: string) => void
  onCreateFolder?: (parentPath: string) => void
  onRename?: (oldPath: string, newName: string) => void
  onDelete?: (path: string) => void
  onCopyPath?: (path: string) => void
}

export const Sidebar = memo(function Sidebar({
  workspace,
  nodes,
  activePath,
  visible,
  isDarkMode = false,
  onPickWorkspace,
  onOpenFile,
  onCreateFile,
  onCreateFolder,
  onRename,
  onDelete,
  onCopyPath,
}: SidebarProps) {
  const [contextMenuPosition, setContextMenuPosition] = useState<ContextMenuPosition | null>(null)
  const [contextMenuNode, setContextMenuNode] = useState<FileNode | null>(null)

  function handleContextMenu(position: ContextMenuPosition, node: FileNode): ContextMenuItem[] {
    setContextMenuPosition(position)
    setContextMenuNode(node)

    const items: ContextMenuItem[] = [
      {
        key: 'open',
        label: '打开',
        icon: '📂',
        action: () => {
          if (node.type === 'file') {
            onOpenFile(node.path)
          }
        },
        disabled: node.type !== 'file',
      },
    ]

    items.push(
      {
        key: 'rename',
        label: '重命名',
        icon: '✏️',
        action: () => {
          if (onRename) {
            const newName = window.prompt('输入新名称', node.name)
            if (newName && newName !== node.name) {
              onRename(node.path, newName)
            }
          }
        },
      },
      {
        key: 'copyPath',
        label: '复制路径',
        icon: '📋',
        action: () => {
          if (onCopyPath) {
            onCopyPath(node.path)
          }
        },
      }
    )

    items.push({
      key: 'delete',
      label: '删除',
      icon: '🗑️',
      action: () => {
        if (onDelete) {
          const confirmed = window.confirm(`确定要删除 "${node.name}" 吗？此操作不可撤销。`)
          if (confirmed) {
            onDelete(node.path)
          }
        }
      },
      variant: 'destructive',
    })

    if (node.type === 'dir') {
      items.splice(1, 0, {
        key: 'separator',
        label: '-',
        action: () => {},
        disabled: true,
      })
      items.splice(2, 0, {
        key: 'createFile',
        label: '新建文件',
        icon: '📄',
        action: () => {
          if (onCreateFile) {
            onCreateFile(node.path)
          }
        },
      })
      items.splice(3, 0, {
        key: 'createFolder',
        label: '新建文件夹',
        icon: '📁',
        action: () => {
          if (onCreateFolder) {
            onCreateFolder(node.path)
          }
        },
      })
    }

    return items
  }

  function handleCloseContextMenu(): void {
    setContextMenuPosition(null)
    setContextMenuNode(null)
  }

  if (!visible) {
    return null
  }

  // 深色模式样式
  const borderClass = isDarkMode ? 'border-slate-700' : 'border-slate-200'

  return (
    <aside className={cn('flex h-full flex-col', isDarkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-900 text-slate-100')}>
      {/* 搜索面板 - 始终显示 */}
      <div className={cn('border-b p-3', borderClass)}>
        <div
          className={cn(
            'flex cursor-pointer items-center gap-2 rounded-md px-3 py-2',
            'border border-dashed border-slate-600 transition-colors',
            'hover:border-slate-500 hover:bg-slate-800',
          )}
          onClick={onPickWorkspace}
          onKeyDown={(e) => e.key === 'Enter' && onPickWorkspace()}
          role="button"
          tabIndex={0}
        >
          <FolderOpen className="size-4 text-slate-500" />
          <span className="text-[13px] text-slate-400">
            {workspace ? '点击更换工作区' : '选择工作区文件夹'}
          </span>
        </div>
      </div>

      {/* 文件树 */}
      <div className="min-h-0 flex-1 overflow-auto p-2">
        {nodes.length > 0 ? (
          <FileTree
            activePath={activePath}
            nodes={nodes}
            onOpenFile={onOpenFile}
            onContextMenu={handleContextMenu}
            isDarkMode={isDarkMode}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FolderOpen className="mb-3 size-10 text-slate-600" />
            <p className="text-[13px] text-slate-500">
              {workspace ? '工作区为空' : '选择工作区以开始'}
            </p>
            {workspace && onCreateFile && (
              <button
                className={cn(
                  'mt-3 rounded-md px-3 py-1.5 text-[12px]',
                  'bg-slate-800 text-slate-300',
                  'transition-colors hover:bg-slate-700',
                )}
                onClick={() => onCreateFile(workspace)}
                type="button"
              >
                新建文件
              </button>
            )}
          </div>
        )}
      </div>

      {/* 右键上下文菜单 */}
      {contextMenuPosition && contextMenuNode && (
        <FileContextMenu
          position={contextMenuPosition}
          items={handleContextMenu(contextMenuPosition, contextMenuNode)}
          onClose={handleCloseContextMenu}
        />
      )}
    </aside>
  )
})
