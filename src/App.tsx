import { useState } from 'react'
import type { NeTExElement, LoadedFile, NeTExExample, ProfileData, ActiveProfile } from './types'
import elementsData from './data/netex-elements.json'
import examplesData from './data/netex-examples.json'
import frProfileData from './data/profiles/fr.json'
import nordicProfileData from './data/profiles/nordic.json'
import { SearchBar } from './components/SearchBar'
import { ElementTree } from './components/ElementTree'
import { AttributePanel } from './components/AttributePanel'
import { ExampleLoader } from './components/ExampleLoader'

const allElements = elementsData as NeTExElement[]
const allExamples = examplesData as NeTExExample[]

const PROFILES: Record<string, ProfileData> = {
  fr: frProfileData as ProfileData,
  nordic: nordicProfileData as ProfileData,
}

export default function App() {
  const [query, setQuery] = useState('')
  const [activeChip, setActiveChip] = useState<string | null>(null)
  const [selectedElement, setSelectedElement] = useState<NeTExElement | null>(null)
  const [loadedFile, setLoadedFile] = useState<LoadedFile | null>(null)
  const [activeProfile, setActiveProfile] = useState<ActiveProfile>(null)

  const profileData = activeProfile ? PROFILES[activeProfile] : null

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
        <SearchBar
          query={query}
          onQueryChange={setQuery}
          activeChip={activeChip}
          onChipChange={setActiveChip}
        />
        <div style={{ marginLeft: 'auto' }}>
          <ExampleLoader examples={allExamples} onFileLoaded={setLoadedFile} />
        </div>
      </div>

      {/* Main area */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left: tree */}
        <div style={{
          width: '260px',
          flexShrink: 0,
          borderRight: '1px solid var(--colors-greys-grey80, #e0e0e0)',
          overflowY: 'auto',
          background: 'var(--colors-greys-grey90, #f8f8f8)',
        }}>
          <ElementTree
            elements={allElements}
            query={query}
            activeChip={activeChip}
            selectedElement={selectedElement}
            loadedFile={loadedFile}
            onSelect={setSelectedElement}
            profileData={profileData}
            activeProfile={activeProfile}
            onProfileChange={setActiveProfile}
          />
        </div>

        {/* Right: detail */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          background: 'var(--colors-greys-white, #ffffff)',
        }}>
          {selectedElement ? (
            <AttributePanel
              element={selectedElement}
              allElements={allElements}
              loadedFile={loadedFile}
              profileData={profileData}
              activeProfile={activeProfile}
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
