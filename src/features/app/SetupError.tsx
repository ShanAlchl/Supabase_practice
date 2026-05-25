import { Card } from '../../components/ui/Card'
import { Notice } from '../../components/ui/Notice'

type SetupErrorProps = {
  detail: string
  compact?: boolean
}

export function SetupError({ detail, compact = false }: SetupErrorProps) {
  if (compact) {
    return (
      <Notice tone="error" title="Supabase 还没有准备好">
        {detail}
      </Notice>
    )
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-[var(--color-page)] px-5">
      <Card className="max-w-xl p-6">
        <Notice tone="error" title="Supabase 还没有准备好">
          <p>{detail}</p>
          <p className="mt-3">
            请确认已经在 Supabase Dashboard 的 SQL Editor 运行{' '}
            <code>scripts/init.sql</code>，并且 <code>.env.local</code> 中的 URL 和
            anon key 正确。
          </p>
        </Notice>
      </Card>
    </main>
  )
}
