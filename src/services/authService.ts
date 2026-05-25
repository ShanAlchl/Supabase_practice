import { supabase } from '../lib/supabase'

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
  if (!supabase) throw new Error('Supabase is not configured.')
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })
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
