import { useState, useRef, useEffect } from 'react'
import { Edit3, MoreHorizontal, Trash2 } from 'lucide-react'

type CommentActionsMenuProps = {
  canEdit: boolean
  canDelete: boolean
  onEdit: () => void
  onDelete: () => void
}

export function CommentActionsMenu({
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: CommentActionsMenuProps) {
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

  if (!canEdit && !canDelete) return null

  return (
    <div className="relative" ref={ref}>
      <button
        aria-label="更多操作"
        className="focus-ring inline-flex h-6 w-6 items-center justify-center rounded text-[var(--color-muted)] transition hover:bg-[var(--color-surface)]"
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        <MoreHorizontal size={14} />
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-20 mt-1 w-32 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white p-1 shadow-[var(--shadow-card)]">
          {canEdit ? (
            <button
              className="focus-ring flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-2.5 py-1.5 text-left text-sm font-medium text-[var(--color-text)] transition hover:bg-[var(--color-surface)]"
              onClick={() => {
                setOpen(false)
                onEdit()
              }}
              type="button"
            >
              <Edit3 size={13} />
              编辑
            </button>
          ) : null}
          {canDelete ? (
            <button
              className="focus-ring flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-2.5 py-1.5 text-left text-sm font-medium text-[var(--color-rose)] transition hover:bg-rose-50"
              onClick={() => {
                setOpen(false)
                onDelete()
              }}
              type="button"
            >
              <Trash2 size={13} />
              删除
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
