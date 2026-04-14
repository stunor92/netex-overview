import { useState } from 'react'
import { Tabs, TabList, Tab, TabPanels, TabPanel } from '@entur/tab'
import { Table, TableHead, TableBody, TableRow, HeaderCell, DataCell } from '@entur/table'
import { ExpandablePanel } from '@entur/expand'
import type { NeTExElement, LoadedFile, NeTExAttribute, NeTExInheritedAttribute } from '../types'

interface AttributePanelProps {
  element: NeTExElement
  allElements: NeTExElement[]
  loadedFile: LoadedFile | null
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
  FareProduct: '#ff6c6c',
  FarePrice: '#181c56',
  SalesOfferPackage: '#e07b00',
  FareStructureElement: '#c0392b',
  UsageParameter: '#6a1b9a',
  TimeStructureFactor: '#1565c0',
}

function cardinality(attr: NeTExAttribute | NeTExInheritedAttribute) {
  const max = attr.maxOccurs === 'unbounded' ? '∞' : attr.maxOccurs
  return `${attr.minOccurs}..${max}`
}

function SchemaTab({ element }: { element: NeTExElement }) {
  const byAncestor = new Map<string, NeTExInheritedAttribute[]>()
  for (const a of element.inheritedAttributes) {
    if (!byAncestor.has(a.inheritedFrom)) byAncestor.set(a.inheritedFrom, [])
    byAncestor.get(a.inheritedFrom)!.push(a)
  }

  return (
    <div>
      {element.description && (
        <div
          style={{
            borderLeft: '3px solid var(--colors-brand-coral, #ff6c6c)',
            paddingLeft: '12px',
            margin: '16px',
            color: 'var(--colors-greys-grey40, #555)',
            fontSize: '14px',
          }}
        >
          {element.description}
        </div>
      )}

      {element.attributes.length > 0 && (
        <div style={{ padding: '0 16px 16px' }}>
          <div
            style={{
              fontSize: '10px',
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              color: 'var(--colors-greys-grey50, #888)',
              fontWeight: 600,
              marginBottom: '8px',
            }}
          >
            Egne attributter
          </div>
          <Table>
            <TableHead>
              <TableRow>
                <HeaderCell>Navn</HeaderCell>
                <HeaderCell>Type</HeaderCell>
                <HeaderCell align="center">Kard.</HeaderCell>
                <HeaderCell>Beskrivelse</HeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {element.attributes.map((a) => (
                <TableRow key={a.name}>
                  <DataCell>{a.name}</DataCell>
                  <DataCell>
                    <span style={{ fontFamily: 'monospace', color: KIND_COLOUR[a.kind] ?? '#555' }}>
                      {a.kind}
                    </span>
                  </DataCell>
                  <DataCell align="center" style={{ color: 'var(--colors-greys-grey50, #888)' }}>
                    {cardinality(a)}
                  </DataCell>
                  <DataCell style={{ color: 'var(--colors-greys-grey50, #888)' }}>
                    {a.description}
                  </DataCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {byAncestor.size > 0 && (
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
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {attrs.map((a) => (
                      <TableRow key={a.name}>
                        <DataCell>{a.name}</DataCell>
                        <DataCell>
                          <span style={{ fontFamily: 'monospace', color: KIND_COLOUR[a.kind] ?? '#555' }}>
                            {a.kind}
                          </span>
                        </DataCell>
                        <DataCell align="center" style={{ color: 'var(--colors-greys-grey50, #888)' }}>
                          {cardinality(a)}
                        </DataCell>
                        <DataCell style={{ color: 'var(--colors-greys-grey50, #888)' }}>
                          {a.description}
                        </DataCell>
                      </TableRow>
                    ))}
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
      <div
        style={{
          padding: '24px 16px',
          fontSize: '14px',
          color: 'var(--colors-greys-grey50, #888)',
        }}
      >
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
                fontSize: '12px',
                padding: '4px 12px',
                borderRadius: '9999px',
                border: selectedIdx === i
                  ? '1px solid var(--colors-brand-coral, #ff6c6c)'
                  : '1px solid var(--colors-greys-grey80, #e0e0e0)',
                background: selectedIdx === i
                  ? 'var(--colors-brand-coral, #ff6c6c)'
                  : 'transparent',
                color: selectedIdx === i
                  ? 'var(--colors-greys-white, #ffffff)'
                  : 'var(--colors-greys-grey40, #555)',
                fontWeight: selectedIdx === i ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {inst.id || `Instans ${i + 1}`}
            </button>
          ))}
        </div>
      )}

      {instance && (
        <>
          <div
            style={{
              fontSize: '10px',
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              color: 'var(--colors-greys-grey50, #888)',
              fontWeight: 600,
              marginBottom: '8px',
            }}
          >
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
                    <DataCell>
                      <span style={{ fontFamily: 'monospace', color: 'var(--colors-greys-grey40, #555)' }}>
                        {a.value}
                      </span>
                    </DataCell>
                    <DataCell style={{ color: 'var(--colors-greys-grey50, #888)' }}>{a.kind}</DataCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div
            style={{
              fontSize: '10px',
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              color: 'var(--colors-greys-grey50, #888)',
              fontWeight: 600,
              marginBottom: '8px',
            }}
          >
            Rå XML
          </div>
          <pre
            style={{
              background: 'var(--colors-greys-grey90, #f8f8f8)',
              border: '1px solid var(--colors-greys-grey80, #e0e0e0)',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '11px',
              fontFamily: 'monospace',
              color: 'var(--colors-greys-grey40, #555)',
              overflowX: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}
          >
            {instance.rawXml}
          </pre>
        </>
      )}
    </div>
  )
}

export function AttributePanel({ element, allElements: _allElements, loadedFile }: AttributePanelProps) {
  const [activeTabIdx, setActiveTabIdx] = useState(0)
  const groupColour = GROUP_COLOURS[element.group] ?? '#555'
  const hasInstances = !!loadedFile?.instanceMap[element.name]?.length

  return (
    <div>
      {/* Header */}
      <div
        style={{
          padding: '16px 16px 12px',
          borderBottom: '1px solid var(--colors-greys-grey80, #e0e0e0)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
          <span
            style={{
              fontSize: '18px',
              fontWeight: 700,
              color: 'var(--colors-greys-grey10, #2a2a2a)',
            }}
          >
            {element.name}
          </span>
          <span
            style={{
              fontSize: '12px',
              padding: '2px 8px',
              borderRadius: '9999px',
              background: 'var(--colors-greys-grey90, #f8f8f8)',
              color: groupColour,
              border: '1px solid var(--colors-greys-grey80, #e0e0e0)',
            }}
          >
            {element.group}
          </span>
          {hasInstances && (
            <span
              style={{
                fontSize: '12px',
                color: 'var(--colors-brand-coral, #ff6c6c)',
                marginLeft: '4px',
              }}
            >
              {loadedFile!.instanceMap[element.name].length} instanser i filen
            </span>
          )}
        </div>
        {element.inheritedFrom.length > 0 && (
          <div
            style={{
              fontSize: '12px',
              color: 'var(--colors-greys-grey50, #888)',
            }}
          >
            Arver fra: {element.inheritedFrom.join(' → ')}
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
            <SchemaTab element={element} />
          </TabPanel>
          <TabPanel>
            {loadedFile && <InstanceTab element={element} loadedFile={loadedFile} />}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  )
}
