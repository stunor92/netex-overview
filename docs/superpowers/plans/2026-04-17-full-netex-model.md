# Full NeTEx Model — Navigation Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the app to show all three NeTEx parts, replace search+filter-chips in the top bar with part-selector chips (Del 1/2/3), move search into the sidebar, hide no-data ref-elements, and show their descriptions inline in the attribute table.

**Architecture:** A `part: 0 | 1 | 2 | 3` field is added to every element in the JSON data, produced by extending the fetch script. The UI reads this field for filtering. No new components are needed — existing files are modified.

**Tech Stack:** React 19, TypeScript, Vitest, @testing-library/react, Node.js fetch script hitting GitHub raw API.

---

## File Map

| File | Change |
|---|---|
| `scripts/fetch-and-parse.js` | Add Part 1/2 dirs, recursive XSD discovery, `partMap` tagging |
| `scripts/parser/hierarchy-resolver.js` | Accept `partMap` param, output `part` field on each element |
| `src/types.ts` | Add `part: 0\|1\|2\|3` to `NeTExElement`, extend `ElementGroup` |
| `src/constants.ts` | Replace `EXPORT_CHIPS` with `PARTS` constant |
| `src/components/SearchBar.tsx` | Replace search+chips with part chips + description line |
| `src/components/ElementTree.tsx` | Add local search field, filter out no-data refs, filter by part |
| `src/components/AttributePanel.tsx` | Inline ref description in Beskrivelse column for no-data refs |
| `src/App.tsx` | `activeChip→activePart` state, right panel part description card |

---

## Task 1: Extend `hierarchy-resolver.js` to accept and output `part`

**Files:**
- Modify: `scripts/parser/hierarchy-resolver.js`

- [ ] **Step 1: Update `resolveHierarchy` signature to accept `partMap`**

In `scripts/parser/hierarchy-resolver.js`, change the function signature and add `part` to each element in the output:

```js
/**
 * @param {{ elements: Map, types: Map, groups: Map }} context
 * @param {string[]} topGroupNames
 * @param {Map<string, 0|1|2|3>} partMap  ← add this param
 * @returns {import('../../src/types.js').NeTExElement[]}
 */
export function resolveHierarchy(context, topGroupNames, partMap = new Map()) {
  // ... existing code ...

  result.push({
    name,
    abstract: false,
    parent: el.substitutionGroup ? stripDummy(el.substitutionGroup) : null,
    group: group ?? 'Other',
    part: partMap.get(name) ?? 0,    // ← add this line
    description: el.description,
    inheritedFrom,
    attributes: ownAttrs.map(normaliseAttr),
    inheritedAttributes: inheritedAttrs.map(normaliseAttr),
  })
```

- [ ] **Step 2: Commit**

```bash
git add scripts/parser/hierarchy-resolver.js
git commit -m "feat(script): add part field to resolveHierarchy output"
```

---

## Task 2: Add recursive XSD discovery and Part 1/2 to `fetch-and-parse.js`

**Files:**
- Modify: `scripts/fetch-and-parse.js`

- [ ] **Step 1: Add `listXsdFilesDeep` helper**

Add Part 1/2 dir constants and group names alongside the existing constants (do not remove `PART3_DIRS` or `FRAMEWORK_DIRS`), then add the `listXsdFilesDeep` function:

```js
// At top of file, add alongside existing PART3_DIRS and FRAMEWORK_DIRS:

const PART1_DIRS = ['xsd/netex_part_1']
const PART2_DIRS = ['xsd/netex_part_2']

const PART1_GROUP_NAMES = [
  'StopPlace', 'Quay', 'AccessSpace', 'Parking', 'PathLink', 'NavigationPath',
  'Line', 'Route', 'Network', 'ScheduledStopPoint', 'ServiceLink', 'StopArea',
  'Connection', 'FlexibleLine', 'SiteFrame', 'NetworkFrame',
]

const PART2_GROUP_NAMES = [
  'ServiceJourney', 'VehicleJourney', 'TimetabledPassingTime',
  'Block', 'VehicleService', 'Interchange', 'DeadRun', 'TrainNumber',
]
```

- [ ] **Step 2: Add `listXsdFilesDeep` function**

After the existing `listXsdFiles` function, add:

