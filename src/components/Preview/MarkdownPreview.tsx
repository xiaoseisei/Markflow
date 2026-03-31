import { memo } from 'react'
import { FileText, Sparkles } from 'lucide-react'

interface MarkdownPreviewProps {
  html: string
  isEmpty?: boolean
}

/**
 * 预览区空状态组件
 */
function EmptyPreview() {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-white text-center dark:bg-slate-900">
      <div className="mb-6 rounded-full bg-slate-100 p-4 dark:bg-slate-800">
        <FileText className="size-10 text-slate-400" />
      </div>
      <h2 className="mb-2 text-lg font-semibold text-slate-700 dark:text-slate-200">
        等待输入...
      </h2>
      <p className="mb-6 max-w-xs text-[14px] text-slate-500">
        在左侧编辑器中输入 Markdown 内容，预览将在这里实时显示
      </p>
      <div className="flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-[13px] text-slate-500 dark:bg-slate-800">
        <Sparkles className="size-4" />
        <span>支持实时预览</span>
      </div>
    </div>
  )
}

export const MarkdownPreview = memo(function MarkdownPreview({ html, isEmpty = false }: MarkdownPreviewProps) {
  // 如果内容为空，显示空状态
  if (isEmpty || !html || html === '<p></p>') {
    return <EmptyPreview />
  }

  return (
    <div
      className="markdown-body h-full overflow-auto bg-white px-8 py-6 dark:bg-slate-900"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
})
