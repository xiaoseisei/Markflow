import { memo, useEffect } from 'react'
import { useUiStore } from '@/store/uiStore'
import { cn } from '@/utils/cn'

const variantClassMap = {
  success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100',
  error: 'border-red-500/30 bg-red-500/10 text-red-100',
  info: 'border-sky-500/30 bg-sky-500/10 text-sky-100',
} as const

export const ToastViewport = memo(function ToastViewport() {
  const toasts = useUiStore((state) => state.toasts)
  const removeToast = useUiStore((state) => state.removeToast)

  useEffect(() => {
    if (toasts.length === 0) {
      return
    }

    const timers = toasts.map((toast) =>
      window.setTimeout(() => {
        removeToast(toast.id)
      }, toast.variant === 'error' ? 5000 : 2000),
    )

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer))
    }
  }, [removeToast, toasts])

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2">
      {toasts.map((toast) => (
        <div
          className={cn(
            'pointer-events-auto rounded-lg border px-4 py-3 text-sm shadow-lg backdrop-blur',
            variantClassMap[toast.variant],
          )}
          key={toast.id}
        >
          {toast.title}
        </div>
      ))}
    </div>
  )
})
