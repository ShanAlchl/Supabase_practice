import { useState, useRef, useEffect } from 'react'
import { Edit3, MoreHorizontal, Pin, Trash2 } from 'lucide-react'
import type { Post } from '../../types/domain'

type PostActionsMenuProps = {
  post: Post
  canEdit: boolean
  canDelete: boolean
  canPin: boolean
  isPinned: boolean
  onEdit: () => void
  onDelete: () => void
  onTogglePin: () => void
}

export function PostActionsMenu({
  canEdit,
  canDelete,
  canPin,
  isPinned,
  onEdit,
  onDelete,
  onTogglePin,
}: PostActionsMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        aria-label="更多操作"
        className="focus-ring inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-muted)] transition hover:bg-[var(--color-surface)]"
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        <MoreHorizontal size={16} />
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-20 mt-1 w-40 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white p-1 shadow-[var(--shadow-card)]">
          {canPin ? (
            <button
              className="focus-ring flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2 text-left text-sm font-medium text-[var(--color-text)] transition hover:bg-[var(--color-surface)]"
              onClick={() => {
                setOpen(false)
                onTogglePin()
              }}
              type="button"
            >
              <Pin size={14} />
              {isPinned ? '取消置顶' : '置顶'}
            </button>
          ) : null}
          {canEdit ? (
            <button
              className="focus-ring flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2 text-left text-sm font-medium text-[var(--color-text)] transition hover:bg-[var(--color-surface)]"
              onClick={() => {
                setOpen(false)
                onEdit()
              }}
              type="button"
            >
              <Edit3 size={14} />
              编辑
            </button>
          ) : null}
          {canDelete ? (
            <button
              className="focus-ring flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-3 py-2 text-left text-sm font-medium text-[var(--color-rose)] transition hover:bg-rose-50"
              onClick={() => {
                setOpen(false)
                onDelete()
              }}
              type="button"
            >
              <Trash2 size={14} />
              删除
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
