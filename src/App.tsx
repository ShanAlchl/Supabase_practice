import { Suspense, lazy } from 'react'
import type { ReactNode } from 'react'
import { hasSupabaseConfig } from './lib/env'
import { useAuth } from './features/auth/useAuth'
import { LoadingScreen } from './features/app/LoadingScreen'

const AuthPanel = lazy(() =>
  import('./features/auth/AuthPanel').then((m) => ({ default: m.AuthPanel })),
)
const DemoApp = lazy(() =>
  import('./features/app/DemoApp').then((m) => ({ default: m.DemoApp })),
)
const PrivateCircleApp = lazy(() =>
  import('./features/app/PrivateCircleApp').then((m) => ({ default: m.PrivateCircleApp })),
)
const ResetPasswordPanel = lazy(() =>
  import('./features/auth/ResetPasswordPanel').then((m) => ({
    default: m.ResetPasswordPanel,
  })),
)

function AppSuspense({ children }: { children: ReactNode }) {
  return <Suspense fallback={<LoadingScreen />}>{children}</Suspense>
}

function App() {
  const auth = useAuth()

  if (window.location.pathname === '/login-preview') {
    return (
      <AppSuspense>
        <AuthPanel />
      </AppSuspense>
    )
  }

  if (!hasSupabaseConfig) {
    return (
      <AppSuspense>
        <DemoApp />
      </AppSuspense>
    )
  }

  if (auth.loading) {
    return <LoadingScreen />
  }

  if (window.location.pathname === '/reset-password') {
    return (
      <AppSuspense>
        <ResetPasswordPanel />
      </AppSuspense>
    )
  }

  if (auth.isPasswordRecovery || !auth.user) {
    return (
      <AppSuspense>
        <AuthPanel />
      </AppSuspense>
    )
  }

  return (
    <AppSuspense>
      <PrivateCircleApp user={auth.user} />
    </AppSuspense>
  )
}

export default App