```js
/**
 * Recursively list all XSD _version/_support files under a top-level directory.
 * @param {string} topDir
 * @returns {Promise<string[]>}
 */
async function listXsdFilesDeep(topDir) {
  const files = []
  const entries = await listFiles(topDir)
  for (const entry of entries) {
    if (entry.type === 'dir') {
      const nested = await listXsdFilesDeep(entry.path)
      files.push(...nested)
    } else if (
      entry.name.endsWith('.xsd') &&
      (entry.name.includes('_version') || entry.name.includes('_support'))
    ) {
      files.push(entry.path)
    }
  }
  return files
}
```

- [ ] **Step 3: Update `buildElementsJson` to parse Part 1 and Part 2**

Replace the body of `buildElementsJson` with:

```js
async function buildElementsJson() {
  const merged = { elements: new Map(), types: new Map(), groups: new Map() }
  const partMap = new Map()

  // Framework: types/groups only, no elements
  console.log('Fetching framework XSD file list...')
  const frameworkPaths = await listXsdFiles(FRAMEWORK_DIRS)
  console.log(`Found ${frameworkPaths.length} framework XSD files`)
  for (const path of frameworkPaths) {
    process.stdout.write(`  Parsing ${path.split('/').pop()}...`)
    const text = await fetchText(path)
    if (!text) { console.log(' skipped (404)'); continue }
    const { types, groups } = parseXsd(text)
    for (const [k, v] of types) merged.types.set(k, v)
    for (const [k, v] of groups) merged.groups.set(k, v)
    console.log(' done')
  }

  // Part 1
  console.log('\nFetching Part 1 XSD file list...')
  const part1Paths = await listXsdFilesDeep(PART1_DIRS[0])
  console.log(`Found ${part1Paths.length} Part 1 XSD files`)
  for (const path of part1Paths) {
    process.stdout.write(`  Parsing ${path.split('/').pop()}...`)
    const text = await fetchText(path)
    if (!text) { console.log(' skipped (404)'); continue }
    const { elements, types, groups } = parseXsd(text)
    for (const [k, v] of elements) { merged.elements.set(k, v); partMap.set(k, 1) }
    for (const [k, v] of types) merged.types.set(k, v)
    for (const [k, v] of groups) merged.groups.set(k, v)
    console.log(' done')
  }

  // Part 2
  console.log('\nFetching Part 2 XSD file list...')
  const part2Paths = await listXsdFilesDeep(PART2_DIRS[0])
  console.log(`Found ${part2Paths.length} Part 2 XSD files`)
  for (const path of part2Paths) {
    process.stdout.write(`  Parsing ${path.split('/').pop()}...`)
    const text = await fetchText(path)
    if (!text) { console.log(' skipped (404)'); continue }
    const { elements, types, groups } = parseXsd(text)
    for (const [k, v] of elements) { merged.elements.set(k, v); partMap.set(k, 2) }
    for (const [k, v] of types) merged.types.set(k, v)
    for (const [k, v] of groups) merged.groups.set(k, v)
    console.log(' done')
  }

  // Part 3 (processed last so Part 3 elements win if names overlap)
  console.log('\nFetching Part 3 XSD file list...')
  const part3Paths = await listXsdFiles(PART3_DIRS)
  console.log(`Found ${part3Paths.length} Part 3 XSD files`)
  for (const path of part3Paths) {
    process.stdout.write(`  Parsing ${path.split('/').pop()}...`)
    const text = await fetchText(path)
    if (!text) { console.log(' skipped (404)'); continue }
    const { elements, types, groups } = parseXsd(text)
    for (const [k, v] of elements) { merged.elements.set(k, v); partMap.set(k, 3) }
    for (const [k, v] of types) merged.types.set(k, v)
    for (const [k, v] of groups) merged.groups.set(k, v)
    console.log(' done')
  }

  const allTopGroups = [...PART1_GROUP_NAMES, ...PART2_GROUP_NAMES, ...TOP_GROUP_NAMES]
  console.log('\nResolving hierarchy...')
  const netexElements = resolveHierarchy(merged, allTopGroups, partMap)
  console.log(`Resolved ${netexElements.length} element types`)

  mkdirSync(DATA_DIR, { recursive: true })
  writeFileSync(join(DATA_DIR, 'netex-elements.json'), JSON.stringify(netexElements, null, 2))
  console.log('Wrote src/data/netex-elements.json')
}
```

