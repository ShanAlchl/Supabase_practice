import { beforeEach, describe, expect, it, vi } from 'vitest'

const updateUser = vi.fn()

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      updateUser,
    },
  },
}))

describe('updatePassword', () => {
  beforeEach(() => {
    updateUser.mockReset()
  })

  it('updates the active Supabase recovery session password', async () => {
    updateUser.mockResolvedValue({ error: null })
    const { updatePassword } = await import('./authService')

    await updatePassword('new-password')

    expect(updateUser).toHaveBeenCalledWith({ password: 'new-password' })
  })

  it('rejects short passwords before calling Supabase', async () => {
    const { updatePassword } = await import('./authService')

    await expect(updatePassword('123')).rejects.toThrow('密码至少需要 6 位。')
    expect(updateUser).not.toHaveBeenCalled()
  })
})
