import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TimelineNavigator } from './TimelineNavigator'

const sections = [
  { id: 'timeline-feed-today', key: 'today', label: '今天', count: 2 },
  { id: 'timeline-feed-2026-05', key: '2026-05', label: '5月', count: 4 },
]

describe('TimelineNavigator', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  it('renders a quiet timeline index with item counts', () => {
    render(<TimelineNavigator sections={sections} title="动态时间" />)

    expect(screen.getByText('动态时间')).toBeVisible()
    expect(screen.getByRole('button', { name: '今天 2 条' })).toBeVisible()
    expect(screen.getByRole('button', { name: '5月 4 条' })).toBeVisible()
  })

  it('scrolls to the selected loaded section', () => {
    const target = document.createElement('div')
    target.id = 'timeline-feed-2026-05'
    document.body.append(target)
    const scrollIntoView = vi.fn()
    target.scrollIntoView = scrollIntoView

    render(<TimelineNavigator sections={sections} title="动态时间" />)
    fireEvent.click(screen.getByRole('button', { name: '5月 4 条' }))

    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start',
    })
  })

  it('can render as docked mobile content without owning sticky positioning', () => {
    const { container } = render(
      <TimelineNavigator sections={sections} sticky={false} title="动态时间" variant="mobile" />,
    )

    expect(container.querySelector('nav')).not.toHaveClass('sticky')
  })
})
