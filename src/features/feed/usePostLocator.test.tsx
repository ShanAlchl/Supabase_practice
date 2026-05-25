import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor, act } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { CircleNotification, Post } from '../../types/domain'
import { usePostLocator } from './usePostLocator'

const profile = {
  id: 'user-1',
  displayName: '林夏',
  avatarUrl: null,
  bio: null,
}

const post: Post = {
  id: 'post-1',
  circleId: 'circle-1',
  authorId: 'user-1',
  body: '今日动态',
  createdAt: '2026-05-23T00:00:00.000Z',
  pinnedAt: null,
  author: profile,
  images: [],
  comments: [],
  commentCount: 1,
  reactionCount: 0,
  viewerHasReacted: false,
}

const notification: CircleNotification = {
  id: 'notification-1',
  circleId: 'circle-1',
  recipientId: 'user-1',
  actorId: 'user-2',
  type: 'post_commented',
  postId: 'post-1',
  commentId: 'comment-1',
  readAt: null,
  createdAt: '2026-05-23T00:01:00.000Z',
}

describe('usePostLocator', () => {
  beforeEach(() => {
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0)
      return 1
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('keeps the target comment id for comment notifications', async () => {
    const queryClient = new QueryClient()
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    const { result } = renderHook(
      () =>
        usePostLocator({
          viewerId: 'user-1',
          circleId: 'circle-1',
          posts: [post],
        }),
      { wrapper },
    )

    act(() => {
      result.current.locate(notification)
    })

    await waitFor(() => {
      expect(result.current.highlightedCommentId).toBe('comment-1')
    })
  })
})
