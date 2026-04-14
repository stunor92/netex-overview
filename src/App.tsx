import { useState } from 'react'
import type { NeTExElement, LoadedFile } from './types'
import elementsData from './data/netex-elements.json'
import examplesData from './data/netex-examples.json'
import type { NeTExExample } from './types'
import { SearchBar } from './components/SearchBar'
import { ElementTree } from './components/ElementTree'
import { AttributePanel } from './components/AttributePanel'
import { ExampleLoader } from './components/ExampleLoader'

const allElements = elementsData as NeTExElement[]
const allExamples = examplesData as NeTExExample[]

export default function App() {
  const [query, setQuery] = useState('')
  const [activeGroup, setActiveGroup] = useState<string | null>(null)
  const [selectedElement, setSelectedElement] = useState<NeTExElement | null>(null)
  const [loadedFile, setLoadedFile] = useState<LoadedFile | null>(null)

  const groups = [...new Set(allElements.map((e) => e.group))].sort()

  return (
    <div className="flex flex-col h-screen bg-[#1e1e2e] text-[#cdd6f4] overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-[#313244] bg-[#181825] shrink-0">
        <SearchBar
          query={query}
          onQueryChange={setQuery}
          groups={groups}
          activeGroup={activeGroup}
          onGroupChange={setActiveGroup}
        />
        <div className="ml-auto">
          <ExampleLoader
            examples={allExamples}
            onFileLoaded={setLoadedFile}
          />
        </div>
      </div>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: tree */}
        <div className="w-[260px] shrink-0 border-r border-[#313244] overflow-y-auto">
          <ElementTree
            elements={allElements}
            query={query}
            activeGroup={activeGroup}
            selectedElement={selectedElement}
            loadedFile={loadedFile}
            onSelect={setSelectedElement}
          />
        </div>

        {/* Right: detail */}
        <div className="flex-1 overflow-y-auto">
          {selectedElement ? (
            <AttributePanel
              element={selectedElement}
              allElements={allElements}
              loadedFile={loadedFile}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-[#6c7086] text-sm">
              Velg et element i treet til venstre
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
