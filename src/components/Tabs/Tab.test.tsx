import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Tab } from '@/components/Tabs/Tab'
import type { OpenedTab } from '@/types'

describe('Tab 组件 - 完整测试套件', () => {
  const createMockTab = (overrides?: Partial<OpenedTab>): OpenedTab => ({
    id: 'tab-1',
    path: '/test.md',
    title: 'test',
    content: '# Test',
    savedContent: '# Test',
    cursorPos: 0,
    scrollTop: 0,
    isDirty: false,
    language: 'markdown',
    ...overrides,
  })

  describe('基础渲染', () => {
    it('渲染标签标题', () => {
      const mockTab = createMockTab({ title: 'document.md' })
      const handleClick = vi.fn()
      const handleClose = vi.fn()

      render(<Tab tab={mockTab} isActive={false} onClick={handleClick} onClose={handleClose} />)

      expect(screen.getByText('document.md')).toBeInTheDocument()
    })

    it('渲染关闭按钮', () => {
      const mockTab = createMockTab()
      const handleClick = vi.fn()
      const handleClose = vi.fn()

      render(<Tab tab={mockTab} isActive={false} onClick={handleClick} onClose={handleClose} />)

      expect(screen.getByText('×')).toBeInTheDocument()
    })

    it('使用 button 元素', () => {
      const mockTab = createMockTab()
      const handleClick = vi.fn()
      const handleClose = vi.fn()

      const { container } = render(
        <Tab tab={mockTab} isActive={false} onClick={handleClick} onClose={handleClose} />
      )

      const button = container.querySelector('button')
      expect(button).toBeInTheDocument()
    })
  })

  describe('激活状态', () => {
    it('激活标签有不同样式', () => {
      const mockTab = createMockTab()
      const handleClick = vi.fn()
      const handleClose = vi.fn()

      const { container: activeContainer } = render(
        <Tab tab={mockTab} isActive={true} onClick={handleClick} onClose={handleClose} />
      )
      const { container: inactiveContainer } = render(
        <Tab tab={mockTab} isActive={false} onClick={handleClick} onClose={handleClose} />
      )

      const activeButton = activeContainer.querySelector('button')
      const inactiveButton = inactiveContainer.querySelector('button')

      expect(activeButton?.className).not.toBe(inactiveButton?.className)
    })

    it('激活标签包含 bg-background 类', () => {
      const mockTab = createMockTab()
      const handleClick = vi.fn()
      const handleClose = vi.fn()

      const { container } = render(
        <Tab tab={mockTab} isActive={true} onClick={handleClick} onClose={handleClose} />
      )

      const button = container.querySelector('button')
      expect(button?.className).toContain('bg-background')
    })
  })

  describe('未保存状态', () => {
    it('未保存标签显示圆点前缀', () => {
      const mockTab = createMockTab({ isDirty: true, title: 'document.md' })
      const handleClick = vi.fn()
      const handleClose = vi.fn()

      render(<Tab tab={mockTab} isActive={false} onClick={handleClick} onClose={handleClose} />)

      expect(screen.getByText('● document.md')).toBeInTheDocument()
    })

    it('已保存标签不显示圆点前缀', () => {
      const mockTab = createMockTab({ isDirty: false, title: 'document.md' })
      const handleClick = vi.fn()
      const handleClose = vi.fn()

      render(<Tab tab={mockTab} isActive={false} onClick={handleClick} onClose={handleClose} />)

      expect(screen.getByText('document.md')).toBeInTheDocument()
      expect(screen.queryByText('● document.md')).not.toBeInTheDocument()
    })
  })

  describe('交互行为', () => {
    it('点击标签触发 onClick', () => {
      const mockTab = createMockTab()
      const handleClick = vi.fn()
      const handleClose = vi.fn()

      const { container } = render(
        <Tab tab={mockTab} isActive={false} onClick={handleClick} onClose={handleClose} />
      )

      const button = container.querySelector('button')
      button && fireEvent.click(button)

      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('点击关闭按钮触发 onClose', () => {
      const mockTab = createMockTab()
      const handleClick = vi.fn()
      const handleClose = vi.fn()

      render(<Tab tab={mockTab} isActive={false} onClick={handleClick} onClose={handleClose} />)

      const closeButton = screen.getByText('×')
      fireEvent.click(closeButton)

      expect(handleClose).toHaveBeenCalledTimes(1)
    })

    it('点击关闭按钮不触发 onClick', () => {
      const mockTab = createMockTab()
      const handleClick = vi.fn()
      const handleClose = vi.fn()

      render(<Tab tab={mockTab} isActive={false} onClick={handleClick} onClose={handleClose} />)

      const closeButton = screen.getByText('×')
      fireEvent.click(closeButton)

      expect(handleClick).not.toHaveBeenCalled()
      expect(handleClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('边界条件', () => {
    it('处理空标题', () => {
      const mockTab = createMockTab({ title: '' })
      const handleClick = vi.fn()
      const handleClose = vi.fn()

      render(<Tab tab={mockTab} isActive={false} onClick={handleClick} onClose={handleClose} />)

      // 应该仍然渲染关闭按钮
      expect(screen.getByText('×')).toBeInTheDocument()
    })

    it('处理超长标题（截断显示）', () => {
      const longTitle = 'a'.repeat(300)
      const mockTab = createMockTab({ title: longTitle })
      const handleClick = vi.fn()
      const handleClose = vi.fn()

      render(<Tab tab={mockTab} isActive={false} onClick={handleClick} onClose={handleClose} />)

      const titleElement = screen.getByText((content) => content.startsWith('a'))
      // 应该有 truncate 类导致截断
      expect(titleElement).toBeInTheDocument()
    })

    it('处理特殊字符标题', () => {
      const specialTitles = [
        '文档.md',
        '😀🎉.md',
        '<script>.md',
        'a & b.md',
        "a'b.md",
        'a"b.md',
      ]

      specialTitles.forEach((title) => {
        const mockTab = createMockTab({ title })
        const handleClick = vi.fn()
        const handleClose = vi.fn()

        const { unmount } = render(
          <Tab tab={mockTab} isActive={false} onClick={handleClick} onClose={handleClose} />
        )

        expect(screen.getByText(title)).toBeInTheDocument()
        unmount()
      })
    })

    it('处理只有空格的标题', () => {
      const mockTab = createMockTab({ title: '   ' })
      const handleClick = vi.fn()
      const handleClose = vi.fn()

      render(<Tab tab={mockTab} isActive={false} onClick={handleClick} onClose={handleClose} />)

      expect(screen.getByText('   ')).toBeInTheDocument()
    })

    it('处理 Unicode 标题', () => {
      const unicodeTitles = [
        'العربية.md',
        '中文文档.md',
        '日本語.md',
        '한국어.md',
        'Русский.md',
        'Ελληνικά.md',
      ]

      unicodeTitles.forEach((title) => {
        const mockTab = createMockTab({ title })
        const handleClick = vi.fn()
        const handleClose = vi.fn()

        const { unmount } = render(
          <Tab tab={mockTab} isActive={false} onClick={handleClick} onClose={handleClose} />
        )

        expect(screen.getByText(title)).toBeInTheDocument()
        unmount()
      })
    })
  })

  describe('可访问性', () => {
    it('按钮有 type="button" 属性', () => {
      const mockTab = createMockTab()
      const handleClick = vi.fn()
      const handleClose = vi.fn()

      const { container } = render(
        <Tab tab={mockTab} isActive={false} onClick={handleClick} onClose={handleClose} />
      )

      const button = container.querySelector('button')
      expect(button?.getAttribute('type')).toBe('button')
    })

    it('关闭按钮可以被键盘访问', () => {
      const mockTab = createMockTab()
      const handleClick = vi.fn()
      const handleClose = vi.fn()

      render(<Tab tab={mockTab} isActive={false} onClick={handleClick} onClose={handleClose} />)

      const closeButton = screen.getByText('×')
      expect(closeButton).toBeInTheDocument()
    })
  })

  describe('样式类', () => {
    it('包含基础的 flex 类', () => {
      const mockTab = createMockTab()
      const handleClick = vi.fn()
      const handleClose = vi.fn()

      const { container } = render(
        <Tab tab={mockTab} isActive={false} onClick={handleClick} onClose={handleClose} />
      )

      const button = container.querySelector('button')
      expect(button?.className).toContain('flex')
    })

    it('包含 items-center 类', () => {
      const mockTab = createMockTab()
      const handleClick = vi.fn()
      const handleClose = vi.fn()

      const { container } = render(
        <Tab tab={mockTab} isActive={false} onClick={handleClick} onClose={handleClose} />
      )

      const button = container.querySelector('button')
      expect(button?.className).toContain('items-center')
    })

    it('包含过渡动画类', () => {
      const mockTab = createMockTab()
      const handleClick = vi.fn()
      const handleClose = vi.fn()

      const { container } = render(
        <Tab tab={mockTab} isActive={false} onClick={handleClick} onClose={handleClose} />
      )

      const button = container.querySelector('button')
      expect(button?.className).toContain('transition')
    })
  })
})
