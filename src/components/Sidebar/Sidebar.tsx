import { memo, useState } from 'react'
import { Button } from '@/components/ui'
import { FileTree } from '@/components/Sidebar/FileTree'
import { FileContextMenu, type ContextMenuPosition, type ContextMenuItem } from '@/components/Sidebar/FileContextMenu'
import { SearchPanel } from '@/components/Sidebar/SearchPanel'
import type { FileNode } from '@/types'

interface SidebarProps {
  workspace: string | null
  nodes: FileNode[]
  activePath: string | null
  visible: boolean
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
  onPickWorkspace,
  onPickFile,
  onOpenFile,
  onRefreshFileTree,
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

    // 文件和文件夹都可以重命名、复制路径
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

    // 删除操作
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

    // 文件夹可以创建子项
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

  return (
    <aside className="flex h-full w-[var(--sidebar-width)] flex-col border-r border-border bg-card/50">
      <div className="border-b border-border px-4 py-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">工作区</h2>
          <div className="flex gap-1">
            {onPickFile && (
              <Button onClick={onPickFile} size="sm" variant="ghost">
                打开文件
              </Button>
            )}
            <Button onClick={onPickWorkspace} size="sm" variant="outline">
              打开工作区
            </Button>
            {onRefreshFileTree && (
              <Button onClick={onRefreshFileTree} size="sm" variant="ghost" title="刷新文件树">
                🔄
              </Button>
            )}
          </div>
        </div>
        <p className="truncate text-xs text-muted-foreground">
          {workspace ?? '尚未选择工作区'}
        </p>
      </div>
      <div className="border-b border-border p-3">
        <SearchPanel nodes={nodes} onOpenFile={onOpenFile} />
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-3">
        {nodes.length > 0 ? (
          <FileTree
            activePath={activePath}
            nodes={nodes}
            onOpenFile={onOpenFile}
            onContextMenu={handleContextMenu}
          />
        ) : (
          <p className="text-sm text-muted-foreground">请选择工作区后加载文件树。</p>
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
