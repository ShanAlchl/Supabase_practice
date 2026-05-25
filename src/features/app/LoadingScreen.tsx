import { Loader2 } from 'lucide-react'
import { Card } from '../../components/ui/Card'

export function LoadingScreen() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-[var(--color-page)] px-5">
      <Card className="flex items-center gap-3 px-6 py-5 text-sm font-semibold text-[var(--color-muted)]">
        <Loader2 className="animate-spin text-[var(--color-primary)]" size={18} />
        正在加载私密朋友圈...
      </Card>
    </main>
  )
}
