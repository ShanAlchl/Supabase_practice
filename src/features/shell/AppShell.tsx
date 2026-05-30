import {
  Bell,
  Camera,
  Home,
  LogOut,
  Plus,
  Settings,
  Sparkles,
  UserCog,
  UsersRound,
} from 'lucide-react'
import type { ComponentType, ReactNode } from 'react'
import type { Circle, CircleMember, Profile, SessionUser } from '../../types/domain'
import { supabase } from '../../lib/supabase'
import { Avatar } from '../../components/ui/Avatar'

import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'

export type PanelKey = 'feed' | 'members' | 'album' | 'notifications' | 'settings'

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
  activePanel: PanelKey
  onActivePanelChange: (panel: PanelKey) => void
  onCompose: () => void
  onOpenNotifications?: () => void
  onOpenSettings?: () => void
  onOpenProfile?: () => void
  onOpenMembers?: () => void
  notificationCount?: number
  mobileTopTools?: ReactNode
  rightRailTools?: ReactNode
  children: ReactNode
}

const leftNavItems: NavItem[] = [
  { key: 'feed', label: '动态', icon: Home },
  { key: 'album', label: '相册', icon: Camera },
]

const mobileNavItems: NavItem[] = [
  { key: 'feed', label: '动态', icon: Home },
  { key: 'album', label: '相册', icon: Camera },
  { key: 'members', label: '成员', icon: UsersRound },
  { key: 'notifications', label: '通知', icon: Bell },
  { key: 'settings', label: '设置', icon: Settings },
]

