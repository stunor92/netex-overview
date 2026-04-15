import { TextField } from '@entur/form'
import { FilterChip } from '@entur/chip'
import { EXPORT_CHIPS } from '../constants'

interface SearchBarProps {
  query: string
  onQueryChange: (q: string) => void
  activeChip: string | null
  onChipChange: (c: string | null) => void
}

export function SearchBar({ query, onQueryChange, activeChip, onChipChange }: SearchBarProps) {
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
          checked={activeChip === null}
          onChange={() => onChipChange(null)}
        >
          Alle
        </FilterChip>
        {EXPORT_CHIPS.map((chip) => (
          <FilterChip
            key={chip.key}
            value={chip.key}
            checked={activeChip === chip.key}
            onChange={() => onChipChange(activeChip === chip.key ? null : chip.key)}
          >
            {chip.label}{' '}
            <span style={{ color: '#aaa', fontWeight: 400 }}>· {chip.sub}</span>
          </FilterChip>
        ))}
      </div>
    </div>
  )
}
