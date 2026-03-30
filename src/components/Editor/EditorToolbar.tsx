import { memo } from 'react'
import { Button } from '@/components/ui'
import type { ViewMode } from '@/types'
import type { EditorCommand } from '@/utils/editorCommands'
import { COMMAND_GROUPS, COMMAND_LABELS, COMMAND_ICONS } from '@/utils/editorCommands'
import { cn } from '@/utils/cn'

interface EditorToolbarProps {
  viewMode: ViewMode
  onChangeViewMode: (viewMode: ViewMode) => void
  onOpenExport: () => void
  onExecuteCommand?: (command: EditorCommand) => void
}

const modes: ViewMode[] = ['split', 'editor', 'preview']

/**
 * 格式化按钮组件
 */
interface FormatButtonProps {
  command: EditorCommand
  onExecuteCommand?: (command: EditorCommand) => void
}

function FormatButton({ command, onExecuteCommand }: FormatButtonProps) {
  return (
    <button
      className={cn(
        'flex items-center gap-1 rounded-md px-2 py-1.5 text-sm font-medium',
        'transition-colors hover:bg-accent hover:text-accent-foreground',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
        'disabled:pointer-events-none disabled:opacity-50',
      )}
      onClick={() => onExecuteCommand?.(command)}
      title={COMMAND_LABELS[command]}
      type="button"
    >
      <span className="text-xs">{COMMAND_ICONS[command]}</span>
      <span className="hidden sm:inline">{COMMAND_LABELS[command]}</span>
    </button>
  )
}

/**
 * 命令组组件
 */
interface CommandGroupProps {
  commands: EditorCommand[]
  onExecuteCommand?: (command: EditorCommand) => void
}

function CommandGroup({ commands, onExecuteCommand }: CommandGroupProps) {
  return (
    <div className="flex items-center gap-1">
      {commands.map((command) => (
        <FormatButton command={command} key={command} onExecuteCommand={onExecuteCommand} />
      ))}
    </div>
  )
}

export const EditorToolbar = memo(function EditorToolbar({
  viewMode,
  onChangeViewMode,
  onOpenExport,
  onExecuteCommand,
}: EditorToolbarProps) {
  return (
    <div className="flex flex-col gap-2 border-b border-border bg-card/80 px-4 py-2">
      {/* 第一行：格式化工具栏 */}
      <div className="flex flex-wrap items-center gap-3">
        {Object.entries(COMMAND_GROUPS).map(([key, group]) => (
          <CommandGroup
            commands={group.commands}
            key={key}
            onExecuteCommand={onExecuteCommand}
          />
        ))}
      </div>

      {/* 第二行：视图切换 + 导出 */}
      <div className="flex items-center justify-between">
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
    </div>
  )
})
