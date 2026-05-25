import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import {
  CornerDownRight,
  Heart,
  Loader2,
  MessageCircle,
  Pin,
  Send,
} from 'lucide-react'
import type { Comment, Post } from '../../types/domain'
import type { FeedCursor, PaginatedResult } from '../../types/domain'
import { Avatar } from '../../components/ui/Avatar'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { SafeImage } from '../../components/ui/SafeImage'
import { formatRelativeTime } from '../../utils/time'
import { PostActionsMenu } from './PostActionsMenu'
import { CommentActionsMenu } from './CommentActionsMenu'

type PostCardProps = {
  post: Post
  viewerId?: string
  highlighted?: boolean
  onToggleReaction: (post: Post) => void
  onAddComment: (post: Post, body: string, parentId?: string) => Promise<void> | void
  onLoadComments?: (
    post: Post,
    cursor?: FeedCursor | null,
  ) => Promise<PaginatedResult<Comment>>
  canDelete?: boolean
  onDelete?: (post: Post) => Promise<void> | void
  canPin?: boolean
  onTogglePin?: (post: Post) => Promise<void> | void
  onUpdatePost?: (post: Post, body: string) => Promise<void> | void
  onUpdateComment?: (commentId: string, body: string) => Promise<void> | void
  onDeleteComment?: (commentId: string) => Promise<void> | void
  highlightedCommentId?: string | null
}

