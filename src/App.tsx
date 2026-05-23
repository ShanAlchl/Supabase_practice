import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { hasSupabaseConfig } from './lib/env'
import { AuthPanel } from './features/auth/AuthPanel'
import { useAuth } from './features/auth/useAuth'
import { Composer } from './features/composer/Composer'
import { Feed } from './features/feed/Feed'
import { useRealtimeFeed } from './features/feed/useRealtimeFeed'
import { AppShell } from './features/shell/AppShell'
import { demoCircle, demoMembers, demoPosts } from './data/demo'
import {
  addComment,
  createPost,
  deletePost,
  fetchPosts,
  searchPosts,
  togglePinPost,
  toggleReaction,
} from './services/feedService'
import { fetchComments } from './services/commentService'
import {
  ensureProfile,
  getCircleMembers,
  getDefaultCircle,
  updateAvatar,
  updateProfile,
} from './services/profileService'
import {
  createCircle,
  leaveCircle,
  listCircles,
  removeCircleMember,
  updateCircle,
} from './services/circleService'
import {
  acceptCircleInvite,
  createCircleInvite,
  listCircleInvites,
  revokeCircleInvite,
} from './services/inviteService'
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  subscribeNotifications,
} from './services/notificationService'
import { CircleSwitcher } from './features/circles/CircleSwitcher'
import { InviteDialog } from './features/invites/InviteDialog'
import { NotificationDialog } from './features/notifications/NotificationDialog'
import { CircleSettingsDialog } from './features/settings/CircleSettingsDialog'
import { MembersDialog } from './features/settings/MembersDialog'
import { ProfileSettingsDialog } from './features/settings/ProfileSettingsDialog'
import { FeedSearchBar } from './features/search/FeedSearchBar'
import { Card } from './components/ui/Card'
import { Notice } from './components/ui/Notice'
import type { Post, Profile, SessionUser } from './types/domain'

function App() {
  const auth = useAuth()

  if (!hasSupabaseConfig) {
    return <DemoApp />
  }

  if (auth.loading) {
    return <LoadingScreen />
  }

  if (!auth.user) {
    return <AuthPanel />
  }

  return <PrivateCircleApp user={auth.user} />
}

