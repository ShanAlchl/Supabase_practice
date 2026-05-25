import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useObjectUrls } from './useObjectUrls'

describe('useObjectUrls', () => {
  const createObjectURL = vi.fn(() => 'blob:test')
  const revokeObjectURL = vi.fn()

  beforeEach(() => {
    globalThis.URL.createObjectURL = createObjectURL
    globalThis.URL.revokeObjectURL = revokeObjectURL
    createObjectURL.mockClear()
    revokeObjectURL.mockClear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('creates object URLs for files', () => {
    const files = [new File(['a'], 'a.png', { type: 'image/png' })]
    const { result } = renderHook(() => useObjectUrls(files))
    expect(result.current).toHaveLength(1)
    expect(result.current[0].name).toBe('a.png')
    expect(createObjectURL).toHaveBeenCalledTimes(1)
  })

  it('revokes object URLs on unmount', () => {
    const files = [new File(['a'], 'a.png', { type: 'image/png' })]
    const { unmount } = renderHook(() => useObjectUrls(files))
    unmount()
    expect(revokeObjectURL).toHaveBeenCalledTimes(1)
  })
})
