import { hasSupabaseConfig } from './lib/env'
import { AuthPanel } from './features/auth/AuthPanel'
import { ResetPasswordPanel } from './features/auth/ResetPasswordPanel'
import { useAuth } from './features/auth/useAuth'
import { DemoApp } from './features/app/DemoApp'
import { LoadingScreen } from './features/app/LoadingScreen'
import { PrivateCircleApp } from './features/app/PrivateCircleApp'

function App() {
  const auth = useAuth()

  if (window.location.pathname === '/login-preview') {
    return <AuthPanel />
  }

  if (!hasSupabaseConfig) {
    return <DemoApp />
  }

  if (auth.loading) {
    return <LoadingScreen />
  }

  if (window.location.pathname === '/reset-password') {
    return <ResetPasswordPanel />
  }

  if (!auth.user) {
    return <AuthPanel />
  }

  return <PrivateCircleApp user={auth.user} />
}

export default App
