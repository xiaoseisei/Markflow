import { memo } from 'react'
import { Button } from '@/components/ui'
import type { ViewMode } from '@/types'
import { cn } from '@/utils/cn'

interface EditorToolbarProps {
  viewMode: ViewMode
  onChangeViewMode: (viewMode: ViewMode) => void
  onOpenExport: () => void
}

const modes: ViewMode[] = ['split', 'editor', 'preview']

export const EditorToolbar = memo(function EditorToolbar({
  viewMode,
  onChangeViewMode,
  onOpenExport,
}: EditorToolbarProps) {
  return (
    <div className="flex items-center justify-between border-b border-border bg-card/80 px-4 py-2">
      <div className="flex items-center gap-2">
        {modes.map((mode) => (
          <Button
            className={cn('capitalize', viewMode === mode && 'ring-1 ring-ring')}
            key={mode}
            onClick={() => onChangeViewMode(mode)}
            variant={viewMode === mode ? 'default' : 'outline'}
          >
            {mode}
          </Button>
        ))}
      </div>
      <Button onClick={onOpenExport} variant="outline">
        导出
      </Button>
    </div>
  )
})
