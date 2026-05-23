import { supabase } from '../lib/supabase'

const POST_MEDIA_BUCKET = 'post-media'
const AVATARS_BUCKET = 'avatars'
const POST_IMAGE_MAX_BYTES = 10 * 1024 * 1024
const AVATAR_MAX_BYTES = 2 * 1024 * 1024
const IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const AVATAR_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

type UploadableImage = {
  post_id: string
  storage_path: string
  public_url: string
  sort_order: number
}

const assertImageFile = (
  file: File,
  options: {
    maxBytes: number
    allowedTypes: Set<string>
    label: string
  },
) => {
  if (!options.allowedTypes.has(file.type)) {
    throw new Error(
      `${options.label} 只支持 JPEG、PNG、WebP${
        options.allowedTypes.has('image/gif') ? '、GIF' : ''
      }。`,
    )
  }

  if (file.size > options.maxBytes) {
    throw new Error(
      `${options.label} 不能超过 ${Math.floor(options.maxBytes / 1024 / 1024)}MB。`,
    )
  }
}

const extensionFor = (file: File) => {
  const fromName = file.name.split('.').pop()?.toLowerCase()
  if (fromName && /^[a-z0-9]+$/.test(fromName)) {
    return fromName
  }

  if (file.type === 'image/png') return 'png'
  if (file.type === 'image/webp') return 'webp'
  if (file.type === 'image/gif') return 'gif'
  return 'jpg'
}

export const removeStorageObjects = async (bucket: string, paths: string[]) => {
  if (!supabase || paths.length === 0) {
    return
  }

  const { error } = await supabase.storage.from(bucket).remove(paths)
  if (error) {
    throw error
  }
}

export const uploadPostImages = async (
  circleId: string,
  userId: string,
  postId: string,
  files: File[],
) => {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const uploadedPaths: string[] = []
  const uploadedImages: UploadableImage[] = []

  for (const [index, file] of files.entries()) {
    assertImageFile(file, {
      maxBytes: POST_IMAGE_MAX_BYTES,
      allowedTypes: IMAGE_MIME_TYPES,
      label: '动态图片',
    })

    const safeName = `${crypto.randomUUID()}.${extensionFor(file)}`
    const storagePath = `${circleId}/${userId}/${postId}/${safeName}`

    const { error } = await supabase.storage
      .from(POST_MEDIA_BUCKET)
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      await removeStorageObjects(POST_MEDIA_BUCKET, uploadedPaths)
      throw error
    }

    uploadedPaths.push(storagePath)
    uploadedImages.push({
      post_id: postId,
      storage_path: storagePath,
      public_url: storagePath,
      sort_order: index,
    })
  }

  return uploadedImages
}

export const cleanupPostImages = async (paths: string[]) => {
  await removeStorageObjects(POST_MEDIA_BUCKET, paths)
}

export const createPostImageSignedUrl = async (storagePath: string) => {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const { data, error } = await supabase.storage
    .from(POST_MEDIA_BUCKET)
    .createSignedUrl(storagePath, 60 * 60)

  if (error) {
    throw error
  }

  return data.signedUrl
}

export const uploadAvatar = async (userId: string, file: File) => {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  assertImageFile(file, {
    maxBytes: AVATAR_MAX_BYTES,
    allowedTypes: AVATAR_MIME_TYPES,
    label: '头像',
  })

  const storagePath = `${userId}/${crypto.randomUUID()}.${extensionFor(file)}`
  const { error } = await supabase.storage
    .from(AVATARS_BUCKET)
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (error) {
    throw error
  }

  return storagePath
}

export const createAvatarSignedUrl = async (storagePath: string) => {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const { data, error } = await supabase.storage
    .from(AVATARS_BUCKET)
    .createSignedUrl(storagePath, 60 * 60)

  if (error) {
    throw error
  }

  return data.signedUrl
}

export const resolveAvatarUrl = async (avatarUrl: string | null) => {
  if (!avatarUrl) {
    return null
  }

  if (/^(https?:|blob:|data:)/.test(avatarUrl)) {
    return avatarUrl
  }

  try {
    return await createAvatarSignedUrl(avatarUrl)
  } catch {
    return avatarUrl
  }
}
