import { MailPlus, UserMinus } from 'lucide-react'
import type { CircleMember } from '../../types/domain'
import { Avatar } from '../../components/ui/Avatar'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Dialog } from '../../components/ui/Dialog'

type MembersDialogProps = {
  open: boolean
  members: CircleMember[]
  currentUserId: string
  onClose: () => void
  onRemoveMember?: (userId: string) => Promise<void>
  onOpenInvites?: () => void
}

export function MembersDialog({
  open,
  members,
  currentUserId,
  onClose,
  onRemoveMember,
  onOpenInvites,
}: MembersDialogProps) {
  const isOwner = members.some(
    (member) => member.userId === currentUserId && member.role === 'owner',
  )

  return (
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
  )
}
