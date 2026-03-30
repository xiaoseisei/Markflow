/**
 * 导出工具
 * 支持 PDF、HTML、Markdown 格式导出
 */

import DOMPurify from 'dompurify'
import type { ExportConfig } from '@/types'

/**
 * 导出文档
 * - PDF: 通过系统打印对话框
 * - HTML: 生成带内联样式的独立 HTML 文件
 * - Markdown: 导出原始 Markdown 文本
 */
export async function exportDocument(markdown: string, html: string, config: ExportConfig): Promise<void> {
  if (config.format === 'pdf') {
    await exportPdf(html, config)
    return
  }

  if (config.format === 'html') {
    await exportHtml(html, config)
    return
  }

  if (config.format === 'markdown') {
    await exportMarkdown(markdown)
    return
  }

  throw new Error(`不支持的导出格式：${config.format}`)
}

/**
 * 导出 PDF（通过系统打印对话框）
 */
async function exportPdf(html: string, config: ExportConfig): Promise<void> {
  // XSS 防护：净化 HTML，保留数学公式标签
  const cleanHtml = DOMPurify.sanitize(html, {
    ADD_TAGS: ['math', 'semantics'],
    ADD_ATTR: ['class', 'aria-label'],
  })

  // 打开打印预览
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    throw new Error('无法打开打印窗口，请检查弹窗设置')
  }

  printWindow.document.write(buildHtmlDocument(cleanHtml, config))
  printWindow.document.close()

  // 等待文档加载完成后触发打印
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print()
    }, 100)
  }
}

/**
 * 导出 HTML（独立文件）
 */
async function exportHtml(html: string, config: ExportConfig): Promise<void> {
  const fullHtml = buildHtmlDocument(html, config)
  const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' })

  // 使用 File System Access API 或传统下载方式
  if (window.showSaveFilePicker) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: 'document.html',
        types: [
          {
            description: 'HTML 文件',
            accept: { 'text/html': ['.html'] },
          },
        ],
      })
      const writable = await handle.createWritable()
      await writable.write(blob)
      await writable.close()
      return
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        return // 用户取消
      }
      throw error
    }
  }

  // 降级方案：使用传统下载方式
  downloadBlob(blob, 'document.html')
}

/**
 * 导出 Markdown（原始文本）
 */
async function exportMarkdown(markdown: string): Promise<void> {
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' })

  if (window.showSaveFilePicker) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: 'document.md',
        types: [
          {
            description: 'Markdown 文件',
            accept: { 'text/markdown': ['.md', '.markdown'] },
          },
        ],
      })
      const writable = await handle.createWritable()
      await writable.write(blob)
      await writable.close()
      return
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        return // 用户取消
      }
      throw error
    }
  }

  // 降级方案
  downloadBlob(blob, 'document.md')
}

/**
 * 构建完整的 HTML 文档
 */
function buildHtmlDocument(bodyHtml: string, config: ExportConfig): string {
  const themeStyles = getThemeStyles(config.cssTheme)

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>导出文档</title>
  <style>
    ${themeStyles}
    @media print {
      @page {
        size: ${config.paperSize} ${config.orientation};
        margin: 2cm;
      }
      body {
        margin: 0;
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <article class="markdown-body">
    ${bodyHtml}
  </article>
</body>
</html>`
}

/**
 * 获取主题样式
 */
function getThemeStyles(theme: ExportConfig['cssTheme']): string {
  const baseStyles = `
    .markdown-body {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #24292f;
    }
    .markdown-body h1, .markdown-body h2, .markdown-body h3,
    .markdown-body h4, .markdown-body h5, .markdown-body h6 {
      margin-top: 24px;
      margin-bottom: 16px;
      font-weight: 600;
      line-height: 1.25;
    }
    .markdown-body h1 { font-size: 2em; border-bottom: 1px solid #d0d7de; padding-bottom: 0.3em; }
    .markdown-body h2 { font-size: 1.5em; border-bottom: 1px solid #d0d7de; padding-bottom: 0.3em; }
    .markdown-body h3 { font-size: 1.25em; }
    .markdown-body p { margin-top: 0; margin-bottom: 16px; }
    .markdown-body code {
      padding: 0.2em 0.4em;
      margin: 0;
      font-size: 85%;
      background-color: rgba(175,184,193,0.2);
      border-radius: 6px;
      font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, monospace;
    }
    .markdown-body pre {
      padding: 16px;
      overflow: auto;
      font-size: 85%;
      line-height: 1.45;
      background-color: #f6f8fa;
      border-radius: 6px;
      margin-bottom: 16px;
    }
    .markdown-body pre code {
      padding: 0;
      background-color: transparent;
    }
    .markdown-body blockquote {
      padding: 0 1em;
      color: #57606a;
      border-left: 0.25em solid #d0d7de;
      margin: 0 0 16px 0;
    }
    .markdown-body table {
      border-spacing: 0;
      border-collapse: collapse;
      margin-bottom: 16px;
      width: 100%;
    }
    .markdown-body table th, .markdown-body table td {
      padding: 6px 13px;
      border: 1px solid #d0d7de;
    }
    .markdown-body table tr { background-color: #ffffff; }
    .markdown-body table tr:nth-child(2n) { background-color: #f6f8fa; }
    .markdown-body img { max-width: 100%; box-sizing: content-box; }
    .markdown-body a { color: #0969da; text-decoration: none; }
    .markdown-body a:hover { text-decoration: underline; }
  `

  if (theme === 'github') {
    return baseStyles
  }

  if (theme === 'minimal') {
    return baseStyles + `
      .markdown-body { font-family: Georgia, 'Times New Roman', serif; }
      .markdown-body h1, .markdown-body h2 { border-bottom: none; }
      .markdown-body pre { background-color: #f5f5f5; border: 1px solid #e1e1e1; }
    `
  }

  if (theme === 'academic') {
    return baseStyles + `
      .markdown-body { font-family: 'Latin Modern Roman', 'Times New Roman', serif; }
      .markdown-body h1, .markdown-body h2 { text-align: center; }
      .markdown-body h1 { font-size: 16pt; font-weight: bold; }
      .markdown-body h2 { font-size: 14pt; font-weight: bold; }
      .markdown-body p { text-align: justify; text-indent: 2em; }
      .markdown-body p:first-of-type { text-indent: 0; }
      .markdown-body pre { font-family: 'Courier New', monospace; font-size: 10pt; }
    `
  }

  return baseStyles
}

/**
 * 降级下载方式（用于不支持 File System Access API 的浏览器）
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
