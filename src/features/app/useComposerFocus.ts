import { useRef, useState } from 'react'

export const useComposerFocus = () => {
  const composerRef = useRef<HTMLDivElement | null>(null)
  const [composerHighlight, setComposerHighlight] = useState(false)

  const scrollToComposer = () => {
    composerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    composerRef.current?.querySelector('textarea')?.focus()
    setComposerHighlight(true)
    window.setTimeout(() => setComposerHighlight(false), 900)
  }

  return {
    composerHighlight,
    composerRef,
    scrollToComposer,
  }
}
