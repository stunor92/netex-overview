import { useState, useMemo, useEffect } from 'react'
import type { NeTExElement, LoadedFile, ProfileData, ActiveProfile } from '../types'

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
  profileData: ProfileData | null
  activeProfile: ActiveProfile
  onProfileChange: (p: ActiveProfile) => void
}

function ProfileBadge({ status }: { status: 'required' | 'optional' | 'not-in-profile' | undefined }) {
  if (!status) return null
  if (status === 'required') return (
    <span style={{ background: '#e8f5e9', color: '#2e7d32', fontSize: '9px', padding: '1px 5px', borderRadius: '6px', fontWeight: 600, flexShrink: 0 }}>✓</span>
  )
  if (status === 'optional') return (
    <span style={{ background: '#e3f2fd', color: '#1565c0', fontSize: '9px', padding: '1px 5px', borderRadius: '6px', fontWeight: 600, flexShrink: 0 }}>~</span>
  )
  return (
    <span style={{ background: '#f5f5f5', color: '#aaa', fontSize: '9px', padding: '1px 5px', borderRadius: '6px', flexShrink: 0 }}>✕</span>
  )
}

export function ElementTree({
  elements, query, activeGroup, selectedElement, loadedFile, onSelect,
  profileData, activeProfile, onProfileChange,
}: ElementTreeProps) {
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

  useEffect(() => {
    if (query) setExpandedGroups(new Set(byGroup.keys()))
  }, [query, byGroup])

  function toggleGroup(group: string) {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      next.has(group) ? next.delete(group) : next.add(group)
      return next
    })
  }

  const groups = [...byGroup.keys()].sort()

  return (
    <div style={{ paddingTop: '0', paddingBottom: '8px' }}>

      {/* Profile selector */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 10px',
        borderBottom: '1px solid var(--colors-greys-grey80, #e0e0e0)',
        background: 'var(--colors-greys-white, #ffffff)',
      }}>
        <span style={{ fontSize: '10px', color: 'var(--colors-greys-grey50, #888)', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
          Profil
        </span>
        <select
          value={activeProfile ?? ''}
          onChange={(e) => onProfileChange((e.target.value || null) as ActiveProfile)}
          style={{
            flex: 1,
            border: '1px solid var(--colors-greys-grey80, #e0e0e0)',
            borderRadius: '4px',
            padding: '3px 6px',
            fontSize: '11px',
            color: 'var(--colors-greys-grey10, #2a2a2a)',
            background: 'var(--colors-greys-white, #ffffff)',
            fontWeight: 500,
          }}
        >
          <option value="">— Ingen profil</option>
          <option value="fr">🇫🇷 Fransk profil</option>
          <option value="nordic">🇳🇴 Nordisk profil</option>
        </select>
      </div>

      {/* Elementer label */}
      <div style={{ padding: '8px 12px 4px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--colors-greys-grey50, #888)', fontWeight: 600 }}>
        Elementer
      </div>

      {groups.length === 0 && (
        <div style={{ padding: '8px 12px', fontSize: '12px', color: 'var(--colors-greys-grey50, #888)' }}>
          Ingen elementer funnet
        </div>
      )}

      {groups.map((group) => {
        const colour = GROUP_COLOURS[group] ?? '#555'
        const isExpanded = expandedGroups.has(group)
        const children = byGroup.get(group)!
        const isGroupHovered = hoveredGroup === group
        return (
          <div key={group}>
            <button
              type="button"
              onClick={() => toggleGroup(group)}
              onMouseEnter={() => setHoveredGroup(group)}
              onMouseLeave={() => setHoveredGroup(null)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                background: isGroupHovered ? 'var(--colors-greys-grey90, #f8f8f8)' : 'none',
                border: 'none', color: colour,
              }}
            >
              <span>{isExpanded ? '▼' : '▶'}</span>
              <span>{group}</span>
              <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--colors-greys-grey50, #888)', fontWeight: 400 }}>
                {children.length}
              </span>
            </button>
            {isExpanded && children.map((el) => {
              const count = loadedFile?.instanceMap[el.name]?.length ?? 0
              const isSelected = selectedElement?.name === el.name
              const isElHovered = hoveredElement === el.name
              const showHighlight = isSelected || isElHovered
              const profileStatus = profileData?.[el.name]?.status
              const notInProfile = profileStatus === 'not-in-profile'
              return (
                <button
                  key={el.name}
                  type="button"
                  onClick={() => onSelect(el)}
                  onMouseEnter={() => setHoveredElement(el.name)}
                  onMouseLeave={() => setHoveredElement(null)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '5px 12px 5px 28px', fontSize: '11px', cursor: 'pointer',
                    background: showHighlight ? 'var(--colors-greys-grey90, #f8f8f8)' : 'none',
                    border: 'none', borderLeft: '3px solid transparent',
                    borderLeftColor: isSelected ? colour : 'transparent',
                    color: showHighlight ? 'var(--colors-greys-grey10, #2a2a2a)' : 'var(--colors-greys-grey40, #555)',
                    fontWeight: isSelected ? 500 : undefined,
                    opacity: notInProfile ? 0.35 : 1,
                  }}
                >
                  <span style={{
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    textDecoration: notInProfile ? 'line-through' : 'none',
                  }}>
                    ● {el.name}
                  </span>
                  <span style={{ display: 'flex', gap: '3px', alignItems: 'center', flexShrink: 0, marginLeft: '4px' }}>
                    {profileData && <ProfileBadge status={profileStatus} />}
                    {count > 0 && (
                      <span style={{ background: '#e8f5e9', color: '#2e7d32', fontSize: '9px', padding: '0 5px', borderRadius: '8px', fontWeight: 600 }}>
                        {count}
                      </span>
                    )}
                  </span>
                </button>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
