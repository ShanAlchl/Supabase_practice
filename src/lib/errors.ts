const AUTH_ERROR_MAP: Record<string, string> = {
  'invalid login credentials': '邮箱或密码不正确。',
  'email not confirmed': '请先完成邮箱验证。',
  'user already registered': '这个邮箱已经注册。',
  'password should be at least 6 characters': '密码至少需要 6 位。',
  'email rate limit exceeded': '邮件发送太频繁，请稍后再试。',
  'invalid credentials': '邮箱或密码不正确。',
}

function mapAuthError(message: string): string {
  const lower = message.toLowerCase()
  for (const [key, value] of Object.entries(AUTH_ERROR_MAP)) {
    if (lower.includes(key)) {
      return value
    }
  }
  return message
}

export const getErrorMessage = (
  error: unknown,
  fallback = '操作失败，请稍后重试。',
) => {
  if (!error) {
    return fallback
  }

  if (error instanceof Error && error.message) {
    return mapAuthError(error.message)
  }

  if (typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string' && message) {
      return mapAuthError(message)
    }
  }

  if (typeof error === 'string' && error) {
    return mapAuthError(error)
  }

  return fallback
}
