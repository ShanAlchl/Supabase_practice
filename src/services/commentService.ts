import { supabase } from '../lib/supabase'
import type { Comment, FeedCursor, PaginatedResult, Profile } from '../types/domain'
import { resolveAvatarUrl } from './storageService'

type ProfileRow = {
  id: string
  display_name: string
  avatar_url: string | null
  bio: string | null
}

type CommentRow = {
  id: string
  post_id: string
  author_id: string
  parent_id: string | null
  body: string
  created_at: string
  updated_at: string | null
  author: ProfileRow | ProfileRow[] | null
}

const firstProfile = (value: ProfileRow | ProfileRow[] | null): ProfileRow => {
  if (Array.isArray(value)) {
    return value[0]
  }

  return (
    value ?? {
      id: 'unknown',
      display_name: 'Unknown friend',
      avatar_url: null,
      bio: null,
    }
  )
}

const toProfile = async (row: ProfileRow): Promise<Profile> => ({
  id: row.id,
  displayName: row.display_name,
  avatarUrl: await resolveAvatarUrl(row.avatar_url),
  bio: row.bio,
})

const toComment = async (row: CommentRow): Promise<Comment> => ({
  id: row.id,
  postId: row.post_id,
  authorId: row.author_id,
  parentId: row.parent_id,
  body: row.body,
  createdAt: row.created_at,
  updatedAt: row.updated_at ?? row.created_at,
  author: await toProfile(firstProfile(row.author)),
})

export const fetchComments = async (
  postId: string,
  options: {
    cursor?: FeedCursor | null
    limit?: number
  } = {},
): Promise<PaginatedResult<Comment>> => {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const limit = Math.min(Math.max(options.limit ?? 20, 1), 50)
  let query = supabase
    .from('comments')
    .select(
      `
      id,
      post_id,
      author_id,
      body,
      created_at,
      updated_at,
      author:profiles!comments_author_id_fkey(id, display_name, avatar_url, bio)
    `,
    )
    .eq('post_id', postId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit + 1)

  if (options.cursor) {
    query = query.or(
      `created_at.lt.${options.cursor.createdAt},and(created_at.eq.${options.cursor.createdAt},id.lt.${options.cursor.id})`,
    )
  }

  const { data, error } = await query
  if (error) {
    throw error
  }

  const rows = (data as CommentRow[]) ?? []
  const pageRows = rows.slice(0, limit)
  const last = pageRows.at(-1)
  const comments = await Promise.all(pageRows.map(toComment))

  return {
    items: comments.reverse(),
    nextCursor:
      rows.length > limit && last
        ? {
            createdAt: last.created_at,
            id: last.id,
          }
        : null,
  }
}

export const addComment = async (
  postId: string,
  circleId: string,
  authorId: string,
  body: string,
  parentId?: string | null,
) => {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const trimmed = body.trim()
  if (!trimmed) {
    throw new Error('评论内容不能为空。')
  }

  const { error } = await supabase.from('comments').insert({
    post_id: postId,
    circle_id: circleId,
    author_id: authorId,
    parent_id: parentId ?? null,
    body: trimmed,
  })

  if (error) {
    throw error
  }
}

export const updateComment = async (commentId: string, body: string) => {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const trimmed = body.trim()
  if (!trimmed) {
    throw new Error('评论内容不能为空。')
  }

  const { data, error } = await supabase
    .from('comments')
    .update({ body: trimmed })
    .eq('id', commentId)
    .select(
      `
      id,
      post_id,
      author_id,
      body,
      created_at,
      updated_at,
      author:profiles!comments_author_id_fkey(id, display_name, avatar_url, bio)
    `,
    )
    .single()

  if (error) {
    throw error
  }

  return toComment(data as CommentRow)
}

export const deleteComment = async (commentId: string) => {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const { error } = await supabase.from('comments').delete().eq('id', commentId)
  if (error) {
    throw error
  }
}
