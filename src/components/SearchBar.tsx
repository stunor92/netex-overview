import { FilterChip } from '@entur/chip'
import { PARTS } from '../constants'

interface SearchBarProps {
  activePart: 1 | 2 | 3 | null
  onPartChange: (p: 1 | 2 | 3 | null) => void
}

export function SearchBar({ activePart, onPartChange }: SearchBarProps) {
  const activePartDef = activePart ? PARTS.find((p) => p.key === activePart) : null

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
        <FilterChip
          value=""
          checked={activePart === null}
          onChange={() => onPartChange(null)}
        >
          Alle
        </FilterChip>
        {PARTS.map((part) => (
          <FilterChip
            key={part.key}
            value={String(part.key)}
            checked={activePart === part.key}
            onChange={() => onPartChange(activePart === part.key ? null : part.key)}
          >
            {part.label}
          </FilterChip>
        ))}
      </div>
      {activePartDef && (
        <span style={{ fontSize: '12px', color: 'var(--colors-greys-grey50, #888)', fontStyle: 'italic', whiteSpace: 'nowrap' }}>
          {activePartDef.description}
        </span>
      )}
    </div>
  )
}
