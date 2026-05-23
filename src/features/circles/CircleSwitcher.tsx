import { LogIn, Plus, RefreshCw } from 'lucide-react'
import type { FormEvent } from 'react'
import { useState } from 'react'
import type { Circle } from '../../types/domain'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Notice } from '../../components/ui/Notice'
import { Textarea } from '../../components/ui/Textarea'

type CircleSwitcherProps = {
  circles: Circle[]
  activeCircleId: string
  onSelect: (circleId: string) => void
  onCreate: (input: { name: string; description: string | null }) => Promise<void>
  onJoin?: (code: string) => Promise<void>
  busy?: boolean
  joinBusy?: boolean
  joinError?: string | null
  isDemo?: boolean
}

export function CircleSwitcher({
  circles,
  activeCircleId,
  onSelect,
  onCreate,
  onJoin,
  busy = false,
  joinBusy = false,
  joinError,
  isDemo = false,
}: CircleSwitcherProps) {
  const [openCreate, setOpenCreate] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [joinMessage, setJoinMessage] = useState('')

  const submitCreate = async (event: FormEvent) => {
    event.preventDefault()
    await onCreate({
      name,
      description: description || null,
    })
    setName('')
    setDescription('')
    setOpenCreate(false)
  }

  const submitJoin = async (event: FormEvent) => {
    event.preventDefault()
    if (!onJoin || !inviteCode.trim()) {
      return
    }

    setJoinMessage('')
    await onJoin(inviteCode)
    setJoinMessage('已加入圈子，并自动切换到新的动态流。')
    setInviteCode('')
  }

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">圈子</h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">切换、创建或通过邀请码加入</p>
        </div>
        <Badge tone={isDemo ? 'warning' : 'primary'}>{circles.length}</Badge>
      </div>

      <div className="space-y-2">
        {circles.map((circle) => {
          const selected = circle.id === activeCircleId
          return (
            <button
              className={`focus-ring w-full rounded-[8px] border px-3 py-2.5 text-left transition duration-200 ${
                selected
                  ? 'border-[var(--color-primary)] bg-[var(--color-soft)]'
                  : 'border-[var(--color-border)] bg-white hover:bg-slate-50'
              }`}
              key={circle.id}
              onClick={() => onSelect(circle.id)}
              type="button"
            >
              <p className="truncate text-sm font-semibold text-[var(--color-text)]">
                {circle.name}
              </p>
              <p className="mt-0.5 line-clamp-1 text-xs text-[var(--color-muted)]">
                {circle.description ?? '还没有圈子说明'}
              </p>
            </button>
          )
        })}
      </div>

      {!isDemo ? (
        <div className="mt-4 space-y-3 border-t border-[var(--color-border)] pt-4">
          <form className="space-y-3" onSubmit={submitJoin}>
            <Input
              autoComplete="off"
              label="使用邀请码加入"
              onChange={(event) => setInviteCode(event.target.value)}
              placeholder="粘贴朋友发来的邀请码"
              value={inviteCode}
            />
            <Button
              disabled={joinBusy || !inviteCode.trim()}
              fullWidth
              type="submit"
              variant="primary"
            >
              {joinBusy ? <RefreshCw className="animate-spin" size={17} /> : <LogIn size={17} />}
              加入圈子
            </Button>
            {joinError ? <Notice tone="error">{joinError}</Notice> : null}
            {joinMessage ? <Notice tone="success">{joinMessage}</Notice> : null}
          </form>

          <div>
            <Button
              fullWidth
              onClick={() => setOpenCreate((current) => !current)}
              variant="subtle"
            >
              <Plus size={17} />
              创建新圈子
            </Button>
            {openCreate ? (
              <form className="mt-3 space-y-3" onSubmit={submitCreate}>
                <Input
                  label="圈子名称"
                  maxLength={40}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="例如：大学室友"
                  required
                  value={name}
                />
                <Textarea
                  label="圈子说明"
                  maxLength={160}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="这个圈子用来记录什么？"
                  value={description}
                />
                <Button disabled={busy || !name.trim()} fullWidth type="submit">
                  {busy ? <RefreshCw className="animate-spin" size={17} /> : <Plus size={17} />}
                  创建
                </Button>
              </form>
            ) : null}
          </div>
        </div>
      ) : null}
    </Card>
  )
}
