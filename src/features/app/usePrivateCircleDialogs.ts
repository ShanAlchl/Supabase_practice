import { useState } from 'react'

export const usePrivateCircleDialogs = () => {
  const [inviteOpen, setInviteOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [membersOpen, setMembersOpen] = useState(false)
  const [circleSettingsOpen, setCircleSettingsOpen] = useState(false)

  return {
    circleSettingsOpen,
    inviteOpen,
    membersOpen,
    notificationsOpen,
    profileOpen,
    setCircleSettingsOpen,
    setInviteOpen,
    setMembersOpen,
    setNotificationsOpen,
    setProfileOpen,
  }
}
