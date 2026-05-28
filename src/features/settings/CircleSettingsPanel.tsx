import {
  CheckCircle2,
  Copy,
  Crown,
  LogOut,
  RefreshCw,
  RotateCcw,
  Save,
  UserMinus,
} from 'lucide-react'
import type { FormEvent } from 'react'
import { useMemo, useState } from 'react'
import type {
  Circle,
  CircleInvite,
  CircleMember,
} from '../../types/domain'
import { Avatar } from '../../components/ui/Avatar'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { Dialog } from '../../components/ui/Dialog'
import { Input } from '../../components/ui/Input'
import { Notice } from '../../components/ui/Notice'
import { Textarea } from '../../components/ui/Textarea'

type CircleSettingsPanelProps = {
  circle: Circle
  members: CircleMember[]
  invites: CircleInvite[]
  currentUserId: string
  isDemo?: boolean
  circleBusy?: boolean
  circleError?: string | null
  inviteBusy?: boolean
  inviteError?: string | null
  leaveBusy?: boolean
  onSaveCircle: (input: { name: string; description: string | null }) => Promise<void>
  onRemoveMember: (userId: string) => Promise<void>
  onTransferOwnership?: (userId: string) => Promise<void>
  onLeaveCircle?: () => Promise<void>
  onCreateInvite: (input: { maxUses: number; expiresAt: string | null }) => Promise<CircleInvite>
  onRevokeInvite: (inviteId: string) => Promise<unknown>
}

