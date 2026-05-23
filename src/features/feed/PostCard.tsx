import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Heart, Loader2, MessageCircle, Send, Trash2 } from 'lucide-react'
import type { Comment, Post } from '../../types/domain'
import { Avatar } from '../../components/ui/Avatar'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { SafeImage } from '../../components/ui/SafeImage'
import { formatRelativeTime } from '../../utils/time'

type PostCardProps = {
  post: Post
  onToggleReaction: (post: Post) => void
  onAddComment: (post: Post, body: string) => Promise<void> | void
  onLoadComments?: (post: Post) => Promise<Comment[]>
  canDelete?: boolean
  onDelete?: (post: Post) => Promise<void> | void
}

export function PostCard({
  post,
  onToggleReaction,
  onAddComment,
  onLoadComments,
  canDelete = false,
  onDelete,
}: PostCardProps) {
  const [comment, setComment] = useState('')
  const [commenting, setCommenting] = useState(false)
  const [loadedComments, setLoadedComments] = useState<Comment[] | null>(null)
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [loadingComments, setLoadingComments] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [heartBurst, setHeartBurst] = useState(false)
  const commentCount = post.commentCount ?? post.comments.length
  const comments = loadedComments ?? post.comments
  const shouldShowComments = commentsOpen || post.comments.length > 0

  useEffect(() => {
    if (!post.viewerHasReacted) {
      return
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHeartBurst(true)
    const timer = window.setTimeout(() => setHeartBurst(false), 220)
    return () => window.clearTimeout(timer)
  }, [post.viewerHasReacted, post.reactionCount])

  const loadComments = async () => {
    if (!onLoadComments || loadingComments) {
      setCommentsOpen(true)
      return
    }

    setLoadingComments(true)
    try {
      const loaded = await onLoadComments(post)
      setLoadedComments(loaded)
      setCommentsOpen(true)
    } finally {
      setLoadingComments(false)
    }
  }

  const handleComment = async (event: FormEvent) => {
    event.preventDefault()
    if (!comment.trim() || commenting) {
      return
    }

    setCommenting(true)
    try {
      await onAddComment(post, comment)
      setComment('')
      if (onLoadComments) {
        const loaded = await onLoadComments(post)
        setLoadedComments(loaded)
        setCommentsOpen(true)
      }
    } finally {
      setCommenting(false)
    }
  }

  const handleDelete = async () => {
    if (!onDelete || deleting) {
      return
    }

    const confirmed = window.confirm('确定删除这条动态吗？相关评论、点赞和图片也会一起删除。')
    if (!confirmed) {
      return
    }

    setDeleting(true)
    try {
      await onDelete(post)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Card as="article" className="group overflow-hidden p-5 transition-all duration-300 hover:shadow-[var(--shadow-elevated)] hover:-translate-y-0.5 sm:p-6">
      <header className="flex items-start gap-3.5">
        <Avatar name={post.author.displayName} size="lg" src={post.author.avatarUrl} />
        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-[15px] text-[var(--color-text)]">
              {post.author.displayName}
            </h2>
            <span className="text-xs text-[var(--color-muted)]">
              {formatRelativeTime(post.createdAt)}
            </span>
          </div>
        </div>
        {canDelete ? (
          <div className="opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <Button
              aria-label="删除动态"
              disabled={deleting}
              onClick={handleDelete}
              size="icon"
              variant="ghost"
            >
              {deleting ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
            </Button>
          </div>
        ) : null}
      </header>

      <p className="mt-5 whitespace-pre-wrap break-words text-[15px] leading-8 text-[var(--color-text)]">
        {post.body}
      </p>

      {post.images.length > 0 ? (
        <ImageGrid images={post.images.map((image) => image.url)} />
      ) : null}

      <div className="mt-5 flex items-center gap-2 border-t border-[var(--color-border)] pt-3">
        <button
          aria-label={post.viewerHasReacted ? '取消点赞' : '点赞'}
          className={`focus-ring inline-flex h-10 items-center gap-2 rounded-[var(--radius-sm)] px-3.5 text-sm font-semibold transition-all duration-200 active:scale-[0.97] ${
            post.viewerHasReacted
              ? 'bg-rose-50 text-[var(--color-rose)] shadow-sm'
              : 'text-[var(--color-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]'
          }`}
          onClick={() => onToggleReaction(post)}
          type="button"
        >
          <Heart
            className={heartBurst ? 'animate-[heart-pop_250ms_var(--ease-spring)]' : ''}
            fill={post.viewerHasReacted ? 'currentColor' : 'none'}
            size={18}
          />
          <span className={`tabular-nums ${heartBurst ? 'animate-[heart-pop_250ms_var(--ease-spring)]' : ''}`}>
            {post.reactionCount}
          </span>
        </button>
        <span className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-sm)] px-3.5 text-sm font-semibold text-[var(--color-muted)]">
          <MessageCircle size={18} />
          {commentCount}
        </span>
      </div>

      {/* 评论列表容器 —— 使用 grid 动画 */}
      <div
        className={`grid transition-all duration-300 ease-out ${
          shouldShowComments && comments.length > 0
            ? 'grid-rows-[1fr] opacity-100 mt-3'
            : 'grid-rows-[0fr] opacity-0 mt-0 pointer-events-none'
        }`}
      >
        <div className="overflow-hidden">
          <div className="rounded-[var(--radius-md)] bg-[var(--color-surface)] p-4 space-y-3">
            {comments.map((item) => (
              <div className="flex gap-3" key={item.id}>
                <Avatar name={item.author.displayName} size="sm" src={item.author.avatarUrl} />
                <div className="min-w-0 flex-1">
                  <p className="break-words text-sm leading-6 text-[var(--color-text)]">
                    <span className="font-semibold">{item.author.displayName}</span>{' '}
                    {item.body}
                  </p>
                  <p className="text-xs font-medium text-[var(--color-muted)]">
                    {formatRelativeTime(item.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* "查看评论" 按钮 —— 仅在评论区收起且有评论时显示 */}
      {!shouldShowComments && commentCount > 0 ? (
        <button
          className="focus-ring mt-3 rounded-[var(--radius-sm)] text-sm font-semibold text-[var(--color-primary)] transition duration-200 hover:text-[var(--color-primary-hover)]"
          disabled={loadingComments}
          onClick={loadComments}
          type="button"
        >
          {loadingComments ? '正在加载评论...' : `查看 ${commentCount} 条评论`}
        </button>
      ) : null}

      <form className="mt-3 flex gap-2" onSubmit={handleComment}>
        <input
          aria-label="写评论"
          className="focus-ring min-w-0 flex-1 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-white px-3 py-2.5 text-sm text-[var(--color-text)] outline-none transition duration-200 placeholder:text-[var(--color-muted)]/60 focus:border-[var(--color-primary)] focus:shadow-[0_0_0_3px_rgba(45,106,79,0.12)]"
          onChange={(event) => setComment(event.target.value)}
          placeholder="写一句评论..."
          value={comment}
        />
        <Button
          aria-label="发送评论"
          disabled={commenting || !comment.trim()}
          size="icon"
          type="submit"
          variant="primary"
        >
          {commenting ? <Loader2 className="animate-spin" size={17} /> : <Send size={17} />}
        </Button>
      </form>
    </Card>
  )
}

function ImageGrid({ images }: { images: string[] }) {
  if (images.length === 1) {
    return (
      <div className="mt-5 overflow-hidden rounded-[var(--radius-md)]">
        <SafeImage
          alt="动态图片"
          className="max-h-[520px] w-full object-cover transition-transform duration-500 ease-out hover:scale-[1.02]"
          src={images[0]}
        />
      </div>
    )
  }

  const gridClass = images.length === 2 ? 'grid-cols-2' : 'grid-cols-2'

  return (
    <div className={`mt-5 grid ${gridClass} gap-3`}>
      {images.slice(0, 4).map((image, index) => (
        <div
          className={`relative overflow-hidden rounded-[var(--radius-md)] bg-[var(--color-surface)] ${
            images.length === 3 && index === 0 ? 'col-span-2 row-span-2 aspect-[2/1]' : 'aspect-square'
          }`}
          key={image}
        >
          <SafeImage
            alt="动态图片"
            className="h-full w-full object-cover transition-transform duration-500 ease-out hover:scale-105"
            src={image}
          />
          {index === 3 && images.length > 4 ? (
            <div className="absolute inset-0 flex items-center justify-center bg-stone-950/40 text-lg font-medium text-white backdrop-blur-sm">
              +{images.length - 4}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  )
}
