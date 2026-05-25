import type { Comment, Post } from '../../types/domain'
import type { FeedCursor, PaginatedResult } from '../../types/domain'
import { EmptyState } from '../../components/ui/EmptyState'
import { Card } from '../../components/ui/Card'
import { Skeleton } from '../../components/ui/Skeleton'
import { Button } from '../../components/ui/Button'
import { PostCard } from './PostCard'

type FeedProps = {
  posts: Post[]
  loading?: boolean
  loadingMore?: boolean
  hasMore?: boolean
  onCompose: () => void
  onToggleReaction: (post: Post) => void
  onAddComment: (post: Post, body: string, parentId?: string) => Promise<void> | void
  onLoadComments?: (
    post: Post,
    cursor?: FeedCursor | null,
  ) => Promise<PaginatedResult<Comment>>
  onLoadMore?: () => Promise<void> | void
  viewerId?: string
  onDeletePost?: (post: Post) => Promise<void> | void
  canPin?: boolean
  onTogglePin?: (post: Post) => Promise<void> | void
  onUpdatePost?: (post: Post, body: string) => Promise<void> | void
  onUpdateComment?: (commentId: string, body: string) => Promise<void> | void
  onDeleteComment?: (commentId: string) => Promise<void> | void
  highlightedPostId?: string | null
  highlightedCommentId?: string | null
}

export function Feed({
  posts,
  loading = false,
  loadingMore = false,
  hasMore = false,
  onCompose,
  onToggleReaction,
  onAddComment,
  onLoadComments,
  onLoadMore,
  viewerId,
  onDeletePost,
  canPin,
  onTogglePin,
  onUpdatePost,
  onUpdateComment,
  onDeleteComment,
  highlightedPostId,
  highlightedCommentId,
}: FeedProps) {
  if (loading) {
    return <FeedSkeleton />
  }

  if (posts.length === 0) {
    return <EmptyState onCompose={onCompose} />
  }

  return (
    <div className="space-y-5">
      <div className="space-y-5">
        {posts.map((post, index) => (
          <div
            key={post.id}
            className="animate-fade-in-up"
            id={`post-${post.id}`}
            style={{ animationDelay: `${Math.min(index * 60, 300)}ms` }}
          >
            <PostCard
              key={post.id}
              viewerId={viewerId}
              highlighted={post.id === highlightedPostId}
              highlightedCommentId={
                post.id === highlightedPostId ? highlightedCommentId : null
              }
              onAddComment={onAddComment}
              canDelete={Boolean(viewerId && post.authorId === viewerId)}
              onDelete={onDeletePost}
              onLoadComments={onLoadComments}
              onToggleReaction={onToggleReaction}
              canPin={canPin}
              onTogglePin={onTogglePin}
              onUpdatePost={onUpdatePost}
              onUpdateComment={onUpdateComment}
              onDeleteComment={onDeleteComment}
              post={post}
            />
          </div>
        ))}
      </div>
      {hasMore && onLoadMore ? (
        <div className="flex justify-center">
          <Button disabled={loadingMore} onClick={onLoadMore} variant="subtle">
            {loadingMore ? '正在加载...' : '加载更多动态'}
          </Button>
        </div>
      ) : null}
    </div>
  )
}

function FeedSkeleton() {
  return (
    <div className="space-y-5" aria-label="动态加载中">
      {[0, 1, 2].map((item) => (
        <Card className="p-5 sm:p-6" key={item}>
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <div className="mt-5 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
          <Skeleton className="mt-5 h-56 w-full rounded-[var(--radius-md)]" />
          <div className="mt-4 flex gap-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-20" />
          </div>
        </Card>
      ))}
    </div>
  )
}
