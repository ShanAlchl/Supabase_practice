import { useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, X, ImageIcon, MessageSquareText } from 'lucide-react'
import type { AlbumImage } from '../../types/domain'
import { Button } from '../../components/ui/Button'
import { SafeImage } from '../../components/ui/SafeImage'
import { formatRelativeTime } from '../../utils/time'
import { Avatar } from '../../components/ui/Avatar'

type LightboxDialogProps = {
  open: boolean
  images: AlbumImage[]
  index: number
  onClose: () => void
  onNext: () => void
  onOpenPost?: (image: AlbumImage) => void
  onPrev: () => void
}

export function LightboxDialog({
  open,
  images,
  index,
  onClose,
  onNext,
  onOpenPost,
  onPrev,
}: LightboxDialogProps) {
  const current = images[index]

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      } else if (event.key === 'ArrowRight') {
        onNext()
      } else if (event.key === 'ArrowLeft') {
        onPrev()
      }
    },
    [onClose, onNext, onPrev],
  )

  useEffect(() => {
    if (!open) return
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, handleKeyDown])

  if (!open || !current) return null

  const hasNext = index < images.length - 1
  const hasPrev = index > 0

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-stone-950/95 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2 text-xs font-medium text-white/70">
          <ImageIcon size={14} />
          <span>
            {index + 1} / {images.length}
          </span>
        </div>
        <button
          aria-label="关闭"
          className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white"
          onClick={onClose}
          type="button"
        >
          <X size={20} />
        </button>
      </div>

      {/* Image area */}
      <div className="relative flex flex-1 items-center justify-center px-4 sm:px-14">
        {hasPrev && (
          <button
            aria-label="上一张"
            className="focus-ring absolute left-2 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:left-4"
            onClick={(e) => {
              e.stopPropagation()
              onPrev()
            }}
            type="button"
          >
            <ChevronLeft size={22} />
          </button>
        )}

        <div
          className="max-h-full max-w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <SafeImage
            alt="相册图片"
            className="max-h-[70vh] w-auto rounded-[var(--radius-md)] object-contain"
            src={current.url}
          />
        </div>

        {hasNext && (
          <button
            aria-label="下一张"
            className="focus-ring absolute right-2 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:right-4"
            onClick={(e) => {
              e.stopPropagation()
              onNext()
            }}
            type="button"
          >
            <ChevronRight size={22} />
          </button>
        )}
      </div>

      {/* Bottom info */}
      <div className="px-4 pb-6 pt-3 sm:px-6">
        <div className="mx-auto max-w-xl">
          <div className="flex items-center gap-3">
            <Avatar
              name={current.author.displayName}
              size="sm"
              src={current.author.avatarUrl}
            />
            <div>
              <p className="text-sm font-semibold text-white">
                {current.author.displayName}
              </p>
              <p className="text-xs text-white/60">
                {formatRelativeTime(current.postCreatedAt)}
              </p>
            </div>
          </div>
          {current.postBody ? (
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/80">
              {current.postBody}
            </p>
          ) : null}
          {onOpenPost ? (
            <Button
              className="mt-3"
              onClick={() => onOpenPost(current)}
              size="sm"
              variant="subtle"
            >
              <MessageSquareText size={16} />
              查看原动态
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
