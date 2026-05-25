import { useState, Suspense, lazy } from 'react'
import { getErrorMessage } from '../../lib/errors'
import { useAlbumState } from '../album/useAlbumState'
import { CircleSwitcher } from '../circles/CircleSwitcher'
import { usePostLocator } from '../feed/usePostLocator'
import { ComposeDialog } from '../composer/ComposeDialog'
import { Feed } from '../feed/Feed'
import { useRealtimeFeed } from '../feed/useRealtimeFeed'
import { FeedSearchBar } from '../search/FeedSearchBar'
import { AppShell } from '../shell/AppShell'
import type { PanelKey } from '../shell/AppShell'
import type { SessionUser } from '../../types/domain'
import { DialogFallback } from '../../components/ui/DialogFallback'
import { LoadingScreen } from './LoadingScreen'
import { SetupError } from './SetupError'
import { usePrivateCircleDialogs } from './usePrivateCircleDialogs'
import { usePrivateCircleMutations } from './usePrivateCircleMutations'
import { usePrivateCircleQueries } from './usePrivateCircleQueries'

const AlbumView = lazy(() => import('../album/AlbumView').then((m) => ({ default: m.AlbumView })))
const LightboxDialog = lazy(() =>
  import('../album/LightboxDialog').then((m) => ({ default: m.LightboxDialog })),
)
const InviteDialog = lazy(() =>
  import('../invites/InviteDialog').then((m) => ({ default: m.InviteDialog })),
)
const NotificationDialog = lazy(() =>
  import('../notifications/NotificationDialog').then((m) => ({ default: m.NotificationDialog })),
)
const ProfileSettingsDialog = lazy(() =>
  import('../settings/ProfileSettingsDialog').then((m) => ({ default: m.ProfileSettingsDialog })),
)
const MembersDialog = lazy(() =>
  import('../settings/MembersDialog').then((m) => ({ default: m.MembersDialog })),
)
const CircleSettingsDialog = lazy(() =>
  import('../settings/CircleSettingsDialog').then((m) => ({ default: m.CircleSettingsDialog })),
)

export function PrivateCircleApp({ user }: { user: SessionUser }) {
  const [selectedCircleId, setSelectedCircleId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [activePanel, setActivePanel] = useState<PanelKey>('feed')
  const [mainPanel, setMainPanel] = useState<'feed' | 'album'>('feed')
  const [composeOpen, setComposeOpen] = useState(false)
  const dialogs = usePrivateCircleDialogs()
  const album = useAlbumState()
  const queries = usePrivateCircleQueries({
    inviteOpen: dialogs.inviteOpen,
    searchTerm,
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
    setSearchTerm,
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
        if (panel === 'feed' || panel === 'album') {
          setMainPanel(panel)
        }
      }}
      onCompose={() => setComposeOpen(true)}
      onOpenNotifications={() => dialogs.setNotificationsOpen(true)}
      onOpenProfile={() => dialogs.setProfileOpen(true)}
      onOpenMembers={() => dialogs.setMembersOpen(true)}
      onOpenSettings={() => dialogs.setCircleSettingsOpen(true)}
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
            setSearchTerm('')
            setActivePanel('feed')
          }}
        />
      }
      user={user}
    >
      {mainPanel === 'feed' ? (
        <div className="space-y-4">
          <FeedSearchBar
            disabled={queries.postsQuery.isLoading}
            onChange={setSearchTerm}
            value={searchTerm}
          />
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
      ) : (
        <Suspense fallback={<DialogFallback />}>
          <AlbumView
            circleId={queries.circle.id}
            onOpenLightbox={album.openLightbox}
          />
        </Suspense>
      )}
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
      <Suspense fallback={<DialogFallback />}>
        <InviteDialog
          error={
            mutations.createInviteMutation.error || mutations.revokeInviteMutation.error
              ? getErrorMessage(
                  mutations.createInviteMutation.error ?? mutations.revokeInviteMutation.error,
                )
              : null
          }
          invites={queries.invitesQuery.data ?? []}
          loading={
            queries.invitesQuery.isLoading ||
            mutations.createInviteMutation.isPending ||
            mutations.revokeInviteMutation.isPending
          }
          onClose={() => dialogs.setInviteOpen(false)}
          onCreate={(input) => mutations.createInviteMutation.mutateAsync(input)}
          onRevoke={async (inviteId) => {
            await mutations.revokeInviteMutation.mutateAsync(inviteId)
          }}
          open={dialogs.inviteOpen}
        />
      </Suspense>
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
      <Suspense fallback={<DialogFallback />}>
        <ProfileSettingsDialog
          busy={
            mutations.updateProfileMutation.isPending ||
            mutations.updateAvatarMutation.isPending
          }
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
          onClose={() => dialogs.setProfileOpen(false)}
          onSave={async (input) => {
            await mutations.updateProfileMutation.mutateAsync(input)
          }}
          open={dialogs.profileOpen}
          profile={profile}
        />
      </Suspense>
      <Suspense fallback={<DialogFallback />}>
        <MembersDialog
          currentUserId={user.id}
          members={members}
          onClose={() => dialogs.setMembersOpen(false)}
          onOpenInvites={() => dialogs.setInviteOpen(true)}
          onRemoveMember={(memberId) => mutations.removeMemberMutation.mutateAsync(memberId)}
          onTransferOwnership={(memberId) =>
            mutations.transferOwnershipMutation.mutateAsync(memberId)
          }
          open={dialogs.membersOpen}
        />
      </Suspense>
      <Suspense fallback={<DialogFallback />}>
        <CircleSettingsDialog
          busy={
            mutations.updateCircleMutation.isPending ||
            mutations.removeMemberMutation.isPending ||
            mutations.transferOwnershipMutation.isPending
          }
          circle={queries.circle}
          currentUserId={user.id}
          error={
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
          members={members}
          onClose={() => dialogs.setCircleSettingsOpen(false)}
          onLeaveCircle={async () => {
            await mutations.leaveCircleMutation.mutateAsync()
          }}
          onRemoveMember={(memberId) => mutations.removeMemberMutation.mutateAsync(memberId)}
          onSave={async (input) => {
            await mutations.updateCircleMutation.mutateAsync(input)
          }}
          open={dialogs.circleSettingsOpen}
        />
      </Suspense>
    </AppShell>
  )
}
