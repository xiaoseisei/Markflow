import { memo } from 'react'
import { Tab } from '@/components/Tabs/Tab'
import type { OpenedTab } from '@/types'

interface TabBarProps {
  tabs: OpenedTab[]
  activeTabId: string | null
  onSelectTab: (tabId: string) => void
  onCloseTab: (tabId: string) => void
}

export const TabBar = memo(function TabBar({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
}: TabBarProps) {
  return (
    <div className="flex min-h-11 items-stretch overflow-auto border-b border-border bg-muted/50">
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
