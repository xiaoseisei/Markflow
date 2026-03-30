import { memo, useEffect, useRef } from 'react'
import { cn } from '@/utils/cn'

export interface ContextMenuPosition {
  x: number
  y: number
}

export interface ContextMenuItem {
  key: string
  label: string
  icon?: string
  action: () => void
  disabled?: boolean
  variant?: 'default' | 'destructive'
}

interface FileContextMenuProps {
  position: ContextMenuPosition | null
  items: ContextMenuItem[]
  onClose: () => void
}

export const FileContextMenu = memo(function FileContextMenu(props: FileContextMenuProps) {
  const { position, items, onClose } = props
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!position) {
      return
    }

    function handleClickOutside(event: MouseEvent): void {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    function handleEscape(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [position, onClose])

  if (!position) {
    return null
  }

  const posX = Math.min(position.x, window.innerWidth - 200)
  const posY = Math.min(position.y, window.innerHeight - 300)
  const menuStyle = {
    left: posX + 'px',
    top: posY + 'px',
  }

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[180px] rounded-md border border-border bg-card p-1 shadow-lg"
      style={menuStyle}
      role="menu"
    >
      {items.map((item) => (
        <button
          key={item.key}
          className={cn(
            'flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-sm transition-colors',
            'hover:bg-accent hover:text-accent-foreground',
            'focus:bg-accent focus:text-accent-foreground',
            item.disabled && 'pointer-events-none opacity-50',
            item.variant === 'destructive' && 'text-destructive hover:bg-destructive/10',
          )}
          disabled={item.disabled}
          onClick={() => {
            item.action()
            onClose()
          }}
          role="menuitem"
          type="button"
        >
          {item.icon && <span className="text-base">{item.icon}</span>}
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  )
})
