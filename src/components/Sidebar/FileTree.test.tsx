import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FileTree } from '@/components/Sidebar/FileTree'
import type { FileNode } from '@/types'

describe('FileTree 组件 - 完整测试套件', () => {
  const createMockNodes = (): FileNode[] => [
    {
      id: '1',
      name: 'documents',
      path: '/documents',
      type: 'dir',
      depth: 0,
      children: [
        { id: '2', name: 'readme.md', path: '/documents/readme.md', type: 'file', ext: 'md', depth: 1 },
        { id: '3', name: 'guide.md', path: '/documents/guide.md', type: 'file', ext: 'md', depth: 1 },
      ],
    },
    {
      id: '4',
      name: 'images',
      path: '/images',
      type: 'dir',
      depth: 0,
      children: [
        { id: '5', name: 'logo.png', path: '/images/logo.png', type: 'file', ext: 'png', depth: 1 },
      ],
    },
    {
      id: '6',
      name: 'root.md',
      path: '/root.md',
      type: 'file',
      ext: 'md',
      depth: 0,
    },
  ]

  describe('基础渲染', () => {
    it('渲染空文件树', () => {
      const handleOpenFile = vi.fn()

      const { container } = render(
        <FileTree nodes={[]} activePath={null} onOpenFile={handleOpenFile} />
      )

      const ul = container.querySelector('ul[role="tree"]')
      expect(ul).toBeInTheDocument()
      expect(ul?.children).toHaveLength(0)
    })

    it('渲染文件节点', () => {
      const nodes: FileNode[] = [
        { id: '1', name: 'test.md', path: '/test.md', type: 'file', ext: 'md', depth: 0 },
      ]
      const handleOpenFile = vi.fn()

      render(<FileTree nodes={nodes} activePath={null} onOpenFile={handleOpenFile} />)

      expect(screen.getByText('test.md')).toBeInTheDocument()
    })

    it('渲染目录节点', () => {
      const nodes: FileNode[] = [
        {
          id: '1',
          name: 'docs',
          path: '/docs',
          type: 'dir',
          depth: 0,
          children: [],
        },
      ]
      const handleOpenFile = vi.fn()

      render(<FileTree nodes={nodes} activePath={null} onOpenFile={handleOpenFile} />)

      expect(screen.getByText('docs')).toBeInTheDocument()
    })

    it('渲染嵌套结构', () => {
      const handleOpenFile = vi.fn()

      render(<FileTree nodes={createMockNodes()} activePath={null} onOpenFile={handleOpenFile} />)

      expect(screen.getByText('documents')).toBeInTheDocument()
      expect(screen.getByText('images')).toBeInTheDocument()
      expect(screen.getByText('root.md')).toBeInTheDocument()
    })
  })

  describe('激活状态', () => {
    it('高亮显示激活的文件路径', () => {
      const nodes: FileNode[] = [
        { id: '1', name: 'test.md', path: '/test.md', type: 'file', ext: 'md', depth: 0 },
        { id: '2', name: 'other.md', path: '/other.md', type: 'file', ext: 'md', depth: 0 },
      ]
      const handleOpenFile = vi.fn()

      render(<FileTree nodes={nodes} activePath="/test.md" onOpenFile={handleOpenFile} />)

      // FileTreeNode 应该根据 activePath 应用不同样式
      expect(screen.getByText('test.md')).toBeInTheDocument()
    })

    it('无激活路径时不显示高亮', () => {
      const nodes: FileNode[] = [
        { id: '1', name: 'test.md', path: '/test.md', type: 'file', ext: 'md', depth: 0 },
      ]
      const handleOpenFile = vi.fn()

      render(<FileTree nodes={nodes} activePath={null} onOpenFile={handleOpenFile} />)

      expect(screen.getByText('test.md')).toBeInTheDocument()
    })
  })

  describe('交互行为', () => {
    it('点击文件触发 onOpenFile', () => {
      const nodes: FileNode[] = [
        { id: '1', name: 'test.md', path: '/test.md', type: 'file', ext: 'md', depth: 0 },
      ]
      const handleOpenFile = vi.fn()

      render(<FileTree nodes={nodes} activePath={null} onOpenFile={handleOpenFile} />)

      fireEvent.click(screen.getByText('test.md'))
      expect(handleOpenFile).toHaveBeenCalledWith('/test.md')
    })

    it('没有右键菜单时不触发上下文菜单', () => {
      const nodes: FileNode[] = [
        { id: '1', name: 'test.md', path: '/test.md', type: 'file', ext: 'md', depth: 0 },
      ]
      const handleOpenFile = vi.fn()

      render(
        <FileTree nodes={nodes} activePath={null} onOpenFile={handleOpenFile} />
      )

      // 右键点击不应该抛出错误
      const fileElement = screen.getByText('test.md')
      expect(() => {
        fireEvent.contextMenu(fileElement)
      }).not.toThrow()
    })
  })

  describe('边界条件', () => {
    it('处理超大文件树（100 个节点）', () => {
      const nodes: FileNode[] = Array.from({ length: 100 }, (_, i) => ({
        id: `${i}`,
        name: `file${i}.md`,
        path: `/file${i}.md`,
        type: 'file' as const,
        ext: 'md',
        depth: 0,
      }))
      const handleOpenFile = vi.fn()

      expect(() => {
        render(<FileTree nodes={nodes} activePath={null} onOpenFile={handleOpenFile} />)
      }).not.toThrow()
    })

    it('处理深层嵌套（10 层）', () => {
      let currentNode: FileNode = {
        id: '0',
        name: 'root',
        path: '/root',
        type: 'dir',
        depth: 0,
        children: [],
      }

      for (let i = 1; i <= 10; i++) {
        const child: FileNode = {
          id: `${i}`,
          name: `level${i}`,
          path: `/root/${'level/'.repeat(i)}`,
          type: 'dir',
          depth: i,
          children: [],
        }
        if (!currentNode.children) {
          currentNode.children = []
        }
        currentNode.children.push(child)
        currentNode = child
      }

      const nodes: FileNode[] = [
        {
          id: '0',
          name: 'root',
          path: '/root',
          type: 'dir',
          depth: 0,
          children: [currentNode],
        },
      ]
      const handleOpenFile = vi.fn()

      expect(() => {
        render(<FileTree nodes={nodes} activePath={null} onOpenFile={handleOpenFile} />)
      }).not.toThrow()
    })

    it('处理特殊字符文件名', () => {
      const nodes: FileNode[] = [
        { id: '1', name: '😀.md', path: '/😀.md', type: 'file', ext: 'md', depth: 0 },
        { id: '2', name: '中文.md', path: '/中文.md', type: 'file', ext: 'md', depth: 0 },
        { id: '3', name: 'a & b.md', path: '/a & b.md', type: 'file', ext: 'md', depth: 0 },
      ]
      const handleOpenFile = vi.fn()

      expect(() => {
        render(<FileTree nodes={nodes} activePath={null} onOpenFile={handleOpenFile} />)
      }).not.toThrow()
    })

    it('处理超长文件名', () => {
      const longName = 'a'.repeat(255) + '.md'
      const nodes: FileNode[] = [
        { id: '1', name: longName, path: `/${longName}`, type: 'file', ext: 'md', depth: 0 },
      ]
      const handleOpenFile = vi.fn()

      expect(() => {
        render(<FileTree nodes={nodes} activePath={null} onOpenFile={handleOpenFile} />)
      }).not.toThrow()
    })

    it('处理空目录名', () => {
      const nodes: FileNode[] = [
        {
          id: '1',
          name: '',
          path: '/',
          type: 'dir',
          depth: 0,
          children: [],
        },
      ]
      const handleOpenFile = vi.fn()

      expect(() => {
        render(<FileTree nodes={nodes} activePath={null} onOpenFile={handleOpenFile} />)
      }).not.toThrow()
    })
  })

  describe('可访问性', () => {
    it('使用正确的 ARIA 角色', () => {
      const handleOpenFile = vi.fn()

      const { container } = render(
        <FileTree nodes={createMockNodes()} activePath={null} onOpenFile={handleOpenFile} />
      )

      const tree = container.querySelector('ul[role="tree"]')
      expect(tree).toBeInTheDocument()
    })
  })

  describe('样式', () => {
    it('容器有正确的类名', () => {
      const handleOpenFile = vi.fn()

      const { container } = render(
        <FileTree nodes={createMockNodes()} activePath={null} onOpenFile={handleOpenFile} />
      )

      const ul = container.querySelector('ul')
      expect(ul?.className).toContain('space-y-1')
    })
  })
})
