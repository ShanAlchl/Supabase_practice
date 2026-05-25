import { supabase } from '../lib/supabase'
import type { AlbumImage, FeedCursor, PaginatedResult, Profile } from '../types/domain'
import { createPostImageSignedUrl, resolveAvatarUrl } from './storageService'

type ProfileRow = {
  id: string
  display_name: string
  avatar_url: string | null
  bio: string | null
}

type AlbumImageRow = {
  id: string
  post_id: string
  circle_id: string
  author_id: string
  storage_path: string
  public_url: string
  sort_order: number
  post_body: string
  post_created_at: string
  author: ProfileRow
}

const toProfile = async (row: ProfileRow): Promise<Profile> => ({
  id: row.id,
  displayName: row.display_name,
  avatarUrl: await resolveAvatarUrl(row.avatar_url),
  bio: row.bio,
})

const toAlbumImage = async (row: AlbumImageRow): Promise<AlbumImage> => {
  let url: string
  try {
    url = await createPostImageSignedUrl(row.storage_path)
  } catch {
    url = row.public_url
  }

  return {
    id: row.id,
    postId: row.post_id,
    circleId: row.circle_id,
    authorId: row.author_id,
    url,
    storagePath: row.storage_path,
    sortOrder: row.sort_order,
    postBody: row.post_body,
    postCreatedAt: row.post_created_at,
    author: await toProfile(row.author),
  }
}

const nextCursorFor = (
  images: AlbumImage[],
  hasMore: boolean,
): FeedCursor | null => {
  const last = images.at(-1)
  if (!hasMore || !last) {
    return null
  }

  return {
    createdAt: last.postCreatedAt,
    id: last.id,
  }
}

export const fetchAlbumImages = async (
  circleId: string,
  options: {
    cursor?: FeedCursor | null
    limit?: number
  } = {},
): Promise<PaginatedResult<AlbumImage>> => {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const limit = Math.min(Math.max(options.limit ?? 30, 1), 50)
  const { data, error } = await supabase.rpc('get_circle_album_images', {
    target_circle_id: circleId,
    before_created_at: options.cursor?.createdAt ?? null,
    before_id: options.cursor?.id ?? null,
    page_size: limit + 1,
  })

  if (error) {
    throw error
  }

  const rows = ((data as AlbumImageRow[]) ?? []).slice(0, limit)
  const images = await Promise.all(rows.map(toAlbumImage))

  return {
    items: images,
    nextCursor: nextCursorFor(images, (data?.length ?? 0) > limit),
  }
}
