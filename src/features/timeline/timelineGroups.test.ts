import { describe, expect, it, vi } from 'vitest'
import { groupItemsByTimeline } from './timelineGroups'

describe('groupItemsByTimeline', () => {
  it('groups loaded items into quiet timeline sections', () => {
    vi.setSystemTime(new Date(2026, 4, 28, 10))

    const items = [
      { id: 'today', createdAt: new Date(2026, 4, 28, 9).toISOString() },
      { id: 'week', createdAt: new Date(2026, 4, 26, 20).toISOString() },
      { id: 'month', createdAt: new Date(2026, 4, 10, 12).toISOString() },
      { id: 'older', createdAt: new Date(2026, 3, 12, 12).toISOString() },
    ]

    const result = groupItemsByTimeline(items, (item) => item.createdAt, {
      idPrefix: 'feed',
    })

    expect(result.sections).toEqual([
      { id: 'timeline-feed-today', key: 'today', label: '今天', count: 1 },
      { id: 'timeline-feed-this-week', key: 'this-week', label: '本周', count: 1 },
      { id: 'timeline-feed-2026-05', key: '2026-05', label: '5月', count: 1 },
      { id: 'timeline-feed-2026-04', key: '2026-04', label: '4月', count: 1 },
    ])
    expect(result.groups.map((group) => group.items.map((item) => item.id))).toEqual([
      ['today'],
      ['week'],
      ['month'],
      ['older'],
    ])
  })
})
