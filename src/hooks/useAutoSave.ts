import { useEffect, useRef } from 'react'
import { nanoid } from 'nanoid'
import { useAppStore } from '@/store/appStore'
import { useUiStore } from '@/store/uiStore'
import { writeFile } from '@/utils/fsAdapter'

/**
 * 自动保存 Hook
 * - 编辑停止后 500ms 触发保存
 * - 保存成功后更新标签状态
 * - 保存失败显示错误提示
 */
const DEBOUNCE_DELAY = 500

export function useAutoSave(tabId: string | null, path: string | null, content: string | null): void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const markTabSaved = useAppStore((state) => state.markTabSaved)
  const pushToast = useUiStore((state) => state.pushToast)

  useEffect(() => {
    // 没有活动标签、路径或内容时不执行自动保存
    if (!tabId || !path || content === null) {
      return
    }

    // 清除之前的定时器（防抖）
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    // 设置新的定时器
    timerRef.current = setTimeout(async () => {
      try {
        await writeFile(path, content)
        markTabSaved(tabId, content)
        // 自动保存成功不显示提示（避免干扰用户）
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        pushToast({
          id: nanoid(),
          title: `自动保存失败：${message}`,
          variant: 'error',
        })
      }
    }, DEBOUNCE_DELAY)

    // 清理函数：组件卸载或依赖变化时清除定时器
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [content, markTabSaved, path, pushToast, tabId])
}
