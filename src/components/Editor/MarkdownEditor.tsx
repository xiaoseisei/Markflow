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
 * 【实现思路】
 * - 使用 useImperativeHandle 暴露命令执行方法
 * - 使用 useRef 存储 EditorView 实例，避免因 value 变化而销毁重建
 * - 外部 value 变化时使用 transaction 更新，而非重建视图
 * - theme 变化时才重建视图
 */
export const MarkdownEditor = memo(
  forwardRef<MarkdownEditorRef, MarkdownEditorProps>(function MarkdownEditor(
    { value, theme, onChange, onSave, className },
    ref,
  ) {
    const [container, setContainer] = useState<HTMLDivElement | null>(null)
    // 【关键修复】使用 ref 存储 view 实例，避免每次渲染都重新创建
    const viewRef = useRef<EditorView | null>(null)
    // 【关键修复】使用 ref 存储上一次的 value，用于检测外部变化
    const prevValueRef = useRef<string>(value)

    /**
     * 【新增】执行编辑器命令
     *
     * 【实现思路】
     * - 获取当前选中的文本
     * - 根据命令类型格式化文本
     * - 使用 transaction 替换选中文本
     * - 调整光标位置到合适位置
     */
    const executeCommand = (command: EditorCommand): void => {
      const view = viewRef.current
      if (!view) {
        return
      }

      const { from, to } = view.state.selection.main
      const selectedText = view.state.sliceDoc(from, to)
      const formattedText = formatText(command, selectedText)

      // 使用 transaction 替换文本
      const transaction = view.state.update({
        changes: {
          from,
          to,
          insert: formattedText,
        },
        // 调整光标位置
        selection: {
          anchor: from + getCursorOffset(command, selectedText),
        },
      })

      view.dispatch(transaction)
      view.focus()
    }

    /**
     * 【新增】暴露方法给父组件
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
          // 【关键修复】更新 ref，避免循环更新
          prevValueRef.current = newContent
        }
      }),
      EditorView.theme({
        '&': { height: '100%', fontSize: '14px' },
        '.cm-scroller': { overflow: 'auto', fontFamily: 'var(--editor-font-family)' },
      }),
      theme === 'dark' ? oneDark : [],
    ]

    /**
     * 【核心修复】初始化 EditorView
     *
     * 【实现思路】
     * - 只在 container 首次可用时创建 EditorView
     * - 使用 ref 存储 view 实例，避免依赖闭包
     * - 移除 value 依赖，防止内容变化时重建 view
     */
    useEffect(() => {
      if (!container) {
        return
      }

      // 如果已经存在 view，不重复创建
      if (viewRef.current) {
        return
      }

      const state = EditorState.create({
        doc: value,
        extensions: [
          ...extensions,
          // 【新增】在 view 上存储一个标记，用于后续识别
          EditorView.editorAttributes.of({ 'data-code-mirror': 'true' }),
        ],
      })

      const view = new EditorView({
        state,
        parent: container,
      })

      viewRef.current = view
      prevValueRef.current = value

      return () => {
        view.destroy()
        viewRef.current = null
      }
      // 【关键】只依赖 container，不依赖 value 和 extensions
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [container])

    /**
     * 【新增】处理外部 value 变化
     *
     * 【实现思路】
     * - 当 value 从外部变化时（如切换标签、加载文件）
     * - 使用 transaction 更新文档内容，而不是重建 view
     * - 检查 value 是否真的变化，避免循环更新
     */
    useEffect(() => {
      const view = viewRef.current
      if (!view) {
        return
      }

      // 如果内容相同，跳过更新
      if (value === prevValueRef.current) {
        return
      }

      // 【关键修复】使用 transaction 更新内容，而不是重建 view
      const transaction = view.state.update({
        changes: {
          from: 0,
          to: view.state.doc.length,
          insert: value,
        },
      })

      view.dispatch(transaction)
      prevValueRef.current = value
    }, [value])

    /**
     * 【新增】处理 theme 变化
     *
     * 【实现思路】
     * - theme 变化时需要重建 view（因为 oneDark 扩展需要在初始化时应用）
     * - 先销毁旧 view，再创建新 view
     */
    useEffect(() => {
      const view = viewRef.current
      if (!view || !container) {
        return
      }

      // 销毁旧 view
      view.destroy()
      viewRef.current = null

      // 创建新 view
      const state = EditorState.create({
        doc: prevValueRef.current, // 使用当前内容
        extensions: [
          ...extensions,
          EditorView.editorAttributes.of({ 'data-code-mirror': 'true' }),
        ],
      })

      const newView = new EditorView({
        state,
        parent: container,
      })

      viewRef.current = newView

      return () => {
        newView.destroy()
        viewRef.current = null
      }
      // 【关键】只依赖 theme 和 container
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [theme, container])

    return <div className={cn('h-full min-h-0 overflow-hidden', className)} ref={setContainer} />
  }),
)
