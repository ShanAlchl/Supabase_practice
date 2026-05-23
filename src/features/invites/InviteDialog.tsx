import { CheckCircle2, Copy, RefreshCw, RotateCcw } from 'lucide-react'
import type { FormEvent } from 'react'
import { useMemo, useState } from 'react'
import type { CircleInvite } from '../../types/domain'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Dialog } from '../../components/ui/Dialog'
import { Input } from '../../components/ui/Input'
import { Notice } from '../../components/ui/Notice'

type InviteDialogProps = {
  open: boolean
  invites: CircleInvite[]
  loading?: boolean
  error?: string | null
  onClose: () => void
  onCreate: (input: { maxUses: number; expiresAt: string | null }) => Promise<CircleInvite>
  onRevoke: (inviteId: string) => Promise<void>
}

export function InviteDialog({
  open,
  invites,
  loading = false,
  error,
  onClose,
  onCreate,
  onRevoke,
}: InviteDialogProps) {
  const [maxUses, setMaxUses] = useState('5')
  const [expiresAt, setExpiresAt] = useState('')
  const [message, setMessage] = useState('')
  const [createdInvite, setCreatedInvite] = useState<CircleInvite | null>(null)

  const visibleInvites = useMemo(() => {
    if (!createdInvite || invites.some((invite) => invite.id === createdInvite.id)) {
      return invites
    }
    return [createdInvite, ...invites]
  }, [createdInvite, invites])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setMessage('')
    const invite = await onCreate({
      maxUses: Math.max(1, Number(maxUses) || 1),
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
    })
    setCreatedInvite(invite)
    setMessage(`邀请码 ${invite.code} 已生成。`)
  }

  const copyCode = async (code: string) => {
    await navigator.clipboard.writeText(code)
    setMessage(`邀请码 ${code} 已复制。`)
  }

  return (
    <Dialog
      className="max-w-[760px]"
      description="设置使用次数和过期时间，生成后复制给朋友即可加入这个圈子。"
      onClose={onClose}
      open={open}
      title="邀请成员"
    >
      <form
        className="rounded-[8px] border border-[var(--color-border)] bg-slate-50 p-4"
        onSubmit={submit}
      >
        <div className="grid gap-4 md:grid-cols-[120px_minmax(240px,1fr)] md:items-end">
          <Input
            label="最大使用次数"
            min={1}
            onChange={(event) => setMaxUses(event.target.value)}
            type="number"
            value={maxUses}
          />
          <Input
            label="过期时间"
            onChange={(event) => setExpiresAt(event.target.value)}
            type="datetime-local"
            value={expiresAt}
          />
        </div>
        <div className="mt-4 flex justify-end">
          <Button disabled={loading} size="lg" type="submit">
            {loading ? <RefreshCw className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
            生成邀请码
          </Button>
        </div>
      </form>

      {error ? (
        <Notice className="mt-4" tone="error">
          {error}
        </Notice>
      ) : null}
      {message ? (
        <Notice className="mt-4" tone="success">
          {message}
        </Notice>
      ) : null}

      <div className="mt-5 space-y-3">
        {visibleInvites.length === 0 ? (
          <div className="rounded-[8px] border border-dashed border-[var(--color-border)] px-4 py-8 text-center text-sm text-[var(--color-muted)]">
            还没有邀请码，生成一个后就可以复制给朋友。
          </div>
        ) : (
          visibleInvites.map((invite) => {
            const revoked = Boolean(invite.revokedAt)
            const expired = invite.expiresAt ? new Date(invite.expiresAt) < new Date() : false
            return (
              <div
                className="rounded-[8px] border border-[var(--color-border)] bg-white p-4"
                key={invite.id}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <code className="inline-flex rounded-[8px] bg-slate-100 px-3 py-2 text-sm font-semibold text-[var(--color-text)]">
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
                    {revoked ? (
                      <Badge tone="danger">已撤销</Badge>
                    ) : expired ? (
                      <Badge tone="warning">已过期</Badge>
                    ) : (
                      <Badge tone="success">有效</Badge>
                    )}
                    <Button onClick={() => copyCode(invite.code)} size="sm" variant="subtle">
                      <Copy size={16} />
                      复制
                    </Button>
                    {!revoked ? (
                      <Button onClick={() => onRevoke(invite.id)} size="sm" variant="danger">
                        <RotateCcw size={16} />
                        撤销
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </Dialog>
  )
}
