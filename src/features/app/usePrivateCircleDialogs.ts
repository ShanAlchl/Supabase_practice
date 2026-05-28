import { useState } from 'react'

export type SettingsTab = 'profile' | 'circle'

export const usePrivateCircleDialogs = () => {
  const [membersOpen, setMembersOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('profile')

  return {
    membersOpen,
    notificationsOpen,
    setMembersOpen,
    setNotificationsOpen,
    settingsOpen,
    setSettingsOpen,
    settingsTab,
    setSettingsTab,
  }
}