export function PostCard({
  post,
  viewerId,
  highlighted = false,
  onToggleReaction,
  onAddComment,
  onLoadComments,
  canDelete = false,
  onDelete,
  canPin = false,
  onTogglePin,
  onUpdatePost,
  onUpdateComment,
  onDeleteComment,
  highlightedCommentId = null,
}: PostCardProps) {
  const [comment, setComment] = useState('')
  const [commenting, setCommenting] = useState(false)
  const [loadedComments, setLoadedComments] = useState<Comment[] | null>(null)
  const [commentsCursor, setCommentsCursor] = useState<FeedCursor | null>(null)
  const [commentsOpen, setCommentsOpen] = useState(post.comments.length > 0)
  const [loadingComments, setLoadingComments] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [pinning, setPinning] = useState(false)
  const [heartBurst, setHeartBurst] = useState(false)
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyBody, setReplyBody] = useState('')
  const [replying, setReplying] = useState(false)
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set())
  const [editingPost, setEditingPost] = useState(false)
  const [editBody, setEditBody] = useState(post.body)
  const [savingEdit, setSavingEdit] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  const commentCount = post.commentCount ?? post.comments.length
  const comments = loadedComments ?? post.comments
  const shouldShowComments = commentsOpen

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
      const page = await onLoadComments(post)
      setLoadedComments(page.items)
      setCommentsCursor(page.nextCursor)
      setCommentsOpen(true)
    } finally {
      setLoadingComments(false)
    }
  }

  const loadMoreComments = async () => {
    if (!onLoadComments || loadingComments || !commentsCursor) {
      return
    }

    setLoadingComments(true)
    try {
      const page = await onLoadComments(post, commentsCursor)
      setLoadedComments((current) => [...page.items, ...(current ?? [])])
      setCommentsCursor(page.nextCursor)
      setCommentsOpen(true)
    } finally {
      setLoadingComments(false)
    }
  }

  useEffect(() => {
    if (!highlightedCommentId) return
    let cancelled = false
    const frame = requestAnimationFrame(() => {
      if (cancelled) return
      setCommentsOpen(true)

      if (!commentMap.has(highlightedCommentId) && loadedComments === null && onLoadComments) {
        setLoadingComments(true)
        onLoadComments(post)
          .then((page) => {
            if (cancelled) return
            setLoadedComments(page.items)
            setCommentsCursor(page.nextCursor)
            setCommentsOpen(true)
          })
          .finally(() => {
            if (!cancelled) {
              setLoadingComments(false)
            }
          })
      }
    })

    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
    }
  }, [highlightedCommentId, commentMap, loadedComments, onLoadComments, post])

  useEffect(() => {
    if (!highlightedCommentId) return
    const target = commentMap.get(highlightedCommentId)
    if (!target) return

    const findRootId = (commentItem: Comment): string => {
      if (!commentItem.parentId) return commentItem.id
      const parent = commentMap.get(commentItem.parentId)
      return parent ? findRootId(parent) : commentItem.id
    }

    const rootId = findRootId(target)
    const frame = requestAnimationFrame(() => {
      if (rootId !== target.id) {
        setExpandedThreads((prev) => {
          if (prev.has(rootId)) return prev
          const next = new Set(prev)
          next.add(rootId)
          return next
        })
      }
      document
        .getElementById(`comment-${highlightedCommentId}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })

    return () => cancelAnimationFrame(frame)
  }, [highlightedCommentId, commentMap])

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
        const page = await onLoadComments(post)
        setLoadedComments(page.items)
        setCommentsCursor(page.nextCursor)
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
        const page = await onLoadComments(post)
        setLoadedComments(page.items)
        setCommentsCursor(page.nextCursor)
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
    setDeleting(true)
    try {
      await onDelete(post)
    } finally {
      setDeleting(false)
      setDeleteConfirmOpen(false)
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

  const handleSaveEdit = async () => {
    if (!onUpdatePost || savingEdit) return
    const trimmed = editBody.trim()
    if (!trimmed || trimmed === post.body) {
      setEditingPost(false)
      return
    }
    setSavingEdit(true)
    try {
      await onUpdatePost(post, trimmed)
      setEditingPost(false)
    } finally {
      setSavingEdit(false)
    }
  }

  const isPinned = Boolean(post.pinnedAt)

  return (
    <Card
      as="article"
      className={`group overflow-hidden p-5 transition-all duration-300 hover:shadow-[var(--shadow-elevated)] hover:-translate-y-0.5 sm:p-6 ${
        isPinned ? 'border-l-4 border-l-[var(--color-primary)]' : ''
      } ${highlighted ? 'ring-2 ring-[var(--color-primary)] ring-offset-2' : ''}`}
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
          <PostActionsMenu
            canDelete={canDelete}
            canEdit={Boolean(viewerId && post.authorId === viewerId && onUpdatePost)}
            canPin={canPin}
            isPinned={isPinned}
            onDelete={() => setDeleteConfirmOpen(true)}
            onEdit={() => {
              setEditBody(post.body)
              setEditingPost(true)
            }}
            onTogglePin={handleTogglePin}
            post={post}
          />
        </div>
      </header>

      {editingPost ? (
        <div className="mt-5 space-y-2">
          <textarea
            className="focus-ring min-h-[100px] w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-white px-3 py-2.5 text-[15px] leading-7 text-[var(--color-text)] outline-none transition placeholder:text-[var(--color-muted)]/60 focus:border-[var(--color-primary)] focus:shadow-[0_0_0_3px_rgba(45,106,79,0.12)]"
            onChange={(e) => setEditBody(e.target.value)}
            value={editBody}
          />
          <div className="flex gap-2">
            <Button
              disabled={savingEdit}
              onClick={handleSaveEdit}
              size="sm"
              variant="primary"
            >
              {savingEdit ? <Loader2 className="animate-spin" size={14} /> : '保存'}
            </Button>
            <Button
              disabled={savingEdit}
              onClick={() => {
                setEditingPost(false)
                setEditBody(post.body)
              }}
              size="sm"
              variant="subtle"
            >
              取消
            </Button>
          </div>
        </div>
      ) : (
        <p className="mt-5 whitespace-pre-wrap break-words text-[15px] leading-8 text-[var(--color-text)]">
          {post.body}
        </p>
      )}

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
                isExpanded={expandedThreads.has(item.id)}
                replyMap={replyMap}
                replyTo={replyTo}
                replyBody={replyBody}
                replying={replying}
                onReplyBodyChange={setReplyBody}
                onReplyTo={setReplyTo}
                onSubmitReply={handleReply}
                onToggleExpand={() =>
                  setExpandedThreads((prev) => {
                    const next = new Set(prev)
                    if (next.has(item.id)) {
                      next.delete(item.id)
                    } else {
                      next.add(item.id)
                    }
                    return next
                  })
                }
                viewerId={viewerId}
                onUpdateComment={onUpdateComment}
                onDeleteComment={onDeleteComment}
                highlightedCommentId={highlightedCommentId}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 展开/收起评论区域 */}
      {commentCount > 0 ? (
        <button
          className="focus-ring mt-3 rounded-[var(--radius-sm)] text-sm font-semibold text-[var(--color-primary)] transition duration-200 hover:text-[var(--color-primary-hover)]"
          disabled={loadingComments}
          onClick={() => {
            if (!shouldShowComments) {
              loadComments()
            } else {
              setCommentsOpen(false)
              setReplyTo(null)
            }
          }}
          type="button"
        >
          {loadingComments
            ? '正在加载评论...'
            : shouldShowComments
              ? '收起评论'
              : `查看 ${commentCount} 条评论`}
        </button>
      ) : null}

      {shouldShowComments && commentsCursor ? (
        <button
          className="focus-ring mt-3 rounded-[var(--radius-sm)] text-sm font-semibold text-[var(--color-primary)] transition duration-200 hover:text-[var(--color-primary-hover)]"
          disabled={loadingComments}
          onClick={loadMoreComments}
          type="button"
        >
          {loadingComments ? '正在加载评论...' : '加载更多评论'}
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
      <ConfirmDialog
        busy={deleting}
        description="确定删除这条动态吗？相关评论、点赞和图片也会一起删除。"
        onCancel={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        open={deleteConfirmOpen}
        title="删除动态"
      />
    </Card>
  )
}

function CommentThread({
  comment,
  replyMap,
  commentMap,
  isExpanded,
  replyTo,
  replyBody,
  replying,
  onReplyBodyChange,
  onReplyTo,
  onSubmitReply,
  onToggleExpand,
  viewerId,
  onUpdateComment,
  onDeleteComment,
  highlightedCommentId,
}: {
  comment: Comment
  replyMap: Map<string, Comment[]>
  commentMap: Map<string, Comment>
  isExpanded: boolean
  replyTo: string | null
  replyBody: string
  replying: boolean
  onReplyBodyChange: (value: string) => void
  onReplyTo: (id: string | null) => void
  onSubmitReply: (parentId: string) => Promise<void>
  onToggleExpand: () => void
  viewerId?: string
  onUpdateComment?: (commentId: string, body: string) => Promise<void> | void
  onDeleteComment?: (commentId: string) => Promise<void> | void
  highlightedCommentId?: string | null
}) {
  const allReplies = replyMap.get(comment.id) ?? []
  const visibleReplies = isExpanded ? allReplies : allReplies.slice(0, 2)
  const hiddenCount = Math.max(0, allReplies.length - 2)
  const isReplying = replyTo === comment.id
  const showReplyList = visibleReplies.length > 0 || isReplying
  const showToggle = hiddenCount > 0

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
        viewerId={viewerId}
        onUpdateComment={onUpdateComment}
        onDeleteComment={onDeleteComment}
        highlighted={comment.id === highlightedCommentId}
      />

      {showReplyList ? (
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
              viewerId={viewerId}
              onUpdateComment={onUpdateComment}
              onDeleteComment={onDeleteComment}
              highlighted={reply.id === highlightedCommentId}
            />
          ))}

          {showToggle ? (
            <button
              className="text-xs font-semibold text-[var(--color-primary)] transition hover:text-[var(--color-primary-hover)]"
              onClick={(event) => {
                event.stopPropagation()
                onToggleExpand()
              }}
              type="button"
            >
              {isExpanded ? '收起回复' : `展开 ${hiddenCount} 条回复`}
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
  viewerId,
  onUpdateComment,
  onDeleteComment,
  highlighted = false,
}: {
  comment: Comment
  commentMap: Map<string, Comment>
  isReplying: boolean
  replyBody: string
  replying: boolean
  onReplyBodyChange: (value: string) => void
  onReplyTo: (id: string | null) => void
  onSubmitReply: (parentId: string) => Promise<void>
  viewerId?: string
  onUpdateComment?: (commentId: string, body: string) => Promise<void> | void
  onDeleteComment?: (commentId: string) => Promise<void> | void
  highlighted?: boolean
}) {
  const parentAuthorName = comment.parentId
    ? commentMap.get(comment.parentId)?.author.displayName
    : null

  const isRoot = !comment.parentId
  const [editing, setEditing] = useState(false)
  const [editBody, setEditBody] = useState(comment.body)
  const [saving, setSaving] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const canEdit = Boolean(viewerId && comment.authorId === viewerId && onUpdateComment)
  const canDelete = Boolean(viewerId && comment.authorId === viewerId && onDeleteComment)

  const handleSave = async () => {
    if (!onUpdateComment || saving) return
    const trimmed = editBody.trim()
    if (!trimmed || trimmed === comment.body) {
      setEditing(false)
      return
    }
    setSaving(true)
    try {
      await onUpdateComment(comment.id, trimmed)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!onDeleteComment) return
    await onDeleteComment(comment.id)
    setDeleteOpen(false)
  }

  return (
    <div
      className={`space-y-2 rounded-[var(--radius-sm)] transition ${
        highlighted
          ? 'bg-[var(--color-primary-light)] px-2 py-1 ring-2 ring-[var(--color-primary)]/30'
          : ''
      }`}
      id={`comment-${comment.id}`}
    >
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
          {editing ? (
            <div className="space-y-2">
              <input
                autoFocus
                className="focus-ring w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-text)] outline-none transition placeholder:text-[var(--color-muted)]/60 focus:border-[var(--color-primary)] focus:shadow-[0_0_0_3px_rgba(45,106,79,0.12)]"
                onChange={(e) => setEditBody(e.target.value)}
                value={editBody}
              />
              <div className="flex gap-2">
                <Button disabled={saving} onClick={handleSave} size="sm" variant="primary">
                  {saving ? <Loader2 className="animate-spin" size={12} /> : '保存'}
                </Button>
                <Button
                  disabled={saving}
                  onClick={() => {
                    setEditing(false)
                    setEditBody(comment.body)
                  }}
                  size="sm"
                  variant="subtle"
                >
                  取消
                </Button>
              </div>
            </div>
          ) : (
            <>
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
                {(canEdit || canDelete) && (
                  <CommentActionsMenu
                    canDelete={canDelete}
                    canEdit={canEdit}
                    onDelete={() => setDeleteOpen(true)}
                    onEdit={() => {
                      setEditBody(comment.body)
                      setEditing(true)
                    }}
                  />
                )}
              </div>
            </>
          )}
        </div>
      </div>
      <ConfirmDialog
        busy={false}
        description="确定删除这条评论吗？"
        onCancel={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        open={deleteOpen}
        title="删除评论"
      />

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
