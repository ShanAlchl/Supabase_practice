import { Search, X } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'

type FeedSearchBarProps = {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function FeedSearchBar({ value, onChange, disabled = false }: FeedSearchBarProps) {
  return (
    <div className="flex gap-2">
      <Input
        aria-label="搜索动态"
        className="h-10"
        disabled={disabled}
        icon={<Search size={18} />}
        onChange={(event) => onChange(event.target.value)}
        placeholder="搜索这个圈子的动态"
        value={value}
      />
      {value ? (
        <Button aria-label="清空搜索" onClick={() => onChange('')} size="icon" variant="subtle">
          <X size={18} />
        </Button>
      ) : null}
    </div>
  )
}
