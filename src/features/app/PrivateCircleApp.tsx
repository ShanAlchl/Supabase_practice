import { useState, Suspense, lazy, useRef } from 'react'
import { getErrorMessage } from '../../lib/errors'
import { supabase } from '../../lib/supabase'
import { useAlbumState } from '../album/useAlbumState'
import { CircleSwitcher } from '../circles/CircleSwitcher'
import { usePostLocator } from '../feed/usePostLocator'
import { Feed } from '../feed/Feed'
import { useRealtimeFeed } from '../feed/useRealtimeFeed'
import { AppShell } from '../shell/AppShell'
import { CalendarDays } from 'lucide-react'
import type { PanelKey } from '../shell/AppShell'
import type { SessionUser } from '../../types/domain'
import { DialogFallback } from '../../components/ui/DialogFallback'
import { LoadingScreen } from './LoadingScreen'
import { SetupError } from './SetupError'
import { usePrivateCircleDialogs } from './usePrivateCircleDialogs'
import { usePrivateCircleMutations } from './usePrivateCircleMutations'
import { usePrivateCircleQueries } from './usePrivateCircleQueries'

const AlbumView = lazy(() => import('../album/AlbumView').then((m) => ({ default: m.AlbumView })))
const CircleSettingsPanel = lazy(() =>
  import('../settings/CircleSettingsPanel').then((m) => ({ default: m.CircleSettingsPanel })),
)
const ComposeDialog = lazy(() =>
  import('../composer/ComposeDialog').then((m) => ({ default: m.ComposeDialog })),
)
const LightboxDialog = lazy(() =>
  import('../album/LightboxDialog').then((m) => ({ default: m.LightboxDialog })),
)
const MembersDialog = lazy(() =>
  import('../settings/MembersDialog').then((m) => ({ default: m.MembersDialog })),
)
const NotificationDialog = lazy(() =>
  import('../notifications/NotificationDialog').then((m) => ({ default: m.NotificationDialog })),
)
const ProfileSettingsPanel = lazy(() =>
  import('../settings/ProfileSettingsPanel').then((m) => ({ default: m.ProfileSettingsPanel })),
)
const SettingsDialog = lazy(() =>
  import('../settings/SettingsDialog').then((m) => ({ default: m.SettingsDialog })),
)
const SettingsView = lazy(() =>
  import('../settings/SettingsView').then((m) => ({ default: m.SettingsView })),
)

