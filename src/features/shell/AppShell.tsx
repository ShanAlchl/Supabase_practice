import {
  Bell,
  Camera,
  Home,
  LogOut,
  MailPlus,
  Plus,
  Settings,
  Sparkles,
  UserCog,
  UsersRound,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import type { ComponentType, ReactNode } from 'react'
import type { Circle, CircleMember, Profile, SessionUser } from '../../types/domain'
import { supabase } from '../../lib/supabase'
import { Avatar } from '../../components/ui/Avatar'
import { AvatarGroup } from '../../components/ui/AvatarGroup'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'

type PanelKey = 'feed' | 'members' | 'album' | 'notifications' | 'settings'

type NavItem = {
  key: PanelKey
  label: string
  icon: ComponentType<{ size?: number; className?: string; strokeWidth?: number }>
  disabled?: boolean
}

type AppShellProps = {
  circle: Circle
  members: CircleMember[]
  profile: Profile
  user: SessionUser | null
  isDemo: boolean
  onCompose: () => void
  onOpenInvites?: () => void
  onOpenNotifications?: () => void
  onOpenSettings?: () => void
  onOpenProfile?: () => void
  notificationCount?: number
  rightRailTools?: ReactNode
  children: ReactNode
}

const navItems: NavItem[] = [
  { key: 'feed', label: '动态', icon: Home },
  { key: 'members', label: '成员', icon: UsersRound },
  { key: 'album', label: '相册', icon: Camera, disabled: true },
  { key: 'notifications', label: '通知', icon: Bell },
  { key: 'settings', label: '设置', icon: Settings },
]

export function AppShell({
  circle,
  members,
  profile,
  user,
  isDemo,
  onCompose,
  onOpenInvites,
  onOpenNotifications,
  onOpenSettings,
  onOpenProfile,
  notificationCount = 0,
  rightRailTools,
  children,
}: AppShellProps) {
  const [activePanel, setActivePanel] = useState<PanelKey>('feed')
  const memberProfiles = useMemo(() => members.map((member) => member.profile), [members])

  const signOut = () => {
    supabase?.auth.signOut()
  }

  const moveToPanel = (panel: PanelKey, disabled?: boolean) => {
    if (disabled) {
      setActivePanel(panel)
      return
    }

    setActivePanel(panel)
    if (panel === 'notifications') {
      onOpenNotifications?.()
      return
    }
    if (panel === 'settings') {
      onOpenSettings?.()
      return
    }
    document.getElementById(panel)?.scrollIntoView({
      behavior: 'smooth',
      block: panel === 'feed' ? 'start' : 'center',
    })
  }

  return (
    <div className="min-h-svh bg-[var(--color-page)] text-[var(--color-text)]">
      <MobileHeader
        circleName={circle.name}
        notificationCount={notificationCount}
        onOpenNotifications={onOpenNotifications}
      />

      <div className="mx-auto grid max-w-[1440px] gap-5 px-4 py-4 sm:px-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-6 lg:py-6 xl:grid-cols-[280px_minmax(0,680px)_360px]">
        <LeftRail
          activePanel={activePanel}
          circle={circle}
          isDemo={isDemo}
          members={memberProfiles}
          notificationCount={notificationCount}
          onCompose={onCompose}
          onMove={moveToPanel}
          onOpenProfile={onOpenProfile}
          onSignOut={signOut}
          profile={profile}
          user={user}
        />

        <main className="min-w-0 pb-28 lg:pb-8" id="feed">
          {children}
        </main>

        <RightRail
          activePanel={activePanel}
          circle={circle}
          isDemo={isDemo}
          members={members}
          notificationCount={notificationCount}
          onCompose={onCompose}
          onOpenInvites={onOpenInvites}
          onOpenNotifications={onOpenNotifications}
          onOpenSettings={onOpenSettings}
          tools={rightRailTools}
        />
      </div>

      <MobileNavigation
        activePanel={activePanel}
        notificationCount={notificationCount}
        onCompose={onCompose}
        onMove={moveToPanel}
      />
    </div>
  )
}

function MobileHeader({
  circleName,
  notificationCount,
  onOpenNotifications,
}: {
  circleName: string
  notificationCount: number
  onOpenNotifications?: () => void
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[var(--color-page)]/80 px-5 py-3.5 backdrop-blur-xl lg:hidden">
      <div className="mx-auto flex max-w-2xl items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-primary)] text-white">
            <Sparkles size={16} />
          </div>
          <h1 className="text-lg font-bold text-[var(--color-text)]">{circleName}</h1>
        </div>
        <div className="flex items-center gap-2">
          <NotificationButton count={notificationCount} onClick={onOpenNotifications} />
        </div>
      </div>
    </header>
  )
}

function LeftRail({
  activePanel,
  circle,
  isDemo,
  members,
  notificationCount,
  onCompose,
  onMove,
  onOpenProfile,
  onSignOut,
  profile,
  user,
}: {
  activePanel: PanelKey
  circle: Circle
  isDemo: boolean
  members: Profile[]
  notificationCount: number
  onCompose: () => void
  onMove: (panel: PanelKey, disabled?: boolean) => void
  onOpenProfile?: () => void
  onSignOut: () => void
  profile: Profile
  user: SessionUser | null
}) {
  return (
    <aside className="sticky top-6 hidden h-[calc(100svh-3rem)] min-h-[620px] flex-col justify-between lg:flex">
      <Card className="flex h-full flex-col justify-between p-4">
        <div>
          <div className="mb-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[var(--color-primary)]">CloseCircle</p>
                <h1 className="mt-1 line-clamp-2 text-2xl font-semibold leading-tight">
                  {circle.name}
                </h1>
              </div>
              {isDemo ? <Badge tone="warning">Demo</Badge> : null}
            </div>
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--color-muted)]">圈子成员</span>
                <span className="text-xs font-semibold text-[var(--color-primary)]">
                  {members.length} 人
                </span>
              </div>
              <AvatarGroup people={members} />
            </div>
          </div>

          <Button className="mb-5" fullWidth onClick={onCompose} variant="cta">
            <Plus size={18} />
            发布新动态
          </Button>

          <nav className="space-y-1.5" aria-label="主导航">
            {navItems.map((item) => {
              const Icon = item.icon
              const selected = activePanel === item.key
              return (
                <button
                  aria-disabled={item.disabled}
                  className={`focus-ring flex w-full items-center justify-between gap-3 rounded-[8px] px-3 py-3 text-left text-sm font-semibold transition duration-200 ${
                    selected
                      ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                      : item.disabled
                        ? 'text-slate-400'
                        : 'text-[var(--color-muted)] hover:bg-slate-100 hover:text-[var(--color-text)]'
                  }`}
                  key={item.key}
                  onClick={() => onMove(item.key, item.disabled)}
                  type="button"
                >
                  <span className="flex items-center gap-3">
                    <Icon size={18} />
                    {item.label}
                  </span>
                  {item.key === 'notifications' && notificationCount > 0 ? (
                    <Badge tone="primary">{notificationCount}</Badge>
                  ) : item.disabled ? (
                    <span className="text-[11px] font-medium text-slate-400">稍后</span>
                  ) : null}
                </button>
              )
            })}
          </nav>
        </div>

        <div className="border-t border-[var(--color-border)] pt-4">
          <button
            className="focus-ring mb-3 flex w-full items-center gap-3 rounded-[8px] p-2 text-left transition duration-200 hover:bg-slate-50"
            onClick={onOpenProfile}
            type="button"
          >
            <Avatar
              name={profile.displayName}
              size="sm"
              src={profile.avatarUrl ?? user?.user_metadata.avatar_url}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{profile.displayName}</p>
              <p className="truncate text-xs text-[var(--color-muted)]">
                {profile.bio ?? user?.email ?? '演示模式用户'}
              </p>
            </div>
            <UserCog size={17} className="text-[var(--color-muted)]" />
          </button>
          {!isDemo ? (
            <Button fullWidth onClick={onSignOut} variant="danger">
              <LogOut size={18} />
              退出登录
            </Button>
          ) : null}
        </div>
      </Card>
    </aside>
  )
}

