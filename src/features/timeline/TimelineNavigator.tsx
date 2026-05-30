import { useEffect, useState } from 'react'
import { cn } from '../../lib/cn'
import type { TimelineSection } from './timelineGroups'

type TimelineNavigatorProps = {
  sections: TimelineSection[]
  title?: string
  variant?: 'rail' | 'mobile'
  sticky?: boolean
  className?: string
}

export function TimelineNavigator({
  sections,
  title = '时间索引',
  variant = 'rail',
  sticky = true,
  className,
}: TimelineNavigatorProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const activeId =
    selectedId && sections.some((section) => section.id === selectedId)
      ? selectedId
      : (sections[0]?.id ?? null)

  useEffect(() => {
    if (!sections.length || !('IntersectionObserver' in window)) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        const nextId = visible[0]?.target.id
        if (nextId) {
          setSelectedId(nextId)
        }
      },
      {
        rootMargin: '-20% 0px -65% 0px',
        threshold: 0,
      },
    )

    for (const section of sections) {
      const element = document.getElementById(section.id)
      if (element) {
        observer.observe(element)
      }
    }

    return () => observer.disconnect()
  }, [sections])

  if (sections.length === 0) return null

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
    setSelectedId(sectionId)
  }

  if (variant === 'mobile') {
    return (
      <nav
        aria-label={title}
        className={cn(
          sticky ? 'sticky top-0 z-20 -mx-4 mb-4' : '',
          'border-y border-[var(--color-border)] bg-[var(--color-page)]/95 px-4 py-2 backdrop-blur xl:hidden',
          className,
        )}
      >
        <div className="quiet-scrollbar flex gap-2 overflow-x-auto">
          {sections.map((section) => (
            <TimelineButton
              active={section.id === activeId}
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              section={section}
              variant="mobile"
            />
          ))}
        </div>
      </nav>
    )
  }

  return (
    <nav
      aria-label={title}
      className={cn(
        'surface-card p-5',
        className,
      )}
    >
      <p className="text-sm font-semibold text-[var(--color-text)]">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-[var(--color-muted)]">
        当前已加载内容的时间位置
      </p>
      <div className="mt-4 space-y-1 border-l border-[var(--color-border)]">
        {sections.map((section) => (
          <TimelineButton
            active={section.id === activeId}
            key={section.id}
            onClick={() => scrollToSection(section.id)}
            section={section}
            variant="rail"
          />
        ))}
      </div>
    </nav>
  )
}

function TimelineButton({
  active,
  onClick,
  section,
  variant,
}: {
  active: boolean
  onClick: () => void
  section: TimelineSection
  variant: 'rail' | 'mobile'
}) {
  const label = `${section.label} ${section.count} 条`

  if (variant === 'mobile') {
    return (
      <button
        aria-label={label}
        className={cn(
          'focus-ring h-8 shrink-0 rounded-[var(--radius-sm)] px-3 text-xs font-semibold transition',
          active
            ? 'bg-[var(--color-primary)] text-white shadow-sm'
            : 'bg-[var(--color-card)] text-[var(--color-muted)] hover:text-[var(--color-text)]',
        )}
        onClick={onClick}
        type="button"
      >
        {section.label}
      </button>
    )
  }

  return (
    <button
      aria-label={label}
      className="focus-ring group flex w-full items-center justify-between gap-3 rounded-r-[var(--radius-sm)] py-2 pl-4 pr-2 text-left text-sm transition hover:bg-[var(--color-surface)]"
      onClick={onClick}
      type="button"
    >
      <span className="relative flex items-center gap-2">
        <span
          className={cn(
            'absolute -left-[21px] h-2.5 w-2.5 rounded-full ring-4 ring-[var(--color-card)] transition',
            active ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]',
          )}
        />
        <span
          className={cn(
            'font-semibold transition',
            active ? 'text-[var(--color-text)]' : 'text-[var(--color-muted)]',
          )}
        >
          {section.label}
        </span>
      </span>
      <span className="text-xs text-[var(--color-muted)]">{section.count}</span>
    </button>
  )
}
