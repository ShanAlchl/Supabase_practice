import { X } from 'lucide-react'
import type { Circle, Profile, SessionUser } from '../../types/domain'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Composer } from './Composer'

type ComposeDialogProps = {
  open: boolean
  circle: Circle
  user: SessionUser | null
  profile?: Profile | null
  demoName?: string
  submitting?: boolean
  onClose: () => void
  onSubmit: (body: string, files: File[]) => Promise<void> | void
}

export function ComposeDialog({
  open,
  circle,
  user,
  profile,
  demoName,
  submitting = false,
  onClose,
  onSubmit,
}: ComposeDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-stone-950/30 p-0 backdrop-blur-sm sm:items-center sm:justify-center sm:p-4">
      <Card
        aria-label="发布动态"
        aria-modal="true"
        className="h-[100svh] w-full overflow-auto rounded-none p-5 sm:h-auto sm:max-h-[calc(100svh-2rem)] sm:max-w-4xl sm:rounded-[var(--radius-lg)] sm:p-6"
        role="dialog"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-sm text-[var(--color-muted)]">
            只分享给当前圈子的成员。
          </p>
          <Button aria-label="关闭发布动态" onClick={onClose} size="icon" variant="ghost">
            <X size={18} />
          </Button>
        </div>
        <Composer
          circle={circle}
          className="p-0"
          demoName={demoName}
          framed={false}
          onSubmit={onSubmit}
          profile={profile}
          submitting={submitting}
          user={user}
        />
      </Card>
    </div>
  )
}
