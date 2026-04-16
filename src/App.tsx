import { useState } from 'react'
import type { NeTExElement, LoadedFile, NeTExExample, ProfileData, ActiveProfile, StructureNode, ProfileStructure, NeTExEnums } from './types'
import elementsData from './data/netex-elements.json'
import examplesData from './data/netex-examples.json'
import enumsData from './data/netex-enums.json'
import frProfileData from './data/profiles/fr.json'
import nordicProfileData from './data/profiles/nordic.json'
import ukProfileData from './data/profiles/uk.json'
import frStructureData from './data/profiles/fr-structure.json'
import nordicStructureData from './data/profiles/nordic-structure.json'
import ukStructureData from './data/profiles/uk-structure.json'
import { SearchBar } from './components/SearchBar'
import { ElementTree } from './components/ElementTree'
import { AttributePanel } from './components/AttributePanel'
import { ExampleLoader } from './components/ExampleLoader'
import { ProfileStructureTree } from './components/ProfileStructureTree'
import { ProfileGuidePanel } from './components/ProfileGuidePanel'

const allElements = elementsData as NeTExElement[]
const allExamples = examplesData as NeTExExample[]
const allEnums = enumsData as NeTExEnums

const PROFILES: Record<string, ProfileData> = {
  fr: frProfileData as ProfileData,
  nordic: nordicProfileData as ProfileData,
  uk: ukProfileData as ProfileData,
}

const PROFILE_STRUCTURES: Record<string, ProfileStructure> = {
  fr: frStructureData as ProfileStructure,
  nordic: nordicStructureData as ProfileStructure,
  uk: ukStructureData as ProfileStructure,
}

function findPath(node: StructureNode, targetId: string, path: string[] = []): string[] | null {
  const current = [...path, node.label]
  if (node.id === targetId) return current
  for (const child of node.children) {
    const result = findPath(child, targetId, current)
    if (result) return result
  }
  return null
}

export default function App() {
  const [query, setQuery] = useState('')
  const [activeChip, setActiveChip] = useState<string | null>(null)
  const [selectedElement, setSelectedElement] = useState<NeTExElement | null>(null)
  const [loadedFile, setLoadedFile] = useState<LoadedFile | null>(null)
  const [activeProfile, setActiveProfile] = useState<ActiveProfile>(null)
  const [selectedNode, setSelectedNode] = useState<StructureNode | null>(null)

  const profileData = activeProfile ? PROFILES[activeProfile] : null
  const structureData = activeProfile ? PROFILE_STRUCTURES[activeProfile] : null

  function handleProfileChange(p: ActiveProfile) {
    setActiveProfile(p)
    setSelectedNode(null)
  }

  const selectedNodePath = selectedNode && structureData
    ? findPath(structureData.root, selectedNode.id) ?? []
    : []

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: 'var(--colors-greys-grey90, #f8f8f8)',
      color: 'var(--colors-greys-grey10, #2a2a2a)',
      overflow: 'hidden',
    }}>
      {/* Top bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '8px 16px',
        borderBottom: '2px solid var(--colors-brand-coral, #ff6c6c)',
        background: 'var(--colors-greys-white, #ffffff)',
        flexShrink: 0,
      }}>
        <span style={{
          fontWeight: 700,
          fontSize: '14px',
          whiteSpace: 'nowrap',
          marginRight: '4px',
          color: 'var(--colors-greys-grey10, #2a2a2a)',
        }}>
          NeTEx Part 3
        </span>

        {activeProfile ? (
          <span style={{ fontSize: '13px', color: 'var(--colors-greys-grey50, #888)', fontStyle: 'italic' }}>
            {activeProfile === 'nordic' 
              ? '🇳🇴 Nordisk profil — eksportstruktur' 
              : activeProfile === 'uk'
              ? '🇬🇧 Britisk profil — eksportstruktur'
              : '🇫🇷 Fransk profil — eksportstruktur'}
          </span>
        ) : (
          <SearchBar
            query={query}
            onQueryChange={setQuery}
            activeChip={activeChip}
            onChipChange={setActiveChip}
          />
        )}

        <div style={{ marginLeft: 'auto' }}>
          <ExampleLoader examples={allExamples} onFileLoaded={setLoadedFile} />
        </div>
      </div>

      {/* Main area */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left panel */}
        <div style={{
          width: '260px',
          flexShrink: 0,
          borderRight: '1px solid var(--colors-greys-grey80, #e0e0e0)',
          overflowY: 'auto',
          background: 'var(--colors-greys-grey90, #f8f8f8)',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {activeProfile && structureData ? (
            <ProfileStructureTree
              structure={structureData}
              profileData={profileData}
              selectedNode={selectedNode}
              onSelect={setSelectedNode}
              activeProfile={activeProfile}
              onProfileChange={handleProfileChange}
            />
          ) : (
            <ElementTree
              elements={allElements}
              query={query}
              activeChip={activeChip}
              selectedElement={selectedElement}
              loadedFile={loadedFile}
              onSelect={setSelectedElement}
              profileData={profileData}
              activeProfile={activeProfile}
              onProfileChange={handleProfileChange}
            />
          )}
        </div>

        {/* Right panel */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          background: 'var(--colors-greys-white, #ffffff)',
        }}>
          {activeProfile && selectedNode ? (
            <ProfileGuidePanel
              node={selectedNode}
              nodePath={selectedNodePath}
              allElements={allElements}
              profileData={profileData}
              activeProfile={activeProfile}
              onSelectElement={(el) => { setActiveProfile(null); setSelectedElement(el) }}
            />
          ) : activeProfile ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'var(--colors-greys-grey50, #888)',
              fontSize: '14px',
            }}>
              Velg et element i eksportstrukturen til venstre
            </div>
          ) : selectedElement ? (
            <AttributePanel
              element={selectedElement}
              allElements={allElements}
              loadedFile={loadedFile}
              profileData={profileData}
              activeProfile={activeProfile}
              onSelect={setSelectedElement}
              enumValues={allEnums}
            />
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'var(--colors-greys-grey50, #888)',
              fontSize: '14px',
            }}>
              Velg et element i treet til venstre
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
