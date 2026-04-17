import { useState, useEffect } from 'react'
import type { NeTExElement, LoadedFile, NeTExExample, ProfileData, ActiveProfile, StructureNode, ProfileStructure, NeTExEnums, VersionManifest, VersionData } from './types'
import { PARTS } from './constants'
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

function PartDescriptionCard({ activePart, allElements }: { activePart: 1 | 2 | 3; allElements: NeTExElement[] }) {
  const partDef = PARTS.find((p) => p.key === activePart)
  if (!partDef) return null
  const count = allElements.filter(
    (el) => el.part === activePart && (el.attributes.length > 0 || el.inheritedAttributes.length > 0)
  ).length
  return (
    <div style={{ padding: '48px 32px', maxWidth: '480px' }}>
      <div style={{ fontSize: '22px', fontWeight: 700, marginBottom: '12px', color: 'var(--colors-greys-grey10, #2a2a2a)' }}>
        {partDef.label}
      </div>
      <div style={{ fontSize: '14px', color: 'var(--colors-greys-grey40, #555)', marginBottom: '16px', lineHeight: 1.6 }}>
        {partDef.description}
      </div>
      <div style={{ fontSize: '12px', color: 'var(--colors-greys-grey50, #888)' }}>
        {count} elementer tilgjengelig
      </div>
    </div>
  )
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
  const [activePart, setActivePart] = useState<1 | 2 | 3 | null>(null)
  const [selectedElement, setSelectedElement] = useState<NeTExElement | null>(null)
  const [loadedFile, setLoadedFile] = useState<LoadedFile | null>(null)
  const [activeProfile, setActiveProfile] = useState<ActiveProfile>(null)
  const [selectedNode, setSelectedNode] = useState<StructureNode | null>(null)
  const [netexVersion, setNetexVersion] = useState<string>('v2.0')
  const [availableVersions, setAvailableVersions] = useState<string[]>(['v2.0'])
  const [versionData, setVersionData] = useState<{ elements: NeTExElement[], enums: NeTExEnums, examples: NeTExExample[] }>({
    elements: allElements,
    enums: allEnums,
    examples: allExamples,
  })
  const [isLoadingVersion, setIsLoadingVersion] = useState(false)

  // Load versions manifest on mount
  useEffect(() => {
    async function loadManifest() {
      try {
        const response = await fetch('/src/data/versions-manifest.json')
        const manifest: VersionManifest = await response.json()
        const versions = manifest.versions
          .filter(v => !v.error)
          .map(v => v.version)
        setAvailableVersions(versions)
      } catch (err) {
        console.warn('Failed to load versions manifest:', err)
        // Fallback to default version
      }
    }
    loadManifest()
  }, [])

  // Load version data when version changes
  useEffect(() => {
    async function loadVersionData() {
      if (netexVersion === 'v2.0' && versionData.elements === allElements) {
        // Already have default data loaded
        return
      }
      
      setIsLoadingVersion(true)
      try {
        const response = await fetch(`/src/data/versions/netex-${netexVersion}.json`)
        const data: VersionData = await response.json()
        setVersionData({
          elements: data.elements,
          enums: data.enums,
          examples: data.examples,
        })
      } catch (err) {
        console.error(`Failed to load version ${netexVersion}:`, err)
        // Fallback to default data
        setVersionData({
          elements: allElements,
          enums: allEnums,
          examples: allExamples,
        })
      } finally {
        setIsLoadingVersion(false)
      }
    }
    loadVersionData()
  }, [netexVersion])

  const profileData = activeProfile ? PROFILES[activeProfile] : null
  const structureData = activeProfile ? PROFILE_STRUCTURES[activeProfile] : null

  function handleProfileChange(p: ActiveProfile) {
    setActiveProfile(p)
    setSelectedNode(null)
  }

  function handleVersionChange(newVersion: string) {
    setNetexVersion(newVersion)
    // Reset selections when changing version
    setSelectedElement(null)
    setActivePart(null)
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
          NeTEx-utforsker
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
            activePart={activePart}
            onPartChange={(p) => { setActivePart(p); setSelectedElement(null) }}
          />
        )}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="var(--colors-greys-grey50, #888)" aria-hidden="true">
              <path d="M11.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 113 2.122V6A2.5 2.5 0 0110 8.5H6a1 1 0 00-1 1v1.128a2.251 2.251 0 11-1.5 0V5.372a2.25 2.25 0 111.5 0v1.836A2.492 2.492 0 016 7h4a1 1 0 001-1v-.628A2.25 2.25 0 019.5 3.25zM4.25 12a.75.75 0 100 1.5.75.75 0 000-1.5zM3.5 3.25a.75.75 0 111.5 0 .75.75 0 01-1.5 0z"/>
            </svg>
            <label htmlFor="version-select" style={{ fontSize: '12px', color: 'var(--colors-greys-grey50, #888)', whiteSpace: 'nowrap' }}>
              Versjon:
            </label>
            <select
              id="version-select"
              value={netexVersion}
              onChange={(e) => handleVersionChange(e.target.value)}
              disabled={isLoadingVersion}
              style={{ 
                fontSize: '12px', 
                padding: '6px 24px 6px 8px',
                minWidth: '140px',
                border: '1px solid var(--colors-greys-grey70, #ccc)',
                borderRadius: '4px',
                backgroundColor: isLoadingVersion ? 'var(--colors-greys-grey90, #f8f8f8)' : 'var(--colors-greys-white, #fff)',
                cursor: isLoadingVersion ? 'wait' : 'pointer',
                outline: 'none',
                opacity: isLoadingVersion ? 0.6 : 1,
              }}
            >
              {availableVersions.map((v) => (
                <option key={v} value={v}>
                  {v === 'v2.0' ? `${v} (stable)` : v}
                </option>
              ))}
            </select>
            {isLoadingVersion && (
              <span style={{ fontSize: '11px', color: 'var(--colors-greys-grey50, #888)' }}>
                Laster...
              </span>
            )}
          </div>
          <ExampleLoader examples={versionData.examples} onFileLoaded={setLoadedFile} />
          <a
            href="https://github.com/NeTEx-CEN/NeTEx"
            target="_blank"
            rel="noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--colors-greys-grey50, #888)', textDecoration: 'none', whiteSpace: 'nowrap' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="15" height="15" fill="currentColor" aria-hidden="true">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
            NeTEx-CEN/NeTEx
          </a>
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
              elements={versionData.elements}
              activePart={activePart}
              selectedElement={selectedElement}
              loadedFile={loadedFile}
              onSelect={setSelectedElement}
              profileData={profileData}
              activeProfile={activeProfile}
              onProfileChange={handleProfileChange}
              enumValues={versionData.enums}
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
              allElements={versionData.elements}
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
              allElements={versionData.elements}
              loadedFile={loadedFile}
              profileData={profileData}
              activeProfile={activeProfile}
              onSelect={setSelectedElement}
              enumValues={versionData.enums}
            />
          ) : activePart ? (
            <PartDescriptionCard activePart={activePart} allElements={versionData.elements} />
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
