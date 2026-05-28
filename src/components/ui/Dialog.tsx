import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../lib/cn'
import { Button } from './Button'
import { Card } from './Card'

type DialogProps = {
  open: boolean
  children: ReactNode
  onClose: () => void
  className?: string
  title?: string
  description?: string
}

export function Dialog({
  open,
  children,
  onClose,
  className,
  title,
  description,
}: DialogProps) {
  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/30 p-4 backdrop-blur-sm">
      <Card
        aria-modal="true"
        className={cn(
          'animate-dialog-enter relative max-h-[calc(100svh-2rem)] w-full max-w-md overflow-auto rounded-[var(--radius-lg)] p-6',
          className,
        )}
        role="dialog"
      >
        <Button
          aria-label="关闭弹窗"
          className="absolute right-4 top-4 z-10"
          onClick={onClose}
          size="icon"
          variant="ghost"
        >
          <X size={18} />
        </Button>

        {title || description ? (
          <div className="mb-4 pr-10">
            {title ? (
              <h2 className="text-base font-semibold text-[var(--color-text)]">{title}</h2>
            ) : null}
            {description ? (
              <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">{description}</p>
            ) : null}
          </div>
        ) : null}

        {children}
      </Card>
    </div>
  )
}
