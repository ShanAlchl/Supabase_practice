import { LogOut, RefreshCw, Save, UserMinus } from 'lucide-react'
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
  onLeaveCircle?: () => Promise<void>
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
  onLeaveCircle,
}: CircleSettingsDialogProps) {
  const [name, setName] = useState(circle.name)
  const [description, setDescription] = useState(circle.description ?? '')
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false)
  const [leaveConfirmName, setLeaveConfirmName] = useState('')
  const [leaveError, setLeaveError] = useState('')
  const [leaving, setLeaving] = useState(false)

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

  const handleLeave = async () => {
    setLeaveError('')
    if (leaveConfirmName.trim() !== circle.name.trim()) {
      setLeaveError('圈子名称不匹配，请重新输入。')
      return
    }
    setLeaving(true)
    try {
      await onLeaveCircle?.()
      setLeaveConfirmOpen(false)
      setLeaveConfirmName('')
    } catch (err) {
      setLeaveError(err instanceof Error ? err.message : '退出失败，请重试。')
    } finally {
      setLeaving(false)
    }
  }

  return (
    <>
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

        <div className="mt-8 border-t border-[var(--color-border)] pt-6">
          <h3 className="mb-2 text-sm font-semibold text-[var(--color-rose)]">危险区域</h3>
          <p className="mb-3 text-xs text-[var(--color-muted)]">
            退出圈子后，你将无法查看这个圈子的动态和成员。圈主需要先转让圈主身份才能退出。
          </p>
          <Button
            onClick={() => {
              setLeaveConfirmOpen(true)
              setLeaveConfirmName('')
              setLeaveError('')
            }}
            variant="danger"
          >
            <LogOut size={16} />
            退出圈子
          </Button>
        </div>
      </Dialog>

      <Dialog
        className="max-w-md"
        onClose={() => {
          setLeaveConfirmOpen(false)
          setLeaveConfirmName('')
          setLeaveError('')
        }}
        open={leaveConfirmOpen}
        title="确认退出圈子"
      >
        <p className="mb-4 text-sm text-[var(--color-text)]">
          你确定要退出「<span className="font-semibold">{circle.name}</span>」吗？此操作不可撤销。
        </p>
        <p className="mb-3 text-xs text-[var(--color-muted)]">
          请输入圈子名称以确认退出：
        </p>
        <Input
          className="mb-3"
          onChange={(event) => setLeaveConfirmName(event.target.value)}
          placeholder={circle.name}
          value={leaveConfirmName}
        />
        {leaveError ? (
          <Notice className="mb-3" tone="error">
            {leaveError}
          </Notice>
        ) : null}
        <div className="flex flex-col gap-3">
          <Button
            disabled={leaving || !leaveConfirmName.trim()}
            fullWidth
            onClick={handleLeave}
            variant="danger"
          >
            {leaving ? <RefreshCw className="animate-spin" size={16} /> : <LogOut size={16} />}
            确认退出
          </Button>
          <Button
            fullWidth
            onClick={() => {
              setLeaveConfirmOpen(false)
              setLeaveConfirmName('')
              setLeaveError('')
            }}
            variant="subtle"
          >
            取消
          </Button>
        </div>
      </Dialog>
    </>
  )
}
