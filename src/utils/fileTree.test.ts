import { describe, expect, it } from 'vitest'
import { flattenFileNodes, findFirstMarkdownFile } from '@/utils/fileTree'
import type { FileNode } from '@/types'

describe('fileTree 工具函数 - 完整测试套件', () => {
  describe('flattenFileNodes', () => {
    it('扁平化空数组', () => {
      expect(flattenFileNodes([])).toEqual([])
    })

    it('扁平化单层文件节点', () => {
      const nodes: FileNode[] = [
        { id: '1', name: 'a.md', path: '/a.md', type: 'file', ext: 'md', depth: 0 },
        { id: '2', name: 'b.txt', path: '/b.txt', type: 'file', ext: 'txt', depth: 0 },
      ]
      const result = flattenFileNodes(nodes)
      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('a.md')
      expect(result[1].name).toBe('b.txt')
    })

    it('扁平化带子目录的节点', () => {
      const nodes: FileNode[] = [
        {
          id: '1',
          name: 'docs',
          path: '/docs',
          type: 'dir',
          depth: 0,
          children: [
            { id: '2', name: 'a.md', path: '/docs/a.md', type: 'file', ext: 'md', depth: 1 },
            { id: '3', name: 'b.md', path: '/docs/b.md', type: 'file', ext: 'md', depth: 1 },
          ],
        },
      ]
      const result = flattenFileNodes(nodes)
      expect(result).toHaveLength(3) // 1 个目录 + 2 个文件
    })

    it('扁平化深层嵌套结构', () => {
      const nodes: FileNode[] = [
        {
          id: '1',
          name: 'a',
          path: '/a',
          type: 'dir',
          depth: 0,
          children: [
            {
              id: '2',
              name: 'b',
              path: '/a/b',
              type: 'dir',
              depth: 1,
              children: [
                {
                  id: '3',
                  name: 'c',
                  path: '/a/b/c',
                  type: 'dir',
                  depth: 2,
                  children: [
                    { id: '4', name: 'd.md', path: '/a/b/c/d.md', type: 'file', ext: 'md', depth: 3 },
                  ],
                },
              ],
            },
          ],
        },
      ]
      const result = flattenFileNodes(nodes)
      expect(result).toHaveLength(4)
    })

    it('目录优先排序（文件夹在文件前）', () => {
      const nodes: FileNode[] = [
        { id: '1', name: 'z.txt', path: '/z.txt', type: 'file', ext: 'txt', depth: 0 },
        { id: '2', name: 'a-folder', path: '/a-folder', type: 'dir', depth: 0 },
        { id: '3', name: 'm.md', path: '/m.md', type: 'file', ext: 'md', depth: 0 },
      ]
      const result = flattenFileNodes(nodes)
      expect(result[0].type).toBe('dir')
      expect(result[0].name).toBe('a-folder')
      expect(result[1].type).toBe('file')
    })

    it('同类型按中文名称排序', () => {
      const nodes: FileNode[] = [
        { id: '1', name: '文档.md', path: '/文档.md', type: 'file', ext: 'md', depth: 0 },
        { id: '2', name: 'abc.md', path: '/abc.md', type: 'file', ext: 'md', depth: 0 },
        { id: '3', name: '123.md', path: '/123.md', type: 'file', ext: 'md', depth: 0 },
      ]
      const result = flattenFileNodes(nodes)
      expect(result[0].name).toBe('123.md')
      expect(result[1].name).toBe('abc.md')
      expect(result[2].name).toBe('文档.md')
    })

    it('处理混合中英文排序', () => {
      const nodes: FileNode[] = [
        { id: '1', name: '中文.md', path: '/中文.md', type: 'file', ext: 'md', depth: 0 },
        { id: '2', name: 'English.md', path: '/English.md', type: 'file', ext: 'md', depth: 0 },
        { id: '3', name: '123.md', path: '/123.md', type: 'file', ext: 'md', depth: 0 },
      ]
      const result = flattenFileNodes(nodes)
      expect(result).toHaveLength(3)
    })

    it('处理特殊字符文件名', () => {
      const nodes: FileNode[] = [
        { id: '1', name: '😀.md', path: '/😀.md', type: 'file', ext: 'md', depth: 0 },
        { id: '2', name: '@特殊.md', path: '/@特殊.md', type: 'file', ext: 'md', depth: 0 },
        { id: '3', name: 'a (1).md', path: '/a (1).md', type: 'file', ext: 'md', depth: 0 },
      ]
      const result = flattenFileNodes(nodes)
      expect(result).toHaveLength(3)
    })

    it('处理超长文件名', () => {
      const longName = 'a'.repeat(255) + '.md'
      const nodes: FileNode[] = [
        { id: '1', name: longName, path: `/${longName}`, type: 'file', ext: 'md', depth: 0 },
      ]
      const result = flattenFileNodes(nodes)
      expect(result[0].name).toBe(longName)
    })
  })

  describe('findFirstMarkdownFile', () => {
    it('在空树中返回 null', () => {
      expect(findFirstMarkdownFile([])).toBeNull()
    })

    it('找到根目录的 Markdown 文件', () => {
      const nodes: FileNode[] = [
        { id: '1', name: 'readme.md', path: '/readme.md', type: 'file', ext: 'md', depth: 0 },
        { id: '2', name: 'data.json', path: '/data.json', type: 'file', ext: 'json', depth: 0 },
      ]
      const result = findFirstMarkdownFile(nodes)
      expect(result?.name).toBe('readme.md')
    })

    it('找到子目录中的 Markdown 文件', () => {
      const nodes: FileNode[] = [
        {
          id: '1',
          name: 'docs',
          path: '/docs',
          type: 'dir',
          depth: 0,
          children: [
            { id: '2', name: 'guide.md', path: '/docs/guide.md', type: 'file', ext: 'md', depth: 1 },
          ],
        },
      ]
      const result = findFirstMarkdownFile(nodes)
      expect(result?.name).toBe('guide.md')
    })

    it('忽略非 Markdown 文件', () => {
      const nodes: FileNode[] = [
        { id: '1', name: 'data.json', path: '/data.json', type: 'file', ext: 'json', depth: 0 },
        { id: '2', name: 'image.png', path: '/image.png', type: 'file', ext: 'png', depth: 0 },
        { id: '3', name: 'script.js', path: '/script.js', type: 'file', ext: 'js', depth: 0 },
      ]
      const result = findFirstMarkdownFile(nodes)
      expect(result).toBeNull()
    })

    it('选择按排序顺序的第一个 Markdown 文件', () => {
      const nodes: FileNode[] = [
        { id: '1', name: 'z.md', path: '/z.md', type: 'file', ext: 'md', depth: 0 },
        { id: '2', name: 'a.md', path: '/a.md', type: 'file', ext: 'md', depth: 0 },
      ]
      const result = findFirstMarkdownFile(nodes)
      expect(result?.name).toBe('a.md') // 目录优先，然后按名称排序
    })

    it('处理深层嵌套中的第一个文件', () => {
      const nodes: FileNode[] = [
        {
          id: '1',
          name: 'z-folder',
          path: '/z-folder',
          type: 'dir',
          depth: 0,
          children: [
            { id: '2', name: 'z.md', path: '/z-folder/z.md', type: 'file', ext: 'md', depth: 1 },
          ],
        },
        {
          id: '3',
          name: 'a-folder',
          path: '/a-folder',
          type: 'dir',
          depth: 0,
          children: [
            { id: '4', name: 'a.md', path: '/a-folder/a.md', type: 'file', ext: 'md', depth: 1 },
          ],
        },
      ]
      const result = findFirstMarkdownFile(nodes)
      expect(result?.name).toBe('a.md')
    })

    it('处理只有目录的情况', () => {
      const nodes: FileNode[] = [
        {
          id: '1',
          name: 'empty',
          path: '/empty',
          type: 'dir',
          depth: 0,
          children: [],
        },
      ]
      const result = findFirstMarkdownFile(nodes)
      expect(result).toBeNull()
    })
  })

  describe('边界条件测试', () => {
    it('处理超大文件树（1000 个节点）', () => {
      const nodes: FileNode[] = Array.from({ length: 1000 }, (_, i) => ({
        id: `${i}`,
        name: `file${i}.md`,
        path: `/file${i}.md`,
        type: 'file' as const,
        ext: 'md',
        depth: 0,
      }))
      const result = flattenFileNodes(nodes)
      expect(result).toHaveLength(1000)
    })

    it('处理深度嵌套（100 层）', () => {
      let currentNode: FileNode = {
        id: '0',
        name: 'root',
        path: '/root',
        type: 'dir',
        depth: 0,
        children: [],
      }

      for (let i = 1; i <= 100; i++) {
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

      const result = flattenFileNodes(nodes)
      expect(result.length).toBeGreaterThan(100)
    })

    it('处理循环引用（防御性测试）', () => {
      // 在正常情况下不应该有循环引用，但测试防止无限循环
      const node: FileNode = {
        id: '1',
        name: 'cycle',
        path: '/cycle',
        type: 'dir',
        depth: 0,
      }
      // 强制创建循环（实际代码中不应该发生）
      ;(node as { children?: FileNode[] }).children = [node]

      // 这应该不会导致无限循环或栈溢出
      expect(() => flattenFileNodes([node])).not.toThrow()
    })
  })
})
