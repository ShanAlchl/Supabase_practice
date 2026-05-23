import type { Profile } from '../../types/domain'
import { Avatar } from './Avatar'

type AvatarGroupProps = {
  people: Profile[]
  max?: number
}

export function AvatarGroup({ people, max = 4 }: AvatarGroupProps) {
  const visible = people.slice(0, max)
  const hidden = Math.max(0, people.length - visible.length)

  return (
    <div className="flex -space-x-2">
      {visible.map((person) => (
        <Avatar
          className="border border-white"
          key={person.id}
          name={person.displayName}
          size="sm"
          src={person.avatarUrl}
        />
      ))}
      {hidden > 0 ? (
        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white bg-slate-100 text-xs font-semibold text-[var(--color-muted)] ring-2 ring-white">
          +{hidden}
        </span>
      ) : null}
    </div>
  )
}
