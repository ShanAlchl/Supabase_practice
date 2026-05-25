import { useEffect, useMemo } from 'react'

export type ObjectUrlPreview = {
  key: string
  name: string
  url: string
}

export const useObjectUrls = (files: readonly File[]): ObjectUrlPreview[] => {
  const previews = useMemo(
    () =>
      files.map((file, index) => ({
        key: `${file.name}-${file.size}-${file.lastModified}-${index}`,
        name: file.name,
        url: URL.createObjectURL(file),
      })),
    [files],
  )

  useEffect(
    () => () => {
      for (const preview of previews) {
        URL.revokeObjectURL(preview.url)
      }
    },
    [previews],
  )

  return previews
}
