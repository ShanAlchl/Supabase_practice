import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'

type ButtonVariant = 'primary' | 'secondary' | 'cta' | 'ghost' | 'subtle' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
}

const variantClass: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] active:bg-[var(--color-primary-hover)] disabled:bg-[var(--color-primary)]/45',
  secondary:
    'bg-[var(--color-primary-light)] text-[var(--color-primary)] hover:bg-[#b7e4c7] active:bg-[#b7e4c7] disabled:text-[var(--color-primary)]/45',
  cta:
    'bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] active:bg-[var(--color-accent-hover)] disabled:bg-[var(--color-accent)]/45',
  ghost:
    'bg-transparent text-[var(--color-muted)] hover:bg-[var(--color-surface)] active:bg-[var(--color-border-light)] disabled:text-[var(--color-muted)]/50',
  subtle:
    'border border-[var(--color-border)] bg-white text-[var(--color-text)] hover:bg-[var(--color-surface)] active:bg-[var(--color-border-light)] disabled:text-[var(--color-muted)]/50',
  danger:
    'bg-[var(--color-error-bg)] text-[var(--color-error-text)] hover:bg-rose-100 active:bg-rose-100 disabled:text-rose-300',
}

const sizeClass: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm rounded-[var(--radius-sm)]',
  md: 'h-10 px-4 text-sm rounded-[var(--radius-sm)]',
  lg: 'h-12 px-5 text-base rounded-[var(--radius-md)]',
  icon: 'h-10 w-10 p-0 rounded-[var(--radius-sm)]',
}

export function Button({
  children,
  className,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'focus-ring inline-flex shrink-0 items-center justify-center gap-2 font-semibold transition-all duration-150 disabled:pointer-events-none disabled:opacity-60 active:scale-[0.97] active:duration-100',
        variantClass[variant],
        sizeClass[size],
        fullWidth && 'w-full',
        className,
      )}
      type={type}
      {...props}
    >
      {children}
    </button>
  )
}
