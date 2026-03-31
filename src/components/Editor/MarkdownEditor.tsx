import { memo, useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from '@codemirror/view'
import { history, historyKeymap, defaultKeymap } from '@codemirror/commands'
import { indentOnInput, bracketMatching, syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language'
import { autocompletion, closeBrackets, closeBracketsKeymap, completionKeymap } from '@codemirror/autocomplete'
import { searchKeymap } from '@codemirror/search'
import { oneDark } from '@codemirror/theme-one-dark'
import { createMarkdownSyntaxExtension } from '@/components/Editor/extensions/markdownSyntax'
import { createSaveKeymap } from '@/components/Editor/extensions/saveKeymap'
import type { EditorCommand } from '@/utils/editorCommands'
import { formatText, getCursorOffset } from '@/utils/editorCommands'
import { cn } from '@/utils/cn'

interface MarkdownEditorProps {
  value: string
  theme: 'light' | 'dark'
  onChange: (content: string) => void
  onSave: () => void
  className?: string
}

/**
 * Markdown 编辑器实例接口
 * 暴露给父组件的方法
 */
export interface MarkdownEditorRef {
  executeCommand: (command: EditorCommand) => void
  focus: () => void
}

/**
 * MarkdownEditor 组件
 *
 * 【方案 B：CSS 动态变量换肤】
 * - 不在主题切换时销毁重建 EditorView
 * - 通过 CSS 变量和 .dark 类控制主题
 * - 确保 React 层面没有任何 Props 和 State 变动
 */
export const MarkdownEditor = memo(
  forwardRef<MarkdownEditorRef, MarkdownEditorProps>(function MarkdownEditor(
    { value, theme, onChange, onSave, className },
    ref,
  ) {
    const [container, setContainer] = useState<HTMLDivElement | null>(null)
    const viewRef = useRef<EditorView | null>(null)
    const prevValueRef = useRef<string>(value)
    const prevThemeRef = useRef<'light' | 'dark'>(theme)

    /**
     * 执行编辑器命令
     */
    const executeCommand = (command: EditorCommand): void => {
      const view = viewRef.current
      if (!view) {
        return
      }

      const { from, to } = view.state.selection.main
      const selectedText = view.state.sliceDoc(from, to)
      const formattedText = formatText(command, selectedText)

      const transaction = view.state.update({
        changes: {
          from,
          to,
          insert: formattedText,
        },
        selection: {
          anchor: from + getCursorOffset(command, selectedText),
        },
      })

      view.dispatch(transaction)
      view.focus()
    }

    /**
     * 暴露方法给父组件
     */
    useImperativeHandle(
      ref,
      () => ({
        executeCommand,
        focus: () => {
          viewRef.current?.focus()
        },
      }),
      [],
    )

    /**
     * 【方案 B 核心】通过 CSS 类名控制主题，不重建 EditorView
     */
    useEffect(() => {
      if (!container || !viewRef.current) {
        return
      }

      // 切换容器的 dark 类，CodeMirror 通过 CSS 变量响应主题变化
      if (theme === 'dark') {
        container.classList.add('dark')
      } else {
        container.classList.remove('dark')
      }

      prevThemeRef.current = theme
    }, [theme, container])

    /**
     * 【方案 B 核心】稳定的 extensions，不包含 theme 相关
     * 使用 CSS 变量让 CodeMirror 响应外部主题变化
     */
    const extensions = [
      createMarkdownSyntaxExtension(),
      lineNumbers(),
      highlightActiveLine(),
      highlightActiveLineGutter(),
      history(),
      indentOnInput(),
      bracketMatching(),
      closeBrackets(),
      autocompletion(),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      EditorView.lineWrapping,
      keymap.of([
        ...defaultKeymap,
        ...historyKeymap,
        ...closeBracketsKeymap,
        ...completionKeymap,
        ...searchKeymap,
      ]),
      createSaveKeymap(onSave),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          const newContent = update.state.doc.toString()
          onChange(newContent)
          prevValueRef.current = newContent
        }
      }),
      /**
       * 【方案 B 核心】使用 CSS 变量定义主题
       * 所有颜色都通过 CSS 变量引用，支持 .dark 类切换
       */
      EditorView.theme({
        '&': {
          height: '100%',
          fontSize: '14px',
          backgroundColor: 'var(--cm-background)',
          color: 'var(--cm-color)',
        },
        '.cm-scroller': {
          overflow: 'auto',
          fontFamily: 'var(--editor-font-family)',
          backgroundColor: 'var(--cm-background)',
        },
        '.cm-content': {
          caretColor: 'var(--cm-caret)',
        },
        '.cm-cursor, .cm-dropCursor': {
          borderLeftColor: 'var(--cm-caret)',
        },
        '.cm-selectionBackground': {
          background: 'var(--cm-selection-bg)',
        },
        '.cm-focused': {
          outline: 'none',
        },
        '.cm-line': {
          borderColor: 'var(--cm-border)',
        },
        '.cm-gutters': {
          backgroundColor: 'var(--cm-gutter-bg)',
          color: 'var(--cm-gutter-color)',
          border: 'none',
        },
        '.cm-activeLineGutter': {
          backgroundColor: 'var(--cm-gutter-active-bg)',
          color: 'var(--cm-gutter-active-color)',
        },
        '.cm-lineNumbers .cm-gutterElement': {
          color: 'var(--cm-line-number-color)',
        },
        '.cm-activeLine': {
          backgroundColor: 'var(--cm-active-line-bg)',
        },
        '.cm-selectionMatch': {
          backgroundColor: 'var(--cm-selection-match-bg)',
        },
        '.cm-matchingBracket, .cm-nonmatchingBracket': {
          backgroundColor: 'var(--cm-bracket-bg)',
          color: 'var(--cm-bracket-color)',
        },
        // 语法高亮颜色
        '&.cm-focused .cm-selectionBackground, ::selection': {
          backgroundColor: 'var(--cm-selection-bg)',
        },
        '.cm-searchMatch': {
          backgroundColor: 'var(--cm-search-bg)',
          color: 'var(--cm-search-color)',
        },
        '.cm-searchMatch.cm-searchMatch-selected': {
          backgroundColor: 'var(--cm-search-selected-bg)',
          color: 'var(--cm-search-selected-color)',
        },
      }),
      // 同时应用 oneDark 作为暗色主题的基础（通过 CSS 变量覆盖）
      oneDark,
    ]

    /**
     * 初始化 EditorView（只执行一次）
     */
    useEffect(() => {
      if (!container) {
        return
      }

      if (viewRef.current) {
        return
      }

      const state = EditorState.create({
        doc: value,
        extensions: [
          ...extensions,
          EditorView.editorAttributes.of({ 'data-code-mirror': 'true' }),
        ],
      })

      const view = new EditorView({
        state,
        parent: container,
      })

      viewRef.current = view
      prevValueRef.current = value

      // 初始化主题类
      if (theme === 'dark') {
        container.classList.add('dark')
      }

      return () => {
        view.destroy()
        viewRef.current = null
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [container])

    /**
     * 处理外部 value 变化（如切换标签或首次加载）
     */
    useEffect(() => {
      const view = viewRef.current
      if (!view) {
        return
      }

      // 比较时使用 EditorView 内的实际内容，而非可能过时的 ref
      const currentContent = view.state.doc.toString()
      if (value === currentContent) {
        // 内容相同，无需更新
        return
      }

      // 使用 transaction 替换整个文档
      const transaction = view.state.update({
        changes: {
          from: 0,
          to: view.state.doc.length,
          insert: value,
        },
      })

      view.dispatch(transaction)
      // 同步 ref
      prevValueRef.current = view.state.doc.toString()

      // 文件切换后自动聚焦
      view.focus()
    }, [value])

    return <div className={cn('h-full min-h-0 overflow-hidden', className)} ref={setContainer} />
  }),
)
