import { useCallback, useState } from 'react'
import type { AlbumImage } from '../../types/domain'

export const useAlbumState = () => {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [lightboxImages, setLightboxImages] = useState<AlbumImage[]>([])

  const openLightbox = useCallback((index: number, images: AlbumImage[]) => {
    setLightboxImages(images)
    setLightboxIndex(index)
    setLightboxOpen(true)
  }, [])

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false)
  }, [])

  const goNext = useCallback(() => {
    setLightboxIndex((prev) => Math.min(lightboxImages.length - 1, prev + 1))
  }, [lightboxImages.length])

  const goPrev = useCallback(() => {
    setLightboxIndex((prev) => Math.max(0, prev - 1))
  }, [])

  return {
    lightboxOpen,
    lightboxIndex,
    lightboxImages,
    openLightbox,
    closeLightbox,
    goNext,
    goPrev,
  }
}
