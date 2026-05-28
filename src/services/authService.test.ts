import { beforeEach, describe, expect, it, vi } from 'vitest'

const updateUser = vi.fn()
const resetPasswordForEmail = vi.fn()
const signOut = vi.fn()
const verifyOtp = vi.fn()

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      resetPasswordForEmail,
      signOut,
      updateUser,
      verifyOtp,
    },
  },
}))

describe('updatePassword', () => {
  beforeEach(() => {
    resetPasswordForEmail.mockReset()
    signOut.mockReset()
    updateUser.mockReset()
    verifyOtp.mockReset()
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

describe('requestPasswordResetCode', () => {
  beforeEach(() => {
    resetPasswordForEmail.mockReset()
  })

  it('requests a recovery OTP email without redirecting to a password link page', async () => {
    resetPasswordForEmail.mockResolvedValue({ error: null })
    const { requestPasswordResetCode } = await import('./authService')

    await requestPasswordResetCode(' User@Example.com ')

    expect(resetPasswordForEmail).toHaveBeenCalledWith('user@example.com')
  })
})

describe('resetPasswordWithOtp', () => {
  beforeEach(() => {
    signOut.mockReset()
    updateUser.mockReset()
    verifyOtp.mockReset()
  })

  it('verifies the recovery OTP, updates the password, and signs out the recovery session', async () => {
    verifyOtp.mockResolvedValue({ error: null })
    updateUser.mockResolvedValue({ error: null })
    signOut.mockResolvedValue({ error: null })
    const { resetPasswordWithOtp } = await import('./authService')

    await resetPasswordWithOtp({
      email: ' User@Example.com ',
      token: ' 12345678 ',
      password: ' new-password ',
    })

    expect(verifyOtp).toHaveBeenCalledWith({
      email: 'user@example.com',
      token: '12345678',
      type: 'recovery',
    })
    expect(updateUser).toHaveBeenCalledWith({ password: 'new-password' })
    expect(signOut).toHaveBeenCalledTimes(1)
  })

  it('rejects invalid recovery OTP input before calling Supabase', async () => {
    const { resetPasswordWithOtp } = await import('./authService')

    await expect(
      resetPasswordWithOtp({
        email: 'user@example.com',
        token: '123',
        password: 'new-password',
      }),
    ).rejects.toThrow('请输入 6 到 10 位验证码。')

    expect(verifyOtp).not.toHaveBeenCalled()
    expect(updateUser).not.toHaveBeenCalled()
  })
})

describe('verifyPasswordResetCode', () => {
  beforeEach(() => {
    updateUser.mockReset()
    verifyOtp.mockReset()
  })

  it('verifies the recovery OTP without updating the password', async () => {
    verifyOtp.mockResolvedValue({ error: null })
    const { verifyPasswordResetCode } = await import('./authService')

    await verifyPasswordResetCode({
      email: ' User@Example.com ',
      token: ' 12345678 ',
    })

    expect(verifyOtp).toHaveBeenCalledWith({
      email: 'user@example.com',
      token: '12345678',
      type: 'recovery',
    })
    expect(updateUser).not.toHaveBeenCalled()
  })
})

describe('completePasswordReset', () => {
  beforeEach(() => {
    signOut.mockReset()
    updateUser.mockReset()
  })

  it('updates the verified recovery session password and signs out', async () => {
    updateUser.mockResolvedValue({ error: null })
    signOut.mockResolvedValue({ error: null })
    const { completePasswordReset } = await import('./authService')

    await completePasswordReset(' new-password ')

    expect(updateUser).toHaveBeenCalledWith({ password: 'new-password' })
    expect(signOut).toHaveBeenCalledTimes(1)
  })
})
