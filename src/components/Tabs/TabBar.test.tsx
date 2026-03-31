import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TabBar } from '@/components/Tabs/TabBar'
import type { OpenedTab } from '@/types'

describe('TabBar 组件 - 完整测试套件', () => {
  const createMockTabs = (count: number): OpenedTab[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: `tab-${i}`,
      path: `/file${i}.md`,
      title: `file${i}.md`,
      content: `# File ${i}`,
      savedContent: `# File ${i}`,
      cursorPos: 0,
      scrollTop: 0,
      isDirty: i % 2 === 0, // 偶数索引为未保存状态
      language: 'markdown',
    }))
  }

  describe('基础渲染', () => {
    it('渲染单个标签', () => {
      const tabs = createMockTabs(1)
      const handleSelectTab = vi.fn()
      const handleCloseTab = vi.fn()

      render(
        <TabBar
          tabs={tabs}
          activeTabId="tab-0"
          onSelectTab={handleSelectTab}
          onCloseTab={handleCloseTab}
        />
      )

      expect(screen.getByText('file0.md')).toBeInTheDocument()
    })

    it('渲染多个标签', () => {
      const tabs = createMockTabs(3)
      const handleSelectTab = vi.fn()
      const handleCloseTab = vi.fn()

      render(
        <TabBar
          tabs={tabs}
          activeTabId="tab-0"
          onSelectTab={handleSelectTab}
          onCloseTab={handleCloseTab}
        />
      )

      expect(screen.getByText('file0.md')).toBeInTheDocument()
      expect(screen.getByText('file1.md')).toBeInTheDocument()
      expect(screen.getByText('file2.md')).toBeInTheDocument()
    })

    it('渲染空标签列表', () => {
      const handleSelectTab = vi.fn()
      const handleCloseTab = vi.fn()

      const { container } = render(
        <TabBar
          tabs={[]}
          activeTabId={null}
          onSelectTab={handleSelectTab}
          onCloseTab={handleCloseTab}
        />
      )

      // 容器仍然存在
      const div = container.querySelector('div')
      expect(div).toBeInTheDocument()
    })

    it('每个标签都有关闭按钮', () => {
      const tabs = createMockTabs(3)
      const handleSelectTab = vi.fn()
      const handleCloseTab = vi.fn()

      render(
        <TabBar
          tabs={tabs}
          activeTabId="tab-0"
          onSelectTab={handleSelectTab}
          onCloseTab={handleCloseTab}
        />
      )

      const closeButtons = screen.getAllByText('×')
      expect(closeButtons).toHaveLength(3)
    })
  })

  describe('激活状态', () => {
    it('高亮显示激活的标签', () => {
      const tabs = createMockTabs(3)
      const handleSelectTab = vi.fn()
      const handleCloseTab = vi.fn()

      const { container } = render(
        <TabBar
          tabs={tabs}
          activeTabId="tab-1"
          onSelectTab={handleSelectTab}
          onCloseTab={handleCloseTab}
        />
      )

      // 第二个标签应该有激活样式
      const tabsElements = container.querySelectorAll('button')
      expect(tabsElements[1]?.className).toContain('bg-background')
    })

    it('无激活标签时不高亮任何标签', () => {
      const tabs = createMockTabs(3)
      const handleSelectTab = vi.fn()
      const handleCloseTab = vi.fn()

      const { container } = render(
        <TabBar
          tabs={tabs}
          activeTabId={null}
          onSelectTab={handleSelectTab}
          onCloseTab={handleCloseTab}
        />
      )

      const tabsElements = container.querySelectorAll('button')
      tabsElements.forEach((tab) => {
        expect(tab.className).toContain('bg-muted')
      })
    })
  })

  describe('未保存状态显示', () => {
    it('显示未保存标记的标签', () => {
      const tabs: OpenedTab[] = [
        {
          id: 'tab-1',
          path: '/dirty.md',
          title: 'dirty.md',
          content: '# Changed',
          savedContent: '# Original',
          cursorPos: 0,
          scrollTop: 0,
          isDirty: true,
          language: 'markdown',
        },
      ]
      const handleSelectTab = vi.fn()
      const handleCloseTab = vi.fn()

      render(
        <TabBar
          tabs={tabs}
          activeTabId="tab-1"
          onSelectTab={handleSelectTab}
          onCloseTab={handleCloseTab}
        />
      )

      expect(screen.getByText('● dirty.md')).toBeInTheDocument()
    })
  })

  describe('交互行为', () => {
    it('点击标签触发 onSelectTab', () => {
      const tabs = createMockTabs(3)
      const handleSelectTab = vi.fn()
      const handleCloseTab = vi.fn()

      render(
        <TabBar
          tabs={tabs}
          activeTabId="tab-0"
          onSelectTab={handleSelectTab}
          onCloseTab={handleCloseTab}
        />
      )

      fireEvent.click(screen.getByText('file1.md'))
      expect(handleSelectTab).toHaveBeenCalledWith('tab-1')
    })

    it('点击关闭按钮触发 onCloseTab', () => {
      const tabs = createMockTabs(3)
      const handleSelectTab = vi.fn()
      const handleCloseTab = vi.fn()

      render(
        <TabBar
          tabs={tabs}
          activeTabId="tab-0"
          onSelectTab={handleSelectTab}
          onCloseTab={handleCloseTab}
        />
      )

      const closeButtons = screen.getAllByText('×')
      fireEvent.click(closeButtons[1])
      expect(handleCloseTab).toHaveBeenCalledWith('tab-1')
    })

    it('点击标签本身不会触发关闭', () => {
      const tabs = createMockTabs(3)
      const handleSelectTab = vi.fn()
      const handleCloseTab = vi.fn()

      render(
        <TabBar
          tabs={tabs}
          activeTabId="tab-0"
          onSelectTab={handleSelectTab}
          onCloseTab={handleCloseTab}
        />
      )

      fireEvent.click(screen.getByText('file1.md'))
      expect(handleCloseTab).not.toHaveBeenCalled()
      expect(handleSelectTab).toHaveBeenCalledTimes(1)
    })
  })

  describe('边界条件', () => {
    it('处理 50 个标签（压力测试）', () => {
      const tabs = createMockTabs(50)
      const handleSelectTab = vi.fn()
      const handleCloseTab = vi.fn()

      render(
        <TabBar
          tabs={tabs}
          activeTabId="tab-0"
          onSelectTab={handleSelectTab}
          onCloseTab={handleCloseTab}
        />
      )

      const closeButtons = screen.getAllByText('×')
      expect(closeButtons).toHaveLength(50)
    })

    it('处理超长标题的标签', () => {
      const tabs: OpenedTab[] = [
        {
          id: 'tab-1',
          path: '/'.repeat(100) + '.md',
          title: 'a'.repeat(300) + '.md',
          content: '# Test',
          savedContent: '# Test',
          cursorPos: 0,
          scrollTop: 0,
          isDirty: false,
          language: 'markdown',
        },
      ]
      const handleSelectTab = vi.fn()
      const handleCloseTab = vi.fn()

      expect(() => {
        render(
          <TabBar
            tabs={tabs}
            activeTabId="tab-1"
            onSelectTab={handleSelectTab}
            onCloseTab={handleCloseTab}
          />
        )
      }).not.toThrow()
    })

    it('处理包含特殊字符的标题', () => {
      const tabs: OpenedTab[] = [
        {
          id: 'tab-1',
          path: '/特殊.md',
          title: '😀🎉<script>&"\'特殊.md',
          content: '# Test',
          savedContent: '# Test',
          cursorPos: 0,
          scrollTop: 0,
          isDirty: false,
          language: 'markdown',
        },
      ]
      const handleSelectTab = vi.fn()
      const handleCloseTab = vi.fn()

      expect(() => {
        render(
          <TabBar
            tabs={tabs}
            activeTabId="tab-1"
            onSelectTab={handleSelectTab}
            onCloseTab={handleCloseTab}
          />
        )
      }).not.toThrow()
    })

    it('处理重复的标签 ID（边界情况）', () => {
      const tabs: OpenedTab[] = [
        {
          id: 'same-id', // 故意重复
          path: '/a.md',
          title: 'a.md',
          content: '# A',
          savedContent: '# A',
          cursorPos: 0,
          scrollTop: 0,
          isDirty: false,
          language: 'markdown',
        },
        {
          id: 'same-id', // 相同 ID
          path: '/b.md',
          title: 'b.md',
          content: '# B',
          savedContent: '# B',
          cursorPos: 0,
          scrollTop: 0,
          isDirty: false,
          language: 'markdown',
        },
      ]
      const handleSelectTab = vi.fn()
      const handleCloseTab = vi.fn()

      // React 的 key 处理重复 ID
      expect(() => {
        render(
          <TabBar
            tabs={tabs}
            activeTabId="same-id"
            onSelectTab={handleSelectTab}
            onCloseTab={handleCloseTab}
          />
        )
      }).not.toThrow()
    })
  })

  describe('样式和布局', () => {
    it('容器有正确的 flex 类', () => {
      const tabs = createMockTabs(1)
      const handleSelectTab = vi.fn()
      const handleCloseTab = vi.fn()

      const { container } = render(
        <TabBar
          tabs={tabs}
          activeTabId="tab-0"
          onSelectTab={handleSelectTab}
          onCloseTab={handleCloseTab}
        />
      )

      const containerDiv = container.querySelector('div')
      expect(containerDiv?.className).toContain('flex')
      expect(containerDiv?.className).toContain('items-stretch')
    })

    it('容器有边框类', () => {
      const tabs = createMockTabs(1)
      const handleSelectTab = vi.fn()
      const handleCloseTab = vi.fn()

      const { container } = render(
        <TabBar
          tabs={tabs}
          activeTabId="tab-0"
          onSelectTab={handleSelectTab}
          onCloseTab={handleCloseTab}
        />
      )

      const containerDiv = container.querySelector('div')
      expect(containerDiv?.className).toContain('border-b')
      expect(containerDiv?.className).toContain('border-border')
    })

    it('容器有溢出滚动类', () => {
      const tabs = createMockTabs(1)
      const handleSelectTab = vi.fn()
      const handleCloseTab = vi.fn()

      const { container } = render(
        <TabBar
          tabs={tabs}
          activeTabId="tab-0"
          onSelectTab={handleSelectTab}
          onCloseTab={handleCloseTab}
        />
      )

      const containerDiv = container.querySelector('div')
      expect(containerDiv?.className).toContain('overflow-auto')
    })
  })

  describe('动态更新', () => {
    it('添加新标签时重新渲染', () => {
      const tabs = createMockTabs(2)
      const handleSelectTab = vi.fn()
      const handleCloseTab = vi.fn()

      const { rerender } = render(
        <TabBar
          tabs={tabs}
          activeTabId="tab-0"
          onSelectTab={handleSelectTab}
          onCloseTab={handleCloseTab}
        />
      )

      expect(screen.getAllByText('×')).toHaveLength(2)

      const newTabs = createMockTabs(3)
      rerender(
        <TabBar
          tabs={newTabs}
          activeTabId="tab-0"
          onSelectTab={handleSelectTab}
          onCloseTab={handleCloseTab}
        />
      )

      expect(screen.getAllByText('×')).toHaveLength(3)
    })

    it('切换激活标签时更新样式', () => {
      const tabs = createMockTabs(3)
      const handleSelectTab = vi.fn()
      const handleCloseTab = vi.fn()

      const { container, rerender } = render(
        <TabBar
          tabs={tabs}
          activeTabId="tab-0"
          onSelectTab={handleSelectTab}
          onCloseTab={handleCloseTab}
        />
      )

      const firstTabBefore = container.querySelectorAll('button')[0]?.className

      rerender(
        <TabBar
          tabs={tabs}
          activeTabId="tab-1"
          onSelectTab={handleSelectTab}
          onCloseTab={handleCloseTab}
        />
      )

      const firstTabAfter = container.querySelectorAll('button')[0]?.className

      // 样式应该改变
      expect(firstTabBefore).not.toBe(firstTabAfter)
    })
  })
})