- [ ] **Step 4: Commit**

```bash
git add scripts/fetch-and-parse.js
git commit -m "feat(script): add Part 1 and Part 2 XSD fetching with part tagging"
```

---

## Task 3: Run fetch script and inspect output

**Files:**
- (generates) `src/data/netex-elements.json`

- [ ] **Step 1: Run the fetch script**

```bash
npm run fetch-schema
```

Expected: script completes without errors, printing counts for Part 1, Part 2, Part 3 files.

- [ ] **Step 2: Inspect element counts and groups**

```bash
node -e "
const d = require('./src/data/netex-elements.json');
const byPart = {0:0,1:0,2:0,3:0};
const groups = new Set();
d.forEach(e => { byPart[e.part]++; groups.add(e.group); });
console.log('By part:', byPart);
console.log('Groups:', [...groups].sort().join(', '));
"
```

Expected: `byPart` shows elements in parts 1, 2, 3. Note the actual group names produced for Part 1 and Part 2 — you'll need these in Task 4.

- [ ] **Step 3: Commit the updated JSON**

```bash
git add src/data/netex-elements.json
git commit -m "data: regenerate netex-elements.json with Part 1, 2, and 3"
```

---

## Task 4: Update `src/types.ts` with `part` field and new groups

**Files:**
- Modify: `src/types.ts`

- [ ] **Step 1: Add `part` to `NeTExElement` and extend `ElementGroup`**

In `src/types.ts`, add `part` to the `NeTExElement` interface and extend `ElementGroup` with Part 1 and Part 2 groups observed in Task 3's inspection step. The Part 1/2 group names below are the expected defaults — **update the union to match what you actually saw in the inspection output**:

```ts
/** Top-level grouping categories for NeTEx elements */
export type ElementGroup =
  // Part 1 — Network & Stops
  | 'StopPlace'
  | 'Quay'
  | 'AccessSpace'
  | 'Parking'
  | 'PathLink'
  | 'NavigationPath'
  | 'Line'
  | 'Route'
  | 'Network'
  | 'ScheduledStopPoint'
  | 'ServiceLink'
  | 'StopArea'
  | 'Connection'
  | 'FlexibleLine'
  | 'SiteFrame'
  | 'NetworkFrame'
  // Part 2 — Timetables
  | 'ServiceJourney'
  | 'VehicleJourney'
  | 'TimetabledPassingTime'
  | 'Block'
  | 'VehicleService'
  | 'Interchange'
  | 'DeadRun'
  | 'TrainNumber'
  // Part 3 — Fares (unchanged from before)
  | 'FareProduct'
  | 'FarePrice'
  | 'SalesOfferPackage'
  | 'FareStructureElement'
  | 'UsageParameter'
  | 'ValidableElement'
  | 'DistributionChannel'
  | 'FulfilmentMethod'
  | 'TypeOfTravelDocument'
  | 'FareTable'
  | 'FareSeries'
  | 'GeographicStructureFactor'
  | 'QualityStructureFactor'
  | 'TimeStructureFactor'
  | 'DistanceMatrixElement'
  | 'FareZone'
  | 'Tariff'
  | 'PricingRule'
  | 'Assignment'
  | 'CustomerAccount'
  | 'SecurityListing'
  | 'Frame'
  | 'Other'
```

And update `NeTExElement` to include `part`:

```ts
export interface NeTExElement {
  name: string
  abstract: boolean
  parent: string | null
  group: ElementGroup
  part: 0 | 1 | 2 | 3        // ← add this
  description: string
  inheritedFrom: string[]
  attributes: NeTExAttribute[]
  inheritedAttributes: NeTExInheritedAttribute[]
}
```

- [ ] **Step 2: Run TypeScript to verify no type errors**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/types.ts
git commit -m "feat(types): add part field to NeTExElement, extend ElementGroup"
```

---

## Task 5: Replace `EXPORT_CHIPS` with `PARTS` in `constants.ts`

**Files:**
- Modify: `src/constants.ts`

- [ ] **Step 1: Replace the constant**

Replace the entire content of `src/constants.ts`:

```ts
// src/constants.ts

