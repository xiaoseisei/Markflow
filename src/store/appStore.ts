import { create } from 'zustand'
import { nanoid } from 'nanoid'
import {
  DEFAULT_CODE_THEME,
  DEFAULT_FONT_FAMILY,
  DEFAULT_FONT_SIZE,
  DEFAULT_LINE_HEIGHT,
  DEFAULT_WORD_WRAP,
} from '@/constants/editor'
import type { AppState, FileNode, OpenedTab, ThemeMode, ViewMode } from '@/types'

interface AppActions {
  setWorkspace: (workspace: string | null) => void
  setFileTree: (nodes: FileNode[]) => void
  openTab: (payload: { path: string; title: string; content: string }) => void
  closeTab: (tabId: string) => void
  setActiveTab: (tabId: string) => void
  updateTabContent: (tabId: string, content: string) => void
  markTabSaved: (tabId: string, savedContent: string) => void
  setViewMode: (viewMode: ViewMode) => void
  toggleSidebar: () => void
  setTheme: (theme: ThemeMode) => void
  setSidebarWidth: (width: number) => void
}

type AppStore = AppState & AppActions

const initialState: AppState = {
  workspace: null,
  fileTree: [],
  openedTabs: [],
  activeTabId: null,
  viewMode: 'split',
  sidebarVisible: true,
  sidebarWidth: 240,
  theme: 'system',
  codeTheme: DEFAULT_CODE_THEME,
  fontSize: DEFAULT_FONT_SIZE,
  fontFamily: DEFAULT_FONT_FAMILY,
  lineHeight: DEFAULT_LINE_HEIGHT,
  wordWrap: DEFAULT_WORD_WRAP,
}

function createTab(path: string, title: string, content: string): OpenedTab {
  return {
    id: nanoid(),
    path,
    title,
    content,
    savedContent: content,
    cursorPos: 0,
    scrollTop: 0,
    isDirty: false,
    language: 'markdown',
  }
}

export const useAppStore = create<AppStore>((set) => ({
  ...initialState,
  setWorkspace: (workspace) => set({ workspace }),
  setFileTree: (fileTree) => set({ fileTree }),
  openTab: ({ path, title, content }) =>
    set((state) => {
      const existingTab = state.openedTabs.find((tab) => tab.path === path)
      if (existingTab) {
        return { activeTabId: existingTab.id }
      }

      const nextTab = createTab(path, title, content)
      return {
        openedTabs: [...state.openedTabs, nextTab],
        activeTabId: nextTab.id,
      }
    }),
  closeTab: (tabId) =>
    set((state) => {
      const nextTabs = state.openedTabs.filter((tab) => tab.id !== tabId)
      const nextActiveTabId =
        state.activeTabId === tabId
          ? nextTabs.at(-1)?.id ?? null
          : state.activeTabId

      return {
        openedTabs: nextTabs,
        activeTabId: nextActiveTabId,
      }
    }),
  setActiveTab: (tabId) => set({ activeTabId: tabId }),
  updateTabContent: (tabId, content) =>
    set((state) => ({
      openedTabs: state.openedTabs.map((tab) =>
        tab.id === tabId
          ? {
              ...tab,
              content,
              isDirty: tab.savedContent !== content,
            }
          : tab,
      ),
    })),
  markTabSaved: (tabId, savedContent) =>
    set((state) => ({
      openedTabs: state.openedTabs.map((tab) =>
        tab.id === tabId
          ? {
              ...tab,
              savedContent,
              content: savedContent,
              isDirty: false,
            }
          : tab,
      ),
    })),
  setViewMode: (viewMode) => set({ viewMode }),
  toggleSidebar: () => set((state) => ({ sidebarVisible: !state.sidebarVisible })),
  setTheme: (theme) => set({ theme }),
  setSidebarWidth: (sidebarWidth) => set({ sidebarWidth }),
}))
