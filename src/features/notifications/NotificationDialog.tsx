import { Bell, CheckCheck, Heart, MessageCircle, Trash2, UserPlus } from 'lucide-react'
import type { CircleNotification } from '../../types/domain'
import { Avatar } from '../../components/ui/Avatar'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Dialog } from '../../components/ui/Dialog'
import { Notice } from '../../components/ui/Notice'
import { formatRelativeTime } from '../../utils/time'

type NotificationDialogProps = {
  open: boolean
  notifications: CircleNotification[]
  error?: string | null
  hasMore?: boolean
  loadingMore?: boolean
  busy?: boolean
  onClose: () => void
  onLoadMore?: () => Promise<void> | void
  onMarkRead: (notificationId: string) => Promise<void>
  onMarkAllRead: () => Promise<void>
  onDeleteAllRead?: () => Promise<void>
  onSelectNotification?: (notification: CircleNotification) => void
}

const labelFor = (item: CircleNotification) => {
  const actor = item.actor?.displayName ?? '有成员'
  if (item.type === 'post_reacted') return `${actor} 点赞了你的动态`
  if (item.type === 'post_commented') return `${actor} 评论了你的动态`
  if (item.type === 'comment_replied') return `${actor} 回复了你的评论`
  if (item.type === 'member_joined') return `${actor} 加入了圈子`
  return `${actor} 使用了你的邀请`
}

const iconFor = (type: CircleNotification['type']) => {
  if (type === 'post_reacted') return Heart
  if (type === 'post_commented') return MessageCircle
  if (type === 'comment_replied') return MessageCircle
  if (type === 'member_joined') return UserPlus
  return Bell
}

export function NotificationDialog({
  open,
  notifications,
  error,
  hasMore = false,
  loadingMore = false,
  busy = false,
  onClose,
  onLoadMore,
  onMarkRead,
  onMarkAllRead,
  onDeleteAllRead,
  onSelectNotification,
}: NotificationDialogProps) {
  const unreadCount = notifications.filter((item) => !item.readAt).length
  const readCount = notifications.length - unreadCount

  return (
    <Dialog className="max-w-xl" onClose={onClose} open={open} title="通知">
      <div className="mb-4 flex items-center justify-between gap-3">
        <Badge tone={unreadCount > 0 ? 'primary' : 'neutral'}>{unreadCount} 条未读</Badge>
        <div className="flex items-center gap-2">
          {onDeleteAllRead ? (
            <Button
              disabled={readCount === 0 || busy}
              onClick={onDeleteAllRead}
              size="sm"
              variant="danger"
            >
              <Trash2 size={14} />
              {busy ? '删除中...' : '删除已读'}
            </Button>
          ) : null}
          <Button disabled={unreadCount === 0} onClick={onMarkAllRead} size="sm" variant="subtle">
            <CheckCheck size={16} />
            全部已读
          </Button>
        </div>
      </div>

      {error ? (
        <Notice className="mb-4" tone="error">
          {error}
        </Notice>
      ) : null}

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] px-4 py-8 text-center text-sm text-[var(--color-muted)]">
            暂时没有通知。
          </div>
        ) : (
          notifications.map((item) => {
            const Icon = iconFor(item.type)
            return (
              <button
                className={`focus-ring w-full rounded-[var(--radius-sm)] border p-3 text-left transition ${
                  item.readAt
                    ? 'border-[var(--color-border)] bg-[var(--color-card)]'
                    : 'border-[var(--color-primary)]/20 bg-[var(--color-primary-light)]/40'
                } ${onSelectNotification ? 'cursor-pointer hover:shadow-sm' : ''}`}
                key={item.id}
                onClick={() => onSelectNotification?.(item)}
                type="button"
              >
                <div className="flex items-start gap-3">
                  <Avatar
                    name={item.actor?.displayName ?? '成员'}
                    size="sm"
                    src={item.actor?.avatarUrl}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[var(--color-text)]">
                      {labelFor(item)}
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-[var(--color-muted)]">
                      <Icon size={14} />
                      {formatRelativeTime(item.createdAt)}
                    </p>
                  </div>
                  {!item.readAt ? (
                    <Button onClick={() => onMarkRead(item.id)} size="sm" variant="ghost">
                      已读
                    </Button>
                  ) : null}
                </div>
              </button>
            )
          })
        )}
        {hasMore && onLoadMore ? (
          <div className="flex justify-center pt-1">
            <Button disabled={loadingMore} onClick={onLoadMore} size="sm" variant="subtle">
              {loadingMore ? '正在加载...' : '加载更多通知'}
            </Button>
          </div>
        ) : null}
      </div>
    </Dialog>
  )
}
