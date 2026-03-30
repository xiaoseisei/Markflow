import { useEffect, useMemo, useRef, useState } from 'react'
import { nanoid } from 'nanoid'
import { Sidebar } from '@/components/Sidebar'
import { EditorToolbar, MarkdownEditor, type MarkdownEditorRef } from '@/components/Editor'
import { ExportDialog } from '@/components/Export'
import { MarkdownPreview } from '@/components/Preview'
import { TabBar } from '@/components/Tabs'
import { Dialog, ToastViewport } from '@/components/ui'
import { useAutoSave } from '@/hooks/useAutoSave'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useTheme } from '@/hooks/useTheme'
import { useAppStore } from '@/store/appStore'
import { useUiStore } from '@/store/uiStore'
import { exportDocument } from '@/utils/export'
import { renderMarkdown } from '@/utils/markdown'
import type { EditorCommand } from '@/utils/editorCommands'
import { getAppConfig } from '@/utils/configAdapter'
import { pickFile, pickWorkspace, readFile, writeFile, createFile, createDir, renamePath, deletePath, readDirTree } from '@/utils/fsAdapter'
import { getEnvInfo } from '@/utils/env'

function App(): JSX.Element {
  // 确认对话框状态
  const [closeConfirmTabId, setCloseConfirmTabId] = useState<string | null>(null)
  const showCloseConfirm = closeConfirmTabId !== null

  // 【新增】编辑器引用，用于执行格式化命令
  const editorRef = useRef<MarkdownEditorRef>(null)

  /**
   * 【新增】处理编辑器命令执行
   * @param command - 要执行的编辑器命令
   */
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
  const exportDialogOpen = useUiStore((state) => state.exportDialogOpen)
  const setExportDialogOpen = useUiStore((state) => state.setExportDialogOpen)
  const pushToast = useUiStore((state) => state.pushToast)

  const activeTab = openedTabs.find((tab) => tab.id === activeTabId) ?? null
  const previewHtml = useMemo(() => renderMarkdown(activeTab?.content ?? '# 欢迎使用 MarkFlow'), [activeTab?.content])
  const isDarkTheme = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  useTheme()
  useKeyboardShortcuts()
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
          // 只在 Tauri 环境自动恢复工作区
          const nodes = await readDirTree(config.lastWorkspace)
          setWorkspace(config.lastWorkspace)
          setFileTree(nodes)
        }

        // 根据环境显示欢迎信息
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
        return // 用户取消
      }
      const { path, nodes } = result
      setWorkspace(path)
      setFileTree(nodes)

      // 保存配置
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
        return // 用户取消
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

  /**
   * 导出文档
   * - 支持多种格式：PDF、HTML、Markdown
   */
  async function handleExport(config: { format: 'pdf' | 'html' | 'markdown'; paperSize: string; orientation: string; cssTheme: string }): Promise<void> {
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
      // 用户取消不算错误
      if (message !== 'AbortError' && !message.includes('取消')) {
        pushToast({ id: nanoid(), title: `导出失败：${message}`, variant: 'error' })
      }
    }
  }

  /**
   * 手动保存当前文件
   * - 快捷键：Ctrl+S / Cmd+S
   * - 保存成功后显示 Toast 提示
   */
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

  /**
   * 处理关闭标签
   * - 如果标签有未保存更改，显示确认对话框
   * - 否则直接关闭
   */
  function handleCloseTab(tabId: string): void {
    const tab = openedTabs.find((t) => t.id === tabId)
    if (tab?.isDirty) {
      setCloseConfirmTabId(tabId)
    } else {
      closeTab(tabId)
    }
  }

  /**
   * 确认关闭未保存的标签
   */
  function confirmCloseTab(): void {
    if (closeConfirmTabId) {
      closeTab(closeConfirmTabId)
      setCloseConfirmTabId(null)
    }
  }

  /**
   * 取消关闭未保存的标签
   */
  function cancelCloseTab(): void {
    setCloseConfirmTabId(null)
  }

  /**
   * 刷新文件树
   */
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

  /**
   * 创建新文件
   */
  async function handleCreateFile(parentPath: string): Promise<void> {
    const fileName = window.prompt('输入文件名（如：note.md）')
    if (!fileName) {
      return
    }
    const newPath = parentPath.endsWith('/') ? `${parentPath}${fileName}` : `${parentPath}/${fileName}`

    try {
      await createFile(newPath)
      await handleRefreshFileTree()
      // 自动打开新创建的文件
      await handleOpenFile(newPath)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      pushToast({ id: nanoid(), title: `创建文件失败：${message}`, variant: 'error' })
    }
  }

  /**
   * 创建新文件夹
   */
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

  /**
   * 重命名文件或文件夹
   */
  async function handleRename(oldPath: string, newName: string): Promise<void> {
    // 构建新路径
    const pathParts = oldPath.split(/[/\\]/)
    pathParts[pathParts.length - 1] = newName
    const newPath = pathParts.join('/')

    if (oldPath === newPath) {
      return
    }

    try {
      await renamePath(oldPath, newPath)
      await handleRefreshFileTree()

      // 如果重命名的是当前打开的文件，更新标签
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

  /**
   * 删除文件或文件夹
   */
  async function handleDelete(path: string): Promise<void> {
    try {
      await deletePath(path)
      await handleRefreshFileTree()

      // 关闭被删除文件的标签
      const deletedTab = openedTabs.find((tab) => tab.path === path)
      if (deletedTab) {
        closeTab(deletedTab.id)
      }

      // 检查是否有子文件被删除（对于文件夹）
      const affectedTabs = openedTabs.filter((tab) => tab.path.startsWith(path + '/'))
      affectedTabs.forEach((tab) => closeTab(tab.id))

      pushToast({ id: nanoid(), title: '已删除', variant: 'success' })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      pushToast({ id: nanoid(), title: `删除失败：${message}`, variant: 'error' })
    }
  }

  /**
   * 复制路径到剪贴板
   */
  async function handleCopyPath(path: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(path)
      pushToast({ id: nanoid(), title: '路径已复制到剪贴板', variant: 'success' })
    } catch {
      pushToast({ id: nanoid(), title: '复制失败', variant: 'error' })
    }
  }

  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <h1 className="text-lg font-semibold">MarkFlow</h1>
          <p className="text-xs text-muted-foreground">
            {getEnvInfo().isTauri ? '桌面版' : '网页版 (File System Access API)'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="rounded-md border border-border px-3 py-2 text-sm"
            onClick={() => setTheme(isDarkTheme ? 'light' : 'dark')}
            type="button"
          >
            {isDarkTheme ? '切换到亮色' : '切换到暗色'}
          </button>
        </div>
      </header>

      <TabBar
        activeTabId={activeTabId}
        onCloseTab={handleCloseTab}
        onSelectTab={setActiveTab}
        tabs={openedTabs}
      />

      <div className="flex min-h-0 flex-1">
        <Sidebar
          activePath={activeTab?.path ?? null}
          nodes={fileTree}
          onOpenFile={(path) => {
            void handleOpenFile(path)
          }}
          onPickWorkspace={() => {
            void handlePickWorkspace()
          }}
          onPickFile={() => {
            void handlePickFile()
          }}
          onRefreshFileTree={() => {
            void handleRefreshFileTree()
          }}
          onCreateFile={(path) => {
            void handleCreateFile(path)
          }}
          onCreateFolder={(path) => {
            void handleCreateFolder(path)
          }}
          onRename={(path, name) => {
            void handleRename(path, name)
          }}
          onDelete={(path) => {
            void handleDelete(path)
          }}
          onCopyPath={(path) => {
            void handleCopyPath(path)
          }}
          visible={sidebarVisible}
          workspace={workspace}
        />

        <main className="flex min-h-0 flex-1 flex-col">
          <EditorToolbar
            onChangeViewMode={setViewMode}
            onOpenExport={() => setExportDialogOpen(true)}
            onExecuteCommand={handleCommandExecute}
            viewMode={viewMode}
          />
          <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden md:grid-cols-2">
            {viewMode !== 'preview' ? (
              <section className="min-h-0 border-r border-border">
                <MarkdownEditor
                  ref={editorRef}
                  onChange={(content) => {
                    if (activeTab) {
                      updateTabContent(activeTab.id, content)
                    }
                  }}
                  onSave={() => {
                    void handleSave()
                  }}
                  theme={isDarkTheme ? 'dark' : 'light'}
                  value={activeTab?.content ?? '# 选择一个 Markdown 文件开始编辑'}
                />
              </section>
            ) : null}
            {viewMode !== 'editor' ? (
              <section className="min-h-0 overflow-hidden">
                <MarkdownPreview html={previewHtml} />
              </section>
            ) : null}
          </div>
        </main>
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
