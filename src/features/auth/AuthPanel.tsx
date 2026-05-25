import { useState } from 'react'
import type { FormEvent } from 'react'
import { Lock, Mail, Sparkles } from 'lucide-react'
import { signInWithEmail, signUpWithEmail, sendPasswordReset } from '../../services/authService'
import { getErrorMessage } from '../../lib/errors'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Notice } from '../../components/ui/Notice'

type AuthMode = 'signin' | 'signup' | 'reset'

export function AuthPanel() {
  const [mode, setMode] = useState<AuthMode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [messageTone, setMessageTone] = useState<'success' | 'error'>('success')
  const [busy, setBusy] = useState(false)

  const resetForm = () => {
    setMessage('')
    setPassword('')
  }

  const switchMode = (next: AuthMode) => {
    setMode(next)
    resetForm()
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setMessage('')

    try {
      if (mode === 'signin') {
        await signInWithEmail(email, password)
        setMessageTone('success')
        setMessage('登录成功，正在进入你的私密圈子。')
      } else if (mode === 'signup') {
        await signUpWithEmail(email, password)
        setMessageTone('success')
        setMessage('注册成功。如果当前项目开启了邮箱确认，请先完成邮箱验证。')
      } else if (mode === 'reset') {
        await sendPasswordReset(email)
        setMessageTone('success')
        setMessage('重置密码邮件已发送，请检查邮箱。')
      }
    } catch (err) {
      setMessageTone('error')
      setMessage(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const isReset = mode === 'reset'
  const isSignup = mode === 'signup'

  return (
    <main className="flex min-h-svh items-center justify-center bg-[var(--color-page)] px-4 py-8 text-[var(--color-text)] sm:px-6">
      <div className="w-full max-w-md">
        <section className="mb-6 text-center">
          <div className="flex items-center gap-3">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)] text-white shadow-[var(--shadow-card)]">
              <Sparkles size={20} />
            </div>
          </div>
          <p className="mt-3 text-sm font-semibold text-[var(--color-primary)]">CloseCircle</p>
          <h1 className="mt-1 text-2xl font-semibold leading-tight text-[var(--color-text)]">
            登录你的私密朋友圈
          </h1>
          <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">使用邮箱继续。</p>
        </section>

        <Card elevated className="p-5 sm:p-6">
          <div className="mb-6">
            <p className="text-sm font-semibold text-[var(--color-primary)]">
              {isReset ? '找回密码' : isSignup ? '创建账号' : '欢迎回来'}
            </p>
            <h2 className="mt-1 text-xl font-semibold text-[var(--color-text)]">
              {isReset ? '通过邮箱重置密码' : isSignup ? '使用邮箱创建账号' : '登录'}
            </h2>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <>
              <Input
                autoComplete="email"
                icon={<Mail size={18} />}
                label="邮箱"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
                type="email"
                value={email}
              />
              {!isReset ? (
                <Input
                  autoComplete={isSignup ? 'new-password' : 'current-password'}
                  hint={isSignup ? '至少 6 位，建议使用不重复的密码。' : undefined}
                  icon={<Lock size={18} />}
                  label="密码"
                  minLength={6}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="至少 6 位"
                  required
                  type="password"
                  value={password}
                />
              ) : null}
            </>
            <Button disabled={busy} fullWidth size="lg" type="submit" variant="primary">
              {busy
                ? '处理中...'
                : isReset
                  ? '发送重置邮件'
                  : mode === 'signin'
                    ? '进入朋友圈'
                    : '创建账号'}
            </Button>
            {message ? <Notice tone={messageTone}>{message}</Notice> : null}
          </form>

          {mode === 'signin' ? (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
              <button
                className="text-[var(--color-primary)] transition hover:text-[var(--color-primary-hover)]"
                onClick={() => switchMode('reset')}
                type="button"
              >
                忘记密码？
              </button>
              <button
                className="text-[var(--color-primary)] transition hover:text-[var(--color-primary-hover)]"
                onClick={() => switchMode('signup')}
                type="button"
              >
                创建账号
              </button>
            </div>
          ) : null}

          {(isReset || isSignup) && (
            <div className="mt-4 text-sm">
              <button
                className="text-[var(--color-primary)] transition hover:text-[var(--color-primary-hover)]"
                onClick={() => switchMode('signin')}
                type="button"
              >
                返回登录
              </button>
            </div>
          )}

          <p className="mt-5 text-xs leading-5 text-[var(--color-muted)]">
            你的内容只会按照 Supabase RLS 策略开放给圈子成员。第一版用于学习和验证私密动态流的完整链路。
          </p>
        </Card>
      </div>
    </main>
  )
}
