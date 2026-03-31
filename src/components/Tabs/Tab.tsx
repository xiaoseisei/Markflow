import { memo } from 'react'
import type { OpenedTab } from '@/types'
import { cn } from '@/utils/cn'
import { X, FileText } from 'lucide-react'

interface TabProps {
  tab: OpenedTab
  isActive: boolean
  onClick: () => void
  onClose: () => void
}

export const Tab = memo(function Tab({ tab, isActive, onClick, onClose }: TabProps) {
  return (
    <button
      className={cn(
        'group flex items-center gap-2 border-r border-slate-200 px-3 text-[13px] transition-colors',
        'hover:bg-slate-100 dark:hover:bg-slate-700',
        isActive
          ? 'bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100'
          : 'bg-slate-50 text-slate-500 dark:bg-slate-800/50 dark:text-slate-400',
      )}
      onClick={onClick}
      type="button"
    >
      <FileText className="size-3.5 flex-shrink-0" />
      <span className="max-w-32 truncate">{tab.isDirty ? `· ${tab.title}` : tab.title}</span>
      <span
        className={cn(
          'flex size-4 items-center justify-center rounded text-slate-400',
          'transition-colors hover:bg-slate-200 hover:text-slate-600',
          'dark:hover:bg-slate-600 dark:hover:text-slate-200',
          'opacity-0 group-hover:opacity-100',
          isActive && 'opacity-100',
        )}
        onClick={(event) => {
          event.stopPropagation()
          onClose()
        }}
      >
        <X className="size-3" />
      </span>
    </button>
  )
})
