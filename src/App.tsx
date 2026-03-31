import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { nanoid } from 'nanoid'
import { Sidebar } from '@/components/Sidebar'
import { EditorToolbar, MarkdownEditor, type MarkdownEditorRef } from '@/components/Editor'
import { ExportDialog } from '@/components/Export'
import { MarkdownPreview } from '@/components/Preview'
import { TabBar } from '@/components/Tabs'
import { Dialog, ToastViewport } from '@/components/ui'
import { Layout, SidebarHeader, StatusBar } from '@/components/Layout/Layout'
import { Header } from '@/components/Layout/Header'
import { useAutoSave } from '@/hooks/useAutoSave'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useTheme } from '@/hooks/useTheme'
import { useAppStore } from '@/store/appStore'
import { useUiStore } from '@/store/uiStore'
import { exportDocument } from '@/utils/export'
import { renderMarkdown } from '@/utils/markdown'
import type { EditorCommand } from '@/utils/editorCommands'
import type { ExportConfig } from '@/types'
import { getAppConfig } from '@/utils/configAdapter'
import { pickFile, pickWorkspace, readFile, writeFile, createFile, createDir, renamePath, deletePath, readDirTree } from '@/utils/fsAdapter'
import { getEnvInfo } from '@/utils/env'

function App(): JSX.Element {
  // 确认对话框状态
  const [closeConfirmTabId, setCloseConfirmTabId] = useState<string | null>(null)
  const showCloseConfirm = closeConfirmTabId !== null

  // 编辑器引用，用于执行格式化命令
  const editorRef = useRef<MarkdownEditorRef>(null)

  function handleCommandExecute(command: EditorCommand): void {
    editorRef.current?.executeCommand(command)
  }

  const workspace = useAppStore((state) => state.workspace)
  const fileTree = useAppStore((state) => state.fileTree)
  const openedTabs = useAppStore((state) => state.openedTabs)
  const activeTabId = useAppStore((state) => state.activeTabId)
  const viewMode = useAppStore((state) => state.viewMode)
  const sidebarVisible = useAppStore((state) => state.sidebarVisible)
  const theme = useAppStore((state) => state.theme)
  const setWorkspace = useAppStore((state) => state.setWorkspace)
  const setFileTree = useAppStore((state) => state.setFileTree)
  const openTab = useAppStore((state) => state.openTab)
  const closeTab = useAppStore((state) => state.closeTab)
  const setActiveTab = useAppStore((state) => state.setActiveTab)
  const updateTabContent = useAppStore((state) => state.updateTabContent)
  const markTabSaved = useAppStore((state) => state.markTabSaved)
  const setViewMode = useAppStore((state) => state.setViewMode)
  const setTheme = useAppStore((state) => state.setTheme)
  const toggleSidebar = useAppStore((state) => state.toggleSidebar)
  const exportDialogOpen = useUiStore((state) => state.exportDialogOpen)
  const setExportDialogOpen = useUiStore((state) => state.setExportDialogOpen)
  const pushToast = useUiStore((state) => state.pushToast)

  const activeTab = openedTabs.find((tab) => tab.id === activeTabId) ?? null
  const previewHtml = useMemo(() => renderMarkdown(activeTab?.content ?? ''), [activeTab?.content])
  const isDarkTheme = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  const isContentEmpty = !activeTab?.content || activeTab.content.trim() === ''

  useTheme()
  useKeyboardShortcuts(editorRef)
  useAutoSave(activeTab?.id ?? null, activeTab?.path ?? null, activeTab?.isDirty ? activeTab.content : null)

  useEffect(() => {
    async function bootstrap(): Promise<void> {
      const env = getEnvInfo()

      try {
        const config = await getAppConfig()
        if (config.theme) {
          setTheme(config.theme)
        }
        if (config.lastWorkspace && env.isTauri) {
          const nodes = await readDirTree(config.lastWorkspace)
          setWorkspace(config.lastWorkspace)
          setFileTree(nodes)
        }

        if (env.isBrowser) {
          pushToast({
            id: nanoid(),
            title: 'MarkFlow 网页版 - 使用 File System Access API',
            variant: 'info'
          })
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        pushToast({ id: nanoid(), title: `初始化失败：${message}`, variant: 'error' })
      }
    }

    void bootstrap()
  }, [pushToast, setFileTree, setTheme, setWorkspace])

  async function handlePickWorkspace(): Promise<void> {
    try {
      const result = await pickWorkspace()
      if (!result) {
        return
      }
      const { path, nodes } = result
      setWorkspace(path)
      setFileTree(nodes)

      await getAppConfig().then(config => {
        return import('@/utils/configAdapter').then(m => m.saveAppConfig({ ...config, lastWorkspace: path }))
      })

      pushToast({ id: nanoid(), title: '工作区已加载', variant: 'success' })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      pushToast({ id: nanoid(), title: `加载工作区失败：${message}`, variant: 'error' })
    }
  }

  async function handlePickFile(): Promise<void> {
    try {
      const result = await pickFile()
      if (!result) {
        return
      }
      const { path, content, title } = result
      openTab({ path, title, content })
      pushToast({ id: nanoid(), title: '文件已打开', variant: 'success' })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      pushToast({ id: nanoid(), title: `打开文件失败：${message}`, variant: 'error' })
    }
  }

  async function handleOpenFile(path: string): Promise<void> {
    try {
      const content = await readFile(path)
      const title = path.split(/[/\\]/).at(-1) ?? path
      openTab({ path, title, content })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      pushToast({ id: nanoid(), title: `打开文件失败：${message}`, variant: 'error' })
    }
  }

  async function handleExport(config: ExportConfig): Promise<void> {
    if (!activeTab) {
      pushToast({ id: nanoid(), title: '没有可导出的文件', variant: 'info' })
      return
    }

    try {
      await exportDocument(activeTab.content, previewHtml, config)
      pushToast({ id: nanoid(), title: '导出成功', variant: 'success' })
      setExportDialogOpen(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (message !== 'AbortError' && !message.includes('取消')) {
        pushToast({ id: nanoid(), title: `导出失败：${message}`, variant: 'error' })
      }
    }
  }

  async function handleSave(): Promise<void> {
    if (!activeTab || !activeTab.path) {
      pushToast({ id: nanoid(), title: '没有可保存的文件', variant: 'info' })
      return
    }

    try {
      await writeFile(activeTab.path, activeTab.content)
      markTabSaved(activeTab.id, activeTab.content)
      pushToast({ id: nanoid(), title: '已保存 ✓', variant: 'success' })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      pushToast({ id: nanoid(), title: `保存失败：${message}`, variant: 'error' })
    }
  }

  function handleCloseTab(tabId: string): void {
    const tab = openedTabs.find((t) => t.id === tabId)
    if (tab?.isDirty) {
      setCloseConfirmTabId(tabId)
    } else {
      closeTab(tabId)
    }
  }

  function confirmCloseTab(): void {
    if (closeConfirmTabId) {
      closeTab(closeConfirmTabId)
      setCloseConfirmTabId(null)
    }
  }

  function cancelCloseTab(): void {
    setCloseConfirmTabId(null)
  }

  async function handleRefreshFileTree(): Promise<void> {
    if (!workspace) {
      return
    }
    try {
      const nodes = await readDirTree(workspace)
      setFileTree(nodes)
      pushToast({ id: nanoid(), title: '文件树已刷新', variant: 'success' })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      pushToast({ id: nanoid(), title: `刷新失败：${message}`, variant: 'error' })
    }
  }

  async function handleCreateFile(parentPath: string): Promise<void> {
    const fileName = window.prompt('输入文件名（如：note.md）')
    if (!fileName) {
      return
    }
    const newPath = parentPath.endsWith('/') ? `${parentPath}${fileName}` : `${parentPath}/${fileName}`

    try {
      await createFile(newPath)
      await handleRefreshFileTree()
      await handleOpenFile(newPath)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      pushToast({ id: nanoid(), title: `创建文件失败：${message}`, variant: 'error' })
    }
  }

  async function handleCreateFolder(parentPath: string): Promise<void> {
    const folderName = window.prompt('输入文件夹名')
    if (!folderName) {
      return
    }
    const newPath = parentPath.endsWith('/') ? `${parentPath}${folderName}` : `${parentPath}/${folderName}`

    try {
      await createDir(newPath)
      await handleRefreshFileTree()
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      pushToast({ id: nanoid(), title: `创建文件夹失败：${message}`, variant: 'error' })
    }
  }

  async function handleRename(oldPath: string, newName: string): Promise<void> {
    const pathParts = oldPath.split(/[/\\]/)
    pathParts[pathParts.length - 1] = newName
    const newPath = pathParts.join('/')

    if (oldPath === newPath) {
      return
    }

    try {
      await renamePath(oldPath, newPath)
      await handleRefreshFileTree()

      const renamedTab = openedTabs.find((tab) => tab.path === oldPath)
      if (renamedTab) {
        closeTab(renamedTab.id)
        openTab({ path: newPath, title: newName, content: renamedTab.content })
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      pushToast({ id: nanoid(), title: `重命名失败：${message}`, variant: 'error' })
    }
  }

  async function handleDelete(path: string): Promise<void> {
    try {
      await deletePath(path)
      await handleRefreshFileTree()

      const deletedTab = openedTabs.find((tab) => tab.path === path)
      if (deletedTab) {
        closeTab(deletedTab.id)
      }

      const affectedTabs = openedTabs.filter((tab) => tab.path.startsWith(path + '/'))
      affectedTabs.forEach((tab) => closeTab(tab.id))

      pushToast({ id: nanoid(), title: '已删除', variant: 'success' })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      pushToast({ id: nanoid(), title: `删除失败：${message}`, variant: 'error' })
    }
  }

  async function handleCopyPath(path: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(path)
      pushToast({ id: nanoid(), title: '路径已复制到剪贴板', variant: 'success' })
    } catch {
      pushToast({ id: nanoid(), title: '复制失败', variant: 'error' })
    }
  }

  const handleOpenFileCallback = useCallback((path: string) => {
    void handleOpenFile(path)
  }, [])

  const handlePickWorkspaceCallback = useCallback(() => {
    void handlePickWorkspace()
  }, [])

  const handlePickFileCallback = useCallback(() => {
    void handlePickFile()
  }, [])

  const handleRefreshFileTreeCallback = useCallback(() => {
    void handleRefreshFileTree()
  }, [])

  const handleCreateFileCallback = useCallback((path: string) => {
    void handleCreateFile(path)
  }, [])

  const handleCreateFolderCallback = useCallback((path: string) => {
    void handleCreateFolder(path)
  }, [])

  const handleRenameCallback = useCallback((path: string, name: string) => {
    void handleRename(path, name)
  }, [])

  const handleDeleteCallback = useCallback((path: string) => {
    void handleDelete(path)
  }, [])

  const handleCopyPathCallback = useCallback((path: string) => {
    void handleCopyPath(path)
  }, [])

  // 主题切换
  const handleToggleTheme = useCallback(() => {
    setTheme(isDarkTheme ? 'light' : 'dark')
  }, [isDarkTheme, setTheme])

  // 侧边栏切换
  const handleToggleSidebar = useCallback(() => {
    toggleSidebar?.()
  }, [toggleSidebar])

  return (
    <div className="flex h-full flex-col bg-stone-50 text-foreground">
      {/* 顶部 Header */}
      <Header
        workspace={workspace}
        activeFilePath={activeTab?.path ?? null}
        isDarkTheme={isDarkTheme}
        onToggleTheme={handleToggleTheme}
        sidebarVisible={sidebarVisible}
        onToggleSidebar={handleToggleSidebar}
      />

      {/* 主内容卡片 */}
      <div className="m-2 flex flex-1 flex-col overflow-hidden rounded-xl border border-[0.5px] border-slate-200/80 bg-white shadow-sm dark:border-slate-700/50 dark:bg-slate-900">
        {/* 标签栏 */}
        <TabBar
          activeTabId={activeTabId}
          onCloseTab={handleCloseTab}
          onSelectTab={setActiveTab}
          tabs={openedTabs}
        />

        {/* 三栏布局 */}
        <Layout
          sidebarVisible={sidebarVisible}
          viewMode={viewMode}
          toolbar={
            <EditorToolbar
              onChangeViewMode={setViewMode}
              onCompile={() => setExportDialogOpen(true)}
              onExecuteCommand={handleCommandExecute}
              viewMode={viewMode}
            />
          }
          sidebar={
            <>
              <SidebarHeader
                onRefreshFileTree={handleRefreshFileTreeCallback}
                onCreateFile={handleCreateFileCallback}
                onCreateFolder={handleCreateFolderCallback}
                workspace={workspace}
              />
              <div className="min-h-0 flex-1 overflow-hidden">
                <Sidebar
                  activePath={activeTab?.path ?? null}
                  nodes={fileTree}
                  onOpenFile={handleOpenFileCallback}
                  onPickWorkspace={handlePickWorkspaceCallback}
                  onPickFile={handlePickFileCallback}
                  onRefreshFileTree={handleRefreshFileTreeCallback}
                  onCreateFile={handleCreateFileCallback}
                  onCreateFolder={handleCreateFolderCallback}
                  onRename={handleRenameCallback}
                  onDelete={handleDeleteCallback}
                  onCopyPath={handleCopyPathCallback}
                  visible={true}
                  workspace={workspace}
                  isDarkMode={true}
                />
              </div>
            </>
          }
          editor={
            <div className="flex-1 overflow-hidden">
              <MarkdownEditor
                key={activeTab?.id}
                ref={editorRef}
                onChange={useCallback((content: string) => {
                  if (activeTabId) {
                    updateTabContent(activeTabId, content)
                  }
                }, [activeTabId, updateTabContent])}
                onSave={() => {
                  void handleSave()
                }}
                theme={isDarkTheme ? 'dark' : 'light'}
                value={activeTab?.content ?? ''}
              />
            </div>
          }
          preview={
            <MarkdownPreview html={previewHtml} isEmpty={isContentEmpty} />
          }
          statusBar={
            <StatusBar
              content={activeTab?.content ?? ''}
              lineCount={(activeTab?.content ?? '').split('\n').length}
            />
          }
        />
      </div>

      <ExportDialog
        onClose={() => setExportDialogOpen(false)}
        onConfirm={async (config) => {
          await handleExport(config)
        }}
        open={exportDialogOpen}
      />

      {/* 未保存标签确认对话框 */}
      <Dialog
        open={showCloseConfirm}
        title="未保存的更改"
        description={`确定要关闭 "${openedTabs.find((t) => t.id === closeConfirmTabId)?.title ?? '文件'}" 吗？未保存的更改将丢失。`}
        onClose={cancelCloseTab}
      >
        <div className="flex justify-end gap-2">
          <button
            className="rounded-md px-4 py-2 text-sm hover:bg-accent"
            onClick={cancelCloseTab}
            type="button"
          >
            取消
          </button>
          <button
            className="rounded-md bg-destructive px-4 py-2 text-sm text-destructive-foreground hover:bg-destructive/90"
            onClick={confirmCloseTab}
            type="button"
          >
            不保存，关闭
          </button>
        </div>
      </Dialog>

      <ToastViewport />
    </div>
  )
}

export default App
