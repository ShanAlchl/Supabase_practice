import { useState } from 'react'
import type { ImgHTMLAttributes } from 'react'
import { Camera } from 'lucide-react'
import { cn } from '../../lib/cn'

type SafeImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  fallbackClassName?: string
}

export function SafeImage({
  alt,
  className,
  fallbackClassName,
  onError,
  ...props
}: SafeImageProps) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <div
        aria-label={alt}
        className={cn(
          'flex items-center justify-center bg-[linear-gradient(135deg,var(--color-primary-light),#FFF7ED)] text-[var(--color-primary)]',
          fallbackClassName,
          className,
        )}
        role="img"
      >
        <Camera size={22} />
      </div>
    )
  }

  return (
    <img
      alt={alt}
      className={className}
      onError={(event) => {
        setFailed(true)
        onError?.(event)
      }}
      {...props}
    />
  )
}
