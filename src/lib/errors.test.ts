import { describe, it, expect } from 'vitest'
import { getErrorMessage } from './errors'

describe('getErrorMessage', () => {
  it('returns fallback for null/undefined', () => {
    expect(getErrorMessage(null)).toBe('操作失败，请稍后重试。')
    expect(getErrorMessage(undefined)).toBe('操作失败，请稍后重试。')
  })

  it('returns message for Error instance', () => {
    expect(getErrorMessage(new Error('something went wrong'))).toBe('something went wrong')
  })

  it('maps common auth errors to Chinese', () => {
    expect(getErrorMessage(new Error('Invalid login credentials'))).toBe('邮箱或密码不正确。')
    expect(getErrorMessage(new Error('Email not confirmed'))).toBe('请先完成邮箱验证。')
    expect(getErrorMessage(new Error('User already registered'))).toBe('这个邮箱已经注册。')
    expect(getErrorMessage(new Error('Password should be at least 6 characters'))).toBe(
      '密码至少需要 6 位。',
    )
    expect(getErrorMessage(new Error('Email rate limit exceeded'))).toBe('邮件发送太频繁，请稍后再试。')
  })

  it('returns fallback for empty string', () => {
    expect(getErrorMessage('')).toBe('操作失败，请稍后重试。')
  })

  it('returns custom fallback', () => {
    expect(getErrorMessage(null, '自定义回退')).toBe('自定义回退')
  })
})
