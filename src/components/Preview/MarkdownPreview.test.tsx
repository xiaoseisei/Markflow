import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MarkdownPreview } from '@/components/Preview/MarkdownPreview'

describe('MarkdownPreview 组件 - 完整测试套件', () => {
  describe('基础渲染', () => {
    it('渲染 HTML 内容', () => {
      const html = '<h1>Hello World</h1><p>This is a paragraph.</p>'

      const { container } = render(<MarkdownPreview html={html} />)

      expect(container.querySelector('h1')).toBeInTheDocument()
      expect(container.querySelector('p')).toBeInTheDocument()
      expect(screen.getByText('Hello World')).toBeInTheDocument()
      expect(screen.getByText('This is a paragraph.')).toBeInTheDocument()
    })

    it('渲染空内容', () => {
      const { container } = render(<MarkdownPreview html="" />)

      const div = container.querySelector('.markdown-body')
      expect(div).toBeInTheDocument()
      expect(div?.innerHTML).toBe('')
    })

    it('渲染纯文本', () => {
      const html = 'Plain text content'

      const { container } = render(<MarkdownPreview html={html} />)

      expect(screen.getByText('Plain text content')).toBeInTheDocument()
    })
  })

  describe('HTML 内容处理', () => {
    it('渲染标题层级', () => {
      const html = '<h1>Heading 1</h1><h2>Heading 2</h2><h3>Heading 3</h3>'

      const { container } = render(<MarkdownPreview html={html} />)

      expect(container.querySelector('h1')).toBeInTheDocument()
      expect(container.querySelector('h2')).toBeInTheDocument()
      expect(container.querySelector('h3')).toBeInTheDocument()
    })

    it('渲染列表', () => {
      const html = '<ul><li>Item 1</li><li>Item 2</li></ul>'

      const { container } = render(<MarkdownPreview html={html} />)

      expect(container.querySelector('ul')).toBeInTheDocument()
      expect(screen.getByText('Item 1')).toBeInTheDocument()
      expect(screen.getByText('Item 2')).toBeInTheDocument()
    })

    it('渲染代码块', () => {
      const html = '<pre><code class="hljs language-javascript">const x = 1;</code></pre>'

      const { container } = render(<MarkdownPreview html={html} />)

      expect(container.querySelector('pre')).toBeInTheDocument()
      expect(container.querySelector('code')).toBeInTheDocument()
      expect(screen.getByText('const x = 1;')).toBeInTheDocument()
    })

    it('渲染表格', () => {
      const html = '<table><thead><tr><th>A</th></tr></thead><tbody><tr><td>1</td></tr></tbody></table>'

      const { container } = render(<MarkdownPreview html={html} />)

      expect(container.querySelector('table')).toBeInTheDocument()
      expect(container.querySelector('thead')).toBeInTheDocument()
      expect(container.querySelector('tbody')).toBeInTheDocument()
    })

    it('渲染链接', () => {
      const html = '<a href="https://example.com">Link</a>'

      const { container } = render(<MarkdownPreview html={html} />)

      const link = container.querySelector('a')
      expect(link).toBeInTheDocument()
      expect(link?.getAttribute('href')).toBe('https://example.com')
      expect(screen.getByText('Link')).toBeInTheDocument()
    })

    it('渲染图片', () => {
      const html = '<img src="test.png" alt="Test Image">'

      const { container } = render(<MarkdownPreview html={html} />)

      const img = container.querySelector('img')
      expect(img).toBeInTheDocument()
      expect(img?.getAttribute('src')).toBe('test.png')
      expect(img?.getAttribute('alt')).toBe('Test Image')
    })

    it('渲染引用块', () => {
      const html = '<blockquote>This is a quote</blockquote>'

      const { container } = render(<MarkdownPreview html={html} />)

      expect(container.querySelector('blockquote')).toBeInTheDocument()
      expect(screen.getByText('This is a quote')).toBeInTheDocument()
    })

    it('渲染水平线', () => {
      const html = '<p>Before</p><hr><p>After</p>'

      const { container } = render(<MarkdownPreview html={html} />)

      expect(container.querySelector('hr')).toBeInTheDocument()
    })

    it('渲染任务列表', () => {
      const html = '<ul><li><input type="checkbox" checked> Done</li><li><input type="checkbox"> Todo</li></ul>'

      const { container } = render(<MarkdownPreview html={html} />)

      const checkboxes = container.querySelectorAll('input[type="checkbox"]')
      expect(checkboxes).toHaveLength(2)
      expect(checkboxes[0]?.checked).toBe(true)
      expect(checkboxes[1]?.checked).toBe(false)
    })
  })

  describe('安全测试', () => {
    it('不执行 script 标签（XSS 防护）', () => {
      const html = '<p>Before</p><script>alert("XSS")</script><p>After</p>'

      const { container } = render(<MarkdownPreview html={html} />)

      // script 标签应该被移除
      expect(container.querySelector('script')).not.toBeInTheDocument()
      // 安全内容应该保留
      expect(screen.getByText('Before')).toBeInTheDocument()
      expect(screen.getByText('After')).toBeInTheDocument()
    })

    it('移除 on* 事件处理器', () => {
      const html = '<div onclick="alert(1)">Click me</div>'

      const { container } = render(<MarkdownPreview html={html} />)

      const div = container.querySelector('div')
      expect(div?.getAttribute('onclick')).toBeNull()
    })

    it('移除 javascript: 协议', () => {
      const html = '<a href="javascript:alert(1)">Click</a>'

      const { container } = render(<MarkdownPreview html={html} />)

      const link = container.querySelector('a')
      expect(link?.getAttribute('href')).not.toContain('javascript:')
    })
  })

  describe('边界条件', () => {
    it('处理超长 HTML 内容（10000 字符）', () => {
      const longHtml = '<p>' + 'a'.repeat(10000) + '</p>'

      expect(() => {
        render(<MarkdownPreview html={longHtml} />)
      }).not.toThrow()
    })

    it('处理嵌套结构（100 层）', () => {
      let nested = '<p>'
      for (let i = 0; i < 100; i++) {
        nested += '<span>'
      }
      nested += 'deep content'
      for (let i = 0; i < 100; i++) {
        nested += '</span>'
      }
      nested += '</p>'

      expect(() => {
        render(<MarkdownPreview html={nested} />)
      }).not.toThrow()
    })

    it('处理特殊字符', () => {
      const html = '<p>&lt;&gt;&amp;"\'</p>'

      const { container } = render(<MarkdownPreview html={html} />)

      expect(container.querySelector('p')).toBeInTheDocument()
    })

    it('处理 Unicode 字符', () => {
      const html = '<p>😀🎉🚀 中文 العربية 日本語 한굴</p>'

      render(<MarkdownPreview html={html} />)

      expect(screen.getByText(/😀/)).toBeInTheDocument()
      expect(screen.getByText(/中文/)).toBeInTheDocument()
    })

    it('处理 null 字节', () => {
      const html = '<p>Before\x00After</p>'

      expect(() => {
        render(<MarkdownPreview html={html} />)
      }).not.toThrow()
    })

    it('处理不匹配的 HTML 标签', () => {
      const html = '<div><p>Unclosed</div>'

      expect(() => {
        render(<MarkdownPreview html={html} />)
      }).not.toThrow()
    })

    it('处理自闭合标签', () => {
      const html = '<p>Before<br/>After</p>'

      const { container } = render(<MarkdownPreview html={html} />)

      expect(container.querySelector('br')).toBeInTheDocument()
    })
  })

  describe('样式类', () => {
    it('容器有 markdown-body 类', () => {
      const { container } = render(<MarkdownPreview html="<p>Test</p>" />)

      const div = container.querySelector('.markdown-body')
      expect(div).toBeInTheDocument()
    })

    it('容器有 h-full 类（全高）', () => {
      const { container } = render(<MarkdownPreview html="<p>Test</p>" />)

      const div = container.querySelector('.markdown-body')
      expect(div?.className).toContain('h-full')
    })

    it('容器有 overflow-auto 类（可滚动）', () => {
      const { container } = render(<MarkdownPreview html="<p>Test</p>" />)

      const div = container.querySelector('.markdown-body')
      expect(div?.className).toContain('overflow-auto')
    })

    it('容器有背景色类', () => {
      const { container } = render(<MarkdownPreview html="<p>Test</p>" />)

      const div = container.querySelector('.markdown-body')
      expect(div?.className).toContain('bg-background')
    })

    it('容器有内边距类', () => {
      const { container } = render(<MarkdownPreview html="<p>Test</p>" />)

      const div = container.querySelector('.markdown-body')
      expect(div?.className).toContain('px-6')
      expect(div?.className).toContain('py-5')
    })
  })

  describe('组件性能', () => {
    it('大量内容渲染不阻塞', () => {
      const largeHtml = Array.from({ length: 1000 }, (_, i) => `<h2>Section ${i}</h2><p>Content ${i}</p>`).join('')

      const startTime = performance.now()
      render(<MarkdownPreview html={largeHtml} />)
      const duration = performance.now() - startTime

      expect(duration).toBeLessThan(1000) // 1秒内完成
    })

    it('频繁更新不卡顿', () => {
      const { rerender } = render(<MarkdownPreview html="<p>Initial</p>" />)

      expect(() => {
        for (let i = 0; i < 100; i++) {
          rerender(<MarkdownPreview html={`<p>Update ${i}</p>`} />)
        }
      }).not.toThrow()
    })
  })

  describe('可访问性', () => {
    it('正确处理 ARIA 属性（如果存在）', () => {
      const html = '<div role="article" aria-label="Content">Article content</div>'

      const { container } = render(<MarkdownPreview html={html} />)

      const div = container.querySelector('[role="article"]')
      expect(div?.getAttribute('aria-label')).toBe('Content')
    })
  })

  describe('实际 Markdown 内容模拟', () => {
    it('渲染典型的 GitHub 风格 Markdown', () => {
      const typicalHtml = `
        <h1>Document Title</h1>
        <p>This is a paragraph with <strong>bold</strong> and <em>italic</em> text.</p>
        <h2>Code Example</h2>
        <pre><code class="hljs language-javascript">function hello() {
  return "Hello, World!";
}</code></pre>
        <h2>Lists</h2>
        <ul>
          <li>Item 1</li>
          <li>Item 2</li>
        </ul>
      `

      const { container } = render(<MarkdownPreview html={typicalHtml} />)

      expect(screen.getByText('Document Title')).toBeInTheDocument()
      expect(screen.getByText(/This is a paragraph/)).toBeInTheDocument()
      expect(screen.getByText('Item 1')).toBeInTheDocument()
      expect(screen.getByText('function hello()')).toBeInTheDocument()
    })

    it('渲染数学公式（KaTeX）', () => {
      const mathHtml = '<p>Inline: <math>...</math></p>'

      const { container } = render(<MarkdownPreview html={mathHtml} />)

      // KaTeX 标签应该被保留（通过 DOMPurify ADD_TAGS）
      expect(container.querySelector('math')).toBeInTheDocument()
    })
  })
})
