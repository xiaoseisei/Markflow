import { describe, expect, it } from 'vitest'
import { renderMarkdown } from '@/utils/markdown'

describe('renderMarkdown - 增强测试套件', () => {
  describe('基础 Markdown 语法', () => {
    it('渲染 H1-H6 标题', () => {
      expect(renderMarkdown('# H1')).toContain('<h1>H1</h1>')
      expect(renderMarkdown('## H2')).toContain('<h2>H2</h2>')
      expect(renderMarkdown('###### H6')).toContain('<h6>H6</h6>')
    })

    it('渲染粗体和斜体', () => {
      expect(renderMarkdown('**粗体**')).toContain('<strong>粗体</strong>')
      expect(renderMarkdown('*斜体*')).toContain('<em>斜体</em>')
      expect(renderMarkdown('***粗斜体***')).toContain('<strong><em>粗斜体</em></strong>')
    })

    it('渲染链接和图片', () => {
      expect(renderMarkdown('[链接](https://example.com)')).toContain('<a href="https://example.com">链接</a>')
      expect(renderMarkdown('![图片](image.png)')).toContain('<img src="image.png" alt="图片">')
    })

    it('渲染无序和有序列表', () => {
      expect(renderMarkdown('- 项目1')).toContain('<li>项目1</li>')
      expect(renderMarkdown('1. 项目1')).toContain('<li>项目1</li>')
    })

    it('渲染代码块', () => {
      const result = renderMarkdown('```javascript\nconsole.log("hello");\n```')
      expect(result).toContain('<pre><code')
      expect(result).toContain('language-javascript')
    })

    it('渲染表格', () => {
      const result = renderMarkdown('| A | B |\n|---|---|\n| 1 | 2 |')
      expect(result).toContain('<table>')
      expect(result).toContain('<th>A</th>')
      expect(result).toContain('<td>1</td>')
    })

    it('渲染任务列表', () => {
      const result = renderMarkdown('- [x] 完成\n- [ ] 未完成')
      expect(result).toContain('type="checkbox"')
    })
  })

  describe('GFM (GitHub Flavored Markdown) 扩展', () => {
    it('渲染删除线', () => {
      expect(renderMarkdown('~~删除~~')).toContain('<del>删除</del>')
    })

    it('渲染自动链接', () => {
      expect(renderMarkdown('https://example.com')).toContain('<a href="https://example.com">')
    })

    it('支持换行符转 <br>', () => {
      expect(renderMarkdown('第一行\n第二行')).toContain('<br />')
    })
  })

  describe('XSS 防护测试', () => {
    it('净化 script 标签', () => {
      const result = renderMarkdown('<script>alert("xss")</script><p>safe</p>')
      expect(result).not.toContain('<script>')
      expect(result).toContain('<p>safe</p>')
    })

    it('净化 on* 事件处理器', () => {
      const result = renderMarkdown('<img src=x onerror="alert(1)">')
      expect(result).not.toContain('onerror')
    })

    it('净化 javascript: 协议', () => {
      const result = renderMarkdown('<a href="javascript:alert(1)">点击</a>')
      expect(result).not.toContain('javascript:')
    })

    it('净化 iframe 标签', () => {
      const result = renderMarkdown('<iframe src="evil.com"></iframe>')
      expect(result).not.toContain('<iframe')
    })

    it('净化 object/embed 标签', () => {
      const result = renderMarkdown('<object data="evil.swf"></object>')
      expect(result).not.toContain('<object')
    })

    it('净化 style 标签中的 expression', () => {
      const result = renderMarkdown('<div style="xss:expression(alert(1))">')
      expect(result).not.toContain('expression')
    })

    it('允许安全的 KaTeX 标签', () => {
      renderMarkdown('$x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$')
      // KaTeX 处理后应该包含 math 标签（通过 ADD_TAGS 允许）
      // 但原始输入不应该被作为 script 执行
    })

    it('净化 SVG XSS', () => {
      const result = renderMarkdown('<svg onload="alert(1)"></svg>')
      expect(result).not.toContain('onload')
    })
  })

  describe('边界条件测试', () => {
    it('处理空字符串', () => {
      expect(renderMarkdown('')).toBe('')
    })

    it('处理纯文本', () => {
      expect(renderMarkdown('纯文本内容')).toContain('纯文本内容')
    })

    it('处理超长文本（10000 字符）', () => {
      const longText = '# '.repeat(5000)
      const result = renderMarkdown(longText)
      expect(result.length).toBeGreaterThan(0)
    })

    it('处理特殊字符', () => {
      expect(renderMarkdown('&lt;&gt;&amp;')).toContain('&lt;&gt;&amp;')
      expect(renderMarkdown('©®™')).toContain('©®™')
    })

    it('处理 Unicode emoji', () => {
      const result = renderMarkdown('😀🎉🚀')
      expect(result).toContain('😀')
    })

    it('处理混合中英文', () => {
      const result = renderMarkdown('Hello 你好 世界 World')
      expect(result).toContain('Hello')
      expect(result).toContain('你好')
    })

    it('处理 null/undefined 输入（类型安全）', () => {
      // TypeScript 应该在编译时捕获这个问题
      // 但我们测试运行时行为
      expect(() => renderMarkdown(null as unknown as string)).not.toThrow()
      expect(() => renderMarkdown(undefined as unknown as string)).not.toThrow()
    })
  })

  describe('代码高亮测试', () => {
    it('高亮 JavaScript 代码', () => {
      const result = renderMarkdown('```js\nconst x = 1;\n```')
      expect(result).toContain('language-javascript')
    })

    it('高亮 Python 代码', () => {
      const result = renderMarkdown('```python\ndef foo():\n    pass\n```')
      expect(result).toContain('language-python')
    })

    it('处理不支持的语言', () => {
      const result = renderMarkdown('```unknown\nfoo bar baz\n```')
      expect(result).toContain('language-plaintext')
    })

    it('处理无语言标识的代码块', () => {
      const result = renderMarkdown('```\ncode here\n```')
      expect(result).toContain('language-plaintext')
    })
  })

  describe('性能测试', () => {
    it('大文件渲染（10000 行）', () => {
      const lines = Array(10000).fill(0).map((_, i) => `## 第 ${i} 行`).join('\n')
      const start = performance.now()
      renderMarkdown(lines)
      const duration = performance.now() - start
      expect(duration).toBeLessThan(5000) // 5秒内完成
    })

    it('复杂嵌套结构', () => {
      const nested = '1. '.repeat(100) + '项目'
      const result = renderMarkdown(nested)
      expect(result).toContain('<ol>')
    })
  })
})
