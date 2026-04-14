import { useState } from 'react'
import type { NeTExElement, LoadedFile, NeTExAttribute, NeTExInheritedAttribute } from '../types'

interface AttributePanelProps {
  element: NeTExElement
  allElements: NeTExElement[]
  loadedFile: LoadedFile | null
}

const KIND_COLOUR: Record<string, string> = {
  enum: '#fab387',
  ref: '#a6e3a1',
  list: '#89b4fa',
  complex: '#cba6f7',
  string: '#cdd6f4',
  boolean: '#f38ba8',
  integer: '#f38ba8',
  decimal: '#f38ba8',
}

const GROUP_COLOURS: Record<string, string> = {
  FareProduct: '#89b4fa',
  FarePrice: '#a6e3a1',
  SalesOfferPackage: '#fab387',
  FareStructureElement: '#f38ba8',
  UsageParameter: '#cba6f7',
}

function cardinality(attr: NeTExAttribute) {
  const max = attr.maxOccurs === 'unbounded' ? '∞' : attr.maxOccurs
  return `${attr.minOccurs}..${max}`
}

function AttrRow({ attr, dim = false }: { attr: NeTExAttribute | NeTExInheritedAttribute; dim?: boolean }) {
  const colour = KIND_COLOUR[attr.kind] ?? '#cdd6f4'
  return (
    <tr className={`border-b border-[#1e1e2e] ${dim ? 'opacity-60' : ''}`}>
      <td className="px-3 py-1.5 text-xs font-medium text-[#cdd6f4]">{attr.name}</td>
      <td className="px-3 py-1.5 text-xs font-mono" style={{ color: colour }}>{attr.kind}</td>
      <td className="px-3 py-1.5 text-xs text-center text-[#a6adc8]">{cardinality(attr)}</td>
      <td className="px-3 py-1.5 text-xs text-[#a6adc8]">{attr.description}</td>
    </tr>
  )
}

function SchemaTab({ element }: { element: NeTExElement }) {
  const [expandedAncestors, setExpandedAncestors] = useState<Set<string>>(new Set())

  function toggleAncestor(name: string) {
    setExpandedAncestors((prev) => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })
  }

  // Group inherited attrs by ancestor
  const byAncestor = new Map<string, NeTExInheritedAttribute[]>()
  for (const a of element.inheritedAttributes) {
    if (!byAncestor.has(a.inheritedFrom)) byAncestor.set(a.inheritedFrom, [])
    byAncestor.get(a.inheritedFrom)!.push(a)
  }

  return (
    <div>
      {element.description && (
        <p className="px-4 py-3 text-sm text-[#a6adc8] border-b border-[#313244]">
          {element.description}
        </p>
      )}

      {element.attributes.length > 0 && (
        <div className="px-4 pt-3">
          <div className="text-[10px] uppercase tracking-widest text-[#6c7086] mb-2">Egne attributter</div>
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-[#6c7086]">
                <th className="px-3 pb-2">Navn</th>
                <th className="px-3 pb-2">Type</th>
                <th className="px-3 pb-2 text-center">Kard.</th>
                <th className="px-3 pb-2">Beskrivelse</th>
              </tr>
            </thead>
            <tbody>
              {element.attributes.map((a) => <AttrRow key={a.name} attr={a} />)}
            </tbody>
          </table>
        </div>
      )}

      {byAncestor.size > 0 && (
        <div className="px-4 pt-4">
          {[...byAncestor.entries()].map(([ancestor, attrs]) => {
            const isOpen = expandedAncestors.has(ancestor)
            return (
              <div key={ancestor} className="mb-2">
                <button
                  onClick={() => toggleAncestor(ancestor)}
                  className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-[#6c7086] hover:text-[#a6adc8] mb-1"
                >
                  <span>{isOpen ? '▼' : '▶'}</span>
                  <span>Arvet fra {ancestor}</span>
                </button>
                {isOpen && (
                  <table className="w-full text-left">
                    <tbody>
                      {attrs.map((a) => <AttrRow key={a.name} attr={a} dim />)}
                    </tbody>
                  </table>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function AttributePanel({ element, allElements: _allElements, loadedFile }: AttributePanelProps) {
  const [activeTab, setActiveTab] = useState<'schema' | 'instance'>('schema')
  const groupColour = GROUP_COLOURS[element.group] ?? '#cdd6f4'
  const hasInstances = !!loadedFile?.instanceMap[element.name]?.length

  return (
    <div>
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-[#313244]">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-lg font-bold text-[#cdd6f4]">{element.name}</span>
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ backgroundColor: '#313244', color: groupColour }}
          >
            {element.group}
          </span>
          {hasInstances && (
            <span className="text-xs text-[#a6e3a1] ml-1">
              {loadedFile!.instanceMap[element.name].length} instanser i filen
            </span>
          )}
        </div>
        {element.inheritedFrom.length > 0 && (
          <div className="text-xs text-[#6c7086]">
            Arver fra: {element.inheritedFrom.join(' → ')}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#313244]">
        {(['schema', 'instance'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            disabled={tab === 'instance' && !loadedFile}
            className={`px-4 py-2 text-sm transition-colors ${
              activeTab === tab
                ? 'text-[#cdd6f4] border-b-2 border-[#89b4fa]'
                : 'text-[#6c7086] hover:text-[#a6adc8]'
            } disabled:opacity-30 disabled:cursor-not-allowed`}
          >
            {tab === 'schema' ? 'Skjema' : 'XML-instans'}
          </button>
        ))}
      </div>

      {activeTab === 'schema' && <SchemaTab element={element} />}
      {activeTab === 'instance' && loadedFile && (
        <div className="px-4 py-4 text-sm text-[#6c7086]">Instance view — implementert i Task 12</div>
      )}
    </div>
  )
}
