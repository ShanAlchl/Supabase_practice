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
    'bg-[var(--color-soft)] text-[var(--color-primary)] hover:bg-teal-100 active:bg-teal-100 disabled:text-[var(--color-primary)]/45',
  cta:
    'bg-[var(--color-cta)] text-white hover:bg-orange-600 active:bg-orange-700 disabled:bg-[var(--color-cta)]/45',
  ghost:
    'bg-transparent text-[var(--color-muted)] hover:bg-slate-100 active:bg-slate-200 disabled:text-slate-300',
  subtle:
    'border border-[var(--color-border)] bg-white text-[var(--color-text)] hover:bg-slate-50 active:bg-slate-100 disabled:text-slate-300',
  danger:
    'bg-[var(--color-error-bg)] text-[var(--color-error-text)] hover:bg-rose-100 active:bg-rose-100 disabled:text-rose-300',
}

const sizeClass: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-5 text-base',
  icon: 'h-10 w-10 p-0',
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
        'focus-ring inline-flex shrink-0 items-center justify-center gap-2 rounded-[8px] font-semibold transition duration-200 disabled:pointer-events-none disabled:opacity-70',
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
