import type { CircleMember } from '../../types/domain'
import { Avatar } from '../../components/ui/Avatar'
import { Badge } from '../../components/ui/Badge'

type MembersViewProps = {
  members: CircleMember[]
}

export function MembersView({ members }: MembersViewProps) {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-5 text-xl font-bold text-[var(--color-text)] lg:hidden">成员</h1>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">圈子成员</h2>
        <p className="text-sm text-[var(--color-muted)]">共 {members.length} 位</p>
      </div>
      <div className="space-y-3">
        {members.map((member) => (
          <div
            className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-card)] p-3"
            key={member.userId}
          >
            <Avatar
              name={member.profile.displayName}
              size="sm"
              src={member.profile.avatarUrl}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{member.profile.displayName}</p>
              <p className="text-xs text-[var(--color-muted)]">
                {member.profile.bio ?? (member.role === 'owner' ? '圈主' : '成员')}
              </p>
            </div>
            <Badge tone={member.role === 'owner' ? 'primary' : 'neutral'}>
              {member.role === 'owner' ? '圈主' : '成员'}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  )
}
