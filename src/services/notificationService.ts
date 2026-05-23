import { supabase } from '../lib/supabase'
import type {
  CircleNotification,
  FeedCursor,
  NotificationType,
  PaginatedResult,
  Profile,
} from '../types/domain'

type ProfileRow = {
  id: string
  display_name: string
  avatar_url: string | null
  bio: string | null
}

type NotificationRow = {
  id: string
  circle_id: string
  recipient_id: string
  actor_id: string
  type: NotificationType
  post_id: string | null
  comment_id: string | null
  read_at: string | null
  created_at: string
  actor?: ProfileRow | ProfileRow[] | null
}

const toProfile = (row: ProfileRow): Profile => ({
  id: row.id,
  displayName: row.display_name,
  avatarUrl: row.avatar_url,
  bio: row.bio,
})

const toNotification = (row: NotificationRow): CircleNotification => {
  const actor = Array.isArray(row.actor) ? row.actor[0] : row.actor

  return {
    id: row.id,
    circleId: row.circle_id,
    recipientId: row.recipient_id,
    actorId: row.actor_id,
    type: row.type,
    postId: row.post_id,
    commentId: row.comment_id,
    readAt: row.read_at,
    createdAt: row.created_at,
    actor: actor ? toProfile(actor) : null,
  }
}

export const fetchNotifications = async (
  options: {
    cursor?: FeedCursor | null
    limit?: number
    unreadOnly?: boolean
  } = {},
): Promise<PaginatedResult<CircleNotification>> => {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const limit = Math.min(Math.max(options.limit ?? 20, 1), 50)
  let query = supabase
    .from('notifications')
    .select(
      `
      id,
      circle_id,
      recipient_id,
      actor_id,
      type,
      post_id,
      comment_id,
      read_at,
      created_at,
      actor:profiles!notifications_actor_id_fkey(id, display_name, avatar_url, bio)
    `,
    )
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit + 1)

  if (options.unreadOnly) {
    query = query.is('read_at', null)
  }

  if (options.cursor) {
    query = query.or(
      `created_at.lt.${options.cursor.createdAt},and(created_at.eq.${options.cursor.createdAt},id.lt.${options.cursor.id})`,
    )
  }

  const { data, error } = await query
  if (error) {
    throw error
  }

  const rows = ((data as NotificationRow[]) ?? []).slice(0, limit)
  const last = rows.at(-1)

  return {
    items: rows.map(toNotification),
    nextCursor:
      (data?.length ?? 0) > limit && last
        ? {
            createdAt: last.created_at,
            id: last.id,
          }
        : null,
  }
}

export const markNotificationRead = async (notificationId: string) => {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const { data, error } = await supabase
    .rpc('mark_notification_read', {
      notification_id: notificationId,
    })
    .single()

  if (error) {
    throw error
  }

  return toNotification(data as NotificationRow)
}

export const markAllNotificationsRead = async () => {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const { data, error } = await supabase.rpc('mark_all_notifications_read')
  if (error) {
    throw error
  }

  return data as number
}

export const subscribeNotifications = (
  recipientId: string,
  onChange: () => void,
) => {
  if (!supabase) {
    return () => undefined
  }

  const client = supabase
  const channel = client
    .channel(`notifications-${recipientId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `recipient_id=eq.${recipientId}`,
      },
      onChange,
    )
    .subscribe()

  return () => {
    client.removeChannel(channel)
  }
}
