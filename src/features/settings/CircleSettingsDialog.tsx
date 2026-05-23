import { RefreshCw, Save, UserMinus } from 'lucide-react'
import type { FormEvent } from 'react'
import { useState } from 'react'
import type { Circle, CircleMember } from '../../types/domain'
import { Avatar } from '../../components/ui/Avatar'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Dialog } from '../../components/ui/Dialog'
import { Input } from '../../components/ui/Input'
import { Notice } from '../../components/ui/Notice'
import { Textarea } from '../../components/ui/Textarea'

type CircleSettingsDialogProps = {
  open: boolean
  circle: Circle
  members: CircleMember[]
  currentUserId: string
  busy?: boolean
  error?: string | null
  onClose: () => void
  onSave: (input: { name: string; description: string | null }) => Promise<void>
  onRemoveMember: (userId: string) => Promise<void>
}

export function CircleSettingsDialog({
  open,
  circle,
  members,
  currentUserId,
  busy = false,
  error,
  onClose,
  onSave,
  onRemoveMember,
}: CircleSettingsDialogProps) {
  const [name, setName] = useState(circle.name)
  const [description, setDescription] = useState(circle.description ?? '')
  const isOwner = members.some(
    (member) => member.userId === currentUserId && member.role === 'owner',
  )

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    await onSave({
      name,
      description: description || null,
    })
  }

  return (
    <Dialog className="max-w-2xl" onClose={onClose} open={open} title="圈子设置">
      {error ? (
        <Notice className="mb-4" tone="error">
          {error}
        </Notice>
      ) : null}

      <form className="space-y-4" onSubmit={submit}>
        <Input
          disabled={!isOwner}
          label="圈子名称"
          maxLength={40}
          onChange={(event) => setName(event.target.value)}
          required
          value={name}
        />
        <Textarea
          disabled={!isOwner}
          label="圈子说明"
          maxLength={180}
          onChange={(event) => setDescription(event.target.value)}
          value={description}
        />
        <Button disabled={!isOwner || busy || !name.trim()} type="submit">
          {busy ? <RefreshCw className="animate-spin" size={17} /> : <Save size={17} />}
          保存圈子
        </Button>
      </form>

      <div className="mt-6">
        <h3 className="mb-3 text-sm font-semibold text-[var(--color-text)]">成员管理</h3>
        <div className="space-y-2">
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
                  <p className="truncate text-sm font-semibold">{member.profile.displayName}</p>
                  <p className="text-xs text-[var(--color-muted)]">{member.profile.bio}</p>
                </div>
                <Badge tone={member.role === 'owner' ? 'primary' : 'neutral'}>
                  {member.role === 'owner' ? '圈主' : '成员'}
                </Badge>
                {canRemove ? (
                  <Button onClick={() => onRemoveMember(member.userId)} size="sm" variant="danger">
                    <UserMinus size={16} />
                    移除
                  </Button>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>
    </Dialog>
  )
}