function PrivateCircleApp({ user }: { user: SessionUser }) {
  const queryClient = useQueryClient()
  const composerRef = useRef<HTMLDivElement | null>(null)
  const [composerHighlight, setComposerHighlight] = useState(false)
  const [selectedCircleId, setSelectedCircleId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [membersOpen, setMembersOpen] = useState(false)
  const [circleSettingsOpen, setCircleSettingsOpen] = useState(false)

  const profileQuery = useQuery({
    queryKey: ['profile', user.id],
    queryFn: () => ensureProfile(user),
  })

  const circleQuery = useQuery({
    queryKey: ['default-circle', user.id],
    queryFn: () => getDefaultCircle(),
    enabled: profileQuery.isSuccess,
  })

  const circlesQuery = useQuery({
    queryKey: ['circles', user.id],
    queryFn: () => listCircles(),
    enabled: circleQuery.isSuccess,
  })

  const circles = circlesQuery.data?.length
    ? circlesQuery.data
    : circleQuery.data
      ? [circleQuery.data]
      : []
  const circleId = selectedCircleId ?? circleQuery.data?.id ?? null
  const circle = circles.find((item) => item.id === circleId) ?? circleQuery.data ?? null
  const postsQueryKey = ['posts', circleId, searchTerm.trim()]

  useRealtimeFeed(circleId)

  useEffect(() => {
    return subscribeNotifications(user.id, () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user.id] })
    })
  }, [queryClient, user.id])

  const membersQuery = useQuery({
    queryKey: ['members', circleId],
    queryFn: () => getCircleMembers(circleId!),
    enabled: Boolean(circleId),
  })

  const postsQuery = useQuery({
    queryKey: postsQueryKey,
    queryFn: async () => {
      if (searchTerm.trim()) {
        const page = await searchPosts(circleId!, searchTerm.trim(), user.id, { limit: 30 })
        return page.items
      }
      return fetchPosts(circleId!, user.id)
    },
    enabled: Boolean(circleId),
  })

  const invitesQuery = useQuery({
    queryKey: ['invites', circleId],
    queryFn: () => listCircleInvites(circleId!),
    enabled: Boolean(circleId) && inviteOpen,
  })

  const notificationsQuery = useQuery({
    queryKey: ['notifications', user.id],
    queryFn: async () => {
      const page = await fetchNotifications({ limit: 30 })
      return page.items
    },
  })

  const unreadCount =
    notificationsQuery.data?.filter((notification) => !notification.readAt).length ?? 0

  const createPostMutation = useMutation({
    mutationFn: (input: { body: string; files: File[] }) =>
      createPost({
        circleId: circleId!,
        authorId: user.id,
        body: input.body,
        files: input.files,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['posts', circleId] }),
  })

  const commentMutation = useMutation({
    mutationFn: (input: { post: Post; body: string; parentId?: string }) =>
      addComment(input.post.id, input.post.circleId, user.id, input.body, input.parentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['posts', circleId] }),
  })

  const reactionMutation = useMutation({
    mutationFn: (post: Post) =>
      toggleReaction(post.id, post.circleId, user.id, post.viewerHasReacted),
    onMutate: async (post) => {
      await queryClient.cancelQueries({ queryKey: postsQueryKey })
      const previousPosts = queryClient.getQueryData<Post[]>(postsQueryKey)

      queryClient.setQueryData<Post[]>(postsQueryKey, (current = []) =>
        current.map((item) =>
          item.id === post.id
            ? {
                ...item,
                viewerHasReacted: !item.viewerHasReacted,
                reactionCount: item.viewerHasReacted
                  ? Math.max(0, item.reactionCount - 1)
                  : item.reactionCount + 1,
              }
            : item,
        ),
      )

      return { previousPosts }
    },
    onError: (_error, _post, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(postsQueryKey, context.previousPosts)
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['posts', circleId] }),
  })

  const deletePostMutation = useMutation({
    mutationFn: (post: Post) => deletePost(post.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['posts', circleId] }),
  })

  const createCircleMutation = useMutation({
    mutationFn: createCircle,
    onSuccess: (newCircle) => {
      setSelectedCircleId(newCircle.id)
      queryClient.invalidateQueries({ queryKey: ['circles', user.id] })
      queryClient.invalidateQueries({ queryKey: ['members', newCircle.id] })
    },
  })

  const joinCircleMutation = useMutation({
    mutationFn: acceptCircleInvite,
    onSuccess: ({ circle: joinedCircle }) => {
      setSelectedCircleId(joinedCircle.id)
      setSearchTerm('')
      queryClient.invalidateQueries({ queryKey: ['circles', user.id] })
      queryClient.invalidateQueries({ queryKey: ['members', joinedCircle.id] })
      queryClient.invalidateQueries({ queryKey: ['posts', joinedCircle.id] })
      queryClient.invalidateQueries({ queryKey: ['notifications', user.id] })
    },
  })

  const updateCircleMutation = useMutation({
    mutationFn: (input: { name: string; description: string | null }) =>
      updateCircle(circleId!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['circles', user.id] })
      queryClient.invalidateQueries({ queryKey: ['default-circle', user.id] })
    },
  })

  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) => removeCircleMember(circleId!, memberId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['members', circleId] }),
  })

  const leaveCircleMutation = useMutation({
    mutationFn: () => leaveCircle(circleId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['circles', user.id] })
      queryClient.invalidateQueries({ queryKey: ['default-circle', user.id] })
      queryClient.invalidateQueries({ queryKey: ['members', circleId] })
    },
  })

  const createInviteMutation = useMutation({
    mutationFn: (input: { maxUses: number; expiresAt: string | null }) =>
      createCircleInvite(circleId!, {
        maxUses: input.maxUses,
        expiresAt: input.expiresAt,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invites', circleId] }),
  })

  const revokeInviteMutation = useMutation({
    mutationFn: (inviteId: string) => revokeCircleInvite(inviteId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['invites', circleId] }),
  })

  const markNotificationMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications', user.id] }),
  })

  const markAllNotificationsMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications', user.id] }),
  })

  const updateProfileMutation = useMutation({
    mutationFn: (input: { displayName: string; bio: string | null }) =>
      updateProfile({
        userId: user.id,
        displayName: input.displayName,
        bio: input.bio,
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(['profile', user.id], data)
      queryClient.invalidateQueries({ queryKey: ['profile', user.id] })
      queryClient.invalidateQueries({ queryKey: ['members', circleId] })
      queryClient.invalidateQueries({ queryKey: ['posts', circleId] })
      queryClient.invalidateQueries({ queryKey: ['notifications', user.id] })
    },
  })

  const togglePinMutation = useMutation({
    mutationFn: (post: Post) => togglePinPost(post.id, post.circleId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['posts', circleId] }),
  })

  const updateAvatarMutation = useMutation({
    mutationFn: (file: File) => updateAvatar(user.id, file),
    onSuccess: (data) => {
      queryClient.setQueryData(['profile', user.id], data)
      queryClient.invalidateQueries({ queryKey: ['profile', user.id] })
      queryClient.invalidateQueries({ queryKey: ['members', circleId] })
      queryClient.invalidateQueries({ queryKey: ['posts', circleId] })
      queryClient.invalidateQueries({ queryKey: ['notifications', user.id] })
    },
  })

  if (profileQuery.isLoading || circleQuery.isLoading || circlesQuery.isLoading) {
    return <LoadingScreen />
  }

  if (profileQuery.error || circleQuery.error || circlesQuery.error || !circle) {
    return (
      <SetupError
        detail={
          profileQuery.error?.message ??
          circleQuery.error?.message ??
          circlesQuery.error?.message ??
          'Supabase 初始化失败。'
        }
      />
    )
  }

  const profile = profileQuery.data!

  const scrollToComposer = () => {
    composerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    composerRef.current?.querySelector('textarea')?.focus()
    setComposerHighlight(true)
    window.setTimeout(() => setComposerHighlight(false), 900)
  }

  return (
    <AppShell
      circle={circle}
      isDemo={false}
      members={membersQuery.data ?? []}
      notificationCount={unreadCount}
      onCompose={scrollToComposer}
      onOpenNotifications={() => setNotificationsOpen(true)}
      onOpenProfile={() => setProfileOpen(true)}
      onOpenMembers={() => setMembersOpen(true)}
      onOpenSettings={() => setCircleSettingsOpen(true)}
      profile={profile}
      rightRailTools={
        <CircleSwitcher
          activeCircleId={circle.id}
          busy={createCircleMutation.isPending}
          circles={circles}
          joinBusy={joinCircleMutation.isPending}
          joinError={joinCircleMutation.error?.message}
          onCreate={async (input) => {
            await createCircleMutation.mutateAsync(input)
          }}
          onJoin={async (code) => {
            await joinCircleMutation.mutateAsync(code)
          }}
          onSelect={(nextCircleId) => {
            setSelectedCircleId(nextCircleId)
            setSearchTerm('')
          }}
        />
      }
      user={user}
    >
      <div
        className={`space-y-4 rounded-[8px] transition duration-200 ${
          composerHighlight ? 'shadow-[0_0_0_4px_rgba(15,118,110,0.16)]' : ''
        }`}
        ref={composerRef}
      >
        <Composer
          circle={circle}
          profile={profile}
          onSubmit={async (body, files) => {
            await createPostMutation.mutateAsync({ body, files })
          }}
          submitting={createPostMutation.isPending}
          user={user}
        />
        <FeedSearchBar
          disabled={postsQuery.isLoading}
          onChange={setSearchTerm}
          value={searchTerm}
        />
        {postsQuery.error ? (
          <SetupError detail={postsQuery.error.message} compact />
        ) : null}
        <Feed
          loading={postsQuery.isLoading}
          onAddComment={(post, body, parentId) =>
            commentMutation.mutateAsync({ post, body, parentId })
          }
          canPin={membersQuery.data?.some(
            (m) => m.userId === user.id && m.role === 'owner',
          )}
          onTogglePin={(post) => togglePinMutation.mutateAsync(post)}
          onDeletePost={(post) => deletePostMutation.mutateAsync(post)}
          onLoadComments={async (post) => {
            const page = await fetchComments(post.id, { limit: 30 })
            return page.items
          }}
          onCompose={scrollToComposer}
          onToggleReaction={(post) => reactionMutation.mutate(post)}
          posts={postsQuery.data ?? []}
          viewerId={user.id}
        />
      </div>
      <InviteDialog
        error={createInviteMutation.error?.message ?? revokeInviteMutation.error?.message}
        invites={invitesQuery.data ?? []}
        loading={
          invitesQuery.isLoading ||
          createInviteMutation.isPending ||
          revokeInviteMutation.isPending
        }
        onClose={() => setInviteOpen(false)}
        onCreate={(input) => createInviteMutation.mutateAsync(input)}
        onRevoke={async (inviteId) => {
          await revokeInviteMutation.mutateAsync(inviteId)
        }}
        open={inviteOpen}
      />
      <NotificationDialog
        error={
          notificationsQuery.error?.message ??
          markNotificationMutation.error?.message ??
          markAllNotificationsMutation.error?.message
        }
        notifications={notificationsQuery.data ?? []}
        onClose={() => setNotificationsOpen(false)}
        onMarkAllRead={async () => {
          await markAllNotificationsMutation.mutateAsync()
        }}
        onMarkRead={(notificationId) =>
          markNotificationMutation.mutateAsync(notificationId).then(() => undefined)
        }
        open={notificationsOpen}
      />
      <ProfileSettingsDialog
        busy={updateProfileMutation.isPending || updateAvatarMutation.isPending}
        error={updateProfileMutation.error?.message ?? updateAvatarMutation.error?.message}
        onAvatar={async (file) => {
          await updateAvatarMutation.mutateAsync(file)
        }}
        onClose={() => setProfileOpen(false)}
        onSave={async (input) => {
          await updateProfileMutation.mutateAsync(input)
        }}
        open={profileOpen}
        profile={profile}
      />
      <MembersDialog
        currentUserId={user.id}
        members={membersQuery.data ?? []}
        onClose={() => setMembersOpen(false)}
        onOpenInvites={() => setInviteOpen(true)}
        onRemoveMember={(memberId) => removeMemberMutation.mutateAsync(memberId)}
        open={membersOpen}
      />
      <CircleSettingsDialog
        busy={updateCircleMutation.isPending || removeMemberMutation.isPending}
        circle={circle}
        currentUserId={user.id}
        error={updateCircleMutation.error?.message ?? removeMemberMutation.error?.message}
        members={membersQuery.data ?? []}
        onClose={() => setCircleSettingsOpen(false)}
        onLeaveCircle={async () => {
          await leaveCircleMutation.mutateAsync()
        }}
        onRemoveMember={(memberId) => removeMemberMutation.mutateAsync(memberId)}
        onSave={async (input) => {
          await updateCircleMutation.mutateAsync(input)
        }}
        open={circleSettingsOpen}
      />
    </AppShell>
  )
}

