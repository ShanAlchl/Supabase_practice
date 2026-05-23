import type { ReactNode } from 'react'
import { Button } from './Button'

type DrawerProps = {
  open: boolean
  title: string
  children: ReactNode
  onClose: () => void
}

export function Drawer({ open, title, children, onClose }: DrawerProps) {
  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-slate-950/35 lg:hidden">
      <section
        aria-modal="true"
        className="max-h-[86svh] w-full overflow-auto rounded-t-[16px] bg-white p-5 shadow-[var(--shadow-elevated)]"
        role="dialog"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-[var(--color-text)]">{title}</h2>
          <Button aria-label="关闭抽屉" onClick={onClose} size="sm" variant="ghost">
            关闭
          </Button>
        </div>
        {children}
      </section>
    </div>
  )
}
