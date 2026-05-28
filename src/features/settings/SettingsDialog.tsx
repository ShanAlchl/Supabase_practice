import type { ReactNode } from 'react'
import { Dialog } from '../../components/ui/Dialog'
import { SettingsView, type SettingsTab } from './SettingsView'

export type { SettingsTab }

type SettingsDialogProps = {
  open: boolean
  activeTab: SettingsTab
  onTabChange: (tab: SettingsTab) => void
  onClose: () => void
  profilePanel: ReactNode
  circlePanel: ReactNode
}

export function SettingsDialog({
  open,
  activeTab,
  onTabChange,
  onClose,
  profilePanel,
  circlePanel,
}: SettingsDialogProps) {
  return (
    <Dialog className="max-w-4xl" onClose={onClose} open={open}>
      <SettingsView
        activeTab={activeTab}
        circlePanel={circlePanel}
        onTabChange={onTabChange}
        profilePanel={profilePanel}
      />
    </Dialog>
  )
}
