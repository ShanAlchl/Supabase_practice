import { Camera, LogOut, RefreshCw, Save, Trash2 } from 'lucide-react'
import type { ChangeEvent, FormEvent } from 'react'
import { useEffect, useState } from 'react'
import type { Profile } from '../../types/domain'
import { Avatar } from '../../components/ui/Avatar'
import { Button } from '../../components/ui/Button'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { Input } from '../../components/ui/Input'
import { Notice } from '../../components/ui/Notice'
import { Textarea } from '../../components/ui/Textarea'
import { useObjectUrls } from '../../hooks/useObjectUrls'

type ProfileSettingsPanelProps = {
  profile: Profile
  isDemo?: boolean
  busy?: boolean
  error?: string | null
  deleteAccountBusy?: boolean
  onSave: (input: { displayName: string; bio: string | null }) => Promise<void>
  onAvatar: (file: File) => Promise<void>
  onSignOut?: () => void
  onDeleteAccount?: () => Promise<void>
}

export function ProfileSettingsPanel({
  profile,
  isDemo = false,
  busy = false,
  error,
  deleteAccountBusy = false,
  onSave,
  onAvatar,
  onSignOut,
  onDeleteAccount,
}: ProfileSettingsPanelProps) {
  const [displayName, setDisplayName] = useState(profile.displayName)
  const [bio, setBio] = useState(profile.bio ?? '')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const avatarPreviews = useObjectUrls(avatarFile ? [avatarFile] : [])
  const localAvatar = avatarPreviews[0]?.url ?? null

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDisplayName(profile.displayName)
    setBio(profile.bio ?? '')
    setAvatarFile(null)
  }, [profile])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    await onSave({
      displayName,
      bio: bio || null,
    })
  }

  const changeAvatar = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      await onAvatar(file)
    }
    event.target.value = ''
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-5 flex items-center gap-4">
          <Avatar
            name={displayName || profile.displayName}
            size="lg"
            src={localAvatar ?? profile.avatarUrl}
          />
          <label className="focus-ring inline-flex h-10 cursor-pointer items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-card)] px-3 text-sm font-semibold transition duration-200 hover:bg-[var(--color-surface)]">
            {busy ? <RefreshCw className="animate-spin" size={17} /> : <Camera size={17} />}
            更换头像
            <input
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              disabled={busy || isDemo}
              onChange={changeAvatar}
              type="file"
            />
          </label>
        </div>

        {error ? (
          <Notice className="mb-4" tone="error">
            {error}
          </Notice>
        ) : null}

        <form className="space-y-4" onSubmit={submit}>
          <Input
            disabled={isDemo}
            label="昵称"
            maxLength={40}
            onChange={(event) => setDisplayName(event.target.value)}
            required
            value={displayName}
          />
          <Textarea
            disabled={isDemo}
            label="简介"
            maxLength={160}
            onChange={(event) => setBio(event.target.value)}
            placeholder="写一点只给圈内好友看的介绍"
            value={bio}
          />
          <Button disabled={busy || isDemo || !displayName.trim()} fullWidth type="submit">
            {busy ? <RefreshCw className="animate-spin" size={17} /> : <Save size={17} />}
            保存资料
          </Button>
        </form>
      </div>

      <div className="border-t border-[var(--color-border)] pt-6">
        <h3 className="mb-2 text-sm font-semibold text-[var(--color-text)]">账户操作</h3>
        <div className="space-y-3">
          {onSignOut ? (
            <Button fullWidth onClick={onSignOut} variant="subtle">
              <LogOut size={16} />
              退出登录
            </Button>
          ) : null}
          {onDeleteAccount ? (
            <Button
              disabled={isDemo || deleteAccountBusy}
              fullWidth
              onClick={() => setDeleteConfirmOpen(true)}
              variant="danger"
            >
              <Trash2 size={16} />
              注销账号
            </Button>
          ) : null}
        </div>
      </div>

      <ConfirmDialog
        busy={deleteAccountBusy}
        description="注销后，你的所有数据（包括动态、评论、圈子成员身份等）将被永久删除，此操作不可撤销。"
        onCancel={() => setDeleteConfirmOpen(false)}
        onConfirm={async () => {
          await onDeleteAccount?.()
          setDeleteConfirmOpen(false)
        }}
        open={deleteConfirmOpen}
        title="确认注销账号"
      />
    </div>
  )
}
