import { supabase } from '../lib/supabase'
import type { Circle } from '../types/domain'

type CircleRow = {
  id: string
  name: string
  description: string | null
  created_by: string
}

const toCircle = (row: CircleRow): Circle => ({
  id: row.id,
  name: row.name,
  description: row.description,
  createdBy: row.created_by,
})

export const listCircles = async () => {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const { data, error } = await supabase
    .from('circles')
    .select('id, name, description, created_by')
    .order('created_at', { ascending: true })

  if (error) {
    throw error
  }

  return ((data as CircleRow[]) ?? []).map(toCircle)
}

export const createCircle = async (input: {
  name: string
  description?: string | null
}) => {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const name = input.name.trim()
  if (!name) {
    throw new Error('圈子名称不能为空。')
  }

  const { data, error } = await supabase
    .rpc('create_circle', {
      circle_name: name,
      circle_description: input.description?.trim() || null,
    })
    .single()

  if (error) {
    throw error
  }

  return toCircle(data as CircleRow)
}

export const updateCircle = async (
  circleId: string,
  patch: {
    name?: string
    description?: string | null
  },
) => {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const changes: Record<string, string | null> = {}
  if (patch.name !== undefined) {
    const name = patch.name.trim()
    if (!name) {
      throw new Error('圈子名称不能为空。')
    }
    changes.name = name
  }

  if (patch.description !== undefined) {
    changes.description = patch.description?.trim() || null
  }

  const { data, error } = await supabase
    .from('circles')
    .update(changes)
    .eq('id', circleId)
    .select('id, name, description, created_by')
    .single()

  if (error) {
    throw error
  }

  return toCircle(data as CircleRow)
}

export const transferCircleOwnership = async (circleId: string, userId: string) => {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const { error } = await supabase.rpc('transfer_circle_ownership', {
    target_circle_id: circleId,
    target_user_id: userId,
  })

  if (error) {
    throw error
  }
}

export const removeCircleMember = async (circleId: string, userId: string) => {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const { error } = await supabase.rpc('remove_circle_member', {
    target_circle_id: circleId,
    target_user_id: userId,
  })

  if (error) {
    throw error
  }
}

export const leaveCircle = async (circleId: string) => {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const { error } = await supabase.rpc('leave_circle', {
    target_circle_id: circleId,
  })

  if (error) {
    throw error
  }
}
