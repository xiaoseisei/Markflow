import { useEffect } from 'react'
import { useAppStore } from '@/store/appStore'

export function useTheme(): void {
  const theme = useAppStore((state) => state.theme)

  useEffect(() => {
    const root = document.documentElement
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const isDark = theme === 'dark' || (theme === 'system' && systemPrefersDark)
    root.classList.toggle('dark', isDark)
  }, [theme])
}
