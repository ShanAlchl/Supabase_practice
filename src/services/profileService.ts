import { supabase } from '../lib/supabase'
import type { Circle, CircleMember, Profile, SessionUser } from '../types/domain'
import { resolveAvatarUrl, uploadAvatar } from './storageService'

type ProfileRow = {
  id: string
  display_name: string
  avatar_url: string | null
  bio: string | null
}

type CircleRow = {
  id: string
  name: string
  description: string | null
  created_by: string
}

const toProfile = async (row: ProfileRow): Promise<Profile> => ({
  id: row.id,
  displayName: row.display_name,
  avatarUrl: await resolveAvatarUrl(row.avatar_url),
  bio: row.bio,
})

const toCircle = (row: CircleRow): Circle => ({
  id: row.id,
  name: row.name,
  description: row.description,
  createdBy: row.created_by,
})

export const ensureProfile = async (user: SessionUser) => {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  // 先查询是否已存在 profile，避免 upsert 覆盖用户已修改的数据
  const { data: existing, error: fetchError } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url, bio')
    .eq('id', user.id)
    .maybeSingle()

  if (fetchError) {
    throw fetchError
  }

  if (existing) {
    return toProfile(existing)
  }

  // 不存在则创建默认 profile
  const displayName =
    user.user_metadata.display_name ??
    user.user_metadata.name ??
    user.email?.split('@')[0] ??
    '新朋友'

  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      display_name: displayName,
      avatar_url: user.user_metadata.avatar_url ?? null,
    })
    .select('id, display_name, avatar_url, bio')
    .single()

  if (error) {
    throw error
  }

  return toProfile(data)
}

export const getDefaultCircle = async () => {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const { data: circle, error } = await supabase
    .rpc('create_default_circle', {
      default_name: '我们的私密朋友圈',
      default_description: '记录朋友之间的日常、照片和小小的开心事。',
    })
    .single()

  if (error) {
    throw error
  }

  return toCircle(circle as CircleRow)
}

export const getCircleMembers = async (circleId: string) => {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const { data, error } = await supabase
    .from('circle_members')
    .select(
      'circle_id, user_id, role, profile:profiles!circle_members_user_id_fkey(id, display_name, avatar_url, bio)',
    )
    .eq('circle_id', circleId)
    .order('joined_at', { ascending: true })

  if (error) {
    throw error
  }

  return Promise.all(
    data.map(async (row) => {
      const profile = Array.isArray(row.profile) ? row.profile[0] : row.profile
      return {
        circleId: row.circle_id,
        userId: row.user_id,
        role: row.role,
        profile: await toProfile(profile as ProfileRow),
      } satisfies CircleMember
    }),
  )
}

export const updateProfile = async (input: {
  userId: string
  displayName: string
  bio: string | null
}) => {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const displayName = input.displayName.trim()
  if (!displayName) {
    throw new Error('昵称不能为空。')
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({
      display_name: displayName,
      bio: input.bio?.trim() || null,
    })
    .eq('id', input.userId)
    .select('id, display_name, avatar_url, bio')
    .single()

  if (error) {
    throw error
  }

  return toProfile(data)
}

export const updateAvatar = async (userId: string, file: File) => {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const avatarPath = await uploadAvatar(userId, file)
  const { data, error } = await supabase
    .from('profiles')
    .update({ avatar_url: avatarPath })
    .eq('id', userId)
    .select('id, display_name, avatar_url, bio')
    .single()

  if (error) {
    throw error
  }

  return toProfile(data)
}
