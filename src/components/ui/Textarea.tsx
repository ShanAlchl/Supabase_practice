import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string
  error?: string
  hint?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ label, error, hint, className, id, ...props }, ref) {
    const inputId = id ?? props.name

    return (
      <label className="block space-y-2 text-sm font-semibold text-[var(--color-text)]">
        {label ? <span>{label}</span> : null}
        <textarea
          className={cn(
            'focus-ring w-full resize-none rounded-[var(--radius-sm)] border bg-white px-3 py-3 text-sm leading-6 text-[var(--color-text)] outline-none transition duration-200 placeholder:text-[var(--color-muted)]/60 disabled:text-[var(--color-muted)]/50',
            error
              ? 'border-rose-300 focus:border-rose-500 focus:shadow-[0_0_0_4px_rgba(225,29,72,0.12)]'
              : 'border-[var(--color-border)] focus:border-[var(--color-primary)] focus:shadow-[0_0_0_3px_rgba(45,106,79,0.12)]',
            className,
          )}
          id={inputId}
          ref={ref}
          {...props}
        />
        {error ? (
          <span className="block text-xs font-medium text-[var(--color-error-text)]">
            {error}
          </span>
        ) : hint ? (
          <span className="block text-xs font-medium text-[var(--color-muted)]">{hint}</span>
        ) : null}
      </label>
    )
  },
)