function DemoApp() {
  const [posts, setPosts] = useState(demoPosts)
  const composerRef = useRef<HTMLDivElement | null>(null)
  const [composerHighlight, setComposerHighlight] = useState(false)

  const demoProfile: Profile = useMemo(
    () => ({
      id: 'demo-user',
      displayName: '你',
      avatarUrl: null,
      bio: '演示模式用户',
    }),
    [],
  )

  const scrollToComposer = () => {
    composerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    composerRef.current?.querySelector('textarea')?.focus()
    setComposerHighlight(true)
    window.setTimeout(() => setComposerHighlight(false), 900)
  }

  const addDemoPost = (body: string, files: File[]) => {
    const postId = crypto.randomUUID()
    const imageUrls = files.map((file, index) => ({
      id: crypto.randomUUID(),
      postId,
      url: URL.createObjectURL(file),
      storagePath: `demo/${postId}/${file.name}`,
      sortOrder: index,
    }))

    setPosts((current) => [
      {
        id: postId,
        circleId: demoCircle.id,
        authorId: demoProfile.id,
        body: body.trim() || '分享了一组照片。',
        createdAt: new Date().toISOString(),
        author: demoProfile,
        images: imageUrls,
        comments: [],
        commentCount: 0,
        reactionCount: 0,
        viewerHasReacted: false,
        pinnedAt: null,
      },
      ...current,
    ])
  }

  const toggleDemoReaction = (post: Post) => {
    setPosts((current) =>
      current.map((item) =>
        item.id === post.id
          ? {
              ...item,
              viewerHasReacted: !item.viewerHasReacted,
              reactionCount: item.viewerHasReacted
                ? Math.max(0, item.reactionCount - 1)
                : item.reactionCount + 1,
            }
          : item,
      ),
    )
  }

  const addDemoComment = (post: Post, body: string, parentId?: string) => {
    setPosts((current) =>
      current.map((item) =>
        item.id === post.id
          ? {
              ...item,
              comments: [
                ...item.comments,
                {
                  id: crypto.randomUUID(),
                  postId: item.id,
                  authorId: demoProfile.id,
                  parentId: parentId ?? null,
                  body,
                  createdAt: new Date().toISOString(),
                  author: demoProfile,
                },
              ],
              commentCount: item.commentCount + 1,
            }
          : item,
      ),
    )
  }

  return (
    <AppShell
      circle={demoCircle}
      isDemo
      members={demoMembers}
      onCompose={scrollToComposer}
      profile={demoProfile}
      user={null}
    >
      <Notice className="mb-4" tone="info" title="演示模式">
        当前没有检测到 Supabase 环境变量。复制 <code>.env.example</code> 为{' '}
        <code>.env.local</code>，填入 Supabase URL 和 anon key，并在 SQL Editor
        运行 <code>scripts/init.sql</code> 后即可连接真实后端。
      </Notice>
      <div
        className={`space-y-4 rounded-[8px] transition duration-200 ${
          composerHighlight ? 'shadow-[0_0_0_4px_rgba(15,118,110,0.16)]' : ''
        }`}
        ref={composerRef}
      >
        <Composer
          circle={demoCircle}
          demoName="你"
          onSubmit={addDemoPost}
          user={null}
        />
        <Feed
          onAddComment={addDemoComment}
          onCompose={scrollToComposer}
          onToggleReaction={toggleDemoReaction}
          posts={posts}
        />
      </div>
    </AppShell>
  )
}

function LoadingScreen() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-[var(--color-page)] px-5">
      <Card className="flex items-center gap-3 px-6 py-5 text-sm font-semibold text-[var(--color-muted)]">
        <Loader2 className="animate-spin text-[var(--color-primary)]" size={18} />
        正在加载私密朋友圈...
      </Card>
    </main>
  )
}

function SetupError({
  detail,
  compact = false,
}: {
  detail: string
  compact?: boolean
}) {
  if (compact) {
    return (
      <Notice tone="error" title="Supabase 还没有准备好">
        {detail}
      </Notice>
    )
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-[var(--color-page)] px-5">
      <Card className="max-w-xl p-6">
        <Notice tone="error" title="Supabase 还没有准备好">
          <p>{detail}</p>
          <p className="mt-3">
            请确认已经在 Supabase Dashboard 的 SQL Editor 运行{' '}
            <code>scripts/init.sql</code>，并且 <code>.env.local</code> 中的 URL 和
            anon key 正确。
          </p>
        </Notice>
      </Card>
    </main>
  )
}

export default App
