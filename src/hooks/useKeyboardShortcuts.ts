import { useEffect } from 'react'
import { nanoid } from 'nanoid'
import { SHORTCUTS } from '@/constants/shortcuts'
import { useAppStore } from '@/store/appStore'
import { useUiStore } from '@/store/uiStore'
import { openPrintDialog, writeFile } from '@/utils/tauri'

function matchesShortcut(event: KeyboardEvent, shortcut: string): boolean {
  const lowered = shortcut.toLowerCase()
  const needsShift = lowered.includes('shift')
  const key = lowered.split('-').at(-1)
  const modPressed = event.ctrlKey || event.metaKey

  return Boolean(modPressed && event.shiftKey === needsShift && event.key.toLowerCase() === key)
}

export function useKeyboardShortcuts(): void {
  const activeTab = useAppStore((state) =>
    state.openedTabs.find((tab) => tab.id === state.activeTabId) ?? null,
  )
  const closeTab = useAppStore((state) => state.closeTab)
  const setViewMode = useAppStore((state) => state.setViewMode)
  const toggleSidebar = useAppStore((state) => state.toggleSidebar)
  const markTabSaved = useAppStore((state) => state.markTabSaved)
  const setExportDialogOpen = useUiStore((state) => state.setExportDialogOpen)
  const pushToast = useUiStore((state) => state.pushToast)

  useEffect(() => {
    async function handleKeyDown(event: KeyboardEvent): Promise<void> {
      if (matchesShortcut(event, SHORTCUTS.SAVE) && activeTab) {
        event.preventDefault()
        try {
          await writeFile(activeTab.path, activeTab.content)
          markTabSaved(activeTab.id, activeTab.content)
          pushToast({ id: nanoid(), title: '已保存 ✓', variant: 'success' })
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error)
          pushToast({ id: nanoid(), title: `保存失败：${message}`, variant: 'error' })
        }
      }

      if (matchesShortcut(event, SHORTCUTS.CLOSE_TAB) && activeTab) {
        event.preventDefault()
        closeTab(activeTab.id)
      }

      if (matchesShortcut(event, SHORTCUTS.TOGGLE_SIDEBAR)) {
        event.preventDefault()
        toggleSidebar()
      }

      if (matchesShortcut(event, SHORTCUTS.TOGGLE_VIEW)) {
        event.preventDefault()
        setViewMode('split')
      }

      if (matchesShortcut(event, SHORTCUTS.EXPORT_PDF)) {
        event.preventDefault()
        setExportDialogOpen(true)
      }

      if (matchesShortcut(event, SHORTCUTS.OPEN_FILE)) {
        event.preventDefault()
        try {
          await openPrintDialog()
        } catch {
          pushToast({ id: nanoid(), title: '打开系统能力失败', variant: 'info' })
        }
      }
    }

    window.addEventListener('keydown', (event) => {
      void handleKeyDown(event)
    })

    return () => {
      window.removeEventListener('keydown', (event) => {
        void handleKeyDown(event)
      })
    }
  }, [activeTab, closeTab, markTabSaved, pushToast, setExportDialogOpen, setViewMode, toggleSidebar])
}
