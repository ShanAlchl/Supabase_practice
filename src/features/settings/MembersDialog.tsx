import { useState } from 'react'
import { Crown, MailPlus, UserMinus } from 'lucide-react'
import type { CircleMember } from '../../types/domain'
import { Avatar } from '../../components/ui/Avatar'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { Dialog } from '../../components/ui/Dialog'

type MembersDialogProps = {
  open: boolean
  members: CircleMember[]
  currentUserId: string
  onClose: () => void
  onRemoveMember?: (userId: string) => Promise<void>
  onOpenInvites?: () => void
  onTransferOwnership?: (userId: string) => Promise<void>
}

export function MembersDialog({
  open,
  members,
  currentUserId,
  onClose,
  onRemoveMember,
  onOpenInvites,
  onTransferOwnership,
}: MembersDialogProps) {
  const isOwner = members.some(
    (member) => member.userId === currentUserId && member.role === 'owner',
  )
  const [transferTarget, setTransferTarget] = useState<string | null>(null)
  const [transferring, setTransferring] = useState(false)

  const handleTransfer = async () => {
    if (!transferTarget || !onTransferOwnership) return
    setTransferring(true)
    try {
      await onTransferOwnership(transferTarget)
      setTransferTarget(null)
      onClose()
    } finally {
      setTransferring(false)
    }
  }

  return (
    <>
      <Dialog className="max-w-lg" onClose={onClose} open={open} title="圈子成员">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-[var(--color-muted)]">
            共 {members.length} 位成员
          </p>
          {isOwner ? (
            <Button
              onClick={() => {
                onClose()
                onOpenInvites?.()
              }}
              size="sm"
              variant="primary"
            >
              <MailPlus size={16} />
              邀请成员
            </Button>
          ) : null}
        </div>

        <div className="space-y-3">
          {members.map((member) => {
            const canRemove = isOwner && member.userId !== currentUserId
            const canTransfer = isOwner && member.userId !== currentUserId
            return (
              <div
                className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-card)] p-3"
                key={member.userId}
              >
                <Avatar
                  name={member.profile.displayName}
                  size="sm"
                  src={member.profile.avatarUrl}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {member.profile.displayName}
                  </p>
                  <p className="text-xs text-[var(--color-muted)]">
                    {member.profile.bio ?? (member.role === 'owner' ? '圈主' : '成员')}
                  </p>
                </div>
                <Badge tone={member.role === 'owner' ? 'primary' : 'neutral'}>
                  {member.role === 'owner' ? '圈主' : '成员'}
                </Badge>
                {canTransfer ? (
                  <Button
                    onClick={() => setTransferTarget(member.userId)}
                    size="sm"
                    variant="subtle"
                  >
                    <Crown size={14} />
                    转让
                  </Button>
                ) : null}
                {canRemove ? (
                  <Button
                    onClick={() => onRemoveMember?.(member.userId)}
                    size="sm"
                    variant="danger"
                  >
                    <UserMinus size={16} />
                    移除
                  </Button>
                ) : null}
              </div>
            )
          })}
        </div>
      </Dialog>

      <ConfirmDialog
        busy={transferring}
        description="转让后你将变为普通成员，对方将成为新的圈主。此操作不可撤销。"
        onCancel={() => setTransferTarget(null)}
        onConfirm={handleTransfer}
        open={Boolean(transferTarget)}
        title="转让圈主身份"
      />
    </>
  )
}
