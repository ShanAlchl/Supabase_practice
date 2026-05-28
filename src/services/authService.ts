import { supabase } from '../lib/supabase'

const normalizeEmail = (email: string) => email.trim().toLowerCase()
const RECOVERY_CODE_PATTERN = /^\d{6,10}$/

export const signInWithEmail = async (email: string, password: string) => {
  if (!supabase) throw new Error('Supabase is not configured.')
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
}

export const signUpWithEmail = async (email: string, password: string) => {
  if (!supabase) throw new Error('Supabase is not configured.')
  const { error } = await supabase.auth.signUp({ email, password })
  if (error) throw error
}

export const sendPasswordReset = async (email: string) => {
  await requestPasswordResetCode(email)
}

export const requestPasswordResetCode = async (email: string) => {
  if (!supabase) throw new Error('Supabase is not configured.')
  const { error } = await supabase.auth.resetPasswordForEmail(normalizeEmail(email))
  if (error) throw error
}

export const updatePassword = async (password: string) => {
  if (!supabase) throw new Error('Supabase is not configured.')
  const trimmed = password.trim()
  if (trimmed.length < 6) {
    throw new Error('密码至少需要 6 位。')
  }

  const { error } = await supabase.auth.updateUser({ password: trimmed })
  if (error) throw error
}

export const verifyPasswordResetCode = async ({
  email,
  token,
}: {
  email: string
  token: string
}) => {
  if (!supabase) throw new Error('Supabase is not configured.')

  const trimmedToken = token.trim()
  if (!RECOVERY_CODE_PATTERN.test(trimmedToken)) {
    throw new Error('请输入 6 到 10 位验证码。')
  }

  const { error: verifyError } = await supabase.auth.verifyOtp({
    email: normalizeEmail(email),
    token: trimmedToken,
    type: 'recovery',
  })
  if (verifyError) throw verifyError
}

export const completePasswordReset = async (password: string) => {
  if (!supabase) throw new Error('Supabase is not configured.')
  await updatePassword(password)

  const { error: signOutError } = await supabase.auth.signOut()
  if (signOutError) throw signOutError
}

export const resetPasswordWithOtp = async ({
  email,
  password,
  token,
}: {
  email: string
  password: string
  token: string
}) => {
  await verifyPasswordResetCode({ email, token })
  await completePasswordReset(password)
}
