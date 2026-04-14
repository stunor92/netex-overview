import { useState, useMemo } from 'react'
import type { NeTExElement, LoadedFile } from '../types'

const GROUP_COLOURS: Record<string, string> = {
  FareProduct: '#89b4fa',
  FarePrice: '#a6e3a1',
  SalesOfferPackage: '#fab387',
  FareStructureElement: '#f38ba8',
  UsageParameter: '#cba6f7',
}

interface ElementTreeProps {
  elements: NeTExElement[]
  query: string
  activeGroup: string | null
  selectedElement: NeTExElement | null
  loadedFile: LoadedFile | null
  onSelect: (el: NeTExElement) => void
}

export function ElementTree({ elements, query, activeGroup, selectedElement, loadedFile, onSelect }: ElementTreeProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => new Set())

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

  // Auto-expand groups that have matches when searching
  useMemo(() => {
    if (query) {
      setExpandedGroups(new Set(byGroup.keys()))
    }
  }, [query, byGroup])

  function toggleGroup(group: string) {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      next.has(group) ? next.delete(group) : next.add(group)
      return next
    })
  }

  const groups = [...byGroup.keys()].sort()

  if (groups.length === 0) {
    return <div className="px-3 py-4 text-xs text-[#6c7086]">Ingen elementer funnet</div>
  }

  return (
    <div className="py-2">
      <div className="px-3 pb-2 text-[10px] uppercase tracking-widest text-[#6c7086]">Elementer</div>
      {groups.map((group) => {
        const colour = GROUP_COLOURS[group] ?? '#cdd6f4'
        const isExpanded = expandedGroups.has(group)
        const children = byGroup.get(group)!
        return (
          <div key={group}>
            <button
              onClick={() => toggleGroup(group)}
              className="w-full flex items-center gap-1.5 px-3 py-1 text-xs font-semibold hover:bg-[#313244] transition-colors"
              style={{ color: colour }}
            >
              <span>{isExpanded ? '▼' : '▶'}</span>
              <span>{group}</span>
              <span className="ml-auto text-[#6c7086] font-normal">{children.length}</span>
            </button>
            {isExpanded && children.map((el) => {
              const count = loadedFile?.instanceMap[el.name]?.length ?? 0
              const isSelected = selectedElement?.name === el.name
              return (
                <button
                  key={el.name}
                  onClick={() => onSelect(el)}
                  className={`w-full flex items-center justify-between px-3 py-1 pl-6 text-xs transition-colors ${
                    isSelected
                      ? 'bg-[#313244] border-l-2 text-[#cdd6f4]'
                      : 'text-[#a6adc8] hover:bg-[#313244] hover:text-[#cdd6f4] border-l-2 border-transparent'
                  }`}
                  style={isSelected ? { borderLeftColor: colour } : {}}
                >
                  <span className="truncate">● {el.name}</span>
                  {count > 0 && (
                    <span className="ml-1 shrink-0 px-1.5 py-0 text-[10px] bg-[#1e3a2f] text-[#a6e3a1] rounded-full">
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
