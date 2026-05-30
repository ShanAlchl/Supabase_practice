export type TimelineSection = {
  id: string
  key: string
  label: string
  count: number
}

export type TimelineGroup<T> = {
  section: TimelineSection
  items: T[]
}

const padMonth = (month: number) => String(month).padStart(2, '0')

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())

const startOfWeek = (date: Date) => {
  const dayStart = startOfDay(date)
  const day = dayStart.getDay()
  const offset = day === 0 ? 6 : day - 1
  dayStart.setDate(dayStart.getDate() - offset)
  return dayStart
}

const monthLabelFor = (date: Date, now: Date) => {
  const month = date.getMonth() + 1
  if (date.getFullYear() === now.getFullYear()) {
    return `${month}月`
  }
  return `${date.getFullYear()}年${month}月`
}

const sectionForDate = (date: Date, now: Date, idPrefix: string): TimelineSection => {
  const todayStart = startOfDay(now)
  const itemDayStart = startOfDay(date)
  if (itemDayStart.getTime() === todayStart.getTime()) {
    return {
      id: `timeline-${idPrefix}-today`,
      key: 'today',
      label: '今天',
      count: 0,
    }
  }

  if (itemDayStart >= startOfWeek(now) && itemDayStart < todayStart) {
    return {
      id: `timeline-${idPrefix}-this-week`,
      key: 'this-week',
      label: '本周',
      count: 0,
    }
  }

  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const key = `${year}-${padMonth(month)}`
  return {
    id: `timeline-${idPrefix}-${key}`,
    key,
    label: monthLabelFor(date, now),
    count: 0,
  }
}

export const groupItemsByTimeline = <T,>(
  items: T[],
  getDate: (item: T) => string,
  options: {
    idPrefix: string
    now?: Date
  },
) => {
  const now = options.now ?? new Date()
  const groups = new Map<string, TimelineGroup<T>>()

  for (const item of items) {
    const date = new Date(getDate(item))
    if (Number.isNaN(date.getTime())) continue
    const section = sectionForDate(date, now, options.idPrefix)
    const existing = groups.get(section.key)
    if (existing) {
      existing.items.push(item)
      existing.section.count += 1
      continue
    }
    groups.set(section.key, {
      section: { ...section, count: 1 },
      items: [item],
    })
  }

  const grouped = Array.from(groups.values())
  return {
    groups: grouped,
    sections: grouped.map((group) => group.section),
  }
}
