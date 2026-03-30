import { describe, expect, it, beforeEach } from 'vitest'
import { useAppStore } from '@/store/appStore'

describe('useAppStore - 完整测试套件', () => {
  // 每个测试前重置 store 状态
  beforeEach(() => {
    // 关闭所有标签，重置工作区
    const state = useAppStore.getState()
    state.openedTabs.forEach((tab) => state.closeTab(tab.id))
    state.setWorkspace(null)
    state.setFileTree([])
  })

  describe('标签页管理', () => {
    describe('openTab', () => {
      it('打开新标签页', () => {
        const store = useAppStore.getState()
        store.openTab({ path: '/test.md', title: 'test', content: '# Test' })

        const nextState = useAppStore.getState()
        expect(nextState.openedTabs).toHaveLength(1)
        expect(nextState.openedTabs[0]?.path).toBe('/test.md')
        expect(nextState.openedTabs[0]?.content).toBe('# Test')
      })

      it('相同路径只打开一个标签', () => {
        const store = useAppStore.getState()
        store.openTab({ path: '/a.md', title: 'a', content: '# A' })
        store.openTab({ path: '/a.md', title: 'a', content: '# A' })

        const nextState = useAppStore.getState()
        expect(nextState.openedTabs).toHaveLength(1)
      })

      it('相同路径切换到已存在的标签', () => {
        const store = useAppStore.getState()
        store.openTab({ path: '/a.md', title: 'a', content: '# A' })
        const firstTabId = useAppStore.getState().openedTabs[0]?.id

        store.openTab({ path: '/b.md', title: 'b', content: '# B' })
        store.openTab({ path: '/a.md', title: 'a', content: '# A' })

        const nextState = useAppStore.getState()
        expect(nextState.activeTabId).toBe(firstTabId)
      })

      it('不同路径打开多个标签', () => {
        const store = useAppStore.getState()
        store.openTab({ path: '/a.md', title: 'a', content: '# A' })
        store.openTab({ path: '/b.md', title: 'b', content: '# B' })
        store.openTab({ path: '/c.md', title: 'c', content: '# C' })

        const nextState = useAppStore.getState()
        expect(nextState.openedTabs).toHaveLength(3)
      })

      it('新标签自动设为活跃标签', () => {
        const store = useAppStore.getState()
        store.openTab({ path: '/test.md', title: 'test', content: '# Test' })

        const nextState = useAppStore.getState()
        expect(nextState.activeTabId).toBe(nextState.openedTabs[0]?.id)
      })

      it('标签初始状态为已保存（isDirty = false）', () => {
        const store = useAppStore.getState()
        store.openTab({ path: '/test.md', title: 'test', content: '# Test' })

        const nextState = useAppStore.getState()
        expect(nextState.openedTabs[0]?.isDirty).toBe(false)
        expect(nextState.openedTabs[0]?.savedContent).toBe('# Test')
      })

      it('处理空内容文件', () => {
        const store = useAppStore.getState()
        store.openTab({ path: '/empty.md', title: 'empty', content: '' })

        const nextState = useAppStore.getState()
        expect(nextState.openedTabs[0]?.content).toBe('')
        expect(nextState.openedTabs[0]?.savedContent).toBe('')
      })

      it('处理超长文件名', () => {
        const longTitle = 'a'.repeat(255)
        const store = useAppStore.getState()
        expect(() => {
          store.openTab({ path: '/long.md', title: longTitle, content: '# Test' })
        }).not.toThrow()
      })

      it('处理特殊字符路径', () => {
        const store = useAppStore.getState()
        expect(() => {
          store.openTab({ path: '/测试📝.md', title: '测试', content: '# Test' })
          store.openTab({ path: '/path with spaces.md', title: 'spaces', content: '# Test' })
        }).not.toThrow()
      })
    })

    describe('closeTab', () => {
      it('关闭单个标签', () => {
        const store = useAppStore.getState()
        store.openTab({ path: '/a.md', title: 'a', content: '# A' })
        const tabId = useAppStore.getState().openedTabs[0]?.id!

        store.closeTab(tabId)

        const nextState = useAppStore.getState()
        expect(nextState.openedTabs).toHaveLength(0)
        expect(nextState.activeTabId).toBeNull()
      })

      it('关闭非活跃标签不影响 activeTabId', () => {
        const store = useAppStore.getState()
        store.openTab({ path: '/a.md', title: 'a', content: '# A' })
        store.openTab({ path: '/b.md', title: 'b', content: '# B' })
        const activeTabId = useAppStore.getState().activeTabId

        // 关闭第一个标签（非活跃）
        const firstTabId = useAppStore.getState().openedTabs[0]?.id!
        store.closeTab(firstTabId)

        const nextState = useAppStore.getState()
        expect(nextState.activeTabId).toBe(activeTabId)
      })

      it('关闭活跃标签时切换到相邻标签', () => {
        const store = useAppStore.getState()
        store.openTab({ path: '/a.md', title: 'a', content: '# A' })
        store.openTab({ path: '/b.md', title: 'b', content: '# B' })
        store.openTab({ path: '/c.md', title: 'c', content: '# C' })

        const activeTabId = useAppStore.getState().activeTabId
        store.closeTab(activeTabId!)

        const nextState = useAppStore.getState()
        expect(nextState.activeTabId).not.toBe(activeTabId)
        expect(nextState.openedTabs).toHaveLength(2)
      })

      it('关闭最后一个标签时 activeTabId 为 null', () => {
        const store = useAppStore.getState()
        store.openTab({ path: '/a.md', title: 'a', content: '# A' })
        const tabId = useAppStore.getState().openedTabs[0]?.id!

        store.closeTab(tabId)

        const nextState = useAppStore.getState()
        expect(nextState.activeTabId).toBeNull()
      })

      it('关闭不存在的标签不影响状态', () => {
        const store = useAppStore.getState()
        store.openTab({ path: '/a.md', title: 'a', content: '# A' })
        const beforeTabs = useAppStore.getState().openedTabs.length

        store.closeTab('non-existent-id')

        const nextState = useAppStore.getState()
        expect(nextState.openedTabs).toHaveLength(beforeTabs)
      })
    })

    describe('updateTabContent', () => {
      it('更新标签内容', () => {
        const store = useAppStore.getState()
        store.openTab({ path: '/test.md', title: 'test', content: '# Old' })
        const tabId = useAppStore.getState().openedTabs[0]?.id!

        store.updateTabContent(tabId, '# New')

        const nextState = useAppStore.getState()
        expect(nextState.openedTabs[0]?.content).toBe('# New')
      })

      it('内容变化时设置 isDirty 为 true', () => {
        const store = useAppStore.getState()
        store.openTab({ path: '/test.md', title: 'test', content: '# Original' })
        const tabId = useAppStore.getState().openedTabs[0]?.id!

        store.updateTabContent(tabId, '# Modified')

        const nextState = useAppStore.getState()
        expect(nextState.openedTabs[0]?.isDirty).toBe(true)
      })

      it('内容相同时不设置 isDirty', () => {
        const store = useAppStore.getState()
        store.openTab({ path: '/test.md', title: 'test', content: '# Same' })
        const tabId = useAppStore.getState().openedTabs[0]?.id!

        store.updateTabContent(tabId, '# Same')

        const nextState = useAppStore.getState()
        expect(nextState.openedTabs[0]?.isDirty).toBe(false)
      })

      it('从有内容改为空时设置 isDirty', () => {
        const store = useAppStore.getState()
        store.openTab({ path: '/test.md', title: 'test', content: '# Content' })
        const tabId = useAppStore.getState().openedTabs[0]?.id!

        store.updateTabContent(tabId, '')

        const nextState = useAppStore.getState()
        expect(nextState.openedTabs[0]?.isDirty).toBe(true)
      })

      it('从空改为有内容时设置 isDirty', () => {
        const store = useAppStore.getState()
        store.openTab({ path: '/test.md', title: 'test', content: '' })
        const tabId = useAppStore.getState().openedTabs[0]?.id!

        store.updateTabContent(tabId, '# New Content')

        const nextState = useAppStore.getState()
        expect(nextState.openedTabs[0]?.isDirty).toBe(true)
      })

      it('更新不存在的标签不影响状态', () => {
        const store = useAppStore.getState()
        store.openTab({ path: '/test.md', title: 'test', content: '# Test' })
        const beforeState = useAppStore.getState().openedTabs[0]

        store.updateTabContent('non-existent-id', '# Changed')

        const nextState = useAppStore.getState()
        expect(nextState.openedTabs[0]).toEqual(beforeState)
      })
    })

    describe('markTabSaved', () => {
      it('保存后重置 isDirty 为 false', () => {
        const store = useAppStore.getState()
        store.openTab({ path: '/test.md', title: 'test', content: '# Original' })
        const tabId = useAppStore.getState().openedTabs[0]?.id!

        store.updateTabContent(tabId, '# Modified')
        store.markTabSaved(tabId, '# Modified')

        const nextState = useAppStore.getState()
        expect(nextState.openedTabs[0]?.isDirty).toBe(false)
      })

      it('保存后更新 savedContent', () => {
        const store = useAppStore.getState()
        store.openTab({ path: '/test.md', title: 'test', content: '# Original' })
        const tabId = useAppStore.getState().openedTabs[0]?.id!

        store.updateTabContent(tabId, '# Modified')
        store.markTabSaved(tabId, '# Modified')

        const nextState = useAppStore.getState()
        expect(nextState.openedTabs[0]?.savedContent).toBe('# Modified')
      })

      it('保存后 content 与 savedContent 同步', () => {
        const store = useAppStore.getState()
        store.openTab({ path: '/test.md', title: 'test', content: '# Original' })
        const tabId = useAppStore.getState().openedTabs[0]?.id!

        store.updateTabContent(tabId, '# Modified')
        store.markTabSaved(tabId, '# Modified')

        const nextState = useAppStore.getState()
        expect(nextState.openedTabs[0]?.content).toBe('# Modified')
        expect(nextState.openedTabs[0]?.savedContent).toBe('# Modified')
      })
    })

    describe('setActiveTab', () => {
      it('设置活跃标签', () => {
        const store = useAppStore.getState()
        store.openTab({ path: '/a.md', title: 'a', content: '# A' })
        store.openTab({ path: '/b.md', title: 'b', content: '# B' })

        const targetTabId = useAppStore.getState().openedTabs[1]?.id!
        store.setActiveTab(targetTabId)

        const nextState = useAppStore.getState()
        expect(nextState.activeTabId).toBe(targetTabId)
      })
    })
  })

  describe('工作区和文件树', () => {
    it('设置工作区路径', () => {
      const store = useAppStore.getState()
      store.setWorkspace('/Users/test/documents')

      const nextState = useAppStore.getState()
      expect(nextState.workspace).toBe('/Users/test/documents')
    })

    it('清除工作区', () => {
      const store = useAppStore.getState()
      store.setWorkspace('/test/path')
      store.setWorkspace(null)

      const nextState = useAppStore.getState()
      expect(nextState.workspace).toBeNull()
    })

    it('设置文件树', () => {
      const fileTree = [
        {
          id: '1',
          name: 'readme.md',
          path: '/readme.md',
          type: 'file' as const,
          ext: 'md',
          depth: 0,
        },
      ]
      const store = useAppStore.getState()
      store.setFileTree(fileTree)

      const nextState = useAppStore.getState()
      expect(nextState.fileTree).toEqual(fileTree)
    })
  })

  describe('UI 状态管理', () => {
    describe('setViewMode', () => {
      it('切换到编辑模式', () => {
        const store = useAppStore.getState()
        store.setViewMode('editor')

        const nextState = useAppStore.getState()
        expect(nextState.viewMode).toBe('editor')
      })

      it('切换到预览模式', () => {
        const store = useAppStore.getState()
        store.setViewMode('preview')

        const nextState = useAppStore.getState()
        expect(nextState.viewMode).toBe('preview')
      })

      it('切换到分屏模式', () => {
        const store = useAppStore.getState()
        store.setViewMode('split')

        const nextState = useAppStore.getState()
        expect(nextState.viewMode).toBe('split')
      })
    })

    describe('toggleSidebar', () => {
      it('切换侧边栏显示状态', () => {
        const store = useAppStore.getState()
        const beforeState = useAppStore.getState().sidebarVisible

        store.toggleSidebar()

        const nextState = useAppStore.getState()
        expect(nextState.sidebarVisible).toBe(!beforeState)
      })

      it('初始状态为显示', () => {
        const store = useAppStore.getState()
        expect(store.sidebarVisible).toBe(true)
      })
    })

    describe('setSidebarWidth', () => {
      it('设置侧边栏宽度', () => {
        const store = useAppStore.getState()
        store.setSidebarWidth(300)

        const nextState = useAppStore.getState()
        expect(nextState.sidebarWidth).toBe(300)
      })

      it('允许的最小宽度', () => {
        const store = useAppStore.getState()
        store.setSidebarWidth(100)

        const nextState = useAppStore.getState()
        expect(nextState.sidebarWidth).toBe(100)
      })

      it('允许的最大宽度', () => {
        const store = useAppStore.getState()
        store.setSidebarWidth(800)

        const nextState = useAppStore.getState()
        expect(nextState.sidebarWidth).toBe(800)
      })
    })

    describe('setTheme', () => {
      it('设置亮色主题', () => {
        const store = useAppStore.getState()
        store.setTheme('light')

        const nextState = useAppStore.getState()
        expect(nextState.theme).toBe('light')
      })

      it('设置暗色主题', () => {
        const store = useAppStore.getState()
        store.setTheme('dark')

        const nextState = useAppStore.getState()
        expect(nextState.theme).toBe('dark')
      })

      it('设置跟随系统主题', () => {
        const store = useAppStore.getState()
        store.setTheme('system')

        const nextState = useAppStore.getState()
        expect(nextState.theme).toBe('system')
      })
    })
  })

  describe('压力测试', () => {
    it('快速打开 50 个标签', () => {
      const store = useAppStore.getState()
      for (let i = 0; i < 50; i++) {
        store.openTab({ path: `/file${i}.md`, title: `file${i}`, content: `# File ${i}` })
      }

      const nextState = useAppStore.getState()
      expect(nextState.openedTabs).toHaveLength(50)
    })

    it('快速切换标签 100 次', () => {
      const store = useAppStore.getState()
      store.openTab({ path: '/a.md', title: 'a', content: '# A' })
      store.openTab({ path: '/b.md', title: 'b', content: '# B' })
      store.openTab({ path: '/c.md', title: 'c', content: '# C' })

      const tabs = useAppStore.getState().openedTabs
      for (let i = 0; i < 100; i++) {
        const randomTab = tabs[i % tabs.length]
        store.setActiveTab(randomTab.id)
      }

      // 不应该崩溃
      expect(useAppStore.getState().activeTabId).toBeTruthy()
    })

    it('快速更新内容 1000 次', () => {
      const store = useAppStore.getState()
      store.openTab({ path: '/test.md', title: 'test', content: '# Start' })
      const tabId = useAppStore.getState().openedTabs[0]?.id!

      for (let i = 0; i < 1000; i++) {
        store.updateTabContent(tabId, `# Update ${i}`)
      }

      const nextState = useAppStore.getState()
      expect(nextState.openedTabs[0]?.content).toBe('# Update 999')
      expect(nextState.openedTabs[0]?.isDirty).toBe(true)
    })
  })

  describe('边界条件', () => {
    it('处理包含 null 字节的内容', () => {
      const store = useAppStore.getState()
      expect(() => {
        store.openTab({ path: '/test.md', title: 'test', content: 'Test\x00Content' })
      }).not.toThrow()
    })

    it('处理超长内容（10MB）', () => {
      const hugeContent = '# '.repeat(5_000_000) // 约 10MB
      const store = useAppStore.getState()

      expect(() => {
        store.openTab({ path: '/huge.md', title: 'huge', content: hugeContent })
      }).not.toThrow()
    })

    it('处理特殊 Unicode 字符', () => {
      const specialContent = '🚀🎉😀\u200B\uFEFF\u202A\u202C'
      const store = useAppStore.getState()

      store.openTab({ path: '/special.md', title: 'special', content: specialContent })

      const nextState = useAppStore.getState()
      expect(nextState.openedTabs[0]?.content).toBe(specialContent)
    })
  })
})
