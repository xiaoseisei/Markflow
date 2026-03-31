import { memo } from 'react'
import { Tab } from '@/components/Tabs/Tab'
import type { OpenedTab } from '@/types'

interface TabBarProps {
  tabs: OpenedTab[]
  activeTabId: string | null
  onSelectTab: (tabId: string) => void
  onCloseTab: (tabId: string) => void
  onNewTab?: () => void
}

export const TabBar = memo(function TabBar({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
}: TabBarProps) {
  return (
    <div className="flex h-9 min-h-9 items-stretch overflow-auto bg-slate-50 dark:bg-slate-800/50">
      {tabs.map((tab) => (
        <Tab
          isActive={tab.id === activeTabId}
          key={tab.id}
          onClick={() => onSelectTab(tab.id)}
          onClose={() => onCloseTab(tab.id)}
          tab={tab}
        />
      ))}
    </div>
  )
})
