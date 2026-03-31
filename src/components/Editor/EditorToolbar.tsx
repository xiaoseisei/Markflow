import { memo } from 'react'
import type { ViewMode } from '@/types'
import type { EditorCommand } from '@/utils/editorCommands'
import { COMMAND_GROUPS } from '@/utils/editorCommands'
import { cn } from '@/utils/cn'
// Lucide React 图标
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  Heading,
  List,
  ListOrdered,
  CheckSquare,
  Code,
  Quote,
  Minus,
  Link,
  Image,
  Columns2,
  FileText,
  Eye,
  Play,
} from 'lucide-react'

/** 命令图标组件映射 */
const COMMAND_ICONS: Record<EditorCommand, React.ReactNode> = {
  'bold': <Bold className="size-4" strokeWidth={2.5} />,
  'italic': <Italic className="size-4" strokeWidth={2.5} />,
  'strikethrough': <Strikethrough className="size-4" strokeWidth={2.5} />,
  'heading-1': <Heading1 className="size-4" strokeWidth={2.5} />,
  'heading-2': <Heading2 className="size-4" strokeWidth={2.5} />,
  'heading-3': <Heading3 className="size-4" strokeWidth={2.5} />,
  'heading-4': <Heading className="size-4" strokeWidth={2.5} />,
  'heading-5': <Heading className="size-4" strokeWidth={2.5} />,
  'heading-6': <Heading className="size-4" strokeWidth={2.5} />,
  'heading-clear': <Heading className="size-4" strokeWidth={2.5} />,
  'unordered-list': <List className="size-4" strokeWidth={2.5} />,
  'ordered-list': <ListOrdered className="size-4" strokeWidth={2.5} />,
  'task-list': <CheckSquare className="size-4" strokeWidth={2.5} />,
  'code-inline': <Code className="size-4" strokeWidth={2.5} />,
  'code-block': <Code className="size-4" strokeWidth={2.5} />,
  'quote': <Quote className="size-4" strokeWidth={2.5} />,
  'divider': <Minus className="size-4" strokeWidth={2.5} />,
  'link': <Link className="size-4" strokeWidth={2.5} />,
  'image': <Image className="size-4" strokeWidth={2.5} />,
}

interface EditorToolbarProps {
  viewMode: ViewMode
  onChangeViewMode: (viewMode: ViewMode) => void
  onCompile: () => void
  onExecuteCommand?: (command: EditorCommand) => void
}

const modes: { value: ViewMode; icon: React.ReactNode; title: string }[] = [
  { value: 'split', icon: <Columns2 className="size-4" />, title: '分屏' },
  { value: 'editor', icon: <FileText className="size-4" />, title: '编辑' },
  { value: 'preview', icon: <Eye className="size-4" />, title: '预览' },
]

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
        'flex items-center justify-center rounded p-1.5',
        'text-slate-500 transition-colors duration-100',
        'hover:bg-slate-100 hover:text-slate-900',
        'dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-300',
        'disabled:pointer-events-none disabled:opacity-50',
      )}
      onClick={() => onExecuteCommand?.(command)}
      title={command}
      type="button"
    >
      {COMMAND_ICONS[command]}
    </button>
  )
}

export const EditorToolbar = memo(function EditorToolbar({
  viewMode,
  onChangeViewMode,
  onCompile,
  onExecuteCommand,
}: EditorToolbarProps) {
  return (
    <div
      className={cn(
        'flex h-10 items-center justify-between px-3',
        // 磨砂半透明效果
        'bg-white/80 backdrop-blur-md dark:bg-slate-900/80',
        // 细边框
        'border-b border-slate-200 dark:border-slate-700',
      )}
    >
      {/* 左侧：格式化工具栏 */}
      <div className="flex items-center gap-0.5">
        {Object.entries(COMMAND_GROUPS).map(([key, group], index) => (
          <div key={key} className="flex items-center">
            {/* 组内按钮 */}
            <div className="flex items-center">
              {group.commands.map((command) => (
                <FormatButton
                  command={command}
                  key={command}
                  onExecuteCommand={onExecuteCommand}
                />
              ))}
            </div>
            {/* 组间分隔线 */}
            {index < Object.entries(COMMAND_GROUPS).length - 1 && (
              <div className="mx-2 h-5 w-px bg-slate-200 dark:bg-slate-700" />
            )}
          </div>
        ))}
      </div>

      {/* 右侧：视图切换 + 编译按钮 */}
      <div className="flex items-center gap-2">
        {/* Segmented Control 视图切换 */}
        <div
          className={cn(
            'flex items-center rounded-lg p-0.5',
            'bg-slate-100 dark:bg-slate-800',
            'border border-slate-200 dark:border-slate-700',
          )}
        >
          {modes.map((mode) => (
            <button
              key={mode.value}
              className={cn(
                'flex items-center gap-1 rounded-md px-2 py-1 text-[13px] font-medium',
                'transition-all duration-100',
                viewMode === mode.value
                  ? cn(
                      'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100',
                      'ring-1 ring-slate-200 dark:ring-slate-600',
                    )
                  : cn(
                      'text-slate-500 hover:bg-white/50 hover:text-slate-700',
                      'dark:text-slate-400 dark:hover:bg-slate-700/50 dark:hover:text-slate-200',
                    ),
              )}
              onClick={() => onChangeViewMode(mode.value)}
              title={mode.title}
              type="button"
            >
              {mode.icon}
            </button>
          ))}
        </div>

        {/* 编译按钮 - 主要 CTA */}
        <button
          className={cn(
            'flex items-center gap-1.5 rounded-lg px-3 py-1.5',
            'bg-blue-600 text-white text-[13px] font-medium',
            'transition-all duration-100',
            'hover:bg-blue-700 active:bg-blue-800',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1',
            'shadow-sm',
          )}
          onClick={onCompile}
          title="编译预览"
          type="button"
        >
          <Play className="size-3.5" strokeWidth={2.5} />
          <span>Compile</span>
        </button>
      </div>
    </div>
  )
})
