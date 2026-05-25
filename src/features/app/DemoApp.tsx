import { useEffect, useMemo, useRef, useState, Suspense, lazy } from 'react'
import { Notice } from '../../components/ui/Notice'
import { demoCircle, demoMembers, demoPosts } from '../../data/demo'
import { ComposeDialog } from '../composer/ComposeDialog'
import { Feed } from '../feed/Feed'
import { AppShell } from '../shell/AppShell'
import type { PanelKey } from '../shell/AppShell'
import type { Post, Profile, AlbumImage } from '../../types/domain'
import { Camera } from 'lucide-react'
import { SafeImage } from '../../components/ui/SafeImage'
import { Avatar } from '../../components/ui/Avatar'
import { formatRelativeTime } from '../../utils/time'

const LightboxDialog = lazy(() =>
  import('../album/LightboxDialog').then((m) => ({ default: m.LightboxDialog })),
)

export function DemoApp() {
  const [posts, setPosts] = useState(demoPosts)
  const [activePanel, setActivePanel] = useState<PanelKey>('feed')
  const [mainPanel, setMainPanel] = useState<'feed' | 'album'>('feed')
  const [composeOpen, setComposeOpen] = useState(false)
  const demoImageUrlsRef = useRef<string[]>([])

  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  const demoProfile: Profile = useMemo(
    () => ({
      id: 'demo-user',
      displayName: '你',
      avatarUrl: null,
      bio: '演示模式用户',
    }),
    [],
  )

  const demoAlbumImages: AlbumImage[] = useMemo(() => {
    const images: AlbumImage[] = []
    for (const post of posts) {
      for (const image of post.images) {
        images.push({
          id: image.id,
          postId: post.id,
          circleId: post.circleId,
          authorId: post.authorId,
          url: image.url,
          storagePath: image.storagePath,
          sortOrder: image.sortOrder,
          postBody: post.body,
          postCreatedAt: post.createdAt,
          author: post.author,
        })
      }
    }
    return images.sort(
      (a, b) =>
        new Date(b.postCreatedAt).getTime() - new Date(a.postCreatedAt).getTime(),
    )
  }, [posts])

  const addDemoPost = (body: string, files: File[]) => {
    const postId = crypto.randomUUID()
    const imageUrls = files.map((file, index) => {
      const url = URL.createObjectURL(file)
      demoImageUrlsRef.current.push(url)
      return {
        id: crypto.randomUUID(),
        postId,
        url,
        storagePath: `demo/${postId}/${file.name}`,
        sortOrder: index,
      }
    })

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

  useEffect(
    () => () => {
      for (const url of demoImageUrlsRef.current) {
        URL.revokeObjectURL(url)
      }
      demoImageUrlsRef.current = []
    },
    [],
  )

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

  const updateDemoPost = (post: Post, body: string) => {
    setPosts((current) =>
      current.map((item) => (item.id === post.id ? { ...item, body } : item)),
    )
  }

  const deleteDemoPost = (post: Post) => {
    setPosts((current) => current.filter((item) => item.id !== post.id))
  }

  const updateDemoComment = (commentId: string, body: string) => {
    setPosts((current) =>
      current.map((item) => ({
        ...item,
        comments: item.comments.map((c) => (c.id === commentId ? { ...c, body } : c)),
      })),
    )
  }

  const deleteDemoComment = (commentId: string) => {
    setPosts((current) =>
      current.map((item) => ({
        ...item,
        comments: item.comments.filter((c) => c.id !== commentId),
        commentCount: Math.max(0, item.commentCount - 1),
      })),
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
      activePanel={activePanel}
      circle={demoCircle}
      isDemo
      members={demoMembers}
      onActivePanelChange={(panel) => {
        setActivePanel(panel)
        if (panel === 'feed' || panel === 'album') {
          setMainPanel(panel)
        }
      }}
      onCompose={() => setComposeOpen(true)}
      profile={demoProfile}
      user={null}
    >
      {mainPanel === 'feed' ? (
        <>
          <Notice className="mb-4" tone="info" title="演示模式">
            当前没有检测到 Supabase 环境变量。复制 <code>.env.example</code> 为{' '}
            <code>.env.local</code>，填入 Supabase URL 和 anon key，并在 SQL Editor
            运行 <code>scripts/init.sql</code> 后即可连接真实后端。
          </Notice>
          <div className="space-y-4">
            <Feed
              onAddComment={addDemoComment}
              onCompose={() => setComposeOpen(true)}
              onDeleteComment={deleteDemoComment}
              onDeletePost={deleteDemoPost}
              onToggleReaction={toggleDemoReaction}
              onUpdateComment={updateDemoComment}
              onUpdatePost={updateDemoPost}
              posts={posts}
              viewerId={demoProfile.id}
            />
          </div>
        </>
      ) : (
        <DemoAlbumView
          images={demoAlbumImages}
          onOpenLightbox={(index) => {
            setLightboxIndex(index)
            setLightboxOpen(true)
          }}
        />
      )}
      <ComposeDialog
        circle={demoCircle}
        demoName="你"
        onClose={() => setComposeOpen(false)}
        onSubmit={(body, files) => {
          addDemoPost(body, files)
          setComposeOpen(false)
          setActivePanel('feed')
          setMainPanel('feed')
        }}
        open={composeOpen}
        profile={demoProfile}
        user={null}
      />
      <Suspense fallback={null}>
        <LightboxDialog
          images={demoAlbumImages}
          index={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
          onNext={() => setLightboxIndex((p) => Math.min(demoAlbumImages.length - 1, p + 1))}
          onPrev={() => setLightboxIndex((p) => Math.max(0, p - 1))}
          open={lightboxOpen}
        />
      </Suspense>
    </AppShell>
  )
}

function DemoAlbumView({
  images,
  onOpenLightbox,
}: {
  images: AlbumImage[]
  onOpenLightbox: (index: number) => void
}) {
  if (images.length === 0) {
    return (
      <div className="py-8 text-center">
        <Camera size={40} className="mx-auto text-[var(--color-muted)]" />
        <p className="mt-3 text-sm font-semibold text-[var(--color-text)]">相册还是空的</p>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          发布带有照片的动态，它们会出现在这里。
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3">
      {images.map((image, index) => (
        <button
          className="focus-ring group relative overflow-hidden rounded-[var(--radius-md)] bg-[var(--color-surface)] text-left"
          key={image.id}
          onClick={() => onOpenLightbox(index)}
          type="button"
        >
          <div className="aspect-square">
            <SafeImage
              alt={`相册图片 ${index + 1}`}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              src={image.url}
            />
          </div>
          <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-stone-950/70 via-transparent to-transparent p-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <div className="flex items-center gap-2">
              <Avatar
                name={image.author.displayName}
                size="xs"
                src={image.author.avatarUrl}
              />
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-white">
                  {image.author.displayName}
                </p>
                <p className="text-[11px] text-white/70">
                  {formatRelativeTime(image.postCreatedAt)}
                </p>
              </div>
            </div>
            {image.postBody ? (
              <p className="mt-1 line-clamp-1 text-[11px] text-white/80">{image.postBody}</p>
            ) : null}
          </div>
        </button>
      ))}
    </div>
  )
}
