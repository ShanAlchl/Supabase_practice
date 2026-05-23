import { useMemo, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { ImagePlus, Loader2, Lock, Send, X } from 'lucide-react'
import type { Circle, SessionUser } from '../../types/domain'
import { Avatar } from '../../components/ui/Avatar'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Textarea } from '../../components/ui/Textarea'

type ComposerProps = {
  circle: Circle
  user: SessionUser | null
  demoName?: string
  onSubmit: (body: string, files: File[]) => Promise<void> | void
  submitting?: boolean
}

const MAX_IMAGES = 6

export function Composer({
  circle,
  user,
  demoName = '你',
  onSubmit,
  submitting = false,
}: ComposerProps) {
  const [body, setBody] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [expanded, setExpanded] = useState(false)

  const previews = useMemo(
    () =>
      files.map((file) => ({
        name: file.name,
        url: URL.createObjectURL(file),
      })),
    [files],
  )

  const displayName =
    user?.user_metadata.display_name ?? user?.email?.split('@')[0] ?? demoName
  const canSubmit = Boolean(body.trim() || files.length > 0)
  const reachedImageLimit = files.length >= MAX_IMAGES

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? [])
    setFiles((current) => [...current, ...selected].slice(0, MAX_IMAGES))
    setExpanded(true)
    event.target.value = ''
  }

  const removeFile = (index: number) => {
    setFiles((current) => current.filter((_file, fileIndex) => fileIndex !== index))
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!canSubmit || submitting) {
      return
    }

    await onSubmit(body, files)
    setBody('')
    setFiles([])
    setExpanded(false)
  }

  return (
    <Card as="section" className="p-4 sm:p-5">
      <form onSubmit={handleSubmit}>
        <div className="flex gap-3">
          <Avatar name={displayName} src={user?.user_metadata.avatar_url} />
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <p className="font-semibold text-[var(--color-text)]">{displayName}</p>
              <Badge tone="primary">
                <Lock size={12} />
                {circle.name}
              </Badge>
            </div>
            <Textarea
              aria-label="发布动态内容"
              className={`bg-slate-50 transition-all duration-200 ${
                expanded || body || files.length > 0 ? 'min-h-28' : 'min-h-14'
              }`}
              maxLength={800}
              onChange={(event) => {
                setBody(event.target.value)
                if (event.target.value || !expanded) {
                  setExpanded(true)
                }
              }}
              onFocus={() => setExpanded(true)}
              placeholder="记录今天发生的小事..."
              value={body}
            />
          </div>
        </div>

        {previews.length > 0 ? (
          <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
            {previews.map((preview, index) => (
              <div
                className="group relative aspect-square overflow-hidden rounded-[8px] border border-[var(--color-border)] bg-slate-100"
                key={preview.url}
              >
                <img
                  alt={preview.name}
                  className="h-full w-full object-cover"
                  src={preview.url}
                />
                <button
                  aria-label="移除图片"
                  className="focus-ring absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-slate-950/60 text-white opacity-100 transition duration-200 hover:bg-slate-950/75 sm:opacity-0 sm:group-hover:opacity-100"
                  onClick={() => removeFile(index)}
                  type="button"
                >
                  <X size={15} />
                </button>
              </div>
            ))}
          </div>
        ) : null}

        {(expanded || files.length > 0 || body) && (
          <div className="mt-4 flex flex-col gap-3 border-t border-[var(--color-border)] pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <label
                aria-disabled={reachedImageLimit}
                className={`focus-ring inline-flex h-10 items-center gap-2 rounded-[8px] border px-3 text-sm font-semibold transition duration-200 ${
                  reachedImageLimit
                    ? 'cursor-not-allowed border-slate-200 text-slate-400'
                    : 'cursor-pointer border-[var(--color-border)] bg-white text-[var(--color-text)] hover:bg-slate-50'
                }`}
                tabIndex={reachedImageLimit ? -1 : 0}
              >
                <ImagePlus size={18} />
                添加图片
                <input
                  accept="image/*"
                  className="sr-only"
                  disabled={reachedImageLimit}
                  multiple
                  onChange={handleFileChange}
                  type="file"
                />
              </label>
              <span className="text-xs font-medium text-[var(--color-muted)]">
                {files.length}/{MAX_IMAGES} 张图片
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 sm:justify-end">
              <span className="text-xs font-medium text-[var(--color-muted)]">
                {body.length}/800
              </span>
              <Button disabled={!canSubmit || submitting} type="submit" variant="primary">
                {submitting ? <Loader2 className="animate-spin" size={17} /> : <Send size={17} />}
                {submitting ? '发布中' : '发布'}
              </Button>
            </div>
          </div>
        )}
      </form>
    </Card>
  )
}
