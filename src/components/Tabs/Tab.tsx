import { memo } from 'react'
import type { OpenedTab } from '@/types'
import { cn } from '@/utils/cn'

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
        'flex items-center gap-2 border-r border-border px-3 py-2 text-sm transition-colors',
        isActive ? 'bg-background text-foreground' : 'bg-muted text-muted-foreground hover:bg-accent',
      )}
      onClick={onClick}
      type="button"
    >
      <span className="max-w-40 truncate">{tab.isDirty ? `● ${tab.title}` : tab.title}</span>
      <span
        className="rounded px-1 text-xs hover:bg-black/10"
        onClick={(event) => {
          event.stopPropagation()
          onClose()
        }}
      >
        ×
      </span>
    </button>
  )
})
