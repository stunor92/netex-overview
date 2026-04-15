import { useState, useEffect, useMemo } from 'react'
import { Tabs, TabList, Tab, TabPanels, TabPanel } from '@entur/tab'
import type { StructureNode, NeTExElement, ProfileData, ActiveProfile, ProfileStatus } from '../types'
import { SchemaTab } from './AttributePanel'

const BADGE_CONFIG: Record<ProfileStatus, { bg: string; color: string; label: string; fw?: number }> = {
  required:          { bg: '#e8f5e9', color: '#2e7d32', label: '✓ påkrevd',       fw: 600 },
  optional:          { bg: '#e3f2fd', color: '#1565c0', label: '~ valgfri',        fw: 600 },
  'not-in-profile':  { bg: '#f5f5f5', color: '#aaa',    label: '✕ ikke i profil'         },
}

function StatusBadge({ status }: { status: ProfileStatus }) {
  const { bg, color, label, fw } = BADGE_CONFIG[status]
  return (
    <span style={{ background: bg, color, fontSize: '11px', padding: '2px 10px', borderRadius: '12px', fontWeight: fw }}>
      {label}
    </span>
  )
}

export interface ProfileGuidePanelProps {
  node: StructureNode
  nodePath: string[]
  allElements: NeTExElement[]
  profileData: ProfileData | null
  activeProfile: ActiveProfile
}

export function ProfileGuidePanel({ node, nodePath, allElements, profileData, activeProfile }: ProfileGuidePanelProps) {
  const [activeTabIdx, setActiveTabIdx] = useState(0)

  useEffect(() => {
    setActiveTabIdx(0)
  }, [node.id])

  const element = useMemo(
    () => node.elementRef ? allElements.find((e) => e.name === node.elementRef) ?? null : null,
    [node.elementRef, allElements],
  )
  const elementProfile = node.elementRef ? profileData?.[node.elementRef] : undefined
  const isElement = node.type === 'element'
  const tabCount = isElement ? 3 : 2
  const safeTabIdx = Math.min(activeTabIdx, tabCount - 1)
  const breadcrumb = nodePath.slice(0, -1).join(' → ')

  const nodeTypeLabel =
    node.type === 'container' ? 'ramme' :
    node.type === 'collection' ? 'liste' :
    'element'

  return (
    <div>
      {/* Header */}
      <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--colors-greys-grey80, #e0e0e0)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--colors-greys-grey10, #2a2a2a)' }}>
            {node.label}
          </span>
          <span style={{ fontSize: '11px', color: '#aaa', fontStyle: 'italic' }}>
            {nodeTypeLabel}
          </span>
          {elementProfile?.status && (
            <StatusBadge status={elementProfile.status} />
          )}
        </div>
        {breadcrumb && (
          <div style={{ fontSize: '11px', color: 'var(--colors-greys-grey50, #888)' }}>
            {breadcrumb} → <strong>{node.label}</strong>
          </div>
        )}
      </div>

      {/* Tabs — outside the header div */}
      <Tabs index={safeTabIdx} onChange={setActiveTabIdx}>
        <TabList>
          <Tab>Beskrivelse</Tab>
          <Tab>XML-mal</Tab>
          {isElement && <Tab>Skjema</Tab>}
        </TabList>
        <TabPanels>
          {/* Tab 1: Beskrivelse */}
          <TabPanel>
            <div style={{ padding: '16px' }}>
              {node.description && (
                <p style={{ fontSize: '13px', lineHeight: 1.7, color: 'var(--colors-greys-grey40, #555)', marginBottom: '16px', marginTop: 0 }}>
                  {node.description}
                </p>
              )}

              {isElement && elementProfile && element && (
                <>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#aaa', fontWeight: 600, marginBottom: '8px' }}>
                    Attributter i profil
                  </div>
                  {Object.keys(elementProfile.attributes).length > 0 ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <tbody>
                        {[...element.attributes, ...element.inheritedAttributes].map((attr) => {
                          const attrStatus = elementProfile.attributes[attr.name]
                          if (!attrStatus) return null
                          const { bg, color, label, fw } = BADGE_CONFIG[attrStatus]
                          return (
                            <tr key={attr.name} style={{ borderBottom: '1px solid #f0f0f0', opacity: attrStatus === 'not-in-profile' ? 0.4 : 1 }}>
                              <td style={{ padding: '5px 8px', fontWeight: 500, textDecoration: attrStatus === 'not-in-profile' ? 'line-through' : 'none' }}>
                                {attr.name}
                              </td>
                              <td style={{ padding: '5px 8px' }}>
                                <span style={{ background: bg, color, fontSize: '9px', padding: '1px 6px', borderRadius: '6px', fontWeight: fw, whiteSpace: 'nowrap' }}>
                                  {label}
                                </span>
                              </td>
                              <td style={{ padding: '5px 8px', fontSize: '11px', color: '#888' }}>
                                {attr.description}
                              </td>
                            </tr>
                          )
                        }).filter(Boolean)}
                      </tbody>
                    </table>
                  ) : (
                    <p style={{ fontSize: '12px', color: '#aaa', fontStyle: 'italic' }}>
                      Ingen attributter spesifisert for dette elementet i profilen.
                    </p>
                  )}
                </>
              )}
            </div>
          </TabPanel>

          {/* Tab 2: XML-mal */}
          <TabPanel>
            <div style={{ padding: '16px' }}>
              <pre style={{
                background: '#1e1e2e',
                borderRadius: '8px',
                padding: '14px 16px',
                fontFamily: 'monospace',
                fontSize: '12px',
                lineHeight: 1.7,
                color: '#cdd6f4',
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                margin: 0,
              }}>
                {node.xmlSnippet}
              </pre>
            </div>
          </TabPanel>

          {/* Tab 3: Skjema (element nodes only) */}
          {isElement && (
            <TabPanel>
              {element ? (
                <SchemaTab element={element} profileData={profileData} activeProfile={activeProfile} />
              ) : (
                <div style={{ padding: '24px 16px', fontSize: '14px', color: '#888' }}>
                  Fant ikke skjemainfo for {node.label}.
                </div>
              )}
            </TabPanel>
          )}
        </TabPanels>
      </Tabs>
    </div>
  )
}
