import { useState } from 'react'
import type { FormEvent } from 'react'
import { KeyRound, Lock, Save } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Notice } from '../../components/ui/Notice'
import { getErrorMessage } from '../../lib/errors'
import { updatePassword } from '../../services/authService'

export function ResetPasswordPanel() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [tone, setTone] = useState<'success' | 'error'>('success')

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setMessage('')

    if (password !== confirmPassword) {
      setTone('error')
      setMessage('两次输入的密码不一致。')
      return
    }

    setBusy(true)
    try {
      await updatePassword(password)
      setTone('success')
      setMessage('密码已更新，请使用新密码登录。')
      setPassword('')
      setConfirmPassword('')
    } catch (err) {
      setTone('error')
      setMessage(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-[var(--color-page)] px-4 py-8 text-[var(--color-text)]">
      <Card elevated className="w-full max-w-md p-5 sm:p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)] text-white">
            <KeyRound size={20} />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--color-primary)]">重置密码</p>
            <h1 className="text-xl font-semibold">设置一个新密码</h1>
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
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
            label="再次输入新密码"
            minLength={6}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="再次输入新密码"
            required
            type="password"
            value={confirmPassword}
          />
          <Button
            disabled={busy || !password || !confirmPassword}
            fullWidth
            type="submit"
            variant="primary"
          >
            <Save size={17} />
            {busy ? '正在更新...' : '更新密码'}
          </Button>
          {message ? <Notice tone={tone}>{message}</Notice> : null}
        </form>

        <Button
          className="mt-4"
          fullWidth
          onClick={() => {
            window.location.href = '/'
          }}
          type="button"
          variant="subtle"
        >
          返回登录
        </Button>
      </Card>
    </main>
  )
}
