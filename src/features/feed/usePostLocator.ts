import { useCallback, useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { InfiniteData } from '@tanstack/react-query'
import { queryKeys } from '../../lib/queryKeys'
import { fetchPostById } from '../../services/feedService'
import type { FeedCursor, PaginatedResult, Post, CircleNotification } from '../../types/domain'

type LocatorTarget = {
  postId: string
  commentId?: string | null
  circleId: string
}

export const usePostLocator = ({
  viewerId,
  circleId,
  posts,
}: {
  viewerId: string
  circleId: string | null
  posts: Post[]
}) => {
  const queryClient = useQueryClient()
  const [highlightedPostId, setHighlightedPostId] = useState<string | null>(null)
  const [highlightedCommentId, setHighlightedCommentId] = useState<string | null>(null)
  const [pending, setPending] = useState<LocatorTarget | null>(null)
  const [error, setError] = useState<string | null>(null)
  const highlightTimerRef = useRef<number | null>(null)

  const clearHighlight = useCallback(() => {
    if (highlightTimerRef.current) {
      window.clearTimeout(highlightTimerRef.current)
      highlightTimerRef.current = null
    }
    setHighlightedPostId(null)
    setHighlightedCommentId(null)
  }, [])

  const highlight = useCallback((postId: string, commentId?: string | null) => {
    clearHighlight()
    setHighlightedPostId(postId)
    setHighlightedCommentId(commentId ?? null)
    highlightTimerRef.current = window.setTimeout(() => {
      setHighlightedPostId(null)
      setHighlightedCommentId(null)
      highlightTimerRef.current = null
    }, commentId ? 3000 : 1500)
  }, [clearHighlight])

  const scrollToPost = useCallback((postId: string) => {
    const el = document.getElementById(`post-${postId}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [])

  const insertPostIntoCache = useCallback(
    (post: Post, targetCircleId: string) => {
      const postsQueryKey = queryKeys.posts(targetCircleId, '')
      queryClient.setQueryData<InfiniteData<PaginatedResult<Post>, FeedCursor | null>>(
        postsQueryKey,
        (old) => {
          if (!old) {
            return {
              pages: [{ items: [post], nextCursor: null }],
              pageParams: [null],
            }
          }
          const firstPage = old.pages[0]
          if (firstPage.items.some((p) => p.id === post.id)) {
            return old
          }
          return {
            ...old,
            pages: [
              { ...firstPage, items: [post, ...firstPage.items] },
              ...old.pages.slice(1),
            ],
          }
        },
      )
    },
    [queryClient],
  )

  useEffect(() => {
    if (!pending) return
    if (circleId !== pending.circleId) return

    const post = posts.find((p) => p.id === pending.postId)
    if (post) {
      scrollToPost(post.id)
      // Defer setState out of effect body to avoid cascading renders
      requestAnimationFrame(() => {
        highlight(post.id, pending.commentId)
        setPending(null)
      })
      return
    }

    // Post not in current feed; fetch it
    let cancelled = false
    fetchPostById(pending.postId, viewerId)
      .then((fetched) => {
        if (cancelled) return
        insertPostIntoCache(fetched, pending.circleId)
        // Wait for React render
        requestAnimationFrame(() => {
          scrollToPost(fetched.id)
          highlight(fetched.id, pending.commentId)
        })
      })
      .catch((err) => {
        if (cancelled) return
        setError(
          err instanceof Error ? err.message : '这条动态可能已被删除或你已无法访问。',
        )
      })
      .finally(() => {
        if (!cancelled) {
          requestAnimationFrame(() => setPending(null))
        }
      })

    return () => {
      cancelled = true
    }
  }, [pending, circleId, posts, viewerId, scrollToPost, highlight, insertPostIntoCache])

  const locate = useCallback(
    (notification: CircleNotification) => {
      setError(null)
      if (!notification.postId) {
        setError('该通知没有关联的动态。')
        return
      }
      setPending({
        postId: notification.postId,
        commentId: notification.commentId,
        circleId: notification.circleId,
      })
    },
    [],
  )

  const locatePost = useCallback((target: LocatorTarget) => {
    setError(null)
    setPending(target)
  }, [])

  return {
    highlightedPostId,
    highlightedCommentId,
    locate,
    locatePost,
    error,
    setError,
    clearHighlight,
    highlight,
    scrollToPost,
  }
}