export function PrivateCircleApp({ user }: { user: SessionUser }) {
  const [selectedCircleId, setSelectedCircleId] = useState<string | null>(null)
  const [activePanel, setActivePanel] = useState<PanelKey>('feed')
  const [mainPanel, setMainPanel] = useState<'feed' | 'album' | 'settings'>('feed')
  const [composeOpen, setComposeOpen] = useState(false)
  const [targetDate, setTargetDate] = useState('')
  const dialogs = usePrivateCircleDialogs()
  const album = useAlbumState()
  const queries = usePrivateCircleQueries({
    selectedCircleId,
    user,
  })
  const locator = usePostLocator({
    viewerId: user.id,
    circleId: queries.circleId,
    posts: queries.posts,
  })

  useRealtimeFeed(queries.circleId)

  const mutations = usePrivateCircleMutations({
    circleId: queries.circleId,
    postsQueryKey: queries.postsQueryKey,
    setSelectedCircleId,
    user,
  })

  if (
    queries.profileQuery.isLoading ||
    queries.circleQuery.isLoading ||
    queries.circlesQuery.isLoading
  ) {
    return <LoadingScreen />
  }

  if (
    queries.profileQuery.error ||
    queries.circleQuery.error ||
    queries.circlesQuery.error ||
    !queries.circle
  ) {
    return (
      <SetupError
        detail={getErrorMessage(
          queries.profileQuery.error ??
            queries.circleQuery.error ??
            queries.circlesQuery.error,
          'Supabase 初始化失败。',
        )}
      />
    )
  }

  const profile = queries.profileQuery.data!
  const members = queries.membersQuery.data ?? []
  const canPin = members.some((member) => member.userId === user.id && member.role === 'owner')

  return (
    <AppShell
      activePanel={activePanel}
      circle={queries.circle}
      isDemo={false}
      members={members}
      notificationCount={queries.unreadCount}
      onActivePanelChange={(panel) => {
        setActivePanel(panel)
        if (panel === 'feed' || panel === 'album' || panel === 'settings') {
          setMainPanel(panel)
        }
      }}
      onCompose={() => setComposeOpen(true)}
      onOpenNotifications={() => dialogs.setNotificationsOpen(true)}
      onOpenProfile={() => {
        dialogs.setSettingsTab('profile')
        dialogs.setSettingsOpen(true)
      }}
      onOpenMembers={() => dialogs.setMembersOpen(true)}
      onOpenSettings={() => {
        dialogs.setSettingsTab('circle')
        dialogs.setSettingsOpen(true)
      }}
      profile={profile}
      rightRailTools={
        <CircleSwitcher
          activeCircleId={queries.circle.id}
          busy={mutations.createCircleMutation.isPending}
          circles={queries.circles}
          joinBusy={mutations.joinCircleMutation.isPending}
          joinError={
            mutations.joinCircleMutation.error
              ? getErrorMessage(mutations.joinCircleMutation.error)
              : null
          }
          onCreate={async (input) => {
            await mutations.createCircleMutation.mutateAsync(input)
          }}
          onJoin={async (code) => {
            await mutations.joinCircleMutation.mutateAsync(code)
          }}
          onSelect={(nextCircleId) => {
            setSelectedCircleId(nextCircleId)
            setActivePanel('feed')
          }}
        />
      }
      user={user}
    >
      {mainPanel === 'feed' ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <DateLocator
              disabled={queries.postsQuery.isLoading || queries.posts.length === 0}
              onSelect={(dateStr) => {
                setTargetDate(dateStr)
                if (!dateStr) return
                const target = new Date(dateStr)
                let closest: typeof queries.posts[number] | null = null
                let minDiff = Infinity
                for (const post of queries.posts) {
                  const postDate = new Date(post.createdAt)
                  const diff = Math.abs(postDate.getTime() - target.getTime())
                  if (diff < minDiff) {
                    minDiff = diff
                    closest = post
                  }
                }
                if (closest) {
                  locator.scrollToPost(closest.id)
                  locator.highlight(closest.id)
                }
              }}
              value={targetDate}
            />
            {targetDate ? (
              <button
                className="focus-ring text-sm font-medium text-[var(--color-muted)] transition hover:text-[var(--color-text)]"
                onClick={() => setTargetDate('')}
                type="button"
              >
                清除
              </button>
            ) : null}
          </div>
          {queries.postsQuery.error ? (
            <SetupError detail={getErrorMessage(queries.postsQuery.error)} compact />
          ) : null}
          <Feed
            loading={queries.postsQuery.isLoading}
            loadingMore={queries.postsQuery.isFetchingNextPage}
            onAddComment={(post, body, parentId) =>
              mutations.commentMutation.mutateAsync({ post, body, parentId })
            }
            canPin={canPin}
            hasMore={queries.postsQuery.hasNextPage}
            onTogglePin={(post) => mutations.togglePinMutation.mutateAsync(post)}
            onDeletePost={(post) => mutations.deletePostMutation.mutateAsync(post)}
            onUpdatePost={(post, body) => mutations.updatePostMutation.mutateAsync({ post, body })}
            onUpdateComment={async (commentId, body) => {
              await mutations.updateCommentMutation.mutateAsync({ commentId, body })
            }}
            onDeleteComment={(commentId) => mutations.deleteCommentMutation.mutateAsync(commentId)}
            onLoadComments={queries.loadPostComments}
            onLoadMore={() => queries.postsQuery.fetchNextPage().then(() => undefined)}
            onCompose={() => setComposeOpen(true)}
            onToggleReaction={(post) => mutations.reactionMutation.mutate(post)}
            posts={queries.posts}
            viewerId={user.id}
            highlightedPostId={locator.highlightedPostId}
            highlightedCommentId={locator.highlightedCommentId}
          />
        </div>
      ) : mainPanel === 'album' ? (
        <Suspense fallback={<DialogFallback />}>
          <AlbumView
            circleId={queries.circle.id}
            onOpenLightbox={album.openLightbox}
          />
        </Suspense>
      ) : (
        <Suspense fallback={<DialogFallback />}>
          <SettingsView
            activeTab={dialogs.settingsTab}
            circlePanel={
              <CircleSettingsPanel
                circle={queries.circle}
                circleBusy={
                  mutations.updateCircleMutation.isPending ||
                  mutations.removeMemberMutation.isPending ||
                  mutations.transferOwnershipMutation.isPending
                }
                circleError={
                  mutations.updateCircleMutation.error ||
                  mutations.removeMemberMutation.error ||
                  mutations.transferOwnershipMutation.error
                    ? getErrorMessage(
                        mutations.updateCircleMutation.error ??
                          mutations.removeMemberMutation.error ??
                          mutations.transferOwnershipMutation.error,
                      )
                    : null
                }
                currentUserId={user.id}
                inviteBusy={
                  mutations.createInviteMutation.isPending ||
                  mutations.revokeInviteMutation.isPending
                }
                inviteError={
                  mutations.createInviteMutation.error || mutations.revokeInviteMutation.error
                    ? getErrorMessage(
                        mutations.createInviteMutation.error ?? mutations.revokeInviteMutation.error,
                      )
                    : null
                }
                invites={queries.invitesQuery.data ?? []}
                members={members}
                onCreateInvite={(input) => mutations.createInviteMutation.mutateAsync(input)}
                onLeaveCircle={async () => {
                  await mutations.leaveCircleMutation.mutateAsync()
                }}
                onRemoveMember={(memberId) => mutations.removeMemberMutation.mutateAsync(memberId)}
                onRevokeInvite={(inviteId) => mutations.revokeInviteMutation.mutateAsync(inviteId)}
                onSaveCircle={async (input) => {
                  await mutations.updateCircleMutation.mutateAsync(input)
                }}
                onTransferOwnership={(memberId) =>
                  mutations.transferOwnershipMutation.mutateAsync(memberId)
                }
              />
            }
            onTabChange={(tab) => dialogs.setSettingsTab(tab)}
            profilePanel={
              <ProfileSettingsPanel
                busy={
                  mutations.updateProfileMutation.isPending ||
                  mutations.updateAvatarMutation.isPending
                }
                deleteAccountBusy={mutations.deleteAccountMutation.isPending}
                error={
                  mutations.updateProfileMutation.error || mutations.updateAvatarMutation.error
                    ? getErrorMessage(
                        mutations.updateProfileMutation.error ?? mutations.updateAvatarMutation.error,
                      )
                    : null
                }
                onAvatar={async (file) => {
                  await mutations.updateAvatarMutation.mutateAsync(file)
                }}
                onDeleteAccount={async () => {
                  await mutations.deleteAccountMutation.mutateAsync()
                }}
                onSave={async (input) => {
                  await mutations.updateProfileMutation.mutateAsync(input)
                }}
                onSignOut={() => supabase?.auth.signOut()}
                profile={profile}
              />
            }
          />
        </Suspense>
      )}
      {composeOpen ? (
        <Suspense fallback={<DialogFallback />}>
          <ComposeDialog
            circle={queries.circle}
            onClose={() => setComposeOpen(false)}
            onSubmit={async (body, files) => {
              await mutations.createPostMutation.mutateAsync({ body, files })
              setComposeOpen(false)
              setActivePanel('feed')
              setMainPanel('feed')
            }}
            open={composeOpen}
            profile={profile}
            submitting={mutations.createPostMutation.isPending}
            user={user}
          />
        </Suspense>
      ) : null}
      {album.lightboxOpen ? (
        <Suspense fallback={null}>
          <LightboxDialog
            images={album.lightboxImages}
            index={album.lightboxIndex}
            onClose={album.closeLightbox}
            onNext={album.goNext}
            onOpenPost={(image) => {
              album.closeLightbox()
              setActivePanel('feed')
              setMainPanel('feed')
              locator.locatePost({
                postId: image.postId,
                circleId: image.circleId,
              })
            }}
            onPrev={album.goPrev}
            open={album.lightboxOpen}
          />
        </Suspense>
      ) : null}
      {locator.error ? (
        <div className="mb-4 rounded-[var(--radius-md)] border border-[var(--color-rose)]/20 bg-rose-50 px-4 py-3 text-sm text-[var(--color-rose)]">
          {locator.error}
          <button
            className="ml-2 font-semibold underline"
            onClick={() => locator.setError(null)}
            type="button"
          >
            关闭
          </button>
        </div>
      ) : null}
      {dialogs.notificationsOpen ? (
        <Suspense fallback={<DialogFallback />}>
          <NotificationDialog
            error={
              queries.notificationsQuery.error ||
              mutations.markNotificationMutation.error ||
              mutations.markAllNotificationsMutation.error ||
              mutations.deleteAllReadNotificationsMutation.error
                ? getErrorMessage(
                    queries.notificationsQuery.error ??
                      mutations.markNotificationMutation.error ??
                      mutations.markAllNotificationsMutation.error ??
                      mutations.deleteAllReadNotificationsMutation.error,
                  )
                : null
            }
            hasMore={queries.notificationsQuery.hasNextPage}
            loadingMore={queries.notificationsQuery.isFetchingNextPage}
            notifications={queries.notifications}
            onClose={() => dialogs.setNotificationsOpen(false)}
            onLoadMore={() =>
              queries.notificationsQuery.fetchNextPage().then(() => undefined)
            }
            onMarkAllRead={async () => {
              await mutations.markAllNotificationsMutation.mutateAsync()
            }}
            onDeleteAllRead={async () => {
              await mutations.deleteAllReadNotificationsMutation.mutateAsync()
            }}
            busy={mutations.deleteAllReadNotificationsMutation.isPending}
            onMarkRead={(notificationId) =>
              mutations.markNotificationMutation
                .mutateAsync(notificationId)
                .then(() => undefined)
            }
            onSelectNotification={async (notification) => {
              dialogs.setNotificationsOpen(false)
              if (!notification.readAt) {
                await mutations.markNotificationMutation.mutateAsync(notification.id)
              }
              if (notification.circleId !== queries.circleId) {
                setSelectedCircleId(notification.circleId)
                setActivePanel('feed')
              }
              locator.locate(notification)
            }}
            open={dialogs.notificationsOpen}
          />
        </Suspense>
      ) : null}
      {dialogs.membersOpen ? (
        <Suspense fallback={<DialogFallback />}>
          <MembersDialog
            members={members}
            onClose={() => dialogs.setMembersOpen(false)}
            open={dialogs.membersOpen}
          />
        </Suspense>
      ) : null}
      {dialogs.settingsOpen ? (
        <Suspense fallback={<DialogFallback />}>
          <SettingsDialog
            circlePanel={
              <CircleSettingsPanel
                circle={queries.circle}
                circleBusy={
                  mutations.updateCircleMutation.isPending ||
                  mutations.removeMemberMutation.isPending ||
                  mutations.transferOwnershipMutation.isPending
                }
                circleError={
                  mutations.updateCircleMutation.error ||
                  mutations.removeMemberMutation.error ||
                  mutations.transferOwnershipMutation.error
                    ? getErrorMessage(
                        mutations.updateCircleMutation.error ??
                          mutations.removeMemberMutation.error ??
                          mutations.transferOwnershipMutation.error,
                      )
                    : null
                }
                currentUserId={user.id}
                inviteBusy={
                  mutations.createInviteMutation.isPending ||
                  mutations.revokeInviteMutation.isPending
                }
                inviteError={
                  mutations.createInviteMutation.error || mutations.revokeInviteMutation.error
                    ? getErrorMessage(
                        mutations.createInviteMutation.error ?? mutations.revokeInviteMutation.error,
                      )
                    : null
                }
                invites={queries.invitesQuery.data ?? []}
                members={members}
                onCreateInvite={(input) => mutations.createInviteMutation.mutateAsync(input)}
                onLeaveCircle={async () => {
                  await mutations.leaveCircleMutation.mutateAsync()
                }}
                onRemoveMember={(memberId) => mutations.removeMemberMutation.mutateAsync(memberId)}
                onRevokeInvite={(inviteId) => mutations.revokeInviteMutation.mutateAsync(inviteId)}
                onSaveCircle={async (input) => {
                  await mutations.updateCircleMutation.mutateAsync(input)
                }}
                onTransferOwnership={(memberId) =>
                  mutations.transferOwnershipMutation.mutateAsync(memberId)
                }
              />
            }
            activeTab={dialogs.settingsTab}
            onClose={() => dialogs.setSettingsOpen(false)}
            onTabChange={(tab) => dialogs.setSettingsTab(tab)}
            open={dialogs.settingsOpen}
            profilePanel={
              <ProfileSettingsPanel
                busy={
                  mutations.updateProfileMutation.isPending ||
                  mutations.updateAvatarMutation.isPending
                }
                deleteAccountBusy={mutations.deleteAccountMutation.isPending}
                error={
                  mutations.updateProfileMutation.error || mutations.updateAvatarMutation.error
                    ? getErrorMessage(
                        mutations.updateProfileMutation.error ?? mutations.updateAvatarMutation.error,
                      )
                    : null
                }
                onAvatar={async (file) => {
                  await mutations.updateAvatarMutation.mutateAsync(file)
                }}
                onDeleteAccount={async () => {
                  await mutations.deleteAccountMutation.mutateAsync()
                }}
                onSave={async (input) => {
                  await mutations.updateProfileMutation.mutateAsync(input)
                }}
                onSignOut={() => supabase?.auth.signOut()}
                profile={profile}
              />
            }
          />
        </Suspense>
      ) : null}
    </AppShell>
  )
}

function DateLocator({
  disabled,
  onSelect,
  value,
}: {
  disabled?: boolean
  onSelect: (dateStr: string) => void
  value: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <button
      className="focus-ring relative flex h-10 items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-card)] px-3 text-sm font-semibold text-[var(--color-text)] transition hover:bg-[var(--color-surface)] disabled:opacity-50"
      disabled={disabled}
      onClick={() => inputRef.current?.showPicker?.() || inputRef.current?.click()}
      type="button"
    >
      <CalendarDays size={16} className="text-[var(--color-muted)]" />
      {value ? value : '定位到日期'}
      <input
        className="sr-only"
        max={new Date().toISOString().split('T')[0]}
        onChange={(e) => onSelect(e.target.value)}
        ref={inputRef}
        type="date"
        value={value}
      />
    </button>
  )
}
