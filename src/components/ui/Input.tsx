import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  error?: string
  hint?: string
  icon?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, icon, className, id, ...props },
  ref,
) {
  const inputId = id ?? props.name

  return (
    <label className="block space-y-2 text-sm font-semibold text-[var(--color-text)]">
      {label ? <span>{label}</span> : null}
      <span
        className={cn(
          'flex min-h-11 items-center gap-3 rounded-[var(--radius-sm)] border bg-white px-3 transition duration-200',
          error
            ? 'border-rose-300 focus-within:border-rose-500 focus-within:shadow-[0_0_0_4px_rgba(225,29,72,0.12)]'
            : 'border-[var(--color-border)] focus-within:border-[var(--color-primary)] focus-within:shadow-[0_0_0_3px_rgba(45,106,79,0.12)]',
        )}
      >
        {icon ? <span className="text-[var(--color-muted)]">{icon}</span> : null}
        <input
          className={cn(
            'w-full min-w-0 border-0 bg-transparent py-2.5 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-muted)]/60 disabled:text-[var(--color-muted)]/50',
            className,
          )}
          id={inputId}
          ref={ref}
          {...props}
        />
      </span>
      {error ? (
        <span className="block text-xs font-medium text-[var(--color-error-text)]">
          {error}
        </span>
      ) : hint ? (
        <span className="block text-xs font-medium text-[var(--color-muted)]">{hint}</span>
      ) : null}
    </label>
  )
})
