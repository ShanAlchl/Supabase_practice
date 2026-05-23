import { Camera } from 'lucide-react'
import { Button } from './Button'
import { Card } from './Card'

type EmptyStateProps = {
  onCompose: () => void
}

export function EmptyState({ onCompose }: EmptyStateProps) {
  return (
    <Card className="border-dashed px-6 py-12 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-soft)] text-[var(--color-primary)]">
        <Camera size={22} />
      </div>
      <h2 className="text-lg font-semibold text-[var(--color-text)]">还没有动态</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[var(--color-muted)]">
        从一张照片、一句近况开始，把只属于你们的小片段留下来。
      </p>
      <Button className="mt-6" onClick={onCompose} variant="cta">
        发布第一条动态
      </Button>
    </Card>
  )
}
