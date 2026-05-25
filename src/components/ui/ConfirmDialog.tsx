import { AlertTriangle } from 'lucide-react'
import { Button } from './Button'
import { Dialog } from './Dialog'

type ConfirmDialogProps = {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'primary'
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = '确认',
  cancelLabel = '取消',
  variant = 'danger',
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog className="max-w-md" onClose={onCancel} open={open} title={title}>
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-50 text-[var(--color-rose)]">
          <AlertTriangle size={18} />
        </div>
        <p className="text-sm leading-6 text-[var(--color-text)]">{description}</p>
      </div>
      <div className="flex flex-col gap-3">
        <Button
          disabled={busy}
          fullWidth
          onClick={onConfirm}
          variant={variant === 'danger' ? 'danger' : 'primary'}
        >
          {confirmLabel}
        </Button>
        <Button fullWidth onClick={onCancel} variant="subtle">
          {cancelLabel}
        </Button>
      </div>
    </Dialog>
  )
}
