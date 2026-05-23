import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../lib/cn'
import { Button } from './Button'
import { Card } from './Card'

type DialogProps = {
  open: boolean
  title: string
  children: ReactNode
  onClose: () => void
  className?: string
  description?: string
}

export function Dialog({
  open,
  title,
  children,
  onClose,
  className,
  description,
}: DialogProps) {
  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4">
      <Card
        aria-modal="true"
        className={cn('max-h-[calc(100svh-2rem)] w-full max-w-md overflow-auto p-5', className)}
        role="dialog"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-[var(--color-text)]">{title}</h2>
            {description ? (
              <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
                {description}
              </p>
            ) : null}
          </div>
          <Button aria-label="关闭弹窗" onClick={onClose} size="icon" variant="ghost">
            <X size={18} />
          </Button>
        </div>
        {children}
      </Card>
    </div>
  )
}
