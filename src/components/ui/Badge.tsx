import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'

type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger'

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode
  tone?: BadgeTone
}

const toneClass: Record<BadgeTone, string> = {
  neutral: 'bg-[var(--color-surface)] text-[var(--color-muted)]',
  primary: 'bg-[var(--color-primary-light)] text-[var(--color-primary)]',
  success: 'bg-[var(--color-success-bg)] text-[var(--color-success-text)]',
  warning: 'bg-orange-50 text-orange-700',
  danger: 'bg-[var(--color-error-bg)] text-[var(--color-error-text)]',
}

export function Badge({ children, className, tone = 'neutral', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold',
        toneClass[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}
