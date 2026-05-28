import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { KeyRound, Lock, Mail, Sparkles } from 'lucide-react'
import {
  completePasswordReset,
  requestPasswordResetCode,
  signInWithEmail,
  signUpWithEmail,
  verifyPasswordResetCode,
} from '../../services/authService'
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
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [messageTone, setMessageTone] = useState<'success' | 'error'>('success')
  const [resetCodeVerified, setResetCodeVerified] = useState(false)
  const [resetCodeSent, setResetCodeSent] = useState(false)
  const [resetCooldown, setResetCooldown] = useState(0)
  const [resetToken, setResetToken] = useState('')
  const [busy, setBusy] = useState(false)

  const resetForm = () => {
    setConfirmPassword('')
    setMessage('')
    setPassword('')
    setResetCodeVerified(false)
    setResetCooldown(0)
    setResetCodeSent(false)
    setResetToken('')
  }

  const switchMode = (next: AuthMode) => {
    setMode(next)
    resetForm()
  }

  const hasResetCooldown = resetCooldown > 0

  useEffect(() => {
    if (!hasResetCooldown) return
    const timer = window.setInterval(() => {
      setResetCooldown((current) => Math.max(0, current - 1))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [hasResetCooldown])

  const sendResetCode = async (successMessage: string) => {
    if (resetCooldown > 0) return
    await requestPasswordResetCode(email)
    setResetCodeSent(true)
    setResetCodeVerified(false)
    setResetCooldown(60)
    setMessageTone('success')
    setMessage(successMessage)
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
        if (!resetCodeSent) {
          await sendResetCode('验证码已发送到你的注册邮箱。')
        } else if (!resetCodeVerified) {
          await verifyPasswordResetCode({
            email,
            token: resetToken,
          })
          setResetCodeVerified(true)
          setMessageTone('success')
          setMessage('验证码已通过，请设置新密码。')
        } else {
          if (password !== confirmPassword) {
            setMessageTone('error')
            setMessage('两次输入的密码不一致。')
            return
          }

          await completePasswordReset(password)
          setMode('signin')
          setPassword('')
          setConfirmPassword('')
          setResetCodeVerified(false)
          setResetCooldown(0)
          setResetCodeSent(false)
          setResetToken('')
          setMessageTone('success')
          setMessage('密码已更新，请使用新密码登录。')
        }
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
              {isReset && resetCodeSent ? (
                <>
                  <Input
                    autoComplete="one-time-code"
                    disabled={resetCodeVerified}
                    icon={<KeyRound size={18} />}
                    inputMode="numeric"
                    label="验证码"
                    maxLength={10}
                    onChange={(event) => setResetToken(event.target.value)}
                    placeholder="输入邮件中的验证码"
                    required
                    value={resetToken}
                  />
                  {resetCodeVerified ? (
                    <>
                      <Input
                        autoComplete="new-password"
                        icon={<Lock size={18} />}
                        label="新密码"
                        minLength={6}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="至少 6 位"
                        required
                        type="password"
                        value={password}
                      />
                      <Input
                        autoComplete="new-password"
                        icon={<Lock size={18} />}
                        label="确认新密码"
                        minLength={6}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        placeholder="再次输入新密码"
                        required
                        type="password"
                        value={confirmPassword}
                      />
                    </>
                  ) : null}
                </>
              ) : !isReset ? (
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
                  ? resetCodeSent
                    ? resetCodeVerified
                      ? '更新密码'
                      : '验证验证码'
                    : '发送验证码'
                  : mode === 'signin'
                    ? '进入朋友圈'
                    : '创建账号'}
            </Button>
            {message ? <Notice tone={messageTone}>{message}</Notice> : null}
          </form>

          {isReset && resetCodeSent && !resetCodeVerified ? (
            <div className="mt-4 text-sm">
              <button
                className="text-[var(--color-primary)] transition hover:text-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:text-[var(--color-muted)]"
                disabled={busy || resetCooldown > 0}
                onClick={async () => {
                  if (resetCooldown > 0) return
                  setBusy(true)
                  setMessage('')
                  try {
                    await sendResetCode('新的验证码已发送，请检查邮箱。')
                  } catch (err) {
                    setMessageTone('error')
                    setMessage(getErrorMessage(err))
                  } finally {
                    setBusy(false)
                  }
                }}
                type="button"
              >
                {resetCooldown > 0 ? `${resetCooldown} 秒后重新发送` : '重新发送验证码'}
              </button>
            </div>
          ) : null}

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
