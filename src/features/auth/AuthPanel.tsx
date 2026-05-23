import { useState } from 'react'
import type { FormEvent } from 'react'
import { Camera, Heart, Lock, Mail, MessageCircle, Radio, Sparkles } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Avatar } from '../../components/ui/Avatar'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Notice } from '../../components/ui/Notice'

export function AuthPanel() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [messageTone, setMessageTone] = useState<'success' | 'error'>('success')
  const [busy, setBusy] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!supabase) {
      return
    }

    setBusy(true)
    setMessage('')

    const action =
      mode === 'signin'
        ? supabase.auth.signInWithPassword({ email, password })
        : supabase.auth.signUp({ email, password })

    const { error } = await action
    setBusy(false)

    if (error) {
      setMessageTone('error')
      setMessage(error.message)
      return
    }

    setMessageTone('success')
    setMessage(
      mode === 'signin'
        ? '登录成功，正在进入你的私密圈子。'
        : '注册成功。如果当前项目开启了邮箱确认，请先完成邮箱验证。',
    )
  }

  return (
    <main className="min-h-svh bg-[var(--color-page)] px-4 py-6 text-[var(--color-text)] sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100svh-3rem)] max-w-6xl items-center gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)] text-white shadow-[var(--shadow-card)]">
              <Sparkles size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--color-primary)]">CloseCircle</p>
              <h1 className="text-2xl font-semibold leading-tight text-[var(--color-text)] sm:text-3xl">
                一个安静的私密好友圈
              </h1>
            </div>
          </div>

          <p className="max-w-xl text-base leading-7 text-[var(--color-muted)]">
            用来保存朋友之间的照片、近况和评论。没有公开推荐流，也没有复杂指标，只有你们共同留下的日常。
          </p>

          <PreviewWall />
        </section>

        <Card elevated className="p-5 sm:p-6">
          <div className="mb-6">
            <p className="text-sm font-semibold text-[var(--color-primary)]">
              {mode === 'signin' ? '欢迎回来' : '创建账号'}
            </p>
            <h2 className="mt-1 text-xl font-semibold text-[var(--color-text)]">
              {mode === 'signin' ? '进入你的私密朋友圈' : '加入一个可信的小圈子'}
            </h2>
          </div>

          <div className="mb-6 grid grid-cols-2 rounded-[var(--radius-md)] bg-[var(--color-surface)] p-1">
            <button
              className={`focus-ring rounded-[10px] px-4 py-2.5 text-sm font-semibold transition duration-200 ${
                mode === 'signin'
                  ? 'bg-white text-[var(--color-text)] shadow-sm'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
              }`}
              onClick={() => setMode('signin')}
              type="button"
            >
              登录
            </button>
            <button
              className={`focus-ring rounded-[10px] px-4 py-2.5 text-sm font-semibold transition duration-200 ${
                mode === 'signup'
                  ? 'bg-white text-[var(--color-text)] shadow-sm'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
              }`}
              onClick={() => setMode('signup')}
              type="button"
            >
              注册
            </button>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
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
            <Input
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              hint={mode === 'signup' ? '至少 6 位，建议使用不重复的密码。' : undefined}
              icon={<Lock size={18} />}
              label="密码"
              minLength={6}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="至少 6 位"
              required
              type="password"
              value={password}
            />
            <Button disabled={busy} fullWidth size="lg" type="submit" variant="primary">
              {busy ? '处理中...' : mode === 'signin' ? '进入朋友圈' : '创建账号'}
            </Button>
            {message ? <Notice tone={messageTone}>{message}</Notice> : null}
          </form>

          <p className="mt-5 text-xs leading-5 text-[var(--color-muted)]">
            你的内容只会按照 Supabase RLS 策略开放给圈子成员。第一版用于学习和验证私密动态流的完整链路。
          </p>
        </Card>
      </div>
    </main>
  )
}

function PreviewWall() {
  return (
    <Card className="overflow-hidden p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[var(--color-text)]">今天的小片段</h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">仅好友可见 · 实时同步</p>
        </div>
        <Badge tone="primary">
          <Radio size={12} />
          私密
        </Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_0.8fr]">
        <div
          aria-label="朋友聚会照片预览"
          className="relative min-h-56 overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[linear-gradient(135deg,#ccfbf1_0%,#fef3c7_52%,#ffe4e6_100%)] sm:h-full"
          role="img"
        >
          <div className="absolute left-6 top-6 h-24 w-24 rounded-full bg-white/45 blur-xl" />
          <div className="absolute bottom-5 left-5 right-5 rounded-[var(--radius-md)] border border-white/60 bg-white/70 p-3 shadow-sm backdrop-blur">
            <p className="text-sm font-semibold text-[var(--color-text)]">周末小聚</p>
            <p className="mt-1 text-xs text-[var(--color-muted)]">3 张照片 · 6 位朋友</p>
          </div>
        </div>
        <div className="space-y-3">
          <div className="rounded-[var(--radius-md)] bg-[var(--color-primary-light)]/40 p-4">
            <div className="flex items-start gap-3">
              <Avatar name="林夏" size="sm" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--color-text)]">林夏</p>
                <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
                  晚饭后大家一起散步。照片不多，但刚好够记住这个晚上。
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-3 text-sm text-[var(--color-muted)]">
              <span className="inline-flex items-center gap-1">
                <Heart size={16} className="text-[var(--color-rose)]" />6
              </span>
              <span className="inline-flex items-center gap-1">
                <MessageCircle size={16} />2 条评论
              </span>
            </div>
          </div>

          <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--color-text)]">
              <Camera size={17} className="text-[var(--color-primary)]" />
              照片记录
            </div>
            <div className="grid grid-cols-3 gap-2">
              {['bg-teal-100', 'bg-orange-100', 'bg-rose-100'].map((color, index) => (
                <div
                  aria-label={`照片缩略图 ${index + 1}`}
                  className={`aspect-square rounded-[var(--radius-sm)] ${color}`}
                  key={color}
                  role="img"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