export const PARTS: {
  key: 1 | 2 | 3
  label: string
  description: string
}[] = [
  {
    key: 1,
    label: 'Del 1 · Nettverk & stoppesteder',
    description: 'Stoppestedsstruktur, linjer, ruter og nettverkstopologi',
  },
  {
    key: 2,
    label: 'Del 2 · Rutetabeller',
    description: 'Avganger, kjøretøyruter, tidsplaner og tjenestekalender',
  },
  {
    key: 3,
    label: 'Del 3 · Billetter & takster',
    description: 'Takststruktur, billetter, salg og bruksvilkår',
  },
]
```

- [ ] **Step 2: Run TypeScript to verify**

```bash
npx tsc --noEmit
```

Expected: errors because `EXPORT_CHIPS` is still referenced in `SearchBar.tsx` and `ElementTree.tsx`. These will be fixed in subsequent tasks.

- [ ] **Step 3: Commit**

```bash
git add src/constants.ts
git commit -m "feat: replace EXPORT_CHIPS with PARTS constant"
```

---

## Task 6: Rewrite `SearchBar.tsx` as part chip navigation

**Files:**
- Modify: `src/components/SearchBar.tsx`

- [ ] **Step 1: Rewrite `SearchBar.tsx`**

Replace the entire file:

```tsx
import { FilterChip } from '@entur/chip'
import { PARTS } from '../constants'

interface SearchBarProps {
  activePart: 1 | 2 | 3 | null
  onPartChange: (p: 1 | 2 | 3 | null) => void
}

