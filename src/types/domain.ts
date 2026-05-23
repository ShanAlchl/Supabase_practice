import type { User } from '@supabase/supabase-js'

export type Profile = {
  id: string
  displayName: string
  avatarUrl: string | null
  bio: string | null
}

export type Circle = {
  id: string
  name: string
  description: string | null
  createdBy: string
}

export type CircleMember = {
  circleId: string
  userId: string
  role: 'owner' | 'member'
  profile: Profile
}

export type PostImage = {
  id: string
  postId: string
  url: string
  storagePath: string
  sortOrder: number
}

export type Comment = {
  id: string
  postId: string
  authorId: string
  body: string
  createdAt: string
  updatedAt?: string
  author: Profile
}

export type Post = {
  id: string
  circleId: string
  authorId: string
  body: string
  createdAt: string
  author: Profile
  images: PostImage[]
  comments: Comment[]
  commentCount: number
  reactionCount: number
  viewerHasReacted: boolean
}

export type SessionUser = User

export type CreatePostInput = {
  circleId: string
  authorId: string
  body: string
  files: File[]
}

export type FeedCursor = {
  createdAt: string
  id: string
}

export type PaginatedResult<T> = {
  items: T[]
  nextCursor: FeedCursor | null
}

export type CircleInvite = {
  id: string
  circleId: string
  createdBy: string
  code: string
  maxUses: number
  usedCount: number
  expiresAt: string | null
  revokedAt: string | null
  createdAt: string
}

export type NotificationType =
  | 'post_reacted'
  | 'post_commented'
  | 'member_joined'
  | 'invite_accepted'

export type CircleNotification = {
  id: string
  circleId: string
  recipientId: string
  actorId: string
  type: NotificationType
  postId: string | null
  commentId: string | null
  readAt: string | null
  createdAt: string
  actor?: Profile | null
}
