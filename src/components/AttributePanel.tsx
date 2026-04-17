import { useState } from 'react'
import { Tabs, TabList, Tab, TabPanels, TabPanel } from '@entur/tab'
import { Table, TableHead, TableBody, TableRow, HeaderCell, DataCell } from '@entur/table'
import { ExpandablePanel } from '@entur/expand'
import { Label } from '@entur/typography'
import type { NeTExElement, LoadedFile, NeTExAttribute, NeTExInheritedAttribute, ProfileData, ActiveProfile, ProfileStatus, NeTExEnums } from '../types'

interface AttributePanelProps {
  element: NeTExElement
  allElements: NeTExElement[]
  loadedFile: LoadedFile | null
  profileData: ProfileData | null
  activeProfile: ActiveProfile
  onSelect?: (el: NeTExElement) => void
  enumValues?: NeTExEnums
}

const KIND_COLOUR: Record<string, string> = {
  enum: '#e65100',
  ref: '#2e7d32',
  list: '#1565c0',
  complex: '#6a1b9a',
  string: '#555',
  boolean: '#555',
  integer: '#555',
  decimal: '#555',
}

const GROUP_COLOURS: Record<string, string> = {
  // Part 1 - cool blues/greens for geography/stops
  AccessSpace: '#00695c',
  Connection: '#00796b',
  FareZone: '#1a6b3c',
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
}

const PROFILE_LABEL: Record<string, string> = {
  fr: '🇫🇷',
  nordic: '🇳🇴',
}

const BADGE_CONFIG: Record<ProfileStatus, { bg: string; color: string; label: string; fw?: number }> = {
  required:       { bg: '#e8f5e9', color: '#2e7d32', label: 'påkrevd', fw: 600 },
  optional:       { bg: '#e3f2fd', color: '#1565c0', label: 'valgfri', fw: 600 },
  'not-in-profile': { bg: '#f5f5f5', color: '#aaa',    label: 'ikke i profil' },
}

function ProfileAttrBadge({ status }: { status: ProfileStatus | undefined }) {
  if (!status) return null
  const { bg, color, label, fw } = BADGE_CONFIG[status]
  return (
    <span style={{ background: bg, color, fontSize: '9px', padding: '1px 6px', borderRadius: '6px', fontWeight: fw, whiteSpace: 'nowrap' }}>
      {label}
    </span>
  )
}

function cardinality(attr: NeTExAttribute | NeTExInheritedAttribute) {
  const max = attr.maxOccurs === 'unbounded' ? '∞' : attr.maxOccurs
  return `${attr.minOccurs}..${max}`
}

export interface SchemaTabProps {
  element: NeTExElement
  allElements: NeTExElement[]
  profileData: ProfileData | null
  activeProfile: ActiveProfile
  onSelect?: (el: NeTExElement) => void
  enumValues?: NeTExEnums
}

function getRefTargetDescription(
  type: string,
  kind: string,
  allElements: NeTExElement[],
): string | null {
  if (kind !== 'ref') return null
  const name = type
    .replace(/RefStructure$/, '')
    .replace(/Refs$/, '')
    .replace(/Ref$/, '')
  const target = allElements.find((e) => e.name === name)
  if (!target) return null
  const hasData = target.attributes.length > 0 || target.inheritedAttributes.length > 0
  if (hasData) return null
  return target.description || null
}

function findLinkedElement(type: string, kind: string, allElements: NeTExElement[]): NeTExElement | null {
  if (!type || type === 'unknown') return null
  if (kind === 'ref') {
    const name = type.replace(/RefStructure$/, '').replace(/Refs$/, '').replace(/Ref$/, '')
    return allElements.find(e => e.name === name) ?? null
  }
  if (kind === 'complex' || kind === 'list') {
    const name = type
      .replace(/_VersionedChildStructure$/, '')
      .replace(/_VersionedStructure$/, '')
      .replace(/_VersionStructure$/, '')
      .replace(/_RelStructure$/, '')
    return allElements.find(e => e.name === name)
      ?? allElements.find(e => e.name.toLowerCase() === name.toLowerCase())
      ?? null
  }
  return null
}

