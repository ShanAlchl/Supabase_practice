import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'

type CardProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode
  as?: 'article' | 'section' | 'div'
  elevated?: boolean
}

export function Card({
  as: Component = 'section',
  children,
  className,
  elevated = false,
  ...props
}: CardProps) {
  return (
    <Component
      className={cn(
        'rounded-[8px] border border-[var(--color-border)] bg-[var(--color-card)]',
        elevated ? 'shadow-[var(--shadow-elevated)]' : 'shadow-[var(--shadow-card)]',
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  )
}
