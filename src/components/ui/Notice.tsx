import { AlertCircle, CheckCircle2, Info } from 'lucide-react'
import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'

type NoticeTone = 'info' | 'success' | 'error'

type NoticeProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
  title?: string
  tone?: NoticeTone
}

const toneClass: Record<NoticeTone, string> = {
  info: 'border-teal-200 bg-[var(--color-soft)] text-[var(--color-primary-hover)]',
  success: 'border-emerald-200 bg-[var(--color-success-bg)] text-[var(--color-success-text)]',
  error: 'border-rose-200 bg-[var(--color-error-bg)] text-[var(--color-error-text)]',
}

const iconMap = {
  info: Info,
  success: CheckCircle2,
  error: AlertCircle,
}

export function Notice({
  children,
  className,
  title,
  tone = 'info',
  ...props
}: NoticeProps) {
  const Icon = iconMap[tone]

  return (
    <div
      className={cn(
        'flex gap-3 rounded-[8px] border px-4 py-3 text-sm leading-6',
        toneClass[tone],
        className,
      )}
      {...props}
    >
      <Icon className="mt-0.5 shrink-0" size={18} />
      <div className="min-w-0">
        {title ? <p className="font-semibold">{title}</p> : null}
        <div className={title ? 'mt-0.5' : ''}>{children}</div>
      </div>
    </div>
  )
}
