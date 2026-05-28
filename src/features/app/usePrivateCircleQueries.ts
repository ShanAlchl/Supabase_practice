import { useEffect } from 'react'
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../../lib/queryKeys'
import { fetchComments } from '../../services/commentService'
import { listCircles } from '../../services/circleService'
import { fetchPostsPage } from '../../services/feedService'
import { listCircleInvites } from '../../services/inviteService'
import { fetchNotifications, subscribeNotifications } from '../../services/notificationService'
import {
  ensureProfile,
  getCircleMembers,
  getDefaultCircle,
} from '../../services/profileService'
import type { Post, SessionUser } from '../../types/domain'
import type { Comment, FeedCursor, PaginatedResult } from '../../types/domain'

type UsePrivateCircleQueriesInput = {
  selectedCircleId: string | null
  user: SessionUser
}

export const usePrivateCircleQueries = ({
  selectedCircleId,
  user,
}: UsePrivateCircleQueriesInput) => {
  const queryClient = useQueryClient()

  const profileQuery = useQuery({
    queryKey: queryKeys.profile(user.id),
    queryFn: () => ensureProfile(user),
  })

  const circleQuery = useQuery({
    queryKey: queryKeys.defaultCircle(user.id),
    queryFn: () => getDefaultCircle(),
    enabled: profileQuery.isSuccess,
  })

  const circlesQuery = useQuery({
    queryKey: queryKeys.circles(user.id),
    queryFn: () => listCircles(),
    enabled: circleQuery.isSuccess,
  })

  const circles = circlesQuery.data?.length
    ? circlesQuery.data
    : circleQuery.data
      ? [circleQuery.data]
      : []
  const circleId = selectedCircleId ?? circleQuery.data?.id ?? null
  const circle = circles.find((item) => item.id === circleId) ?? circleQuery.data ?? null
  const postsQueryKey = queryKeys.posts(circleId)

  useEffect(() => {
    return subscribeNotifications(user.id, () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications(user.id) })
    })
  }, [queryClient, user.id])

  const membersQuery = useQuery({
    queryKey: queryKeys.members(circleId),
    queryFn: () => getCircleMembers(circleId!),
    enabled: Boolean(circleId),
  })

  const postsQuery = useInfiniteQuery({
    queryKey: postsQueryKey,
    queryFn: async ({ pageParam }) => {
      return fetchPostsPage(circleId!, user.id, { cursor: pageParam, limit: 30 })
    },
    enabled: Boolean(circleId),
    initialPageParam: null as FeedCursor | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  })

  const invitesQuery = useQuery({
    queryKey: queryKeys.invites(circleId),
    queryFn: () => listCircleInvites(circleId!),
    enabled: Boolean(circleId),
  })

  const notificationsQuery = useInfiniteQuery({
    queryKey: queryKeys.notifications(user.id),
    queryFn: ({ pageParam }) => fetchNotifications({ cursor: pageParam, limit: 30 }),
    initialPageParam: null as FeedCursor | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  })

  const posts = postsQuery.data?.pages.flatMap((page) => page.items) ?? []
  const notifications = notificationsQuery.data?.pages.flatMap((page) => page.items) ?? []
  const unreadCount =
    notifications.filter((notification) => !notification.readAt).length

  const loadPostComments = (
    post: Post,
    cursor?: FeedCursor | null,
  ): Promise<PaginatedResult<Comment>> => fetchComments(post.id, { cursor, limit: 30 })

  return {
    circle,
    circleId,
    circleQuery,
    circles,
    circlesQuery,
    invitesQuery,
    loadPostComments,
    membersQuery,
    notificationsQuery,
    notifications,
    posts,
    postsQuery,
    postsQueryKey,
    profileQuery,
    unreadCount,
  }
}
