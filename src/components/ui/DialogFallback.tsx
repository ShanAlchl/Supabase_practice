import { Loader2 } from 'lucide-react'

export function DialogFallback() {
  return (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="animate-spin text-[var(--color-muted)]" size={24} />
    </div>
  )
}
