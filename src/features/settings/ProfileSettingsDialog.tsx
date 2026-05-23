import { Camera, RefreshCw, Save } from 'lucide-react'
import type { ChangeEvent, FormEvent } from 'react'
import { useEffect, useState } from 'react'
import type { Profile } from '../../types/domain'
import { Avatar } from '../../components/ui/Avatar'
import { Button } from '../../components/ui/Button'
import { Dialog } from '../../components/ui/Dialog'
import { Input } from '../../components/ui/Input'
import { Notice } from '../../components/ui/Notice'
import { Textarea } from '../../components/ui/Textarea'

type ProfileSettingsDialogProps = {
  open: boolean
  profile: Profile
  busy?: boolean
  error?: string | null
  onClose: () => void
  onSave: (input: { displayName: string; bio: string | null }) => Promise<void>
  onAvatar: (file: File) => Promise<void>
}

export function ProfileSettingsDialog({
  open,
  profile,
  busy = false,
  error,
  onClose,
  onSave,
  onAvatar,
}: ProfileSettingsDialogProps) {
  const [displayName, setDisplayName] = useState(profile.displayName)
  const [bio, setBio] = useState(profile.bio ?? '')
  const [localAvatar, setLocalAvatar] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      return
    }
    setDisplayName(profile.displayName)
    setBio(profile.bio ?? '')
    setLocalAvatar(null)
  }, [open, profile])

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
      const previewUrl = URL.createObjectURL(file)
      setLocalAvatar(previewUrl)
      await onAvatar(file)
    }
    event.target.value = ''
  }

  return (
    <Dialog onClose={onClose} open={open} title="编辑资料">
      <div className="mb-5 flex items-center gap-4">
        <Avatar
          name={displayName || profile.displayName}
          size="lg"
          src={localAvatar ?? profile.avatarUrl}
        />
        <label className="focus-ring inline-flex h-10 cursor-pointer items-center gap-2 rounded-[8px] border border-[var(--color-border)] bg-white px-3 text-sm font-semibold transition duration-200 hover:bg-slate-50">
          {busy ? <RefreshCw className="animate-spin" size={17} /> : <Camera size={17} />}
          更换头像
          <input
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            disabled={busy}
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
          label="昵称"
          maxLength={40}
          onChange={(event) => setDisplayName(event.target.value)}
          required
          value={displayName}
        />
        <Textarea
          label="简介"
          maxLength={160}
          onChange={(event) => setBio(event.target.value)}
          placeholder="写一点只给圈内好友看的介绍"
          value={bio}
        />
        <Button disabled={busy || !displayName.trim()} fullWidth type="submit">
          {busy ? <RefreshCw className="animate-spin" size={17} /> : <Save size={17} />}
          保存资料
        </Button>
      </form>
    </Dialog>
  )
}