export function CircleSettingsPanel({
  circle,
  members,
  invites,
  currentUserId,
  isDemo = false,
  circleBusy = false,
  circleError,
  inviteBusy = false,
  inviteError,
  leaveBusy = false,
  onSaveCircle,
  onRemoveMember,
  onTransferOwnership,
  onLeaveCircle,
  onCreateInvite,
  onRevokeInvite,
}: CircleSettingsPanelProps) {
  const [name, setName] = useState(circle.name)
  const [description, setDescription] = useState(circle.description ?? '')
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false)
  const [leaveConfirmName, setLeaveConfirmName] = useState('')
  const [leaveError, setLeaveError] = useState('')
  const [leaving, setLeaving] = useState(false)

  const [maxUses, setMaxUses] = useState('5')
  const [duration, setDuration] = useState<'1d' | '1w' | '1m' | 'never'>('1w')
  const [inviteFormOpen, setInviteFormOpen] = useState(false)
  const [inviteMessage, setInviteMessage] = useState('')
  const [createdInvite, setCreatedInvite] = useState<CircleInvite | null>(null)

  const [transferTarget, setTransferTarget] = useState<string | null>(null)
  const [transferring, setTransferring] = useState(false)

  const isOwner = members.some(
    (member) => member.userId === currentUserId && member.role === 'owner',
  )

  const visibleInvites = useMemo(() => {
    const all = createdInvite && !invites.some((i) => i.id === createdInvite.id)
      ? [createdInvite, ...invites]
      : invites
    return all.filter((invite) => {
      if (invite.revokedAt) return false
      if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) return false
      if (invite.usedCount >= invite.maxUses) return false
      return true
    })
  }, [createdInvite, invites])

  const submitCircle = async (event: FormEvent) => {
    event.preventDefault()
    await onSaveCircle({
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

  const getExpiresAt = (): string | null => {
    if (duration === 'never') return null
    const now = new Date()
    if (duration === '1d') now.setDate(now.getDate() + 1)
    if (duration === '1w') now.setDate(now.getDate() + 7)
    if (duration === '1m') now.setDate(now.getDate() + 30)
    return now.toISOString()
  }

  const submitInvite = async (event: FormEvent) => {
    event.preventDefault()
    setInviteMessage('')
    const invite = await onCreateInvite({
      maxUses: Math.max(1, Number(maxUses) || 1),
      expiresAt: getExpiresAt(),
    })
    setCreatedInvite(invite)
    setInviteMessage(`邀请码 ${invite.code} 已生成。`)
    setInviteFormOpen(false)
  }

  const copyCode = async (code: string) => {
    await navigator.clipboard.writeText(code)
    setInviteMessage(`邀请码 ${code} 已复制。`)
  }

  const handleTransfer = async () => {
    if (!transferTarget || !onTransferOwnership) return
    setTransferring(true)
    try {
      await onTransferOwnership(transferTarget)
      setTransferTarget(null)
    } finally {
      setTransferring(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        {circleError ? (
          <Notice className="mb-4" tone="error">
            {circleError}
          </Notice>
        ) : null}

        <form className="space-y-4" onSubmit={submitCircle}>
          <Input
            disabled={!isOwner || isDemo}
            label="圈子名称"
            maxLength={40}
            onChange={(event) => setName(event.target.value)}
            required
            value={name}
          />
          <Textarea
            disabled={!isOwner || isDemo}
            label="圈子说明"
            maxLength={180}
            onChange={(event) => setDescription(event.target.value)}
            value={description}
          />
          <Button disabled={!isOwner || circleBusy || isDemo || !name.trim()} type="submit">
            {circleBusy ? <RefreshCw className="animate-spin" size={17} /> : <Save size={17} />}
            保存圈子
          </Button>
        </form>
      </div>

      {/* Members */}
      <div className="border-t border-[var(--color-border)] pt-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[var(--color-text)]">成员管理</h3>
          <p className="text-xs text-[var(--color-muted)]">共 {members.length} 位成员</p>
        </div>
        <div className="space-y-2">
          {members.map((member) => {
            const canRemove = isOwner && member.userId !== currentUserId && !isDemo
            const canTransfer = isOwner && member.userId !== currentUserId && !isDemo
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
                    onClick={() => onRemoveMember(member.userId)}
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
      </div>

      {/* Invites */}
      {isOwner && !isDemo ? (
        <div className="border-t border-[var(--color-border)] pt-6">
          <h3 className="mb-4 text-sm font-semibold text-[var(--color-text)]">邀请管理</h3>

          {!inviteFormOpen ? (
            <Button
              disabled={inviteBusy}
              onClick={() => setInviteFormOpen(true)}
              variant="primary"
            >
              <CheckCircle2 size={18} />
              生成邀请码
            </Button>
          ) : (
            <form
              className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
              onSubmit={submitInvite}
            >
              <div className="mb-4">
                <label className="mb-2 block text-sm font-semibold text-[var(--color-text)]">
                  生效时长
                </label>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      { key: '1d', label: '1天' },
                      { key: '1w', label: '1周' },
                      { key: '1m', label: '1月' },
                      { key: 'never', label: '永久' },
                    ] as const
                  ).map((opt) => (
                    <button
                      className={`focus-ring rounded-[var(--radius-sm)] px-3 py-2 text-sm font-semibold transition ${
                        duration === opt.key
                          ? 'bg-[var(--color-primary)] text-white'
                          : 'border border-[var(--color-border)] bg-white text-[var(--color-muted)] hover:bg-[var(--color-surface)]'
                      }`}
                      key={opt.key}
                      onClick={() => setDuration(opt.key)}
                      type="button"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-4">
                <Input
                  label="最大使用次数"
                  min={1}
                  onChange={(event) => setMaxUses(event.target.value)}
                  type="number"
                  value={maxUses}
                />
              </div>
              <div className="flex gap-2">
                <Button disabled={inviteBusy} type="submit">
                  {inviteBusy ? (
                    <RefreshCw className="animate-spin" size={17} />
                  ) : (
                    <CheckCircle2 size={17} />
                  )}
                  确认生成
                </Button>
                <Button
                  disabled={inviteBusy}
                  onClick={() => setInviteFormOpen(false)}
                  variant="subtle"
                >
                  取消
                </Button>
              </div>
            </form>
          )}

          {inviteError ? (
            <Notice className="mt-4" tone="error">
              {inviteError}
            </Notice>
          ) : null}
          {inviteMessage ? (
            <Notice className="mt-4" tone="success">
              {inviteMessage}
            </Notice>
          ) : null}

          <div className="mt-5 space-y-3">
            {visibleInvites.length === 0 ? (
              <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] px-4 py-8 text-center text-sm text-[var(--color-muted)]">
                还没有有效邀请码，生成一个后就可以复制给朋友。
              </div>
            ) : (
              visibleInvites.map((invite) => (
                <div
                  className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-card)] p-4"
                  key={invite.id}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <code className="inline-flex rounded-[var(--radius-sm)] bg-[var(--color-surface)] px-3 py-2 text-sm font-semibold text-[var(--color-text)]">
                        {invite.code}
                      </code>
                      <p className="mt-2 text-xs text-[var(--color-muted)]">
                        已使用 {invite.usedCount}/{invite.maxUses}
                        {invite.expiresAt
                          ? ` · 过期：${new Date(invite.expiresAt).toLocaleString()}`
                          : ' · 永不过期'}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="success">有效</Badge>
                      <Button onClick={() => copyCode(invite.code)} size="sm" variant="subtle">
                        <Copy size={16} />
                        复制
                      </Button>
                      <Button
                        onClick={() => onRevokeInvite(invite.id)}
                        size="sm"
                        variant="danger"
                      >
                        <RotateCcw size={16} />
                        撤销
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}

      {/* Danger zone */}
      <div className="border-t border-[var(--color-border)] pt-6">
        <h3 className="mb-2 text-sm font-semibold text-[var(--color-rose)]">危险区域</h3>
        <p className="mb-3 text-xs text-[var(--color-muted)]">
          退出圈子后，你将无法查看这个圈子的动态和成员。圈主需要先转让圈主身份才能退出。
        </p>
        <Button
          disabled={isDemo || leaveBusy}
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

      {/* Leave confirm dialog */}
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
        <p className="mb-3 text-xs text-[var(--color-muted)]">请输入圈子名称以确认退出：</p>
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

      {/* Transfer confirm dialog */}
      <ConfirmDialog
        busy={transferring}
        description="转让后你将变为普通成员，对方将成为新的圈主。此操作不可撤销。"
        onCancel={() => setTransferTarget(null)}
        onConfirm={handleTransfer}
        open={Boolean(transferTarget)}
        title="转让圈主身份"
      />
    </div>
  )
}
