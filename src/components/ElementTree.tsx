import { useState, useMemo, useEffect } from 'react'
import type { NeTExElement, LoadedFile, ProfileData, ActiveProfile, ProfileStatus } from '../types'
import { EXPORT_CHIPS } from '../constants'
import { Label } from '@entur/typography'

const GROUP_COLOURS: Record<string, string> = {
  // Part 1 - cool blues/greens for geography/stops
  AccessSpace: '#00695c',
  Connection: '#00796b',
  FlexibleLine: '#5c6bc0',
  Line: '#1a237e',
  NavigationPath: '#004d40',
  Network: '#1565c0',
  Parking: '#37474f',
  PathLink: '#006064',
  Quay: '#0277bd',
  Route: '#283593',
  ScheduledStopPoint: '#1976d2',
  ServiceLink: '#0288d1',
  SiteFrame: '#455a64',
  StopArea: '#2e7d32',
  StopPlace: '#388e3c',
  // Part 2 - warm purples/oranges for timetables
  Block: '#6a1b9a',
  DeadRun: '#757575',
  Interchange: '#7b1fa2',
  ServiceJourney: '#e65100',
  TimetabledPassingTime: '#f57c00',
  TrainNumber: '#8d6e63',
  VehicleJourney: '#d84315',
  VehicleService: '#bf360c',
  // Part 3 - fare modelling
  DistanceMatrixElement: '#388e3c',
  DistributionChannel: '#f57c00',
  FarePrice: '#181c56',
  FareProduct: '#ff6c6c',
  FareStructureElement: '#c0392b',
  FareTable: '#bf360c',
  FulfilmentMethod: '#ef6c00',
  PricingRule: '#283593',
  QualityStructureFactor: '#0277bd',
  SalesOfferPackage: '#e07b00',
  Tariff: '#4a148c',
  TimeStructureFactor: '#1565c0',
  TypeOfTravelDocument: '#e65100',
  UsageParameter: '#6a1b9a',
  ValidableElement: '#d84315',
  FareZone: '#1a6b3c',
}

interface ElementTreeProps {
  elements: NeTExElement[]
  query: string
  activeChip: string | null
  selectedElement: NeTExElement | null
  loadedFile: LoadedFile | null
  onSelect: (el: NeTExElement) => void
  profileData: ProfileData | null
  activeProfile: ActiveProfile
  onProfileChange: (p: ActiveProfile) => void
}

function ProfileBadge({ status }: { status: ProfileStatus | undefined }) {
  if (!status) return null
  if (status === 'required') return (
    <span style={{ background: '#e8f5e9', color: '#2e7d32', fontSize: '9px', padding: '1px 5px', borderRadius: '6px', fontWeight: 600, flexShrink: 0 }}>
      ✓ påkrevd
    </span>
  )
  if (status === 'optional') return (
    <span style={{ background: '#e3f2fd', color: '#1565c0', fontSize: '9px', padding: '1px 5px', borderRadius: '6px', fontWeight: 600, flexShrink: 0 }}>
      ~ valgfri
    </span>
  )
  return (
    <span style={{ background: '#f5f5f5', color: '#aaa', fontSize: '9px', padding: '1px 5px', borderRadius: '6px', flexShrink: 0 }}>
      ✕ ikke i profil
    </span>
  )
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      <span style={{ display: 'inline-block', width: '3px', height: '12px', background: color, borderRadius: '2px' }} />
      <span style={{ color: color === '#e0e0e0' ? '#aaa' : color }}>{label}</span>
    </span>
  )
}

export function ElementTree({
  elements, query, activeChip, selectedElement, loadedFile, onSelect,
  profileData, activeProfile, onProfileChange,
}: ElementTreeProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => new Set())
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null)
  const [hoveredElement, setHoveredElement] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const activeChipDef = activeChip ? EXPORT_CHIPS.find((c) => c.key === activeChip) : null
    return elements.filter((el) => {
      if (activeChipDef && !activeChipDef.groups.includes(el.group)) return false
      if (query) return el.name.toLowerCase().includes(query.toLowerCase())
      return true
    })
  }, [elements, query, activeChip])

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
        borderBottom: '1px solid var(--colors-greys-grey80, #e0e0e0)',
        background: 'var(--colors-greys-white, #ffffff)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px' }}>
          <Label as="span" margin="none" style={{ fontSize: '10px', color: 'var(--colors-greys-grey50, #888)', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
            Profil
          </Label>
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
            <option value="uk">🇬🇧 Britisk profil</option>
          </select>
        </div>
        {activeProfile && (
          <div style={{ display: 'flex', gap: '10px', padding: '0 10px 6px', fontSize: '10px', flexWrap: 'wrap' }}>
            <LegendItem color="#2e7d32" label="påkrevd" />
            <LegendItem color="#1565c0" label="valgfri" />
            <LegendItem color="#e0e0e0" label="ikke i profil" />
            <span style={{ color: '#ccc', fontStyle: 'italic' }}>╎ ukjent</span>
          </div>
        )}
      </div>

      {/* Elementer label */}
      <Label as="div" margin="none" style={{ padding: '8px 12px 4px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--colors-greys-grey50, #888)', fontWeight: 600 }}>
        Elementer
      </Label>

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
              const noSchema = el.attributes.length === 0 && el.inheritedAttributes.length === 0
              const count = loadedFile?.instanceMap[el.name]?.length ?? 0
              const isSelected = selectedElement?.name === el.name
              const isElHovered = hoveredElement === el.name
              const showHighlight = isSelected || isElHovered
              const profileStatus = profileData?.[el.name]?.status
              const notInProfile = profileStatus === 'not-in-profile'
              const showUnknown = profileData !== null && profileStatus === undefined
              const borderColor =
                profileStatus === 'required' ? '#2e7d32' :
                profileStatus === 'optional' ? '#1565c0' :
                notInProfile ? '#e0e0e0' :
                isSelected ? colour :
                'transparent'
              return (
                <button
                  key={el.name}
                  type="button"
                  onClick={() => onSelect(el)}
                  onMouseEnter={() => setHoveredElement(el.name)}
                  onMouseLeave={() => setHoveredElement(null)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '5px 12px 5px 25px', fontSize: '11px', cursor: 'pointer',
                    background: showHighlight ? 'var(--colors-greys-grey90, #f8f8f8)' : 'none',
                    border: 'none', borderLeft: `3px solid ${borderColor}`,
                    color: showHighlight ? 'var(--colors-greys-grey10, #2a2a2a)' : 'var(--colors-greys-grey40, #555)',
                    fontWeight: isSelected ? 500 : undefined,
                    opacity: notInProfile ? 0.5 : 1,
                  }}
                >
                  <span style={{
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    textDecoration: notInProfile ? 'line-through' : 'none',
                  }}>
                    ● {el.name}
                    {noSchema && (
                      <span style={{ fontSize: '9px', color: '#ccc', marginLeft: '4px', fontStyle: 'italic' }}>
                        ingen data
                      </span>
                    )}
                  </span>
                  <span style={{ display: 'flex', gap: '3px', alignItems: 'center', flexShrink: 0, marginLeft: '4px' }}>
                    {profileData && profileStatus && <ProfileBadge status={profileStatus} />}
                    {showUnknown && (
                      <span style={{ fontSize: '9px', color: '#ccc', border: '1px dashed #ddd', padding: '1px 5px', borderRadius: '6px', flexShrink: 0 }}>
                        ? ukjent
                      </span>
                    )}
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
