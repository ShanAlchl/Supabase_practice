export const queryKeys = {
  album: (circleId: string | null) => ['album', circleId] as const,
  circles: (userId: string) => ['circles', userId] as const,
  defaultCircle: (userId: string) => ['default-circle', userId] as const,
  invites: (circleId: string | null) => ['invites', circleId] as const,
  members: (circleId: string | null) => ['members', circleId] as const,
  notifications: (userId: string) => ['notifications', userId] as const,
  posts: (circleId: string | null, searchTerm = '') =>
    ['posts', circleId, searchTerm.trim()] as const,
  postsRoot: (circleId: string | null) => ['posts', circleId] as const,
  profile: (userId: string) => ['profile', userId] as const,
}
