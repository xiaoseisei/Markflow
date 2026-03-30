import { useEffect } from 'react'
import { nanoid } from 'nanoid'
import { SHORTCUTS } from '@/constants/shortcuts'
import type { EditorCommand } from '@/utils/editorCommands'
import type { MarkdownEditorRef } from '@/components/Editor'
import { useAppStore } from '@/store/appStore'
import { useUiStore } from '@/store/uiStore'
import { pickFile, writeFile } from '@/utils/fsAdapter'

/**
 * 检查按键事件是否匹配快捷键
 */
function matchesShortcut(event: KeyboardEvent, shortcut: string): boolean {
  const lowered = shortcut.toLowerCase()
  const needsShift = lowered.includes('shift')
  const key = lowered.split('-').at(-1)
  const modPressed = event.ctrlKey || event.metaKey

  return Boolean(modPressed && event.shiftKey === needsShift && event.key.toLowerCase() === key)
}

/**
 * 全局快捷键 Hook
 *
 * 【实现思路】
 * - 监听全局 keydown 事件
 * - 根据快捷键执行相应操作
 * - 支持文件操作、格式化、视图切换等
 * - 使用 editorRef 执行编辑器命令
 *
 * @param editorRef - 编辑器引用，用于执行格式化命令
 */
export function useKeyboardShortcuts(editorRef: React.RefObject<MarkdownEditorRef>): void {
  const activeTab = useAppStore((state) =>
    state.openedTabs.find((tab) => tab.id === state.activeTabId) ?? null,
  )
  const workspace = useAppStore((state) => state.workspace)
  const closeTab = useAppStore((state) => state.closeTab)
  const openTab = useAppStore((state) => state.openTab)
  const setViewMode = useAppStore((state) => state.setViewMode)
  const toggleSidebar = useAppStore((state) => state.toggleSidebar)
  const markTabSaved = useAppStore((state) => state.markTabSaved)
  const setExportDialogOpen = useUiStore((state) => state.setExportDialogOpen)
  const pushToast = useUiStore((state) => state.pushToast)

  /**
   * 执行编辑器格式化命令
   */
  function executeEditorCommand(command: EditorCommand): void {
    editorRef.current?.executeCommand(command)
  }

  /**
   * 打开文件或工作区
   */
  async function handleOpenFile(): Promise<void> {
    try {
      if (workspace) {
        // 有工作区：提示用户使用侧边栏新建文件
        pushToast({ id: nanoid(), title: '请使用侧边栏右键菜单新建文件', variant: 'info' })
      } else {
        // 无工作区：打开文件
        const result = await pickFile()
        if (result) {
          const { path, content, title } = result
          openTab({ path, title, content })
          pushToast({ id: nanoid(), title: '文件已打开', variant: 'success' })
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      pushToast({ id: nanoid(), title: `打开文件失败：${message}`, variant: 'error' })
    }
  }

  useEffect(() => {
    async function handleKeyDown(event: KeyboardEvent): Promise<void> {
      // ========================================
      // 文件操作
      // ========================================

      // Mod+S: 保存
      if (matchesShortcut(event, SHORTCUTS.SAVE) && activeTab?.path) {
        event.preventDefault()
        try {
          await writeFile(activeTab.path, activeTab.content)
          markTabSaved(activeTab.id, activeTab.content)
          pushToast({ id: nanoid(), title: '已保存 ✓', variant: 'success' })
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error)
          pushToast({ id: nanoid(), title: `保存失败：${message}`, variant: 'error' })
        }
        return
      }

      // Mod+W: 关闭标签
      if (matchesShortcut(event, SHORTCUTS.CLOSE_TAB) && activeTab) {
        event.preventDefault()
        closeTab(activeTab.id)
        return
      }

      // Mod+P: 打开文件
      if (matchesShortcut(event, SHORTCUTS.OPEN_FILE)) {
        event.preventDefault()
        await handleOpenFile()
        return
      }

      // Mod+N: 新建文件（暂不支持，显示提示）
      if (matchesShortcut(event, SHORTCUTS.NEW_FILE)) {
        event.preventDefault()
        pushToast({ id: nanoid(), title: '请先打开一个工作区', variant: 'info' })
        return
      }

      // Mod+Shift+E: 导出
      if (matchesShortcut(event, SHORTCUTS.EXPORT_PDF)) {
        event.preventDefault()
        setExportDialogOpen(true)
        return
      }

      // ========================================
      // 格式化快捷键
      // ========================================

      // 只有在有活动标签时才执行格式化命令
      if (activeTab) {
        switch (true) {
          // 文本格式
          case matchesShortcut(event, SHORTCUTS.FORMAT_BOLD):
            case matchesShortcut(event, SHORTCUTS.FORMAT_ITALIC):
          case matchesShortcut(event, SHORTCUTS.FORMAT_STRIKETHROUGH):
          case matchesShortcut(event, SHORTCUTS.FORMAT_HEADING_1):
          case matchesShortcut(event, SHORTCUTS.FORMAT_HEADING_2):
          case matchesShortcut(event, SHORTCUTS.FORMAT_HEADING_3):
          case matchesShortcut(event, SHORTCUTS.FORMAT_HEADING_4):
          case matchesShortcut(event, SHORTCUTS.FORMAT_HEADING_5):
          case matchesShortcut(event, SHORTCUTS.FORMAT_HEADING_6):
          case matchesShortcut(event, SHORTCUTS.FORMAT_UNORDERED_LIST):
          case matchesShortcut(event, SHORTCUTS.FORMAT_ORDERED_LIST):
          case matchesShortcut(event, SHORTCUTS.FORMAT_TASK_LIST):
          case matchesShortcut(event, SHORTCUTS.FORMAT_CODE_INLINE):
          case matchesShortcut(event, SHORTCUTS.FORMAT_CODE_BLOCK):
          case matchesShortcut(event, SHORTCUTS.FORMAT_QUOTE):
          case matchesShortcut(event, SHORTCUTS.FORMAT_LINK):
          case matchesShortcut(event, SHORTCUTS.FORMAT_IMAGE):
            event.preventDefault()
            // 找到匹配的命令并执行
            if (matchesShortcut(event, SHORTCUTS.FORMAT_BOLD)) executeEditorCommand('bold')
            else if (matchesShortcut(event, SHORTCUTS.FORMAT_ITALIC)) executeEditorCommand('italic')
            else if (matchesShortcut(event, SHORTCUTS.FORMAT_STRIKETHROUGH)) executeEditorCommand('strikethrough')
            else if (matchesShortcut(event, SHORTCUTS.FORMAT_HEADING_1)) executeEditorCommand('heading-1')
            else if (matchesShortcut(event, SHORTCUTS.FORMAT_HEADING_2)) executeEditorCommand('heading-2')
            else if (matchesShortcut(event, SHORTCUTS.FORMAT_HEADING_3)) executeEditorCommand('heading-3')
            else if (matchesShortcut(event, SHORTCUTS.FORMAT_HEADING_4)) executeEditorCommand('heading-4')
            else if (matchesShortcut(event, SHORTCUTS.FORMAT_HEADING_5)) executeEditorCommand('heading-5')
            else if (matchesShortcut(event, SHORTCUTS.FORMAT_HEADING_6)) executeEditorCommand('heading-6')
            else if (matchesShortcut(event, SHORTCUTS.FORMAT_UNORDERED_LIST)) executeEditorCommand('unordered-list')
            else if (matchesShortcut(event, SHORTCUTS.FORMAT_ORDERED_LIST)) executeEditorCommand('ordered-list')
            else if (matchesShortcut(event, SHORTCUTS.FORMAT_TASK_LIST)) executeEditorCommand('task-list')
            else if (matchesShortcut(event, SHORTCUTS.FORMAT_CODE_INLINE)) executeEditorCommand('code-inline')
            else if (matchesShortcut(event, SHORTCUTS.FORMAT_CODE_BLOCK)) executeEditorCommand('code-block')
            else if (matchesShortcut(event, SHORTCUTS.FORMAT_QUOTE)) executeEditorCommand('quote')
            else if (matchesShortcut(event, SHORTCUTS.FORMAT_LINK)) executeEditorCommand('link')
            else if (matchesShortcut(event, SHORTCUTS.FORMAT_IMAGE)) executeEditorCommand('image')
            return
        }
      }

      // ========================================
      // 视图切换
      // ========================================

      if (matchesShortcut(event, SHORTCUTS.TOGGLE_SIDEBAR)) {
        event.preventDefault()
        toggleSidebar()
        return
      }

      if (matchesShortcut(event, SHORTCUTS.VIEW_EDITOR)) {
        event.preventDefault()
        setViewMode('editor')
        return
      }

      if (matchesShortcut(event, SHORTCUTS.VIEW_PREVIEW)) {
        event.preventDefault()
        setViewMode('preview')
        return
      }

      if (matchesShortcut(event, SHORTCUTS.VIEW_SPLIT)) {
        event.preventDefault()
        setViewMode('split')
        return
      }

      // ========================================
      // 搜索
      // ========================================

      if (matchesShortcut(event, SHORTCUTS.GLOBAL_SEARCH)) {
        event.preventDefault()
        // 全局搜索：侧边栏搜索面板
        pushToast({ id: nanoid(), title: '请在侧边栏搜索面板中输入关键词', variant: 'info' })
        return
      }

      if (matchesShortcut(event, SHORTCUTS.FIND_IN_FILE)) {
        event.preventDefault()
        // 当前文件搜索：聚焦到编辑器
        editorRef.current?.focus()
        pushToast({ id: nanoid(), title: '当前文件搜索功能即将推出', variant: 'info' })
        return
      }

      // ========================================
      // 缩放（暂不支持，显示提示）
      // ========================================

      if (
        matchesShortcut(event, SHORTCUTS.ZOOM_IN) ||
        matchesShortcut(event, SHORTCUTS.ZOOM_OUT) ||
        matchesShortcut(event, SHORTCUTS.ZOOM_RESET)
      ) {
        event.preventDefault()
        pushToast({ id: nanoid(), title: '缩放功能即将推出', variant: 'info' })
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [
    activeTab,
    closeTab,
    editorRef,
    markTabSaved,
    pushToast,
    setExportDialogOpen,
    setViewMode,
    toggleSidebar,
    workspace,
    openTab,
  ])
}