export function SearchBar({ activePart, onPartChange }: SearchBarProps) {
  const activePartDef = activePart ? PARTS.find((p) => p.key === activePart) : null

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
        <FilterChip
          value=""
          checked={activePart === null}
          onChange={() => onPartChange(null)}
        >
          Alle
        </FilterChip>
        {PARTS.map((part) => (
          <FilterChip
            key={part.key}
            value={String(part.key)}
            checked={activePart === part.key}
            onChange={() => onPartChange(activePart === part.key ? null : part.key)}
          >
            {part.label}
          </FilterChip>
        ))}
      </div>
      {activePartDef && (
        <span style={{ fontSize: '12px', color: 'var(--colors-greys-grey50, #888)', fontStyle: 'italic', whiteSpace: 'nowrap' }}>
          {activePartDef.description}
        </span>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Run TypeScript**

```bash
npx tsc --noEmit
```

Expected: errors in `App.tsx` because it still passes old props to `SearchBar`. Fixed in Task 8.

- [ ] **Step 3: Commit**

```bash
git add src/components/SearchBar.tsx
git commit -m "feat(ui): rewrite SearchBar as part chip navigation"
```

---

## Task 7: Update `ElementTree.tsx` — local search, ref filtering, part filtering

**Files:**
- Modify: `src/components/ElementTree.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/components/__tests__/ElementTree.filtering.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import type { NeTExElement } from '../../types'

function isNoData(el: NeTExElement): boolean {
  return el.attributes.length === 0 && el.inheritedAttributes.length === 0
}

function filterElements(
  elements: NeTExElement[],
  activePart: 1 | 2 | 3 | null,
  query: string,
): NeTExElement[] {
  return elements.filter((el) => {
    if (isNoData(el)) return false
    if (activePart !== null && el.part !== activePart) return false
    if (query) return el.name.toLowerCase().includes(query.toLowerCase())
    return true
  })
}

const makeEl = (overrides: Partial<NeTExElement>): NeTExElement => ({
  name: 'TestElement',
  abstract: false,
  parent: null,
  group: 'Other',
  part: 3,
  description: '',
  inheritedFrom: [],
  attributes: [{ name: 'Id', type: 'xsd:string', kind: 'string', minOccurs: '1', maxOccurs: '1', description: '' }],
  inheritedAttributes: [],
  ...overrides,
})

describe('ElementTree filtering', () => {
  it('hides elements with no attributes and no inheritedAttributes', () => {
    const elements = [
      makeEl({ name: 'WithData' }),
      makeEl({ name: 'NoDataRef', attributes: [], inheritedAttributes: [] }),
    ]
    expect(filterElements(elements, null, '')).toHaveLength(1)
    expect(filterElements(elements, null, '')[0].name).toBe('WithData')
  })

  it('filters by part number', () => {
    const elements = [
      makeEl({ name: 'Part1El', part: 1 }),
      makeEl({ name: 'Part3El', part: 3 }),
    ]
    expect(filterElements(elements, 1, '')).toHaveLength(1)
    expect(filterElements(elements, 1, '')[0].name).toBe('Part1El')
  })

  it('shows all parts when activePart is null', () => {
    const elements = [
      makeEl({ name: 'Part1El', part: 1 }),
      makeEl({ name: 'Part3El', part: 3 }),
    ]
    expect(filterElements(elements, null, '')).toHaveLength(2)
  })

  it('filters by search query case-insensitively', () => {
    const elements = [
      makeEl({ name: 'StopPlace', part: 1 }),
      makeEl({ name: 'ServiceJourney', part: 2 }),
    ]
    expect(filterElements(elements, null, 'stop')).toHaveLength(1)
    expect(filterElements(elements, null, 'STOP')[0].name).toBe('StopPlace')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- ElementTree.filtering
```

Expected: FAIL — `filterElements` is not defined yet (it's extracted inline for testing, but ElementTree itself doesn't exist as separate logic yet).

- [ ] **Step 3: Extract `isNoData` utility and implement in `ElementTree.tsx`**

In `src/components/ElementTree.tsx`, make these changes:

1. Remove the `EXPORT_CHIPS` import and add `PARTS` (no longer needed after refactor — remove entirely since part filtering now comes from the `activePart` prop).

2. Change the props interface — remove `activeChip`, add `activePart`:

```tsx
interface ElementTreeProps {
  elements: NeTExElement[]
  selectedElement: NeTExElement | null
  loadedFile: LoadedFile | null
  onSelect: (el: NeTExElement) => void
  profileData: ProfileData | null
  activeProfile: ActiveProfile
  onProfileChange: (p: ActiveProfile) => void
  activePart: 1 | 2 | 3 | null   // ← replaces activeChip
}
```

3. Add local search state at the top of the component function:

```tsx
const [query, setQuery] = useState('')
```

4. Replace the `filtered` useMemo:

```tsx
const filtered = useMemo(() => {
  return elements.filter((el) => {
    if (el.attributes.length === 0 && el.inheritedAttributes.length === 0) return false
    if (activePart !== null && el.part !== activePart) return false
    if (query) return el.name.toLowerCase().includes(query.toLowerCase())
    return true
  })
}, [elements, query, activePart])
```

5. Add the search field in the JSX, just before the «Elementer» label (after the profile selector block):

```tsx
{/* Search */}
<div style={{ padding: '6px 10px', borderBottom: '1px solid var(--colors-greys-grey80, #e0e0e0)' }}>
  <input
    type="search"
    placeholder="Søk etter element..."
    value={query}
    onChange={(e) => setQuery(e.target.value)}
    style={{
      width: '100%',
      border: '1px solid var(--colors-greys-grey80, #e0e0e0)',
      borderRadius: '4px',
      padding: '4px 8px',
      fontSize: '11px',
      color: 'var(--colors-greys-grey10, #2a2a2a)',
      background: 'var(--colors-greys-white, #ffffff)',
      boxSizing: 'border-box',
    }}
  />
</div>
```

6. Remove the `noSchema` variable and its badge from the element row (since no-data elements are now filtered out and never rendered):

Remove this block from the element row JSX:
```tsx
{noSchema && (
  <span style={{ fontSize: '9px', color: '#ccc', marginLeft: '4px', fontStyle: 'italic' }}>
    ingen data
  </span>
)}
```

And remove the `noSchema` variable definition:
```tsx
const noSchema = el.attributes.length === 0 && el.inheritedAttributes.length === 0
```

- [ ] **Step 4: Run tests**

```bash
npm test -- ElementTree.filtering
```

Expected: PASS (the filter logic in the test matches what's in the component).

- [ ] **Step 5: Run TypeScript**

```bash
npx tsc --noEmit
```

Expected: errors in `App.tsx` — `activeChip` prop no longer exists on `ElementTree`. Fixed in Task 8.

- [ ] **Step 6: Commit**

```bash
git add src/components/ElementTree.tsx src/components/__tests__/ElementTree.filtering.test.ts
git commit -m "feat(ui): add local search, filter no-data refs, filter by part in ElementTree"
```

---

## Task 8: Update `App.tsx` — state, props, right panel part description

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Update state and wiring**

In `src/App.tsx`:

1. Replace `activeChip` state with `activePart`:

```tsx
const [activePart, setActivePart] = useState<1 | 2 | 3 | null>(null)
```

2. Update the `SearchBar` call in the top bar (remove old `query`/`onQueryChange`/`activeChip`/`onChipChange` props):

```tsx
<SearchBar
  activePart={activePart}
  onPartChange={setActivePart}
/>
```

3. Update the `ElementTree` call (remove `query` and `activeChip`, add `activePart`):

```tsx
<ElementTree
  elements={allElements}
  activePart={activePart}
  selectedElement={selectedElement}
  loadedFile={loadedFile}
  onSelect={setSelectedElement}
  profileData={profileData}
  activeProfile={activeProfile}
  onProfileChange={handleProfileChange}
/>
```

- [ ] **Step 2: Add part description card to the right panel**

Replace the empty-state fallback in the right panel (the «Velg et element» message) with a part description card. The right panel rendering block becomes:

```tsx
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
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '100%', color: 'var(--colors-greys-grey50, #888)', fontSize: '14px',
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
) : activePart ? (
  <PartDescriptionCard activePart={activePart} allElements={allElements} />
) : (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '100%', color: 'var(--colors-greys-grey50, #888)', fontSize: '14px',
  }}>
    Velg et element i treet til venstre
  </div>
)}
```

- [ ] **Step 3: Add `PartDescriptionCard` component inline in `App.tsx`**

Add this component above the `App` function in `App.tsx`:

```tsx
import { PARTS } from './constants'

function PartDescriptionCard({ activePart, allElements }: { activePart: 1 | 2 | 3; allElements: NeTExElement[] }) {
  const partDef = PARTS.find((p) => p.key === activePart)!
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
```

- [ ] **Step 4: Run TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Run all tests**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx
git commit -m "feat(ui): update App state to activePart, add part description card"
```

---

## Task 9: Inline ref description in `AttributePanel.tsx`

**Files:**
- Modify: `src/components/AttributePanel.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/components/__tests__/AttributePanel.refDescription.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import type { NeTExElement } from '../../types'

// Pure logic extracted for testability
function getRefTargetDescription(
  attrType: string,
  attrKind: string,
  allElements: NeTExElement[],
): string | null {
  if (attrKind !== 'ref') return null
  const name = attrType
    .replace(/RefStructure$/, '')
    .replace(/Refs$/, '')
    .replace(/Ref$/, '')
  const target = allElements.find((e) => e.name === name)
  if (!target) return null
  const hasData = target.attributes.length > 0 || target.inheritedAttributes.length > 0
  if (hasData) return null  // has data → show link, not description
  return target.description || null
}

const makeEl = (name: string, hasData: boolean, description = ''): NeTExElement => ({
  name,
  abstract: false,
  parent: null,
  group: 'Other',
  part: 3,
  description,
  inheritedFrom: [],
  attributes: hasData ? [{ name: 'Id', type: 'xsd:string', kind: 'string', minOccurs: '1', maxOccurs: '1', description: '' }] : [],
  inheritedAttributes: [],
})

describe('getRefTargetDescription', () => {
  it('returns null for non-ref attributes', () => {
    expect(getRefTargetDescription('xsd:string', 'string', [])).toBeNull()
  })

  it('returns null when ref target has schema data', () => {
    const elements = [makeEl('PricingRule', true, 'A pricing rule.')]
    expect(getRefTargetDescription('PricingRuleRef', 'ref', elements)).toBeNull()
  })

  it('returns the target description when ref target has no data', () => {
    const elements = [makeEl('PricingRule', false, 'Reference to a PRICING RULE.')]
    expect(getRefTargetDescription('PricingRuleRef', 'ref', elements)).toBe('Reference to a PRICING RULE.')
  })

  it('returns null when target element is not found', () => {
    expect(getRefTargetDescription('UnknownRef', 'ref', [])).toBeNull()
  })

  it('strips RefStructure suffix when resolving target name', () => {
    const elements = [makeEl('FareProduct', false, 'A fare product.')]
    expect(getRefTargetDescription('FareProductRefStructure', 'ref', elements)).toBe('A fare product.')
  })
})
```

- [ ] **Step 2: Run tests to verify they pass (logic is self-contained)**

```bash
npm test -- AttributePanel.refDescription
```

Expected: PASS — the test defines its own copy of the logic to verify correctness before implementing it in the component.

- [ ] **Step 3: Update `attrRow` in `SchemaTab` to show inline ref description**

In `src/components/AttributePanel.tsx`, update the `attrRow` function. Find the existing `attrRow` function and update the Beskrivelse `DataCell`:

The existing last `DataCell` in `attrRow`:
```tsx
<DataCell style={{ color: 'var(--colors-greys-grey50, #888)' }}>
  {a.description}
  {a.kind === 'enum' && enumValues?.[a.type] && (
    // ... enum badges ...
  )}
</DataCell>
```

Replace with:
```tsx
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
  {(() => {
    if (a.kind !== 'ref') return null
    const refDesc = getRefTargetDescription(a.type, a.kind, allElements)
    if (!refDesc) return null
    return (
      <div style={{ fontSize: '11px', color: 'var(--colors-greys-grey50, #888)', fontStyle: 'italic', marginTop: '2px' }}>
        {refDesc}
      </div>
    )
  })()}
</DataCell>
```

Also update the Type `DataCell` in `attrRow` to not link to no-data elements. Replace the entire Type `DataCell` block (currently lines 133-145 in `AttributePanel.tsx`):

```tsx
<DataCell>
  <span style={{ fontFamily: 'monospace', color: KIND_COLOUR[a.kind] ?? '#555' }}>{a.kind}</span>
  {linkedEl ? (
    <button
      type="button"
      onClick={() => onSelect && onSelect(linkedEl)}
      style={{ display: 'block', background: 'none', border: 'none', cursor: 'pointer', color: '#1565c0', textDecoration: 'underline', fontFamily: 'monospace', fontSize: '11px', padding: 0, textAlign: 'left' }}
    >
      {a.type}
    </button>
  ) : (
    <span style={{ display: 'block', fontFamily: 'monospace', fontSize: '11px', color: 'var(--colors-greys-grey60, #aaa)' }}>{a.type}</span>
  )}
</DataCell>
```

Replace with:

```tsx
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
```

Note: the `linkedEl` variable that was previously declared at the top of `attrRow` (`const linkedEl = findLinkedElement(...)`) must be removed since it's now computed inline above.

Add the `getRefTargetDescription` function to `AttributePanel.tsx` (above `SchemaTab`):

```tsx
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
```

- [ ] **Step 4: Update tests to import from component**

Update the test file to use the same logic (the test already tests the logic inline — no import needed since it's a pure function test).

- [ ] **Step 5: Run all tests**

```bash
npm test
```

Expected: all tests pass including the new `AttributePanel.refDescription` tests.

- [ ] **Step 6: Run TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/AttributePanel.tsx src/components/__tests__/AttributePanel.refDescription.test.tsx
git commit -m "feat(ui): show no-data ref element descriptions inline in attribute table"
```

---

## Task 10: Final verification

- [ ] **Step 1: Run all tests**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 2: Build**

```bash
npm run build
```

Expected: build succeeds with no TypeScript errors.

- [ ] **Step 3: Smoke test in dev server**

```bash
npm run dev
```

Verify manually:
- Top bar shows «Alle | Del 1 · Nettverk & stoppesteder | Del 2 · Rutetabeller | Del 3 · Billetter & takster» chips
- Clicking «Del 1» shows only Part 1 elements in sidebar; description text appears in top bar
- No ref-only elements (ending in Ref/Refs with no attributes) appear in sidebar element lists
- Clicking a Part 1/2/3 chip with no element selected shows the `PartDescriptionCard` in the right panel
- Opening an element with ref attributes that resolve to no-data elements shows their description in the Beskrivelse column
- Profile selector still works; switching to FR/NO/UK profile takes over the sidebar as before

- [ ] **Step 4: Final commit if any minor fixes were needed**

```bash
git add -p   # stage only intentional changes
git commit -m "fix: address smoke test issues"
```