export function AppShell({
  circle,
  members,
  profile,
  user,
  isDemo,
  activePanel,
  onActivePanelChange,
  onCompose,
  onOpenNotifications,
  onOpenSettings,
  onOpenProfile,
  onOpenMembers,
  notificationCount = 0,
  mobileTopTools,
  rightRailTools,
  children,
}: AppShellProps) {
  const signOut = () => {
    supabase?.auth.signOut()
  }

  const moveToPanel = (panel: PanelKey, disabled?: boolean) => {
    if (disabled) {
      onActivePanelChange(panel)
      return
    }

    onActivePanelChange(panel)
    if (panel === 'members') {
      onOpenMembers?.()
      return
    }
    if (panel === 'notifications') {
      onOpenNotifications?.()
      return
    }
    document.getElementById(panel)?.scrollIntoView({
      behavior: 'smooth',
      block: panel === 'feed' ? 'start' : 'center',
    })
  }

  return (
    <div className="min-h-svh bg-[var(--color-page)] text-[var(--color-text)] lg:h-screen lg:overflow-hidden">
      <div className="fixed inset-x-0 top-0 z-30 lg:hidden">
        <MobileHeader
          circleName={circle.name}
          notificationCount={notificationCount}
          onOpenMembers={onOpenMembers}
          onOpenNotifications={onOpenNotifications}
        />
        {mobileTopTools}
      </div>

      <div
        className={`mx-auto grid max-w-[1440px] gap-5 px-4 pb-4 ${
          mobileTopTools ? 'pt-32' : 'pt-20'
        } sm:px-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-6 lg:py-6 xl:grid-cols-[280px_minmax(0,680px)_360px] lg:h-[calc(100vh-3rem)]`}
      >
        <LeftRail
          activePanel={activePanel}
          circle={circle}
          isDemo={isDemo}
          onCompose={onCompose}
          onMove={moveToPanel}
          onOpenProfile={onOpenProfile}
          onSignOut={signOut}
          profile={profile}
          user={user}
        />

        <main className="min-w-0 h-full overflow-auto quiet-scrollbar pb-28 lg:pb-8" id="feed">
          {children}
        </main>

        <RightRail
          circle={circle}
          isDemo={isDemo}
          members={members}
          notificationCount={notificationCount}
          onOpenMembers={onOpenMembers}
          onOpenNotifications={onOpenNotifications}
          onOpenSettings={onOpenSettings}
          tools={rightRailTools}
        />
      </div>

      <MobileNavigation
        activePanel={activePanel}
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
  onOpenMembers,
}: {
  circleName: string
  notificationCount: number
  onOpenNotifications?: () => void
  onOpenMembers?: () => void
}) {
  return (
    <header className="border-b border-[var(--color-border)] bg-[var(--color-page)]/80 px-5 py-3.5 backdrop-blur-xl">
      <div className="mx-auto flex max-w-2xl items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-primary)] text-white">
            <Sparkles size={16} />
          </div>
          <h1 className="text-lg font-bold text-[var(--color-text)]">{circleName}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            aria-label="查看成员"
            className="focus-ring relative inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-muted)] transition duration-200 hover:bg-[var(--color-surface)]"
            onClick={onOpenMembers}
            type="button"
          >
            <UsersRound size={20} />
          </button>
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
  onCompose: () => void
  onMove: (panel: PanelKey, disabled?: boolean) => void
  onOpenProfile?: () => void
  onSignOut: () => void
  profile: Profile
  user: SessionUser | null
}) {
  return (
    <aside className="hidden h-full flex-col overflow-auto quiet-scrollbar lg:flex">
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
          </div>

          <Button className="mb-5" fullWidth onClick={onCompose} variant="cta">
            <Plus size={18} />
            发布新动态
          </Button>

          <nav className="space-y-1.5" aria-label="主导航">
            {leftNavItems.map((item) => {
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
                  {item.disabled ? (
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
  circle,
  isDemo,
  members,
  notificationCount = 0,
  onOpenMembers,
  onOpenNotifications,
  onOpenSettings,
  tools,
}: {
  circle: Circle
  isDemo: boolean
  members: CircleMember[]
  notificationCount?: number
  onOpenMembers?: () => void
  onOpenNotifications?: () => void
  onOpenSettings?: () => void
  tools?: ReactNode
}) {
  return (
    <aside className="hidden h-full space-y-4 overflow-auto pb-2 xl:block quiet-scrollbar">
      {tools}

      {/* Members */}
      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[var(--color-text)]">成员</h3>
          {onOpenMembers ? (
            <button
              className="text-xs font-medium text-[var(--color-primary)] hover:underline"
              onClick={onOpenMembers}
              type="button"
            >
              查看全部
            </button>
          ) : null}
        </div>
        <div className="flex items-center">
          <div className="flex -space-x-2">
            {members.slice(0, 5).map((m) => (
              <div key={m.userId} className="relative inline-block rounded-full ring-2 ring-white">
                <Avatar
                  name={m.profile.displayName}
                  size="sm"
                  src={m.profile.avatarUrl}
                />
              </div>
            ))}
          </div>
          {members.length > 5 ? (
            <div className="ml-2 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-surface)] text-xs font-semibold text-[var(--color-muted)]">
              +{members.length - 5}
            </div>
          ) : null}
        </div>
        <p className="mt-2 text-xs text-[var(--color-muted)]">{members.length} 位成员</p>
      </Card>

      {/* Notifications */}
      {onOpenNotifications ? (
        <Card className="overflow-hidden p-0">
          <button
            className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-[var(--color-surface)]"
            onClick={onOpenNotifications}
            type="button"
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text)]">
              <Bell size={16} />
              通知
            </span>
            {notificationCount > 0 ? (
              <Badge tone="primary">{notificationCount}</Badge>
            ) : null}
          </button>
        </Card>
      ) : null}

      {/* Circle Info */}
      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-[var(--color-primary)]">{circle.name}</p>
            <p className="mt-1 text-xs text-[var(--color-muted)]">{members.length} 位成员 · {isDemo ? '演示模式' : '私密圈子'}</p>
          </div>
          {isDemo ? <Badge tone="warning">Demo</Badge> : <Badge tone="success">私密</Badge>}
        </div>
        <Button disabled={isDemo} fullWidth onClick={onOpenSettings} variant="subtle">
          <Settings size={18} />
          设置
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
  onCompose,
  onMove,
}: {
  activePanel: PanelKey
  onCompose: () => void
  onMove: (panel: PanelKey, disabled?: boolean) => void
}) {
  const mobileItems = mobileNavItems.filter((item) =>
    ['feed', 'album', 'settings'].includes(item.key),
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
        <div className="mx-auto grid max-w-md grid-cols-3 gap-1 text-xs font-semibold">
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
                <span>{item.label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </>
  )
}
