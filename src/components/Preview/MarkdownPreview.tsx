import { memo } from 'react'

interface MarkdownPreviewProps {
  html: string
}

export const MarkdownPreview = memo(function MarkdownPreview({ html }: MarkdownPreviewProps) {
  return (
    <div className="markdown-body h-full overflow-auto bg-background px-6 py-5" dangerouslySetInnerHTML={{ __html: html }} />
  )
})