function RightRail({
  activePanel,
  circle,
  isDemo,
  members,
  notificationCount,
  onCompose,
  onOpenInvites,
  onOpenNotifications,
  onOpenSettings,
  tools,
}: {
  activePanel: PanelKey
  circle: Circle
  isDemo: boolean
  members: CircleMember[]
  notificationCount: number
  onCompose: () => void
  onOpenInvites?: () => void
  onOpenNotifications?: () => void
  onOpenSettings?: () => void
  tools?: ReactNode
}) {
  return (
    <aside className="sticky top-6 hidden h-[calc(100svh-3rem)] space-y-4 overflow-auto pb-2 xl:block quiet-scrollbar">
      {tools}

      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-[var(--color-primary)]">{circle.name}</p>
            <p className="mt-1 text-xs text-[var(--color-muted)]">{members.length} 位成员 · {isDemo ? '演示模式' : '私密圈子'}</p>
          </div>
          {isDemo ? <Badge tone="warning">Demo</Badge> : <Badge tone="success">私密</Badge>}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={onCompose} variant="primary">
            <Plus size={18} />
            写近况
          </Button>
          <Button disabled={isDemo} onClick={onOpenSettings} variant="subtle">
            <Settings size={18} />
            设置
          </Button>
        </div>
      </Card>

      <Card
        className={`p-5 transition-all duration-300 ${
          activePanel === 'members'
            ? 'border-[var(--color-primary)] shadow-[0_0_0_3px_rgba(45,106,79,0.12)]'
            : ''
        }`}
        id="members"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-semibold">成员</h2>
          <Badge tone="neutral">{members.length} 人</Badge>
        </div>
        <div className="space-y-3">
          {members.map((member) => (
            <div className="flex items-center gap-3" key={member.userId}>
              <Avatar
                name={member.profile.displayName}
                size="sm"
                src={member.profile.avatarUrl}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{member.profile.displayName}</p>
                <p className="text-xs text-[var(--color-muted)]">
                  {member.role === 'owner' ? '圈主' : '成员'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <div className="mb-3 flex items-center gap-2">
          <MailPlus size={18} className="text-[var(--color-primary)]" />
          <h2 className="font-semibold">邀请入口</h2>
        </div>
        <p className="text-sm leading-6 text-[var(--color-muted)]">
          生成有次数和过期时间限制的邀请码，让朋友安全加入这个圈子。
        </p>
        <Button
          className="mt-4"
          disabled={isDemo}
          fullWidth
          onClick={onOpenInvites}
          variant="subtle"
        >
          <MailPlus size={18} />
          管理邀请
        </Button>
      </Card>

      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">通知</h2>
          <Badge tone={notificationCount > 0 ? 'primary' : 'neutral'}>
            {notificationCount} 未读
          </Badge>
        </div>
        <Button disabled={isDemo} fullWidth onClick={onOpenNotifications} variant="subtle">
          <Bell size={18} />
          查看通知
        </Button>
      </Card>
    </aside>
  )
}

function NotificationButton({
  count,
  onClick,
}: {
  count: number
  onClick?: () => void
}) {
  return (
    <button
      aria-label="查看通知"
      className="focus-ring relative inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-muted)] transition duration-200 hover:bg-[var(--color-surface)]"
      onClick={onClick}
      type="button"
    >
      <Bell size={20} />
      {count > 0 ? (
        <span className="absolute right-1 top-1 min-w-4 rounded-full bg-[var(--color-rose)] px-1 text-[10px] font-semibold leading-4 text-white">
          {count}
        </span>
      ) : null}
    </button>
  )
}

function MobileNavigation({
  activePanel,
  notificationCount,
  onCompose,
  onMove,
}: {
  activePanel: PanelKey
  notificationCount: number
  onCompose: () => void
  onMove: (panel: PanelKey, disabled?: boolean) => void
}) {
  const mobileItems = navItems.filter((item) =>
    ['feed', 'members', 'notifications', 'settings'].includes(item.key),
  )

  return (
    <>
      <Button
        aria-label="发布动态"
        className="fixed bottom-20 right-5 z-40 h-14 w-14 rounded-full shadow-[var(--shadow-fab)] lg:hidden"
        onClick={onCompose}
        size="icon"
        variant="cta"
      >
        <Plus size={24} strokeWidth={2.5} />
      </Button>
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--color-border)] bg-white/95 px-3 py-2 backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-4 gap-1 text-xs font-semibold">
          {mobileItems.map((item) => {
            const Icon = item.icon
            const selected = activePanel === item.key
            return (
              <button
                aria-disabled={item.disabled}
                className={`focus-ring relative flex flex-col items-center gap-1 rounded-[var(--radius-lg)] px-3 py-2 transition-all duration-200 ${
                  selected
                    ? 'text-[var(--color-primary)] bg-[var(--color-primary-light)]'
                    : item.disabled
                      ? 'text-[var(--color-muted)]/50'
                      : 'text-[var(--color-muted)] hover:bg-[var(--color-surface)]'
                }`}
                key={item.key}
                onClick={() => onMove(item.key, item.disabled)}
                type="button"
              >
                <Icon size={20} strokeWidth={selected ? 2.5 : 2} />
                {item.key === 'notifications' && notificationCount > 0 ? (
                  <span className="absolute right-5 top-1 h-2 w-2 rounded-full bg-[var(--color-rose)]" />
                ) : null}
                <span>{item.label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </>
  )
}
