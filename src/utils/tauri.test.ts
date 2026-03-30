import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { readFile, writeFile, readDirTree, createFile, createDir, deletePath, renamePath } from '@/utils/tauri'

// Mock Tauri invoke
const mockInvoke = vi.fn()

vi.mock('@tauri-apps/api/core', () => ({
  invoke: (command: string, args?: unknown) => mockInvoke(command, args),
}))

describe('Tauri 工具函数 - Mock 测试套件', () => {
  beforeEach(() => {
    // 设置默认的 Tauri 环境
    ;(window as Window & { __TAURI_INTERNALS__?: object }).__TAURI_INTERNALS__ = {}
    mockInvoke.mockReset()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('readFile', () => {
    it('成功读取文件', async () => {
      mockInvoke.mockResolvedValue('# File Content')

      const result = await readFile('/test.md')

      expect(result).toBe('# File Content')
      expect(mockInvoke).toHaveBeenCalledWith('read_file', { path: '/test.md' })
    })

    it('传递正确的参数', async () => {
      mockInvoke.mockResolvedValue('')

      await readFile('/path/to/file.md')

      expect(mockInvoke).toHaveBeenCalledTimes(1)
      expect(mockInvoke).toHaveBeenCalledWith('read_file', { path: '/path/to/file.md' })
    })

    it('抛出错误时向上传播', async () => {
      mockInvoke.mockRejectedValue(new Error('File not found'))

      await expect(readFile('/nonexistent.md')).rejects.toThrow('File not found')
    })
  })

  describe('writeFile', () => {
    it('成功写入文件', async () => {
      mockInvoke.mockResolvedValue(undefined)

      await writeFile('/test.md', '# New Content')

      expect(mockInvoke).toHaveBeenCalledWith('write_file', {
        path: '/test.md',
        content: '# New Content',
      })
    })

    it('处理空内容', async () => {
      mockInvoke.mockResolvedValue(undefined)

      await writeFile('/empty.md', '')

      expect(mockInvoke).toHaveBeenCalledWith('write_file', {
        path: '/empty.md',
        content: '',
      })
    })

    it('处理超长内容（10MB）', async () => {
      const hugeContent = 'x'.repeat(10_000_000)
      mockInvoke.mockResolvedValue(undefined)

      await writeFile('/huge.md', hugeContent)

      expect(mockInvoke).toHaveBeenCalledWith('write_file', {
        path: '/huge.md',
        content: hugeContent,
      })
    })

    it('处理特殊字符内容', async () => {
      const specialContent = '😀🎉\n<script>alert(1)</script>\n中文'
      mockInvoke.mockResolvedValue(undefined)

      await writeFile('/special.md', specialContent)

      expect(mockInvoke).toHaveBeenCalledWith('write_file', {
        path: '/special.md',
        content: specialContent,
      })
    })

    it('抛出错误时向上传播', async () => {
      mockInvoke.mockRejectedValue(new Error('Permission denied'))

      await expect(writeFile('/readonly.md', 'content')).rejects.toThrow('Permission denied')
    })
  })

  describe('readDirTree', () => {
    it('成功读取目录树', async () => {
      const mockTree = [
        {
          id: '1',
          name: 'docs',
          path: '/docs',
          type: 'dir',
          depth: 0,
          children: [
            { id: '2', name: 'readme.md', path: '/docs/readme.md', type: 'file', ext: 'md', depth: 1 },
          ],
        },
      ]
      mockInvoke.mockResolvedValue(mockTree)

      const result = await readDirTree('/docs')

      expect(result).toEqual(mockTree)
      expect(mockInvoke).toHaveBeenCalledWith('read_dir_tree', { path: '/docs' })
    })

    it('处理空目录', async () => {
      mockInvoke.mockResolvedValue([])

      const result = await readDirTree('/empty')

      expect(result).toEqual([])
    })

    it('处理深层嵌套目录', async () => {
      const deepTree = [
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
                  children: [],
                },
              ],
            },
          ],
        },
      ]
      mockInvoke.mockResolvedValue(deepTree)

      const result = await readDirTree('/a')

      expect(result).toHaveLength(1)
      expect(result[0]?.children?.[0]?.children?.[0]?.name).toBe('c')
    })
  })

  describe('createFile', () => {
    it('成功创建文件', async () => {
      mockInvoke.mockResolvedValue(undefined)

      await createFile('/new.md')

      expect(mockInvoke).toHaveBeenCalledWith('create_file', { path: '/new.md' })
    })

    it('处理特殊文件名', async () => {
      mockInvoke.mockResolvedValue(undefined)

      await createFile('/😀.md')
      await createFile('/中文文件.md')
      await createFile('/file with spaces.md')

      expect(mockInvoke).toHaveBeenCalledTimes(3)
    })
  })

  describe('createDir', () => {
    it('成功创建目录', async () => {
      mockInvoke.mockResolvedValue(undefined)

      await createDir('/new-folder')

      expect(mockInvoke).toHaveBeenCalledWith('create_dir', { path: '/new-folder' })
    })

    it('处理嵌套路径', async () => {
      mockInvoke.mockResolvedValue(undefined)

      await createDir('/a/b/c/d')

      expect(mockInvoke).toHaveBeenCalledWith('create_dir', { path: '/a/b/c/d' })
    })
  })

  describe('deletePath', () => {
    it('成功删除文件', async () => {
      mockInvoke.mockResolvedValue(undefined)

      await deletePath('/file.md')

      expect(mockInvoke).toHaveBeenCalledWith('delete_path', { path: '/file.md' })
    })

    it('成功删除目录', async () => {
      mockInvoke.mockResolvedValue(undefined)

      await deletePath('/folder')

      expect(mockInvoke).toHaveBeenCalledWith('delete_path', { path: '/folder' })
    })

    it('抛出错误时向上传播', async () => {
      mockInvoke.mockRejectedValue(new Error('Directory not empty'))

      await expect(deletePath('/non-empty-folder')).rejects.toThrow('Directory not empty')
    })
  })

  describe('renamePath', () => {
    it('成功重命名文件', async () => {
      mockInvoke.mockResolvedValue(undefined)

      await renamePath('/old.md', '/new.md')

      expect(mockInvoke).toHaveBeenCalledWith('rename_path', {
        oldPath: '/old.md',
        newPath: '/new.md',
      })
    })

    it('成功移动文件到不同目录', async () => {
      mockInvoke.mockResolvedValue(undefined)

      await renamePath('/source/file.md', '/destination/file.md')

      expect(mockInvoke).toHaveBeenCalledWith('rename_path', {
        oldPath: '/source/file.md',
        newPath: '/destination/file.md',
      })
    })

    it('抛出错误时向上传播', async () => {
      mockInvoke.mockRejectedValue(new Error('Target already exists'))

      await expect(renamePath('/a.md', '/existing.md')).rejects.toThrow('Target already exists')
    })
  })

  describe('非 Tauri 环境处理', () => {
    it('在非 Tauri 环境中抛出错误', async () => {
      // 移除 Tauri 内部标记
      delete (window as Window & { __TAURI_INTERNALS__?: object }).__TAURI_INTERNALS__

      await expect(readFile('/test.md')).rejects.toThrow('当前不在 Tauri 环境中运行')
    })

    it('错误消息清晰明确', async () => {
      delete (window as Window & { __TAURI_INTERNALS__?: object }).__TAURI_INTERNALS__

      try {
        await writeFile('/test.md', 'content')
        expect(true).toBe(false) // 不应该到达这里
      } catch (error) {
        expect(String(error)).toContain('Tauri')
      }
    })
  })

  describe('边界条件', () => {
    it('处理空路径', async () => {
      mockInvoke.mockResolvedValue('')

      await expect(readFile('')).resolves.toBe('')
    })

    it('处理相对路径', async () => {
      mockInvoke.mockResolvedValue('content')

      await readFile('./relative.md')

      expect(mockInvoke).toHaveBeenCalledWith('read_file', { path: './relative.md' })
    })

    it('处理路径穿越尝试', async () => {
      mockInvoke.mockResolvedValue('')

      // 不应该在前端阻止，让后端处理安全检查
      await readFile('../../../etc/passwd')

      expect(mockInvoke).toHaveBeenCalledWith('read_file', { path: '../../../etc/passwd' })
    })

    it('处理 Unicode 路径', async () => {
      mockInvoke.mockResolvedValue('')

      await readFile('/中文路径/文档.md')

      expect(mockInvoke).toHaveBeenCalledWith('read_file', { path: '/中文路径/文档.md' })
    })
  })

  describe('并发操作', () => {
    it('同时执行多个读取操作', async () => {
      mockInvoke.mockImplementation((path: string) => Promise.resolve(`Content of ${path}`))

      const results = await Promise.all([
        readFile('/a.md'),
        readFile('/b.md'),
        readFile('/c.md'),
      ])

      expect(results).toEqual(['Content of /a.md', 'Content of /b.md', 'Content of /c.md'])
      expect(mockInvoke).toHaveBeenCalledTimes(3)
    })

    it('同时执行多个写入操作', async () => {
      mockInvoke.mockResolvedValue(undefined)

      await Promise.all([
        writeFile('/a.md', 'A'),
        writeFile('/b.md', 'B'),
        writeFile('/c.md', 'C'),
      ])

      expect(mockInvoke).toHaveBeenCalledTimes(3)
    })

    it('并发操作中的错误处理', async () => {
      mockInvoke.mockImplementation((path: string) => {
        if (path === '/error.md') {
          return Promise.reject(new Error('Failed'))
        }
        return Promise.resolve('Success')
      })

      const results = await Promise.allSettled([
        readFile('/success.md'),
        readFile('/error.md'),
        readFile('/another.md'),
      ])

      expect(results[0].status).toBe('fulfilled')
      expect(results[1].status).toBe('rejected')
      expect(results[2].status).toBe('fulfilled')
    })
  })
})
