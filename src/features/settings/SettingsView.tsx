import { User, UsersRound } from 'lucide-react'
import type { ReactNode } from 'react'

export type SettingsTab = 'profile' | 'circle'

type SettingsViewProps = {
  activeTab: SettingsTab
  onTabChange: (tab: SettingsTab) => void
  profilePanel: ReactNode
  circlePanel: ReactNode
}

export function SettingsView({
  activeTab,
  onTabChange,
  profilePanel,
  circlePanel,
}: SettingsViewProps) {
  return (
    <div className="mx-auto max-w-2xl">
      <nav className="mb-6 flex gap-2 border-b border-[var(--color-border)] pb-1" aria-label="设置导航">
        <button
          className={`focus-ring flex items-center gap-2 rounded-t-[var(--radius-sm)] px-4 py-2.5 text-sm font-semibold transition ${
            activeTab === 'profile'
              ? 'border-b-2 border-[var(--color-primary)] text-[var(--color-primary)]'
              : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
          }`}
          onClick={() => onTabChange('profile')}
          type="button"
        >
          <User size={17} />
          个人资料
        </button>
        <button
          className={`focus-ring flex items-center gap-2 rounded-t-[var(--radius-sm)] px-4 py-2.5 text-sm font-semibold transition ${
            activeTab === 'circle'
              ? 'border-b-2 border-[var(--color-primary)] text-[var(--color-primary)]'
              : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
          }`}
          onClick={() => onTabChange('circle')}
          type="button"
        >
          <UsersRound size={17} />
          圈子设置
        </button>
      </nav>

      <div className="min-w-0">
        {activeTab === 'profile' ? profilePanel : circlePanel}
      </div>
    </div>
  )
}
