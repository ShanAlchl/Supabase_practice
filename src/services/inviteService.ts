import { supabase } from '../lib/supabase'
import type { Circle, CircleInvite } from '../types/domain'

type InviteRow = {
  id: string
  circle_id: string
  created_by: string
  code: string
  max_uses: number
  used_count: number
  expires_at: string | null
  revoked_at: string | null
  created_at: string
}

type AcceptInviteRow = {
  circle_id: string
  name: string
  description: string | null
  created_by: string
  joined: boolean
}

const toInvite = (row: InviteRow): CircleInvite => ({
  id: row.id,
  circleId: row.circle_id,
  createdBy: row.created_by,
  code: row.code,
  maxUses: row.max_uses,
  usedCount: row.used_count,
  expiresAt: row.expires_at,
  revokedAt: row.revoked_at,
  createdAt: row.created_at,
})

const generateInviteCode = () => {
  const bytes = new Uint8Array(8)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

const canFallbackFromRpcError = (message: string) =>
  message.includes('gen_random_bytes') || message.includes('create_circle_invite')

const createInviteDirectly = async (
  circleId: string,
  options: {
    maxUses?: number
    expiresAt?: string | null
  },
) => {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    throw userError
  }
  if (!user) {
    throw new Error('请先登录后再生成邀请码。')
  }

  const { data, error } = await supabase
    .from('circle_invites')
    .insert({
      circle_id: circleId,
      created_by: user.id,
      code: generateInviteCode(),
      max_uses: options.maxUses ?? 1,
      expires_at: options.expiresAt ?? null,
    })
    .select(
      'id, circle_id, created_by, code, max_uses, used_count, expires_at, revoked_at, created_at',
    )
    .single()

  if (error) {
    throw error
  }

  return toInvite(data as InviteRow)
}

export const listCircleInvites = async (circleId: string) => {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const { data, error } = await supabase
    .from('circle_invites')
    .select(
      'id, circle_id, created_by, code, max_uses, used_count, expires_at, revoked_at, created_at',
    )
    .eq('circle_id', circleId)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return ((data as InviteRow[]) ?? []).map(toInvite)
}

export const createCircleInvite = async (
  circleId: string,
  options: {
    maxUses?: number
    expiresAt?: string | null
  } = {},
) => {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const maxUses = options.maxUses ?? 1
  const expiresAt = options.expiresAt ?? null

  const { data, error } = await supabase
    .rpc('create_circle_invite', {
      target_circle_id: circleId,
      max_uses: maxUses,
      expires_at: expiresAt,
    })
    .single()

  if (error) {
    if (canFallbackFromRpcError(error.message)) {
      return createInviteDirectly(circleId, { maxUses, expiresAt })
    }
    throw error
  }

  return toInvite(data as InviteRow)
}

export const acceptCircleInvite = async (code: string) => {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const inviteCode = code.trim()
  if (!inviteCode) {
    throw new Error('邀请码不能为空。')
  }

  const { data, error } = await supabase
    .rpc('accept_circle_invite', {
      invite_code: inviteCode,
    })
    .single()

  if (error) {
    throw error
  }

  const row = data as AcceptInviteRow
  return {
    circle: {
      id: row.circle_id,
      name: row.name,
      description: row.description,
      createdBy: row.created_by,
    } satisfies Circle,
    joined: row.joined,
  }
}

export const revokeCircleInvite = async (inviteId: string) => {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const { data, error } = await supabase
    .rpc('revoke_circle_invite', {
      invite_id: inviteId,
    })
    .single()

  if (error) {
    throw error
  }

  return toInvite(data as InviteRow)
}
