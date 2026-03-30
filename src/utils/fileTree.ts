import type { FileNode } from '@/types'

function sortNodes(nodes: FileNode[]): FileNode[] {
  return [...nodes].sort((left, right) => {
    if (left.type !== right.type) {
      return left.type === 'dir' ? -1 : 1
    }

    return left.name.localeCompare(right.name, 'zh-CN')
  })
}

export function flattenFileNodes(nodes: FileNode[]): FileNode[] {
  return sortNodes(nodes).flatMap((node) => [
    node,
    ...(node.children ? flattenFileNodes(node.children) : []),
  ])
}

export function findFirstMarkdownFile(nodes: FileNode[]): FileNode | null {
  const flattened = flattenFileNodes(nodes)
  return flattened.find((node) => node.type === 'file' && node.name.endsWith('.md')) ?? null
}