export function SchemaTab({ element, allElements, profileData, activeProfile, onSelect, enumValues }: SchemaTabProps) {
  const byAncestor = new Map<string, NeTExInheritedAttribute[]>()
  for (const a of element.inheritedAttributes) {
    if (!byAncestor.has(a.inheritedFrom)) byAncestor.set(a.inheritedFrom, [])
    byAncestor.get(a.inheritedFrom)!.push(a)
  }

  const elementProfile = profileData?.[element.name]
  const showProfileCol = !!profileData

  function attrRow(a: NeTExAttribute | NeTExInheritedAttribute) {
    const attrStatus = elementProfile?.attributes[a.name]
    const notInProfile = attrStatus === 'not-in-profile'
    return (
      <TableRow key={a.name} style={{ opacity: notInProfile ? 0.4 : 1 }}>
        <DataCell style={{ textDecoration: notInProfile ? 'line-through' : 'none' }}>{a.name}</DataCell>
        <DataCell>
          <span style={{ fontFamily: 'monospace', color: KIND_COLOUR[a.kind] ?? '#555' }}>{a.kind}</span>
          {(() => {
            const linkedEl = findLinkedElement(a.type, a.kind, allElements)
            const hasData = linkedEl && (linkedEl.attributes.length > 0 || linkedEl.inheritedAttributes.length > 0)
            if (hasData) {
              return (
                <button
                  type="button"
                  onClick={() => onSelect && onSelect(linkedEl!)}
                  style={{ display: 'block', background: 'none', border: 'none', cursor: 'pointer', color: '#1565c0', textDecoration: 'underline', fontFamily: 'monospace', fontSize: '11px', padding: 0, textAlign: 'left' }}
                >
                  {a.type}
                </button>
              )
            }
            return <span style={{ display: 'block', fontFamily: 'monospace', fontSize: '11px', color: 'var(--colors-greys-grey60, #aaa)' }}>{a.type}</span>
          })()}
        </DataCell>
        <DataCell align="center" style={{ color: 'var(--colors-greys-grey50, #888)' }}>{cardinality(a)}</DataCell>
        <DataCell style={{ color: 'var(--colors-greys-grey50, #888)' }}>
          {a.description}
          {a.kind === 'enum' && enumValues?.[a.type] && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px', marginTop: '4px' }}>
              {enumValues[a.type].map(v => (
                <span key={v} style={{
                  fontSize: '9px', padding: '1px 5px', borderRadius: '4px',
                  background: '#fff3e0', color: '#e65100', fontFamily: 'monospace',
                  border: '1px solid #ffe0b2'
                }}>
                  {v}
                </span>
              ))}
            </div>
          )}
          {a.kind === 'enum' && !enumValues?.[a.type] && (
            <div style={{ fontSize: '10px', color: '#d84315', background: '#ffebee', padding: '4px 8px', borderRadius: '4px', marginTop: '4px', display: 'inline-block' }}>
              ⚠ Ingen verdier definert
            </div>
          )}
          {(() => {
            const refDesc = getRefTargetDescription(a.type, a.kind, allElements)
            if (!refDesc) return null
            return (
              <div style={{ fontSize: '11px', color: 'var(--colors-greys-grey50, #888)', fontStyle: 'italic', marginTop: '2px' }}>
                {refDesc}
              </div>
            )
          })()}
        </DataCell>
        {showProfileCol && <DataCell align="center"><ProfileAttrBadge status={attrStatus} /></DataCell>}
      </TableRow>
    )
  }

  const noSchema = element.attributes.length === 0 && element.inheritedAttributes.length === 0

  return (
    <div>
      {element.description && (
        <div style={{ borderLeft: '3px solid var(--colors-brand-coral, #ff6c6c)', paddingLeft: '12px', margin: '16px', color: 'var(--colors-greys-grey40, #555)', fontSize: '14px' }}>
          {element.description}
        </div>
      )}

      {noSchema && (
        <div style={{ padding: '24px 16px', fontSize: '14px', color: 'var(--colors-greys-grey50, #888)', fontStyle: 'italic' }}>
          Ingen attributtskjemadata tilgjengelig for denne elementtypen i det nåværende datasettet.
        </div>
      )}

      {!noSchema && element.attributes.length > 0 && (
        <div style={{ padding: '0 16px 16px' }}>
          <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--colors-greys-grey50, #888)', fontWeight: 600, marginBottom: '8px' }}>
            Egne attributter
          </div>
          <Table>
            <TableHead>
              <TableRow>
                <HeaderCell>Navn</HeaderCell>
                <HeaderCell>Type</HeaderCell>
                <HeaderCell align="center">Kard.</HeaderCell>
                <HeaderCell>Beskrivelse</HeaderCell>
                {showProfileCol && <HeaderCell align="center">{activeProfile ? PROFILE_LABEL[activeProfile] : ''} Profil</HeaderCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {element.attributes.map((a) => attrRow(a))}
            </TableBody>
          </Table>
        </div>
      )}

      {!noSchema && byAncestor.size > 0 && (
        <div style={{ padding: '0 16px 16px' }}>
          {[...byAncestor.entries()].map(([ancestor, attrs]) => (
            <div key={ancestor} style={{ marginBottom: '8px' }}>
              <ExpandablePanel title={`Arvet fra ${ancestor}`}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <HeaderCell>Navn</HeaderCell>
                      <HeaderCell>Type</HeaderCell>
                      <HeaderCell align="center">Kard.</HeaderCell>
                      <HeaderCell>Beskrivelse</HeaderCell>
                      {showProfileCol && <HeaderCell align="center">{activeProfile ? PROFILE_LABEL[activeProfile] : ''} Profil</HeaderCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {attrs.map((a) => attrRow(a))}
                  </TableBody>
                </Table>
              </ExpandablePanel>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function InstanceTab({ element, loadedFile }: { element: NeTExElement; loadedFile: LoadedFile }) {
  const instances = loadedFile.instanceMap[element.name] ?? []
  const [selectedIdx, setSelectedIdx] = useState(0)
  const instance = instances[selectedIdx]

  if (instances.length === 0) {
    return (
      <div style={{ padding: '24px 16px', fontSize: '14px', color: 'var(--colors-greys-grey50, #888)' }}>
        Ingen instanser av {element.name} funnet i {loadedFile.filename}
      </div>
    )
  }

  return (
    <div style={{ padding: '16px' }}>
      {instances.length > 1 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
          {instances.map((inst, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSelectedIdx(i)}
              style={{
                fontSize: '12px', padding: '4px 12px', borderRadius: '9999px',
                border: selectedIdx === i ? '1px solid var(--colors-brand-coral, #ff6c6c)' : '1px solid var(--colors-greys-grey80, #e0e0e0)',
                background: selectedIdx === i ? 'var(--colors-brand-coral, #ff6c6c)' : 'transparent',
                color: selectedIdx === i ? 'var(--colors-greys-white, #ffffff)' : 'var(--colors-greys-grey40, #555)',
                fontWeight: selectedIdx === i ? 600 : 400,
                cursor: 'pointer',
              }}
            >
              {inst.id || `Instans ${i + 1}`}
            </button>
          ))}
        </div>
      )}

      {instance && (
        <>
          <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--colors-greys-grey50, #888)', fontWeight: 600, marginBottom: '8px' }}>
            Attributtverdier
          </div>
          <div style={{ marginBottom: '24px' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <HeaderCell>Attributt</HeaderCell>
                  <HeaderCell>Verdi</HeaderCell>
                  <HeaderCell>Type</HeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {instance.attributes.map((a) => (
                  <TableRow key={a.name}>
                    <DataCell>{a.name}</DataCell>
                    <DataCell><span style={{ fontFamily: 'monospace', color: 'var(--colors-greys-grey40, #555)' }}>{a.value}</span></DataCell>
                    <DataCell style={{ color: 'var(--colors-greys-grey50, #888)' }}>{a.kind}</DataCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--colors-greys-grey50, #888)', fontWeight: 600, marginBottom: '8px' }}>
            Rå XML
          </div>
          <pre style={{ background: 'var(--colors-greys-grey90, #f8f8f8)', border: '1px solid var(--colors-greys-grey80, #e0e0e0)', borderRadius: '8px', padding: '12px', fontSize: '11px', fontFamily: 'monospace', color: 'var(--colors-greys-grey40, #555)', overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {instance.rawXml}
          </pre>
        </>
      )}
    </div>
  )
}

export function AttributePanel({ element, allElements, loadedFile, profileData, activeProfile, onSelect, enumValues }: AttributePanelProps) {
  // Check if this is an enum (virtual element from Enumerations group)
  const isEnum = element.group === 'Enumerations'
  const enumVals = isEnum ? enumValues?.[element.name] : undefined

  if (isEnum && enumVals) {
    return (
      <div style={{ padding: '24px' }}>
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px', color: 'var(--colors-greys-grey10, #2a2a2a)', fontFamily: 'monospace' }}>
            {element.name}
          </div>
          <div style={{ fontSize: '14px', color: 'var(--colors-greys-grey50, #888)' }}>
            {enumVals.length} {enumVals.length === 1 ? 'verdi' : 'verdier'} definert
          </div>
        </div>

        <div>
          <Label style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--colors-greys-grey50, #888)', marginBottom: '12px' }}>
            Gyldige verdier
          </Label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {enumVals.map((value) => (
              <span
                key={value}
                style={{
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  background: '#fff3e0',
                  color: '#e65100',
                  border: '1px solid #ffe0b2',
                }}
              >
                {value}
              </span>
            ))}
          </div>
        </div>

        <div style={{ marginTop: '32px' }}>
          <Label style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--colors-greys-grey50, #888)', marginBottom: '12px' }}>
            Brukes av
          </Label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {allElements
              .filter((el) => 
                [...el.attributes, ...el.inheritedAttributes].some(
                  (attr) => attr.kind === 'enum' && attr.type === element.name
                )
              )
              .map((el) => (
                <button
                  key={el.name}
                  onClick={() => onSelect?.(el)}
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '11px',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: 'var(--colors-greys-grey90, #f8f8f8)',
                    color: 'var(--colors-greys-grey40, #555)',
                    border: '1px solid var(--colors-greys-grey80, #e0e0e0)',
                    cursor: 'pointer',
                  }}
                >
                  {el.name}
                </button>
              ))}
          </div>
        </div>
      </div>
    )
  }

  const [activeTabIdx, setActiveTabIdx] = useState(0)
  const groupColour = GROUP_COLOURS[element.group] ?? '#555'
  const hasInstances = !!loadedFile?.instanceMap[element.name]?.length
  const elementProfileStatus = profileData?.[element.name]?.status

  return (
    <div>
      {/* Header */}
      <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--colors-greys-grey80, #e0e0e0)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--colors-greys-grey10, #2a2a2a)' }}>
            {element.name}
          </span>
          <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '9999px', background: 'var(--colors-greys-grey90, #f8f8f8)', color: groupColour, border: '1px solid var(--colors-greys-grey80, #e0e0e0)' }}>
            {element.group}
          </span>
          {elementProfileStatus && elementProfileStatus !== 'not-in-profile' && (
            <span style={{ fontSize: '11px', background: elementProfileStatus === 'required' ? '#e8f5e9' : '#e3f2fd', color: elementProfileStatus === 'required' ? '#2e7d32' : '#1565c0', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>
              {elementProfileStatus === 'required' ? '✓ Påkrevd' : '~ Valgfri'} — {activeProfile === 'fr' ? 'Fransk profil' : 'Nordisk profil'}
            </span>
          )}
          {elementProfileStatus === 'not-in-profile' && (
            <span style={{ fontSize: '11px', background: '#f5f5f5', color: '#aaa', padding: '2px 8px', borderRadius: '10px' }}>
              ✕ Ikke i profil
            </span>
          )}
          {hasInstances && (
            <span style={{ fontSize: '12px', color: 'var(--colors-brand-coral, #ff6c6c)', marginLeft: '4px' }}>
              {loadedFile!.instanceMap[element.name].length} instanser i filen
            </span>
          )}
        </div>
        {element.inheritedFrom.length > 0 && (
          <div style={{ fontSize: '12px', color: 'var(--colors-greys-grey50, #888)' }}>
            Arver fra:{' '}
            {element.inheritedFrom.map((ancestorName, i) => {
              const found = allElements.find(e => e.name === ancestorName)
              return (
                <span key={ancestorName}>
                  {i > 0 && ' → '}
                  <button
                    type="button"
                    onClick={() => found && onSelect && onSelect(found)}
                    style={found && onSelect
                      ? { background: 'none', border: 'none', cursor: 'pointer', color: '#1565c0', textDecoration: 'underline', fontSize: '12px', padding: 0 }
                      : { background: 'none', border: 'none', cursor: 'default', color: '#bbb', fontSize: '12px', padding: 0 }
                    }
                  >
                    {ancestorName}
                  </button>
                </span>
              )
            })}
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs index={activeTabIdx} onChange={setActiveTabIdx}>
        <TabList>
          <Tab>Skjema</Tab>
          <Tab disabled={!loadedFile}>XML-instans</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <SchemaTab element={element} allElements={allElements} profileData={profileData} activeProfile={activeProfile} onSelect={onSelect} enumValues={enumValues} />
          </TabPanel>
          <TabPanel>
            {loadedFile && <InstanceTab element={element} loadedFile={loadedFile} />}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  )
}
