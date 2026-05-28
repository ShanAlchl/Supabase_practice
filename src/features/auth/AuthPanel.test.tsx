import '@testing-library/jest-dom/vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthPanel } from './AuthPanel'

const authMocks = vi.hoisted(() => ({
  requestPasswordResetCode: vi.fn(),
  completePasswordReset: vi.fn(),
  sendPasswordReset: vi.fn(),
  signInWithEmail: vi.fn(),
  signUpWithEmail: vi.fn(),
  verifyPasswordResetCode: vi.fn(),
}))

vi.mock('../../services/authService', () => ({
  completePasswordReset: authMocks.completePasswordReset,
  requestPasswordResetCode: authMocks.requestPasswordResetCode,
  sendPasswordReset: authMocks.sendPasswordReset,
  signInWithEmail: authMocks.signInWithEmail,
  signUpWithEmail: authMocks.signUpWithEmail,
  verifyPasswordResetCode: authMocks.verifyPasswordResetCode,
}))

describe('AuthPanel password reset', () => {
  beforeEach(() => {
    authMocks.completePasswordReset.mockReset()
    authMocks.requestPasswordResetCode.mockReset()
    authMocks.sendPasswordReset.mockReset()
    authMocks.signInWithEmail.mockReset()
    authMocks.signUpWithEmail.mockReset()
    authMocks.verifyPasswordResetCode.mockReset()
    vi.useRealTimers()
  })

  it('verifies the email recovery code before showing the new password fields', async () => {
    authMocks.completePasswordReset.mockResolvedValue(undefined)
    authMocks.requestPasswordResetCode.mockResolvedValue(undefined)
    authMocks.verifyPasswordResetCode.mockResolvedValue(undefined)

    render(<AuthPanel />)

    fireEvent.click(screen.getByRole('button', { name: '忘记密码？' }))
    fireEvent.change(screen.getByLabelText('邮箱'), {
      target: { value: 'user@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: '发送验证码' }))

    await waitFor(() => {
      expect(authMocks.requestPasswordResetCode).toHaveBeenCalledWith('user@example.com')
    })
    expect(authMocks.sendPasswordReset).not.toHaveBeenCalled()
    expect(screen.queryByLabelText('新密码')).not.toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('验证码'), {
      target: { value: '12345678' },
    })
    fireEvent.click(screen.getByRole('button', { name: '验证验证码' }))

    await waitFor(() => {
      expect(authMocks.verifyPasswordResetCode).toHaveBeenCalledWith({
        email: 'user@example.com',
        token: '12345678',
      })
    })
    expect(screen.getByLabelText('新密码')).toBeVisible()
    expect(screen.getByLabelText('确认新密码')).toBeVisible()

    fireEvent.change(screen.getByLabelText('新密码'), {
      target: { value: 'new-password' },
    })
    fireEvent.change(screen.getByLabelText('确认新密码'), {
      target: { value: 'new-password' },
    })
    fireEvent.click(screen.getByRole('button', { name: '更新密码' }))

    await waitFor(() => {
      expect(authMocks.completePasswordReset).toHaveBeenCalledWith('new-password')
    })
    expect(screen.getByRole('heading', { name: /^登录$/ })).toBeVisible()
    expect(screen.getByText('密码已更新，请使用新密码登录。')).toBeVisible()
  })

  it('prevents requesting another reset code for 60 seconds', async () => {
    vi.useFakeTimers()
    authMocks.requestPasswordResetCode.mockResolvedValue(undefined)

    render(<AuthPanel />)

    fireEvent.click(screen.getByRole('button', { name: '忘记密码？' }))
    fireEvent.change(screen.getByLabelText('邮箱'), {
      target: { value: 'user@example.com' },
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '发送验证码' }))
    })
    expect(authMocks.requestPasswordResetCode).toHaveBeenCalledTimes(1)

    const blockedResend = screen.getByRole('button', { name: /重新发送/ })
    expect(blockedResend).toBeDisabled()
    fireEvent.click(blockedResend)
    expect(authMocks.requestPasswordResetCode).toHaveBeenCalledTimes(1)

    await act(async () => {
      for (let i = 0; i < 60; i += 1) {
        vi.advanceTimersByTime(1000)
      }
    })

    const resend = screen.getByRole('button', { name: '重新发送验证码' })
    expect(resend).not.toBeDisabled()
    await act(async () => {
      fireEvent.click(resend)
    })
    expect(authMocks.requestPasswordResetCode).toHaveBeenCalledTimes(2)
  })
})
