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
    <Card as="article" className="overflow-hidden p-4 transition duration-200 hover:border-teal-200 sm:p-5">
      <header className="flex items-start gap-3">
        <Avatar name={post.author.displayName} src={post.author.avatarUrl} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h2 className="truncate font-semibold text-[var(--color-text)]">
              {post.author.displayName}
            </h2>
            <span className="text-xs font-medium text-[var(--color-muted)]">
              {formatRelativeTime(post.createdAt)}
            </span>
          </div>
          {post.author.bio ? (
            <p className="mt-0.5 truncate text-xs text-[var(--color-muted)]">
              {post.author.bio}
            </p>
          ) : null}
        </div>
        {canDelete ? (
          <Button
            aria-label="删除动态"
            disabled={deleting}
            onClick={handleDelete}
            size="icon"
            variant="ghost"
          >
            {deleting ? <Loader2 className="animate-spin" size={17} /> : <Trash2 size={17} />}
          </Button>
        ) : null}
      </header>

      <p className="mt-4 whitespace-pre-wrap break-words text-[15px] leading-7 text-[var(--color-text)]">
        {post.body}
      </p>

      {post.images.length > 0 ? (
        <ImageGrid images={post.images.map((image) => image.url)} />
      ) : null}

      <div className="mt-4 flex items-center gap-2 border-t border-[var(--color-border)] pt-3">
        <button
          aria-label={post.viewerHasReacted ? '取消点赞' : '点赞'}
          className={`focus-ring inline-flex h-9 items-center gap-2 rounded-[8px] px-3 text-sm font-semibold transition duration-150 active:scale-[0.98] ${
            post.viewerHasReacted
              ? 'bg-rose-50 text-[var(--color-rose)] hover:bg-rose-100'
              : 'text-[var(--color-muted)] hover:bg-slate-100 hover:text-[var(--color-text)]'
          }`}
          onClick={() => onToggleReaction(post)}
          type="button"
        >
          <Heart
            className={heartBurst ? 'animate-[heart-pop_220ms_ease-out]' : ''}
            fill={post.viewerHasReacted ? 'currentColor' : 'none'}
            size={18}
          />
          {post.reactionCount}
        </button>
        <span className="inline-flex h-9 items-center gap-2 rounded-[8px] px-3 text-sm font-semibold text-[var(--color-muted)]">
          <MessageCircle size={18} />
          {commentCount}
        </span>
      </div>

      {!shouldShowComments && commentCount > 0 ? (
        <button
          className="focus-ring mt-3 rounded-[8px] text-sm font-semibold text-[var(--color-primary)] transition duration-200 hover:text-[var(--color-primary-hover)]"
          disabled={loadingComments}
          onClick={loadComments}
          type="button"
        >
          {loadingComments ? '正在加载评论...' : `查看 ${commentCount} 条评论`}
        </button>
      ) : null}

      {shouldShowComments && comments.length > 0 ? (
        <div className="mt-3 space-y-3 rounded-[8px] bg-slate-50 p-3">
          {comments.map((item) => (
            <div className="flex gap-2.5" key={item.id}>
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
      ) : null}

      <form className="mt-3 flex gap-2" onSubmit={handleComment}>
        <input
          aria-label="写评论"
          className="focus-ring min-w-0 flex-1 rounded-[8px] border border-[var(--color-border)] bg-white px-3 py-2.5 text-sm text-[var(--color-text)] outline-none transition duration-200 placeholder:text-slate-400 focus:border-[var(--color-primary)]"
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
  const visible = images.slice(0, 4)

  if (images.length === 1) {
    return (
      <SafeImage
        alt="动态图片"
        className="mt-4 max-h-[520px] w-full rounded-[8px] object-cover"
        src={images[0]}
      />
    )
  }

  const gridClass =
    images.length === 2
      ? 'grid-cols-2'
      : images.length === 3
        ? 'grid-cols-3'
        : 'grid-cols-2'

  return (
    <div className={`mt-4 grid ${gridClass} gap-2`}>
      {visible.map((image, index) => (
        <div
          className={`relative overflow-hidden rounded-[8px] bg-slate-100 ${
            images.length === 3 && index === 0 ? 'col-span-2 row-span-2' : 'aspect-square'
          }`}
          key={image}
        >
          <SafeImage alt="动态图片" className="h-full w-full object-cover" src={image} />
          {index === 3 && images.length > 4 ? (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/45 text-lg font-semibold text-white">
              +{images.length - 4}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  )
}
