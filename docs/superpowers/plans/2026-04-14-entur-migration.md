# Entur Design System Migration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the NeTEx Part 3 overview app from Tailwind CSS v4 to the Entur design system, adopting the standard light theme.

**Architecture:** Remove Tailwind entirely. Install `@entur/*` packages, import their CSS globally, then rewrite each component to use Entur components (`TextField`, `FilterChip`, `Tab`, `Table`, `ExpandablePanel`, `Modal`, `SecondaryButton`) and `@entur/tokens` CSS variables for layout colors.

**Tech Stack:** Vite, React 18, TypeScript, @entur/tokens, @entur/form, @entur/chip, @entur/button, @entur/tab, @entur/table, @entur/expand, @entur/modal, @entur/typography

---

## File Map

| File | Change |
|---|---|
| `package.json` | Add `@entur/*` packages, remove `tailwindcss` + `@tailwindcss/vite` |
| `vite.config.ts` | Remove `tailwindcss()` plugin |
| `src/index.css` | Replace Tailwind import with Entur CSS imports |
| `src/App.tsx` | Replace Tailwind classes with inline styles using `@entur/tokens` CSS vars |
| `src/components/SearchBar.tsx` | `TextField` + `FilterChip` |
| `src/components/ElementTree.tsx` | Token-based inline styles (no Entur tree component exists) |
| `src/components/AttributePanel.tsx` | `Tabs`/`Tab`, `Table`, `ExpandablePanel` |
| `src/components/ExampleLoader.tsx` | `SecondaryButton`, `PrimaryButton`, `TertiaryButton`, `Modal` |

---

## Task 1: Install Entur packages, remove Tailwind

**Files:**
- Modify: `package.json`
- Modify: `vite.config.ts`
- Modify: `src/index.css`

- [ ] **Step 1: Install Entur packages and remove Tailwind**

```bash
cd /Users/stunor/WebstormProjects/netex-overview
npm install @entur/tokens @entur/form @entur/chip @entur/button @entur/tab @entur/table @entur/expand @entur/modal @entur/typography
npm uninstall tailwindcss @tailwindcss/vite
```

- [ ] **Step 2: Update `vite.config.ts` — remove Tailwind plugin**

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
  },
})
```

- [ ] **Step 3: Replace `src/index.css` with Entur CSS imports**

```css
@import '@entur/tokens/dist/styles.css';
@import '@entur/typography/dist/styles.css';
@import '@entur/form/dist/styles.css';
@import '@entur/chip/dist/styles.css';
@import '@entur/button/dist/styles.css';
@import '@entur/tab/dist/styles.css';
@import '@entur/table/dist/styles.css';
@import '@entur/expand/dist/styles.css';
@import '@entur/modal/dist/styles.css';

