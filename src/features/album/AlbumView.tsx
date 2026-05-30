import { Camera } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { queryKeys } from '../../lib/queryKeys'
import { fetchAlbumImages } from '../../services/albumService'
import { Skeleton } from '../../components/ui/Skeleton'
import { SafeImage } from '../../components/ui/SafeImage'
import { formatRelativeTime } from '../../utils/time'
import { Avatar } from '../../components/ui/Avatar'
import { groupItemsByTimeline } from '../timeline/timelineGroups'
import type { TimelineSection } from '../timeline/timelineGroups'
import type { AlbumImage } from '../../types/domain'

type AlbumViewProps = {
  circleId: string
  onOpenLightbox: (index: number, images: AlbumImage[]) => void
  onTimelineSectionsChange?: (sections: TimelineSection[]) => void
}

export function AlbumView({
  circleId,
  onOpenLightbox,
  onTimelineSectionsChange,
}: AlbumViewProps) {
  const query = useInfiniteQuery({
    queryKey: queryKeys.album(circleId),
    queryFn: async ({ pageParam }) =>
      fetchAlbumImages(circleId, { cursor: pageParam, limit: 30 }),
    enabled: Boolean(circleId),
    initialPageParam: null as { createdAt: string; id: string } | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  })

  const images = useMemo(
    () => query.data?.pages.flatMap((page) => page.items) ?? [],
    [query.data],
  )
  const indexedImages = useMemo(
    () => images.map((image, index) => ({ image, index })),
    [images],
  )
  const timeline = useMemo(
    () =>
      groupItemsByTimeline(indexedImages, (item) => item.image.postCreatedAt, {
        idPrefix: 'album',
      }),
    [indexedImages],
  )

  useEffect(() => {
    onTimelineSectionsChange?.(timeline.sections)
    return () => onTimelineSectionsChange?.([])
  }, [onTimelineSectionsChange, timeline.sections])

  if (query.isLoading) {
    return <AlbumSkeleton />
  }

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
    <div className="space-y-4">
      <div className="space-y-5">
        {timeline.groups.map((group) => (
          <section
            className="scroll-mt-24 space-y-3"
            id={group.section.id}
            key={group.section.id}
          >
            <AlbumHeading count={group.section.count} label={group.section.label} />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3">
              {group.items.map(({ image, index }) => (
                <AlbumTile
                  key={image.id}
                  image={image}
                  index={index}
                  onClick={() => onOpenLightbox(index, images)}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      {query.hasNextPage && (
        <div className="flex justify-center py-2">
          <button
            className="focus-ring rounded-[var(--radius-sm)] px-4 py-2 text-sm font-semibold text-[var(--color-primary)] transition hover:text-[var(--color-primary-hover)]"
            disabled={query.isFetchingNextPage}
            onClick={() => query.fetchNextPage()}
            type="button"
          >
            {query.isFetchingNextPage ? '正在加载...' : '加载更多'}
          </button>
        </div>
      )}
    </div>
  )
}

function AlbumHeading({ count, label }: { count: number; label: string }) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div>
        <h2 className="text-base font-semibold text-[var(--color-text)]">{label}</h2>
        <p className="mt-1 text-xs text-[var(--color-muted)]">{count} 张照片</p>
      </div>
      <div className="h-px flex-1 bg-[var(--color-border)]" />
    </div>
  )
}

function AlbumTile({
  image,
  index,
  onClick,
}: {
  image: AlbumImage
  index: number
  onClick: () => void
}) {
  return (
    <button
      className="focus-ring group relative overflow-hidden rounded-[var(--radius-md)] bg-[var(--color-surface)] text-left"
      onClick={onClick}
      type="button"
    >
      <div className="aspect-square">
        <SafeImage
          alt={`相册图片 ${index + 1}`}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          src={image.url}
        />
      </div>

      {/* Hover overlay */}
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
          <p className="mt-1 line-clamp-1 text-[11px] text-white/80">
            {image.postBody}
          </p>
        ) : null}
      </div>
    </button>
  )
}

function AlbumSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="aspect-square rounded-[var(--radius-md)]" />
      ))}
    </div>
  )
}
