import { marked } from 'marked'
import DOMPurify from 'dompurify'
import hljs from 'highlight.js'

marked.setOptions({
  gfm: true,
  breaks: true,
})

const renderer = new marked.Renderer()
renderer.code = ({ text, lang }) => {
  const language = hljs.getLanguage(lang ?? '') ? (lang ?? 'plaintext') : 'plaintext'
  const highlighted = hljs.highlight(text, { language }).value
  return `<pre><code class="hljs language-${language}">${highlighted}</code></pre>`
}

marked.use({ renderer })

export function renderMarkdown(content: string): string {
  const rawHtml = marked.parse(content) as string
  return DOMPurify.sanitize(rawHtml, {
    ADD_TAGS: ['math', 'semantics'],
    ADD_ATTR: ['class', 'aria-label'],
  })
}
