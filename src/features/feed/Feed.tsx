import type { Comment, Post } from '../../types/domain'
import { EmptyState } from '../../components/ui/EmptyState'
import { Card } from '../../components/ui/Card'
import { Skeleton } from '../../components/ui/Skeleton'
import { PostCard } from './PostCard'

type FeedProps = {
  posts: Post[]
  loading?: boolean
  onCompose: () => void
  onToggleReaction: (post: Post) => void
  onAddComment: (post: Post, body: string) => Promise<void> | void
  onLoadComments?: (post: Post) => Promise<Comment[]>
  viewerId?: string
  onDeletePost?: (post: Post) => Promise<void> | void
}

export function Feed({
  posts,
  loading = false,
  onCompose,
  onToggleReaction,
  onAddComment,
  onLoadComments,
  viewerId,
  onDeletePost,
}: FeedProps) {
  if (loading) {
    return <FeedSkeleton />
  }

  if (posts.length === 0) {
    return <EmptyState onCompose={onCompose} />
  }

  return (
    <div className="space-y-5">
      {posts.map((post, index) => (
        <div
          key={post.id}
          className="animate-fade-in-up"
          style={{ animationDelay: `${Math.min(index * 60, 300)}ms` }}
        >
          <PostCard
            key={post.id}
            onAddComment={onAddComment}
            canDelete={Boolean(viewerId && post.authorId === viewerId)}
            onDelete={onDeletePost}
            onLoadComments={onLoadComments}
            onToggleReaction={onToggleReaction}
            post={post}
          />
        </div>
      ))}
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
