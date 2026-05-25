import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { InfiniteData } from '@tanstack/react-query'
import { queryKeys } from '../../lib/queryKeys'
import {
  createCircle,
  leaveCircle,
  removeCircleMember,
  transferCircleOwnership,
  updateCircle,
} from '../../services/circleService'
import {
  addComment,
  createPost,
  deletePost,
  togglePinPost,
  toggleReaction,
  updatePost,
} from '../../services/feedService'
import { updateComment, deleteComment } from '../../services/commentService'
import {
  acceptCircleInvite,
  createCircleInvite,
  revokeCircleInvite,
} from '../../services/inviteService'
import {
  deleteAllReadNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../services/notificationService'
import { updateAvatar, updateProfile } from '../../services/profileService'
import type { CircleNotification, FeedCursor, PaginatedResult, Post, SessionUser } from '../../types/domain'

type PostsQueryKey = ReturnType<typeof queryKeys.posts>
type PostsInfiniteData = InfiniteData<PaginatedResult<Post>, FeedCursor | null>

type NotificationsInfiniteData = InfiniteData<
  PaginatedResult<CircleNotification>,
  FeedCursor | null
>

type UsePrivateCircleMutationsInput = {
  circleId: string | null
  postsQueryKey: PostsQueryKey
  setSearchTerm: (value: string) => void
  setSelectedCircleId: (value: string | null) => void
  user: SessionUser
}

export const usePrivateCircleMutations = ({
  circleId,
  postsQueryKey,
  setSearchTerm,
  setSelectedCircleId,
  user,
}: UsePrivateCircleMutationsInput) => {
  const queryClient = useQueryClient()

  const createPostMutation = useMutation({
    mutationFn: (input: { body: string; files: File[] }) =>
      createPost({
        circleId: circleId!,
        authorId: user.id,
        body: input.body,
        files: input.files,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.postsRoot(circleId) }),
  })

  const commentMutation = useMutation({
    mutationFn: (input: { post: Post; body: string; parentId?: string }) =>
      addComment(input.post.id, input.post.circleId, user.id, input.body, input.parentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.postsRoot(circleId) }),
  })

  const reactionMutation = useMutation({
    mutationFn: (post: Post) =>
      toggleReaction(post.id, post.circleId, user.id, post.viewerHasReacted),
    onMutate: async (post) => {
      await queryClient.cancelQueries({ queryKey: postsQueryKey })
      const previousPosts = queryClient.getQueryData<PostsInfiniteData>(postsQueryKey)

      queryClient.setQueryData<PostsInfiniteData>(postsQueryKey, (current) => {
        if (!current) {
          return current
        }

        return {
          ...current,
          pages: current.pages.map((page) => ({
            ...page,
            items: page.items.map((item) =>
              item.id === post.id
                ? {
                    ...item,
                    viewerHasReacted: !item.viewerHasReacted,
                    reactionCount: item.viewerHasReacted
                      ? Math.max(0, item.reactionCount - 1)
                      : item.reactionCount + 1,
                  }
                : item,
            ),
          })),
        }
      })

      return { previousPosts }
    },
    onError: (_error, _post, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(postsQueryKey, context.previousPosts)
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.postsRoot(circleId) }),
  })

  const updatePostMutation = useMutation({
    mutationFn: (input: { post: Post; body: string }) => updatePost(input.post.id, input.body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.postsRoot(circleId) }),
  })

  const deletePostMutation = useMutation({
    mutationFn: (post: Post) => deletePost(post.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.postsRoot(circleId) }),
  })

  const createCircleMutation = useMutation({
    mutationFn: createCircle,
    onSuccess: (newCircle) => {
      setSelectedCircleId(newCircle.id)
      queryClient.invalidateQueries({ queryKey: queryKeys.circles(user.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.members(newCircle.id) })
    },
  })

  const joinCircleMutation = useMutation({
    mutationFn: acceptCircleInvite,
    onSuccess: ({ circle: joinedCircle }) => {
      setSelectedCircleId(joinedCircle.id)
      setSearchTerm('')
      queryClient.invalidateQueries({ queryKey: queryKeys.circles(user.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.members(joinedCircle.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.postsRoot(joinedCircle.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications(user.id) })
    },
  })

  const updateCircleMutation = useMutation({
    mutationFn: (input: { name: string; description: string | null }) =>
      updateCircle(circleId!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.circles(user.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.defaultCircle(user.id) })
    },
  })

  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) => removeCircleMember(circleId!, memberId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.members(circleId) }),
  })

  const transferOwnershipMutation = useMutation({
    mutationFn: (memberId: string) => transferCircleOwnership(circleId!, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.members(circleId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.circles(user.id) })
    },
  })

  const leaveCircleMutation = useMutation({
    mutationFn: () => leaveCircle(circleId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.circles(user.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.defaultCircle(user.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.members(circleId) })
    },
  })

  const createInviteMutation = useMutation({
    mutationFn: (input: { maxUses: number; expiresAt: string | null }) =>
      createCircleInvite(circleId!, {
        maxUses: input.maxUses,
        expiresAt: input.expiresAt,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.invites(circleId) }),
  })

  const revokeInviteMutation = useMutation({
    mutationFn: (inviteId: string) => revokeCircleInvite(inviteId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.invites(circleId) }),
  })

  const markNotificationMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications(user.id) }),
  })

  const markAllNotificationsMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications(user.id) }),
  })

  const deleteAllReadNotificationsMutation = useMutation({
    mutationFn: deleteAllReadNotifications,
    onMutate: async () => {
      const notificationsQueryKey = queryKeys.notifications(user.id)
      await queryClient.cancelQueries({ queryKey: notificationsQueryKey })
      const previous = queryClient.getQueryData<NotificationsInfiniteData>(notificationsQueryKey)

      queryClient.setQueryData<NotificationsInfiniteData>(notificationsQueryKey, (current) => {
        if (!current) return current
        return {
          ...current,
          pages: current.pages.map((page) => ({
            ...page,
            items: page.items.filter((item) => !item.readAt),
          })),
        }
      })

      return { previousNotifications: previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(queryKeys.notifications(user.id), context.previousNotifications)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications(user.id) })
    },
  })

  const updateProfileMutation = useMutation({
    mutationFn: (input: { displayName: string; bio: string | null }) =>
      updateProfile({
        userId: user.id,
        displayName: input.displayName,
        bio: input.bio,
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.profile(user.id), data)
      queryClient.invalidateQueries({ queryKey: queryKeys.profile(user.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.members(circleId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.postsRoot(circleId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications(user.id) })
    },
  })

  const togglePinMutation = useMutation({
    mutationFn: (post: Post) => togglePinPost(post.id, post.circleId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.postsRoot(circleId) }),
  })

  const updateAvatarMutation = useMutation({
    mutationFn: (file: File) => updateAvatar(user.id, file),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.profile(user.id), data)
      queryClient.invalidateQueries({ queryKey: queryKeys.profile(user.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.members(circleId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.postsRoot(circleId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications(user.id) })
    },
  })

  const updateCommentMutation = useMutation({
    mutationFn: (input: { commentId: string; body: string }) =>
      updateComment(input.commentId, input.body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.postsRoot(circleId) }),
  })

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => deleteComment(commentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.postsRoot(circleId) }),
  })

  return {
    commentMutation,
    createCircleMutation,
    createInviteMutation,
    createPostMutation,
    deleteCommentMutation,
    deletePostMutation,
    joinCircleMutation,
    leaveCircleMutation,
    deleteAllReadNotificationsMutation,
    markAllNotificationsMutation,
    markNotificationMutation,
    reactionMutation,
    removeMemberMutation,
    revokeInviteMutation,
    togglePinMutation,
    transferOwnershipMutation,
    updateAvatarMutation,
    updateCircleMutation,
    updateCommentMutation,
    updatePostMutation,
    updateProfileMutation,
  }
}
