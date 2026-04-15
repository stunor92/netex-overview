import { TextField } from '@entur/form'
import { FilterChip } from '@entur/chip'

interface SearchBarProps {
  query: string
  onQueryChange: (q: string) => void
  groups: string[]
  activeGroup: string | null
  onGroupChange: (g: string | null) => void
}

export function SearchBar({ query, onQueryChange, groups, activeGroup, onGroupChange }: SearchBarProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 0 }}>
      <div className="search-label-hidden">
        <TextField
          label="Søk"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Søk etter element..."
        />
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
        <FilterChip
          value=""
          checked={activeGroup === null}
          onChange={() => onGroupChange(null)}
        >
          Alle
        </FilterChip>
        {groups.map((g) => {
          const isActive = activeGroup === g
          return (
            <FilterChip
              key={g}
              value={g}
              checked={isActive}
              onChange={() => onGroupChange(isActive ? null : g)}
            >
              {g}
            </FilterChip>
          )
        })}
      </div>
    </div>
  )
}
