import { supabase } from '../lib/supabase'
import type {
  CreatePostInput,
  FeedCursor,
  PaginatedResult,
  Post,
  PostImage,
  Profile,
} from '../types/domain'
import {
  cleanupPostImages,
  createPostImageSignedUrl,
  resolveAvatarUrl,
  uploadPostImages,
} from './storageService'
export { addComment } from './commentService'

type ProfileRow = {
  id: string
  display_name: string
  avatar_url: string | null
  bio: string | null
}

type ImageRow = {
  id: string
  post_id: string
  public_url: string
  storage_path: string
  sort_order: number
}

type FeedPostRow = {
  id: string
  circle_id: string
  author_id: string
  body: string
  created_at: string
  updated_at: string
  author: ProfileRow
  images: ImageRow[] | string | null
  comment_count: number
  reaction_count: number
  viewer_has_reacted: boolean
}

type DeletedImageRow = {
  storage_path: string
}

const toProfile = async (row: ProfileRow): Promise<Profile> => ({
  id: row.id,
  displayName: row.display_name,
  avatarUrl: await resolveAvatarUrl(row.avatar_url),
  bio: row.bio,
})

const parseImages = (value: FeedPostRow['images']): ImageRow[] => {
  if (!value) {
    return []
  }

  if (typeof value === 'string') {
    return JSON.parse(value) as ImageRow[]
  }

  return value
}

const toImage = async (row: ImageRow): Promise<PostImage> => {
  try {
    const url = await createPostImageSignedUrl(row.storage_path)
    return {
      id: row.id,
      postId: row.post_id,
      url,
      storagePath: row.storage_path,
      sortOrder: row.sort_order,
    }
  } catch {
    return {
      id: row.id,
      postId: row.post_id,
      url: row.public_url,
      storagePath: row.storage_path,
      sortOrder: row.sort_order,
    }
  }
}

const toPost = async (row: FeedPostRow): Promise<Post> => ({
  id: row.id,
  circleId: row.circle_id,
  authorId: row.author_id,
  body: row.body,
  createdAt: row.created_at,
  author: await toProfile(row.author),
  images: await Promise.all(parseImages(row.images).map(toImage)),
  comments: [],
  commentCount: Number(row.comment_count ?? 0),
  reactionCount: Number(row.reaction_count ?? 0),
  viewerHasReacted: Boolean(row.viewer_has_reacted),
})

const nextCursorFor = (posts: Post[], hasMore: boolean): FeedCursor | null => {
  const last = posts.at(-1)
  if (!hasMore || !last) {
    return null
  }

  return {
    createdAt: last.createdAt,
    id: last.id,
  }
}

export const fetchPostsPage = async (
  circleId: string,
  _viewerId: string,
  options: {
    cursor?: FeedCursor | null
    limit?: number
  } = {},
): Promise<PaginatedResult<Post>> => {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const limit = Math.min(Math.max(options.limit ?? 20, 1), 50)
  const { data, error } = await supabase.rpc('get_feed_posts', {
    target_circle_id: circleId,
    before_created_at: options.cursor?.createdAt ?? null,
    before_id: options.cursor?.id ?? null,
    page_size: limit + 1,
  })

  if (error) {
    throw error
  }

  const rows = ((data as FeedPostRow[]) ?? []).slice(0, limit)
  const posts = await Promise.all(rows.map(toPost))

  return {
    items: posts,
    nextCursor: nextCursorFor(posts, (data?.length ?? 0) > limit),
  }
}

export const fetchPosts = async (circleId: string, viewerId: string) => {
  const page = await fetchPostsPage(circleId, viewerId, { limit: 30 })
  return page.items
}

export const searchPosts = async (
  circleId: string,
  keyword: string,
  _viewerId: string,
  options: {
    cursor?: FeedCursor | null
    limit?: number
  } = {},
): Promise<PaginatedResult<Post>> => {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const limit = Math.min(Math.max(options.limit ?? 20, 1), 50)
  const { data, error } = await supabase.rpc('search_circle_posts', {
    target_circle_id: circleId,
    keyword,
    before_created_at: options.cursor?.createdAt ?? null,
    before_id: options.cursor?.id ?? null,
    page_size: limit + 1,
  })

  if (error) {
    throw error
  }

  const rows = ((data as FeedPostRow[]) ?? []).slice(0, limit)
  const posts = await Promise.all(rows.map(toPost))

  return {
    items: posts,
    nextCursor: nextCursorFor(posts, (data?.length ?? 0) > limit),
  }
}

export const createPost = async (input: CreatePostInput) => {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const body = input.body.trim()
  if (!body && input.files.length === 0) {
    throw new Error('动态内容不能为空。')
  }

  const { data: post, error: postError } = await supabase
    .from('posts')
    .insert({
      circle_id: input.circleId,
      author_id: input.authorId,
      body: body || '分享了一组照片。',
    })
    .select('id')
    .single()

  if (postError) {
    throw postError
  }

  const postId = post.id as string
  let uploadedImages: Awaited<ReturnType<typeof uploadPostImages>> = []

  try {
    if (input.files.length > 0) {
      uploadedImages = await uploadPostImages(
        input.circleId,
        input.authorId,
        postId,
        input.files,
      )

      const { error: imageError } = await supabase
        .from('post_images')
        .insert(uploadedImages)

      if (imageError) {
        throw imageError
      }
    }
  } catch (error) {
    await cleanupPostImages(uploadedImages.map((image) => image.storage_path))
    await supabase.from('posts').delete().eq('id', postId)
    throw error
  }

  return postId
}

export const deletePost = async (postId: string) => {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const { data: images, error: imageLookupError } = await supabase
    .from('post_images')
    .select('storage_path')
    .eq('post_id', postId)

  if (imageLookupError) {
    throw imageLookupError
  }

  const imagePaths = ((images as DeletedImageRow[]) ?? []).map(
    (image) => image.storage_path,
  )

  const { error: deleteError } = await supabase.from('posts').delete().eq('id', postId)
  if (deleteError) {
    throw deleteError
  }

  try {
    await cleanupPostImages(imagePaths)
  } catch (error) {
    throw new Error(
      `动态已删除，但图片清理失败。请稍后重试清理 Storage：${
        error instanceof Error ? error.message : String(error)
      }`,
      { cause: error },
    )
  }
}

export const toggleReaction = async (
  postId: string,
  circleId: string,
  userId: string,
  reacted: boolean,
) => {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  if (reacted) {
    const { error } = await supabase
      .from('reactions')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId)

    if (error) {
      throw error
    }
    return
  }

  const { error } = await supabase.from('reactions').insert({
    post_id: postId,
    circle_id: circleId,
    user_id: userId,
  })

  if (error) {
    throw error
  }
}
