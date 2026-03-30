import { memo, useEffect, type ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface DialogProps {
  open: boolean
  title: string
  description?: string
  onClose: () => void
  children: ReactNode
}

export const Dialog = memo(function Dialog({
  open,
  title,
  description,
  onClose,
  children,
}: DialogProps) {
  useEffect(() => {
    if (!open) {
      return
    }

    function handleEscape(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose, open])

  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="absolute inset-0" onClick={onClose} />
      <div
        aria-describedby={description ? 'dialog-description' : undefined}
        aria-modal="true"
        aria-labelledby="dialog-title"
        className={cn(
          'relative z-10 w-full max-w-lg rounded-lg border border-border bg-card p-6 text-card-foreground shadow-xl',
        )}
        role="dialog"
      >
        <div className="mb-4 space-y-1">
          <h2 className="text-lg font-semibold" id="dialog-title">
            {title}
          </h2>
          {description ? (
            <p className="text-sm text-muted-foreground" id="dialog-description">
              {description}
            </p>
          ) : null}
        </div>
        {children}
      </div>
    </div>
  )
})