*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: var(--typography-font-family, system-ui, sans-serif);
  background: var(--colors-greys-grey05, #f8f8f8);
  color: var(--colors-greys-grey90, #1a1a1a);
}

/* Visually hide the TextField label when used inline in a compact bar */
.search-label-hidden label {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
```

- [ ] **Step 4: Verify the app still compiles**

```bash
npx tsc --noEmit
```

Expected: TypeScript errors related to missing Tailwind types are acceptable here. Component type errors will be fixed in later tasks. What must NOT appear: import errors for `@entur/` packages.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vite.config.ts src/index.css
git commit -m "feat: install Entur design system, remove Tailwind"
```

---

## Task 2: App layout shell

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Replace `src/App.tsx`**

```typescript
import { useState } from 'react'
import type { NeTExElement, LoadedFile, NeTExExample } from './types'
import elementsData from './data/netex-elements.json'
import examplesData from './data/netex-examples.json'
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
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: 'var(--colors-greys-grey05, #f8f8f8)',
      color: 'var(--colors-greys-grey90, #1a1a1a)',
      overflow: 'hidden',
    }}>
      {/* Top bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '8px 16px',
        borderBottom: '3px solid var(--colors-brand-coral, #ff6c6c)',
        background: 'var(--colors-greys-white, #ffffff)',
        flexShrink: 0,
      }}>
        <span style={{
          fontWeight: 700,
          fontSize: '14px',
          whiteSpace: 'nowrap',
          marginRight: '4px',
          color: 'var(--colors-greys-grey90, #1a1a1a)',
        }}>
          NeTEx Part 3
        </span>
        <SearchBar
          query={query}
          onQueryChange={setQuery}
          groups={groups}
          activeGroup={activeGroup}
          onGroupChange={setActiveGroup}
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
          borderRight: '1px solid var(--colors-greys-grey20, #e0e0e0)',
          overflowY: 'auto',
          background: 'var(--colors-greys-grey05, #f8f8f8)',
        }}>
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
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No errors in `App.tsx`. Errors in other components are fine — they will be fixed in later tasks.

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: migrate App layout shell to Entur tokens"
```

---

## Task 3: SearchBar

**Files:**
- Modify: `src/components/SearchBar.tsx`

- [ ] **Step 1: Replace `src/components/SearchBar.tsx`**

```typescript
import { TextField } from '@entur/form'
import { FilterChip } from '@entur/chip'

interface SearchBarProps {
  query: string
  onQueryChange: (q: string) => void
  groups: string[]
  activeGroup: string | null
  onGroupChange: (g: string | null) => void
}

export function SearchBar({ query, onQueryChange, groups, activeGroup, onGroupChange }: SearchBarProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
      <div className="search-label-hidden" style={{ width: '200px', flexShrink: 0 }}>
        <TextField
          label="Søk etter element"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Søk etter element..."
          clearable
          onClear={() => onQueryChange('')}
        />
      </div>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
        <FilterChip
          value="alle"
          checked={activeGroup === null}
          onChange={() => onGroupChange(null)}
        >
          Alle
        </FilterChip>
        {groups.map((g) => (
          <FilterChip
            key={g}
            value={g}
            checked={activeGroup === g}
            onChange={(e) => onGroupChange(e.target.checked ? g : null)}
          >
            {g}
          </FilterChip>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep SearchBar
```

Expected: No errors for SearchBar.tsx.

- [ ] **Step 3: Commit**

```bash
git add src/components/SearchBar.tsx
git commit -m "feat: migrate SearchBar to TextField and FilterChip"
```

---

## Task 4: ElementTree

**Files:**
- Modify: `src/components/ElementTree.tsx`

- [ ] **Step 1: Replace `src/components/ElementTree.tsx`**

```typescript
import { useState, useMemo } from 'react'
import type { NeTExElement, LoadedFile } from '../types'

const GROUP_COLOURS: Record<string, string> = {
  FareProduct: '#ff6c6c',
  FarePrice: '#181c56',
  SalesOfferPackage: '#e07b00',
  FareStructureElement: '#c0392b',
  UsageParameter: '#6a1b9a',
  TimeStructureFactor: '#1565c0',
  FareSeries: '#00695c',
  FareTable: '#4527a0',
  GeographicStructureFactor: '#558b2f',
  QualityStructureFactor: '#1565c0',
  DistanceMatrixElement: '#6d4c41',
  FareZone: '#283593',
  Tariff: '#37474f',
  PricingRule: '#ad1457',
  DistributionChannel: '#00838f',
  FulfilmentMethod: '#2e7d32',
  TypeOfTravelDocument: '#4e342e',
  ValidableElement: '#880e4f',
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

  useMemo(() => {
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

  if (groups.length === 0) {
    return (
      <div style={{ padding: '16px 12px', fontSize: '12px', color: 'var(--colors-greys-grey50, #888)' }}>
        Ingen elementer funnet
      </div>
    )
  }

  return (
    <div style={{ paddingTop: '8px', paddingBottom: '8px' }}>
      <div style={{
        padding: '0 12px 8px',
        fontSize: '10px',
        textTransform: 'uppercase',
        letterSpacing: '1.5px',
        color: 'var(--colors-greys-grey50, #888)',
        fontWeight: 600,
      }}>
        Elementer
      </div>

      {groups.map((group) => {
        const colour = GROUP_COLOURS[group] ?? '#555'
        const isExpanded = expandedGroups.has(group)
        const children = byGroup.get(group)!

        return (
          <div key={group}>
            {/* Group header */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => toggleGroup(group)}
              onKeyDown={(e) => e.key === 'Enter' && toggleGroup(group)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                color: colour,
                userSelect: 'none',
              }}
            >
              <span style={{ fontSize: '9px', color: 'var(--colors-greys-grey50, #aaa)' }}>
                {isExpanded ? '▼' : '▶'}
              </span>
              <span>{group}</span>
              <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--colors-greys-grey50, #aaa)', fontWeight: 400 }}>
                {children.length}
              </span>
            </div>

            {/* Element items */}
            {isExpanded && children.map((el) => {
              const count = loadedFile?.instanceMap[el.name]?.length ?? 0
              const isSelected = selectedElement?.name === el.name
              return (
                <button
                  key={el.name}
                  onClick={() => onSelect(el)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    padding: '5px 12px 5px 28px',
                    fontSize: '12px',
                    textAlign: 'left',
                    border: 'none',
                    borderLeft: `3px solid ${isSelected ? colour : 'transparent'}`,
                    background: isSelected ? 'var(--colors-greys-grey10, #f0f0f0)' : 'transparent',
                    color: isSelected ? 'var(--colors-greys-grey90, #1a1a1a)' : 'var(--colors-greys-grey70, #555)',
                    cursor: 'pointer',
                    fontWeight: isSelected ? 500 : 400,
                    gap: '6px',
                  }}
                >
                  <span style={{ fontSize: '8px', color: colour }}>●</span>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {el.name}
                  </span>
                  {count > 0 && (
                    <span style={{
                      flexShrink: 0,
                      padding: '0 6px',
                      fontSize: '10px',
                      background: 'var(--colors-validation-success-bg, #e8f5e9)',
                      color: 'var(--colors-validation-success, #2e7d32)',
                      borderRadius: '10px',
                      fontWeight: 600,
                    }}>
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
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep ElementTree
```

Expected: No errors for ElementTree.tsx.

- [ ] **Step 3: Commit**

```bash
git add src/components/ElementTree.tsx
git commit -m "feat: migrate ElementTree to Entur tokens"
```

---

## Task 5: AttributePanel

**Files:**
- Modify: `src/components/AttributePanel.tsx`

- [ ] **Step 1: Replace `src/components/AttributePanel.tsx`**

```typescript
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

function cardinality(attr: NeTExAttribute) {
  const max = attr.maxOccurs === 'unbounded' ? '∞' : attr.maxOccurs
  return `${attr.minOccurs}..${max}`
}

function AttrRows({ attrs, dim = false }: { attrs: (NeTExAttribute | NeTExInheritedAttribute)[]; dim?: boolean }) {
  return (
    <>
      {attrs.map((attr) => (
        <TableRow key={attr.name} style={dim ? { opacity: 0.6 } : {}}>
          <DataCell>
            <span style={{ fontWeight: 500, color: 'var(--colors-greys-grey90, #1a1a1a)' }}>{attr.name}</span>
          </DataCell>
          <DataCell>
            <span style={{ fontFamily: 'monospace', fontSize: '12px', color: KIND_COLOUR[attr.kind] ?? '#555' }}>
              {attr.kind}
            </span>
          </DataCell>
          <DataCell style={{ textAlign: 'center' }}>
            <span style={{ color: 'var(--colors-greys-grey50, #888)' }}>{cardinality(attr)}</span>
          </DataCell>
          <DataCell>
            <span style={{ color: 'var(--colors-greys-grey70, #555)', fontSize: '12px' }}>{attr.description}</span>
          </DataCell>
        </TableRow>
      ))}
    </>
  )
}

function SchemaTab({ element }: { element: NeTExElement }) {
  const byAncestor = new Map<string, NeTExInheritedAttribute[]>()
  for (const a of element.inheritedAttributes) {
    if (!byAncestor.has(a.inheritedFrom)) byAncestor.set(a.inheritedFrom, [])
    byAncestor.get(a.inheritedFrom)!.push(a)
  }

  return (
    <div style={{ padding: '16px 20px' }}>
      {element.description && (
        <p style={{
          fontSize: '13px',
          color: 'var(--colors-greys-grey70, #555)',
          lineHeight: 1.6,
          borderLeft: '3px solid var(--colors-brand-coral, #ff6c6c)',
          paddingLeft: '12px',
          marginBottom: '16px',
          background: 'var(--colors-greys-grey05, #fafafa)',
          padding: '10px 12px',
          borderRadius: '0 4px 4px 0',
        }}>
          {element.description}
        </p>
      )}

      {element.attributes.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{
            fontSize: '10px',
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            color: 'var(--colors-greys-grey50, #888)',
            fontWeight: 600,
            marginBottom: '8px',
          }}>
            Egne attributter
          </div>
          <Table spacing="small">
            <TableHead>
              <TableRow>
                <HeaderCell>Navn</HeaderCell>
                <HeaderCell>Type</HeaderCell>
                <HeaderCell style={{ textAlign: 'center' }}>Kard.</HeaderCell>
                <HeaderCell>Beskrivelse</HeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <AttrRows attrs={element.attributes} />
            </TableBody>
          </Table>
        </div>
      )}

      {[...byAncestor.entries()].map(([ancestor, attrs]) => (
        <ExpandablePanel key={ancestor} title={`Arvet fra ${ancestor}`} style={{ marginBottom: '8px' }}>
          <Table spacing="small">
            <TableBody>
              <AttrRows attrs={attrs} dim />
            </TableBody>
          </Table>
        </ExpandablePanel>
      ))}
    </div>
  )
}

function InstanceTab({ element, loadedFile }: { element: NeTExElement; loadedFile: LoadedFile }) {
  const instances = loadedFile.instanceMap[element.name] ?? []
  const [selectedIdx, setSelectedIdx] = useState(0)
  const instance = instances[selectedIdx]

  if (instances.length === 0) {
    return (
      <div style={{ padding: '24px 20px', fontSize: '13px', color: 'var(--colors-greys-grey50, #888)' }}>
        Ingen instanser av {element.name} funnet i {loadedFile.filename}
      </div>
    )
  }

  return (
    <div style={{ padding: '16px 20px' }}>
      {instances.length > 1 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
          {instances.map((inst, i) => (
            <button
              key={i}
              onClick={() => setSelectedIdx(i)}
              style={{
                fontSize: '12px',
                padding: '4px 12px',
                borderRadius: '16px',
                border: `1px solid ${selectedIdx === i ? 'var(--colors-brand-coral, #ff6c6c)' : 'var(--colors-greys-grey20, #ddd)'}`,
                background: selectedIdx === i ? 'var(--colors-brand-coral, #ff6c6c)' : 'transparent',
                color: selectedIdx === i ? '#fff' : 'var(--colors-greys-grey70, #555)',
                cursor: 'pointer',
                fontWeight: selectedIdx === i ? 600 : 400,
              }}
            >
              {inst.id || `Instans ${i + 1}`}
            </button>
          ))}
        </div>
      )}

      {instance && (
        <>
          <div style={{
            fontSize: '10px',
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            color: 'var(--colors-greys-grey50, #888)',
            fontWeight: 600,
            marginBottom: '8px',
          }}>
            Attributtverdier
          </div>
          <Table spacing="small" style={{ marginBottom: '20px' }}>
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
                  <DataCell><span style={{ fontWeight: 500 }}>{a.name}</span></DataCell>
                  <DataCell><span style={{ fontFamily: 'monospace', color: 'var(--colors-validation-success, #2e7d32)' }}>{a.value}</span></DataCell>
                  <DataCell><span style={{ color: 'var(--colors-greys-grey50, #888)' }}>{a.kind}</span></DataCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div style={{
            fontSize: '10px',
            textTransform: 'uppercase',
            letterSpacing: '1.5px',
            color: 'var(--colors-greys-grey50, #888)',
            fontWeight: 600,
            marginBottom: '8px',
          }}>
            Rå XML
          </div>
          <pre style={{
            background: 'var(--colors-greys-grey05, #f8f8f8)',
            border: '1px solid var(--colors-greys-grey20, #e0e0e0)',
            borderRadius: '4px',
            padding: '12px',
            fontSize: '11px',
            fontFamily: 'monospace',
            color: 'var(--colors-greys-grey70, #555)',
            overflowX: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
          }}>
            {instance.rawXml}
          </pre>
        </>
      )}
    </div>
  )
}

export function AttributePanel({ element, allElements: _allElements, loadedFile }: AttributePanelProps) {
  const [activeTab, setActiveTab] = useState(0)
  const groupColour = GROUP_COLOURS[element.group] ?? '#555'

  return (
    <div>
      {/* Header */}
      <div style={{
        padding: '16px 20px 12px',
        borderBottom: '1px solid var(--colors-greys-grey20, #e0e0e0)',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
          <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--colors-greys-grey90, #1a1a1a)' }}>
            {element.name}
          </span>
          <span style={{
            fontSize: '11px',
            padding: '2px 8px',
            borderRadius: '12px',
            background: 'var(--colors-greys-grey05, #f8f8f8)',
            color: groupColour,
            border: `1px solid ${groupColour}`,
            fontWeight: 500,
          }}>
            {element.group}
          </span>
          {loadedFile?.instanceMap[element.name]?.length ? (
            <span style={{ fontSize: '12px', color: 'var(--colors-validation-success, #2e7d32)' }}>
              {loadedFile.instanceMap[element.name].length} instanser i filen
            </span>
          ) : null}
        </div>
        {element.inheritedFrom.length > 0 && (
          <div style={{ fontSize: '12px', color: 'var(--colors-greys-grey50, #888)' }}>
            Arver fra: {element.inheritedFrom.join(' → ')}
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs index={activeTab} onChange={setActiveTab}>
        <TabList>
          <Tab>Skjema</Tab>
          <Tab disabled={!loadedFile}>XML-instans</Tab>
        </TabList>
        <TabPanels>
          <TabPanel><SchemaTab element={element} /></TabPanel>
          <TabPanel>{loadedFile && <InstanceTab element={element} loadedFile={loadedFile} />}</TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  )
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep AttributePanel
```

Expected: No errors for AttributePanel.tsx. If `ExpandablePanel` style prop is not accepted, remove the `style` prop and add `marginBottom: '8px'` to the wrapping `<div>` instead.

- [ ] **Step 3: Commit**

```bash
git add src/components/AttributePanel.tsx
git commit -m "feat: migrate AttributePanel to Tabs, Table, ExpandablePanel"
```

---

## Task 6: ExampleLoader

**Files:**
- Modify: `src/components/ExampleLoader.tsx`

- [ ] **Step 1: Replace `src/components/ExampleLoader.tsx`**

```typescript
import { useState, useRef } from 'react'
import { SecondaryButton, PrimaryButton, TertiaryButton } from '@entur/button'
import { Modal } from '@entur/modal'
import type { NeTExExample, LoadedFile } from '../types'
import { parseXmlInstance } from '../utils/xml-instance-parser'

interface ExampleLoaderProps {
  examples: NeTExExample[]
  onFileLoaded: (file: LoadedFile | null) => void
}

export function ExampleLoader({ examples, onFileLoaded }: ExampleLoaderProps) {
  const [open, setOpen] = useState(false)
  const [pasteOpen, setPasteOpen] = useState(false)
  const [pasteXml, setPasteXml] = useState('')
  const [activeFilename, setActiveFilename] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function loadXml(xml: string, filename: string) {
    const instanceMap = parseXmlInstance(xml)
    onFileLoaded({ filename, instanceMap })
    setActiveFilename(filename)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => loadXml(ev.target!.result as string, file.name)
    reader.readAsText(file)
    setOpen(false)
  }

  function handlePaste() {
    if (pasteXml.trim()) loadXml(pasteXml.trim(), 'clipboard.xml')
    setPasteOpen(false)
    setPasteXml('')
  }

  function clearFile() {
    onFileLoaded(null)
    setActiveFilename(null)
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}>
      {activeFilename && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '12px',
          padding: '4px 10px',
          background: 'var(--colors-validation-success-bg, #e8f5e9)',
          border: '1px solid var(--colors-validation-success, #2e7d32)',
          borderRadius: '4px',
          color: 'var(--colors-validation-success, #2e7d32)',
        }}>
          <span style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {activeFilename}
          </span>
          <TertiaryButton
            size="small"
            onClick={clearFile}
            aria-label="Fjern fil"
            style={{ minWidth: 'unset', padding: '0 4px', color: 'inherit' }}
          >
            ✕
          </TertiaryButton>
        </div>
      )}

      <div style={{ position: 'relative' }}>
        <SecondaryButton size="small" onClick={() => setOpen((v) => !v)}>
          Eksempler {open ? '▲' : '▼'}
        </SecondaryButton>

        {open && (
          <div style={{
            position: 'absolute',
            right: 0,
            top: '100%',
            marginTop: '4px',
            width: '320px',
            background: 'var(--colors-greys-white, #fff)',
            border: '1px solid var(--colors-greys-grey20, #e0e0e0)',
            borderRadius: '6px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            zIndex: 50,
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '8px 12px',
              fontSize: '11px',
              color: 'var(--colors-greys-grey50, #888)',
              borderBottom: '1px solid var(--colors-greys-grey20, #e0e0e0)',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}>
              Offisielle NeTEx-eksempler
            </div>
            <div style={{ maxHeight: '260px', overflowY: 'auto' }}>
              {examples.map((ex) => (
                <button
                  key={ex.filename}
                  onClick={() => { loadXml(ex.xml, ex.filename); setOpen(false) }}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 12px',
                    fontSize: '13px',
                    color: 'var(--colors-greys-grey90, #1a1a1a)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--colors-greys-grey10, #f5f5f5)',
                  }}
                >
                  {ex.label}
                </button>
              ))}
            </div>
            <div style={{ borderTop: '1px solid var(--colors-greys-grey20, #e0e0e0)' }}>
              <button
                onClick={() => { fileRef.current?.click(); setOpen(false) }}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '8px 12px',
                  fontSize: '13px',
                  color: 'var(--colors-greys-grey70, #555)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  borderBottom: '1px solid var(--colors-greys-grey10, #f5f5f5)',
                }}
              >
                Last inn lokal XML-fil...
              </button>
              <button
                onClick={() => { setPasteOpen(true); setOpen(false) }}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '8px 12px',
                  fontSize: '13px',
                  color: 'var(--colors-greys-grey70, #555)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Lim inn XML...
              </button>
            </div>
          </div>
        )}
      </div>

      <input ref={fileRef} type="file" accept=".xml" style={{ display: 'none' }} onChange={handleFileChange} />

      <Modal
        open={pasteOpen}
        onDismiss={() => { setPasteOpen(false); setPasteXml('') }}
        title="Lim inn NeTEx XML"
        size="medium"
      >
        <textarea
          value={pasteXml}
          onChange={(e) => setPasteXml(e.target.value)}
          placeholder="<PublicationDelivery ...>...</PublicationDelivery>"
          style={{
            width: '100%',
            height: '240px',
            border: '1px solid var(--colors-greys-grey20, #e0e0e0)',
            borderRadius: '4px',
            padding: '8px',
            fontSize: '12px',
            fontFamily: 'monospace',
            color: 'var(--colors-greys-grey90, #1a1a1a)',
            resize: 'none',
            outline: 'none',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
          <TertiaryButton onClick={() => { setPasteOpen(false); setPasteXml('') }}>
            Avbryt
          </TertiaryButton>
          <PrimaryButton onClick={handlePaste}>
            Last inn
          </PrimaryButton>
        </div>
      </Modal>
    </div>
  )
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No TypeScript errors across all files.

- [ ] **Step 3: Run all tests**

```bash
npx vitest run
```

Expected: All 13 tests pass (components are not unit-tested, only parser/utils tests run).

- [ ] **Step 4: Run production build**

```bash
npm run build
```

Expected: Build succeeds. Chunk size warning is expected.

- [ ] **Step 5: Commit**

```bash
git add src/components/ExampleLoader.tsx
git commit -m "feat: migrate ExampleLoader to SecondaryButton and Modal"
```

---

## Self-Review

**Spec coverage check:**
- ✅ All 9 Entur packages installed (Task 1)
- ✅ Tailwind removed (Task 1)
- ✅ Entur CSS imports with correct order (Task 1)
- ✅ App layout uses `@entur/tokens` CSS variables (Task 2)
- ✅ `TextField` + `FilterChip` in SearchBar (Task 3)
- ✅ Token-based colors in ElementTree with full GROUP_COLOURS map (Task 4)
- ✅ `Tabs`/`Tab`, `Table`, `ExpandablePanel` in AttributePanel (Task 5)
- ✅ `SecondaryButton`, `Modal`, `PrimaryButton`, `TertiaryButton` in ExampleLoader (Task 6)
- ✅ Group accent colors align to Entur palette (Tasks 4, 5)
- ✅ Kind badge colors updated to Entur semantic palette (Task 5)
- ✅ `src/types.ts`, `scripts/`, `src/utils/` not touched

**No placeholders found.**
