import { cn } from '../../lib/cn'

type AvatarProps = {
  name: string
  src?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeClass = {
  xs: 'h-7 w-7 text-[11px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-14 w-14 text-lg',
}

const palette = [
  'bg-[var(--color-primary)]',
  'bg-[var(--color-secondary)]',
  'bg-[var(--color-cta)]',
  'bg-[var(--color-rose)]',
  'bg-slate-700',
]

const colorForName = (name: string) => {
  const sum = Array.from(name).reduce((total, char) => total + char.charCodeAt(0), 0)
  return palette[sum % palette.length]
}

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  const initial = name.trim().slice(0, 1).toUpperCase() || '?'

  if (src) {
    return (
      <img
        alt={`${name} 的头像`}
        className={cn(
          'shrink-0 rounded-full object-cover ring-2 ring-white',
          sizeClass[size],
          className,
        )}
        src={src}
      />
    )
  }

  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full font-semibold text-white ring-2 ring-white',
        sizeClass[size],
        colorForName(name),
        className,
      )}
      title={name}
    >
      {initial}
    </span>
  )
}
