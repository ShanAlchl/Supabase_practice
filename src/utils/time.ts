export const formatRelativeTime = (isoDate: string) => {
  const diff = Date.now() - new Date(isoDate).getTime()
  const minutes = Math.max(1, Math.floor(diff / 60_000))

  if (minutes < 60) {
    return `${minutes} 分钟前`
  }

  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    return `${hours} 小时前`
  }

  const days = Math.floor(hours / 24)
  if (days < 7) {
    return `${days} 天前`
  }

  return new Intl.DateTimeFormat('zh-CN', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(isoDate))
}
