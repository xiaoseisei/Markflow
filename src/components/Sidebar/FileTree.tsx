import { memo } from 'react'
import { FileTreeNode } from '@/components/Sidebar/FileTreeNode'
import type { ContextMenuPosition, ContextMenuItem } from '@/components/Sidebar/FileContextMenu'
import type { FileNode } from '@/types'

interface FileTreeProps {
  nodes: FileNode[]
  activePath: string | null
  onOpenFile: (path: string) => void
  onContextMenu?: (position: ContextMenuPosition, node: FileNode) => ContextMenuItem[]
  isDarkMode?: boolean
}

export const FileTree = memo(function FileTree({
  nodes,
  activePath,
  onOpenFile,
  onContextMenu,
  isDarkMode = false,
}: FileTreeProps) {
  return (
    <ul className="space-y-1" role="tree">
      {nodes.map((node) => (
        <FileTreeNode
          activePath={activePath}
          key={node.id}
          node={node}
          onOpenFile={onOpenFile}
          onContextMenu={onContextMenu}
          isDarkMode={isDarkMode}
        />
      ))}
    </ul>
  )
})
