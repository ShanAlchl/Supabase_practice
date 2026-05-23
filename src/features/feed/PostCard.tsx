import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  CornerDownRight,
  Heart,
  Loader2,
  MessageCircle,
  Pin,
  Send,
  Trash2,
} from 'lucide-react'
import type { Comment, Post } from '../../types/domain'
import { Avatar } from '../../components/ui/Avatar'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { SafeImage } from '../../components/ui/SafeImage'
import { formatRelativeTime } from '../../utils/time'

type PostCardProps = {
  post: Post
  viewerId?: string
  onToggleReaction: (post: Post) => void
  onAddComment: (post: Post, body: string, parentId?: string) => Promise<void> | void
  onLoadComments?: (post: Post) => Promise<Comment[]>
  canDelete?: boolean
  onDelete?: (post: Post) => Promise<void> | void
  canPin?: boolean
  onTogglePin?: (post: Post) => Promise<void> | void
}

export function PostCard({
  post,
  onToggleReaction,
  onAddComment,
  onLoadComments,
  canDelete = false,
  onDelete,
  canPin = false,
  onTogglePin,
}: PostCardProps) {
  const [comment, setComment] = useState('')
  const [commenting, setCommenting] = useState(false)
  const [loadedComments, setLoadedComments] = useState<Comment[] | null>(null)
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [loadingComments, setLoadingComments] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [pinning, setPinning] = useState(false)
  const [heartBurst, setHeartBurst] = useState(false)
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyBody, setReplyBody] = useState('')
  const [replying, setReplying] = useState(false)

  const commentCount = post.commentCount ?? post.comments.length
  const comments = loadedComments ?? post.comments
  const shouldShowComments = commentsOpen || post.comments.length > 0

  const { topLevel, replyMap, commentMap } = useMemo(() => {
    const idMap = new Map<string, Comment>()
    for (const c of comments) {
      idMap.set(c.id, c)
    }

    const getRootId = (comment: Comment): string | null => {
      if (!comment.parentId) return null
      const parent = idMap.get(comment.parentId)
      if (!parent) return null
      if (!parent.parentId) return parent.id
      return getRootId(parent)
    }

    const map = new Map<string, Comment[]>()
    const top: Comment[] = []

    for (const c of comments) {
      if (!c.parentId) {
        top.push(c)
      } else {
        const rootId = getRootId(c)
        if (rootId) {
          const list = map.get(rootId) ?? []
          list.push(c)
          map.set(rootId, list)
        }
      }
    }

    for (const list of map.values()) {
      list.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    }

    return { topLevel: top, replyMap: map, commentMap: idMap }
  }, [comments])

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

  const handleReply = async (parentId: string) => {
    if (!replyBody.trim() || replying) {
      return
    }

    setReplying(true)
    try {
      await onAddComment(post, replyBody, parentId)
      setReplyBody('')
      setReplyTo(null)
      if (onLoadComments) {
        const loaded = await onLoadComments(post)
        setLoadedComments(loaded)
        setCommentsOpen(true)
      }
    } finally {
      setReplying(false)
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

  const handleTogglePin = async () => {
    if (!onTogglePin || pinning) {
      return
    }

    setPinning(true)
    try {
      await onTogglePin(post)
    } finally {
      setPinning(false)
    }
  }

  const isPinned = Boolean(post.pinnedAt)

  return (
    <Card
      as="article"
      className={`group overflow-hidden p-5 transition-all duration-300 hover:shadow-[var(--shadow-elevated)] hover:-translate-y-0.5 sm:p-6 ${
        isPinned ? 'border-l-4 border-l-[var(--color-primary)]' : ''
      }`}
    >
      {isPinned ? (
        <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-[var(--color-primary)]">
          <Pin size={14} />
          置顶动态
        </div>
      ) : null}

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
        <div className="flex items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          {canPin ? (
            <Button
              aria-label={isPinned ? '取消置顶' : '置顶'}
              disabled={pinning}
              onClick={handleTogglePin}
              size="icon"
              variant="ghost"
            >
              {pinning ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <Pin size={16} className={isPinned ? 'text-[var(--color-primary)]' : ''} />
              )}
            </Button>
          ) : null}
          {canDelete ? (
            <Button
              aria-label="删除动态"
              disabled={deleting}
              onClick={handleDelete}
              size="icon"
              variant="ghost"
            >
              {deleting ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
            </Button>
          ) : null}
        </div>
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
          <span
            className={`tabular-nums ${heartBurst ? 'animate-[heart-pop_250ms_var(--ease-spring)]' : ''}`}
          >
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
          shouldShowComments && topLevel.length > 0
            ? 'grid-rows-[1fr] opacity-100 mt-3'
            : 'grid-rows-[0fr] opacity-0 mt-0 pointer-events-none'
        }`}
      >
        <div className="overflow-hidden">
          <div className="rounded-[var(--radius-md)] bg-[var(--color-surface)] p-4 space-y-4">
            {topLevel.map((item) => (
              <CommentThread
                key={item.id}
                comment={item}
                commentMap={commentMap}
                replyMap={replyMap}
                replyTo={replyTo}
                replyBody={replyBody}
                replying={replying}
                onReplyBodyChange={setReplyBody}
                onReplyTo={setReplyTo}
                onSubmitReply={handleReply}
              />
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

function CommentThread({
  comment,
  replyMap,
  commentMap,
  replyTo,
  replyBody,
  replying,
  onReplyBodyChange,
  onReplyTo,
  onSubmitReply,
}: {
  comment: Comment
  replyMap: Map<string, Comment[]>
  commentMap: Map<string, Comment>
  replyTo: string | null
  replyBody: string
  replying: boolean
  onReplyBodyChange: (value: string) => void
  onReplyTo: (id: string | null) => void
  onSubmitReply: (parentId: string) => Promise<void>
}) {
  const allReplies = replyMap.get(comment.id) ?? []
  const [showAll, setShowAll] = useState(false)
  const visibleReplies = showAll ? allReplies : allReplies.slice(0, 2)
  const hasMore = allReplies.length > 2
  const isReplying = replyTo === comment.id

  return (
    <div className="space-y-2">
      <CommentItem
        comment={comment}
        commentMap={commentMap}
        isReplying={isReplying}
        onReplyBodyChange={onReplyBodyChange}
        onReplyTo={onReplyTo}
        onSubmitReply={onSubmitReply}
        replyBody={replyBody}
        replying={replying}
      />

      {visibleReplies.length > 0 || isReplying ? (
        <div className="space-y-2 pl-3">
          {visibleReplies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              commentMap={commentMap}
              isReplying={replyTo === reply.id}
              onReplyBodyChange={onReplyBodyChange}
              onReplyTo={onReplyTo}
              onSubmitReply={onSubmitReply}
              replyBody={replyBody}
              replying={replying}
            />
          ))}

          {hasMore ? (
            <button
              className="text-xs font-semibold text-[var(--color-primary)] transition hover:text-[var(--color-primary-hover)]"
              onClick={() => setShowAll((prev) => !prev)}
              type="button"
            >
              {showAll ? '收起回复' : `展开 ${allReplies.length - 2} 条回复`}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function CommentItem({
  comment,
  commentMap,
  isReplying,
  replyBody,
  replying,
  onReplyBodyChange,
  onReplyTo,
  onSubmitReply,
}: {
  comment: Comment
  commentMap: Map<string, Comment>
  isReplying: boolean
  replyBody: string
  replying: boolean
  onReplyBodyChange: (value: string) => void
  onReplyTo: (id: string | null) => void
  onSubmitReply: (parentId: string) => Promise<void>
}) {
  const parentAuthorName = comment.parentId
    ? commentMap.get(comment.parentId)?.author.displayName
    : null

  const isRoot = !comment.parentId

  return (
    <div className="space-y-2">
      <div className={`flex ${isRoot ? 'gap-3' : 'gap-2.5'}`}>
        {!isRoot ? (
          <CornerDownRight size={14} className="mt-1 shrink-0 text-[var(--color-muted)]" />
        ) : null}
        <Avatar
          name={comment.author.displayName}
          size={isRoot ? 'sm' : 'xs'}
          src={comment.author.avatarUrl}
        />
        <div className="min-w-0 flex-1">
          <p className="break-words text-sm leading-6 text-[var(--color-text)]">
            <span className="font-semibold">{comment.author.displayName}</span>{' '}
            {parentAuthorName ? (
              <span className="font-medium text-[var(--color-primary)]">@{parentAuthorName}</span>
            ) : null}{' '}
            {comment.body}
          </p>
          <div className="mt-1 flex items-center gap-3">
            <p className="text-xs font-medium text-[var(--color-muted)]">
              {formatRelativeTime(comment.createdAt)}
            </p>
            <button
              className="text-xs font-semibold text-[var(--color-primary)] transition hover:text-[var(--color-primary-hover)]"
              onClick={() => onReplyTo(isReplying ? null : comment.id)}
              type="button"
            >
              {isReplying ? '取消回复' : '回复'}
            </button>
          </div>
        </div>
      </div>

      {isReplying ? (
        <div className="flex gap-2 pl-2">
          <input
            autoFocus
            className="focus-ring min-w-0 flex-1 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-text)] outline-none transition placeholder:text-[var(--color-muted)]/60 focus:border-[var(--color-primary)] focus:shadow-[0_0_0_3px_rgba(45,106,79,0.12)]"
            onChange={(event) => onReplyBodyChange(event.target.value)}
            placeholder={`回复 ${comment.author.displayName}...`}
            value={replyBody}
          />
          <Button
            disabled={replying || !replyBody.trim()}
            onClick={() => onSubmitReply(comment.id)}
            size="icon"
            variant="primary"
          >
            {replying ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
          </Button>
        </div>
      ) : null}
    </div>
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
