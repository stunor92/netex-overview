import { useState, useMemo } from 'react'
import type { NeTExElement, LoadedFile } from '../types'

const GROUP_COLOURS: Record<string, string> = {
  FareProduct: '#ff6c6c',
  FarePrice: '#181c56',
  SalesOfferPackage: '#e07b00',
  FareStructureElement: '#c0392b',
  UsageParameter: '#6a1b9a',
  TimeStructureFactor: '#1565c0',
}

interface ElementTreeProps {
  elements: NeTExElement[]
  query: string
  activeGroup: string | null
  selectedElement: NeTExElement | null
  loadedFile: LoadedFile | null
  onSelect: (el: NeTExElement) => void
}

export function ElementTree({ elements, query, activeGroup, selectedElement, loadedFile, onSelect }: ElementTreeProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => new Set())
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null)
  const [hoveredElement, setHoveredElement] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return elements.filter((el) => {
      if (activeGroup && el.group !== activeGroup) return false
      if (query) return el.name.toLowerCase().includes(query.toLowerCase())
      return true
    })
  }, [elements, query, activeGroup])

  const byGroup = useMemo(() => {
    const map = new Map<string, NeTExElement[]>()
    for (const el of filtered) {
      if (!map.has(el.group)) map.set(el.group, [])
      map.get(el.group)!.push(el)
    }
    return map
  }, [filtered])

  // Auto-expand groups that have matches when searching
  useMemo(() => {
    if (query) {
      setExpandedGroups(new Set(byGroup.keys()))
    }
  }, [query, byGroup])

  function toggleGroup(group: string) {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      next.has(group) ? next.delete(group) : next.add(group)
      return next
    })
  }

  const groups = [...byGroup.keys()].sort()

  if (groups.length === 0) {
    return (
      <div style={{ padding: '8px 12px', fontSize: '12px', color: 'var(--colors-greys-grey50, #888)' }}>
        Ingen elementer funnet
      </div>
    )
  }

  return (
    <div style={{ paddingTop: '8px', paddingBottom: '8px' }}>
      <div
        style={{
          padding: '0 12px 8px',
          fontSize: '10px',
          textTransform: 'uppercase',
          letterSpacing: '1.5px',
          color: 'var(--colors-greys-grey50, #888)',
          fontWeight: 600,
        }}
      >
        Elementer
      </div>
      {groups.map((group) => {
        const colour = GROUP_COLOURS[group] ?? '#555'
        const isExpanded = expandedGroups.has(group)
        const children = byGroup.get(group)!
        const isGroupHovered = hoveredGroup === group
        return (
          <div key={group}>
            <button
              onClick={() => toggleGroup(group)}
              onMouseEnter={() => setHoveredGroup(group)}
              onMouseLeave={() => setHoveredGroup(null)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                background: isGroupHovered ? 'var(--colors-greys-grey90, #f8f8f8)' : 'none',
                border: 'none',
                color: colour,
              }}
            >
              <span>{isExpanded ? '▼' : '▶'}</span>
              <span>{group}</span>
              <span
                style={{
                  marginLeft: 'auto',
                  fontSize: '11px',
                  color: 'var(--colors-greys-grey50, #888)',
                  fontWeight: 400,
                }}
              >
                {children.length}
              </span>
            </button>
            {isExpanded &&
              children.map((el) => {
                const count = loadedFile?.instanceMap[el.name]?.length ?? 0
                const isSelected = selectedElement?.name === el.name
                const isElHovered = hoveredElement === el.name
                const showHighlight = isSelected || isElHovered
                return (
                  <button
                    key={el.name}
                    onClick={() => onSelect(el)}
                    onMouseEnter={() => setHoveredElement(el.name)}
                    onMouseLeave={() => setHoveredElement(null)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '5px 12px 5px 28px',
                      fontSize: '11px',
                      cursor: 'pointer',
                      background: showHighlight ? 'var(--colors-greys-grey90, #f8f8f8)' : 'none',
                      border: 'none',
                      borderLeft: '3px solid transparent',
                      borderLeftColor: isSelected ? colour : 'transparent',
                      color: showHighlight
                        ? 'var(--colors-greys-grey10, #2a2a2a)'
                        : 'var(--colors-greys-grey40, #555)',
                      fontWeight: isSelected ? 500 : undefined,
                    }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      ● {el.name}
                    </span>
                    {count > 0 && (
                      <span
                        style={{
                          marginLeft: 'auto',
                          flexShrink: 0,
                          background: '#e8f5e9',
                          color: '#2e7d32',
                          fontSize: '9px',
                          padding: '0 5px',
                          borderRadius: '8px',
                          fontWeight: 600,
                        }}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                )
              })}
          </div>
        )
      })}
    </div>
  )
}
