# NeTEx Profile Selection — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a profile selector to the sidebar that annotates NeTEx elements and attributes with their status (required / optional / not-in-profile) in the French or Nordic NeTEx profile.

**Architecture:** Pre-generated static JSON files per profile (`src/data/profiles/fr.json`, `nordic.json`) are imported directly by the React app. A new `scripts/fetch-profiles.js` script fetches French profile XSD restrictions from GitHub and copies the manually curated Nordic JSON. Profile state lives in `App.tsx` and is passed as props to `ElementTree` and `AttributePanel`. A nightly GitHub Actions workflow keeps data fresh; Vercel auto-deploys on every commit to `main`.

**Tech Stack:** Node.js 20, fast-xml-parser (already installed), TypeScript 5, React 18, Vitest, GitHub Actions

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/types.ts` | Modify | Add `ProfileStatus`, `ProfileElementData`, `ProfileData`, `ActiveProfile` |
| `scripts/parser/profile-xsd-parser.js` | Create | Pure function: XSD text → element/attribute restriction map |
| `scripts/profiles/nordic-manual.json` | Create | Manually curated Nordic profile source of truth |
| `scripts/fetch-profiles.js` | Create | Fetch French XSDs + copy Nordic; output JSON to `src/data/profiles/` |
| `src/data/profiles/fr.json` | Generated | French profile data (produced by `npm run fetch-profiles`) |
| `src/data/profiles/nordic.json` | Generated | Nordic profile data (produced by `npm run fetch-profiles`) |
| `package.json` | Modify | Add `fetch-profiles` script |
| `src/App.tsx` | Modify | Add `activeProfile` state; import profile JSONs; pass `profileData`, `activeProfile`, `onProfileChange` props |
| `src/components/ElementTree.tsx` | Modify | Profile `<select>` above tree; element badges (✓/~/✕); dim not-in-profile rows |
| `src/components/AttributePanel.tsx` | Modify | Profile column in attribute tables; profile status badge in element header |
| `scripts/parser/__tests__/profile-xsd-parser.test.js` | Create | Vitest tests for the XSD parser |
| `.github/workflows/update-data.yml` | Create | Nightly cron: fetch-schema + fetch-profiles, commit, Vercel picks up |

---

### Task 1: Add profile types to `src/types.ts`

**Files:**
- Modify: `src/types.ts`

- [ ] **Step 1: Add the four new types at the end of `src/types.ts`**

Append after the last export in the file:

```typescript
// --- Profile annotation types ---

export type ProfileStatus = 'required' | 'optional' | 'not-in-profile'

export interface ProfileElementData {
  status: ProfileStatus
  attributes: Record<string, ProfileStatus>
}

/** Keyed by NeTEx element name, e.g. "PreassignedFareProduct" */
export type ProfileData = Record<string, ProfileElementData>

export type ActiveProfile = 'fr' | 'nordic' | null
```

- [ ] **Step 2: Verify TypeScript accepts the new types**

Run:
```bash
npx tsc --noEmit
```
Expected: no output (zero errors).

- [ ] **Step 3: Commit**

```bash
git add src/types.ts
git commit -m "feat: add profile annotation types"
```

---

### Task 2: Create Nordic manual profile stub + directory structure

**Files:**
- Create: `scripts/profiles/nordic-manual.json`
- Create: `src/data/profiles/fr.json` (empty stub — script will overwrite)
- Create: `src/data/profiles/nordic.json` (empty stub — script will overwrite)

The manual file is the source of truth for the Nordic profile. It only needs the elements you care about — entries not listed get no badge in the UI.

- [ ] **Step 1: Create `scripts/profiles/nordic-manual.json`**

```json
{
  "PreassignedFareProduct": {
    "status": "required",
    "attributes": {
      "id": "required",
      "version": "required",
      "Name": "required",
      "ProductType": "required",
      "ChargingMomentType": "optional",
      "ConditionSummaryRef": "optional"
    }
  },
  "AmountOfPriceUnitProduct": {
    "status": "optional",
    "attributes": {
      "id": "required",
      "version": "required",
      "Name": "required",
      "ProductType": "optional"
    }
  },
  "SalesOfferPackage": {
    "status": "required",
    "attributes": {
      "id": "required",
      "version": "required",
      "Name": "required",
      "Description": "optional"
    }
  },
  "FareStructureElement": {
    "status": "optional",
    "attributes": {
      "id": "required",
      "version": "required",
      "Name": "optional",
      "TypeOfFareStructureElementRef": "optional"
    }
  },
  "UserProfile": {
    "status": "optional",
    "attributes": {
      "id": "required",
      "version": "required",
      "Name": "required",
      "UserType": "required",
      "MinimumAge": "optional",
      "MaximumAge": "optional"
    }
  }
}
```

> **Note:** This is a minimal stub. Expand it over time as you learn what the Nordic profile actually requires. See https://entur.atlassian.net/wiki/spaces/PUBLIC/pages/728891481/Nordic+NeTEx+Profile for reference.

- [ ] **Step 2: Create empty stub profile files so TypeScript imports don't fail**

Create `src/data/profiles/fr.json`:
```json
{}
```

Create `src/data/profiles/nordic.json`:
```json
{}
```

- [ ] **Step 3: Commit**

```bash
git add scripts/profiles/nordic-manual.json src/data/profiles/fr.json src/data/profiles/nordic.json
git commit -m "feat: add Nordic manual profile stub and empty profile data files"
```

---

### Task 3: XSD parser utility (TDD)

**Files:**
- Create: `scripts/parser/profile-xsd-parser.js`
- Create: `scripts/parser/__tests__/profile-xsd-parser.test.js`

This is a pure function that parses a single XSD string and returns a restriction map. It does not fetch anything.

- [ ] **Step 1: Write the failing test**

Create `scripts/parser/__tests__/profile-xsd-parser.test.js`:

```javascript
import { describe, it, expect } from 'vitest'
import { parseXsdRestrictions } from '../profile-xsd-parser.js'

const FIXTURE_XSD = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema"
           xmlns:netex="http://www.netex.org.uk/netex">
  <xs:complexType name="PreassignedFareProduct_VersionStructure">
    <xs:complexContent>
      <xs:restriction base="netex:PreassignedFareProduct_VersionStructure">
        <xs:sequence>
          <xs:element name="ProductType" minOccurs="1" maxOccurs="1"/>
          <xs:element name="ConditionSummaryRef" minOccurs="0" maxOccurs="1"/>
        </xs:sequence>
      </xs:restriction>
    </xs:complexContent>
  </xs:complexType>
  <xs:complexType name="SaleDiscountRight_VersionStructure">
    <xs:complexContent>
      <xs:restriction base="netex:SaleDiscountRight_VersionStructure">
        <xs:sequence>
          <xs:element name="Name" minOccurs="1"/>
        </xs:sequence>
      </xs:restriction>
    </xs:complexContent>
  </xs:complexType>
</xs:schema>`

describe('parseXsdRestrictions', () => {
  it('returns a map keyed by element base name (strip _VersionStructure)', () => {
    const result = parseXsdRestrictions(FIXTURE_XSD)
    expect(result).toHaveProperty('PreassignedFareProduct')
    expect(result).toHaveProperty('SaleDiscountRight')
  })

  it('marks minOccurs=1 elements as required', () => {
    const result = parseXsdRestrictions(FIXTURE_XSD)
    expect(result['PreassignedFareProduct']['ProductType']).toBe('required')
  })

  it('marks minOccurs=0 elements as optional', () => {
    const result = parseXsdRestrictions(FIXTURE_XSD)
    expect(result['PreassignedFareProduct']['ConditionSummaryRef']).toBe('optional')
  })

  it('handles missing minOccurs as required (XSD default)', () => {
    const result = parseXsdRestrictions(FIXTURE_XSD)
    expect(result['SaleDiscountRight']['Name']).toBe('required')
  })

  it('returns empty object for XSD with no restrictions', () => {
    const result = parseXsdRestrictions('<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema"/>')
    expect(result).toEqual({})
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run scripts/parser/__tests__/profile-xsd-parser.test.js
```
Expected: FAIL — "Cannot find module '../profile-xsd-parser.js'"

- [ ] **Step 3: Implement `scripts/parser/profile-xsd-parser.js`**

```javascript
import { XMLParser } from 'fast-xml-parser'

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  isArray: (name) => ['xs:complexType', 'xs:element', 'xsd:complexType', 'xsd:element'].includes(name),
})

/**
 * Parse a single XSD string and return a map:
 *   { ElementName: { AttributeName: 'required' | 'optional' } }
 *
 * Only xs:complexType elements that contain xs:restriction are processed.
 * The key is the restriction base name with common suffixes stripped:
 *   "netex:PreassignedFareProduct_VersionStructure" → "PreassignedFareProduct"
 *
 * @param {string} xsdText
 * @returns {Record<string, Record<string, 'required' | 'optional'>>}
 */
export function parseXsdRestrictions(xsdText) {
  let doc
  try {
    doc = parser.parse(xsdText)
  } catch {
    return {}
  }

  const schema = doc['xs:schema'] ?? doc['xsd:schema'] ?? {}
  const complexTypes = (schema['xs:complexType'] ?? schema['xsd:complexType'] ?? [])
  const result = {}

  for (const ct of complexTypes) {
    const content = ct['xs:complexContent'] ?? ct['xsd:complexContent']
    if (!content) continue

    const restriction = content['xs:restriction'] ?? content['xsd:restriction']
    if (!restriction) continue

    const base = restriction['@_base'] ?? ''
    const localBase = base.split(':').pop() ?? base
    const elementName = localBase
      .replace(/_VersionStructure$/, '')
      .replace(/_Structure$/, '')
      .replace(/_PropertiesStructure$/, '')
    if (!elementName) continue

    const sequence = restriction['xs:sequence'] ?? restriction['xsd:sequence'] ?? {}
    const rawElements = sequence['xs:element'] ?? sequence['xsd:element'] ?? []
    const elements = Array.isArray(rawElements) ? rawElements : [rawElements]

    const attrs = {}
    for (const el of elements) {
      const name = (el['@_name'] ?? el['@_ref'] ?? '').split(':').pop()
      if (!name) continue
      const minOccurs = el['@_minOccurs'] !== undefined ? parseInt(String(el['@_minOccurs']), 10) : 1
      attrs[name] = minOccurs > 0 ? 'required' : 'optional'
    }

    result[elementName] = attrs
  }

  return result
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run scripts/parser/__tests__/profile-xsd-parser.test.js
```
Expected: 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/parser/profile-xsd-parser.js scripts/parser/__tests__/profile-xsd-parser.test.js
git commit -m "feat: add XSD restriction parser for profile extraction"
```

---

### Task 4: Create `scripts/fetch-profiles.js` and wire `package.json`

**Files:**
- Create: `scripts/fetch-profiles.js`
- Modify: `package.json`

- [ ] **Step 1: Create `scripts/fetch-profiles.js`**

```javascript
import { writeFileSync, readFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { parseXsdRestrictions } from './parser/profile-xsd-parser.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '../src/data')
const PROFILES_DIR = join(DATA_DIR, 'profiles')
const MANUAL_DIR = join(__dirname, 'profiles')

const FR_GITHUB_API = 'https://api.github.com/repos/etalab/transport-profil-netex-fr/contents'
const FR_RAW_BASE = 'https://raw.githubusercontent.com/etalab/transport-profil-netex-fr/master'

async function getAuthHeaders() {
  const token = process.env.GITHUB_TOKEN
  if (token) return { Authorization: `Bearer ${token}` }
  try {
    const { execSync } = await import('child_process')
    const ghToken = execSync('gh auth token', { encoding: 'utf8' }).trim()
    if (ghToken) return { Authorization: `Bearer ${ghToken}` }
  } catch { /* gh not available */ }
  return {}
}

async function listDir(apiUrl, headers) {
  const res = await fetch(apiUrl, { headers })
  if (!res.ok) throw new Error(`HTTP ${res.status} listing ${apiUrl}`)
  return res.json()
}

async function fetchText(rawUrl, headers) {
  const res = await fetch(rawUrl, { headers })
  if (!res.ok) return null
  return res.text()
}

/** Recursively collect .xsd file paths from a GitHub API directory listing */
async function collectXsdPaths(apiUrl, headers, depth = 0) {
  if (depth > 3) return []
  let entries
  try {
    entries = await listDir(apiUrl, headers)
  } catch {
    return []
  }
  const paths = []
  for (const entry of entries) {
    if (entry.type === 'file' && entry.name.endsWith('.xsd')) {
      paths.push(entry.path)
    } else if (entry.type === 'dir') {
      const sub = await collectXsdPaths(entry.url, headers, depth + 1)
      paths.push(...sub)
    }
  }
  return paths
}

async function buildFrenchProfile(headers) {
  console.log('Building French profile...')

  // Load base element list to know all valid element names
  const allElements = JSON.parse(readFileSync(join(DATA_DIR, 'netex-elements.json'), 'utf8'))
  const elementAttrMap = {}
  for (const el of allElements) {
    elementAttrMap[el.name] = new Set([
      ...el.attributes.map((a) => a.name),
      ...el.inheritedAttributes.map((a) => a.name),
    ])
  }

  // Fetch XSD file list from French profile repo
  let xsdPaths = []
  try {
    xsdPaths = await collectXsdPaths(FR_GITHUB_API, headers)
    console.log(`  Found ${xsdPaths.length} XSD files`)
  } catch (err) {
    console.warn(`  Could not list French profile repo: ${err.message}`)
    console.warn('  French profile will be empty — inspect repo and adjust parser')
  }

  // Parse all XSD files and merge restriction maps
  const allRestrictions = {}
  for (const xsdPath of xsdPaths) {
    process.stdout.write(`  Parsing ${xsdPath.split('/').pop()}...`)
    const text = await fetchText(`${FR_RAW_BASE}/${xsdPath}`, headers)
    if (!text) { console.log(' skipped'); continue }
    const restrictions = parseXsdRestrictions(text)
    Object.assign(allRestrictions, restrictions)
    console.log(` ${Object.keys(restrictions).length} types`)
  }

  console.log(`  Parsed ${Object.keys(allRestrictions).length} restricted types total`)

  // Build profile data: map each known NeTEx element to a status + attribute map
  const profile = {}
  const hasData = Object.keys(allRestrictions).length > 0

  for (const el of allElements) {
    const restriction = allRestrictions[el.name]
    if (!restriction) {
      // Not found in French profile XSDs
      if (hasData) {
        profile[el.name] = { status: 'not-in-profile', attributes: {} }
      }
      continue
    }

    const attrMap = {}
    for (const attr of [...el.attributes, ...el.inheritedAttributes]) {
      const status = restriction[attr.name]
      if (status) {
        attrMap[attr.name] = status
      }
      // Attributes not mentioned in restriction get no entry (unknown)
    }

    // Element is in the profile; treat as optional at element level
    // (French profile XSDs rarely declare which elements are mandatory at the document root level —
    // that depends on which frame types are used. Override manually if needed.)
    profile[el.name] = { status: 'optional', attributes: attrMap }
  }

  return profile
}

async function buildNordicProfile() {
  console.log('Building Nordic profile (from manual source)...')
  const manual = JSON.parse(readFileSync(join(MANUAL_DIR, 'nordic-manual.json'), 'utf8'))
  console.log(`  ${Object.keys(manual).length} elements`)
  return manual
}

async function main() {
  console.log('=== fetch-profiles ===\n')
  mkdirSync(PROFILES_DIR, { recursive: true })

  const headers = await getAuthHeaders()

  const frProfile = await buildFrenchProfile(headers)
  writeFileSync(join(PROFILES_DIR, 'fr.json'), JSON.stringify(frProfile, null, 2))
  console.log(`Wrote src/data/profiles/fr.json (${Object.keys(frProfile).length} elements)\n`)

  const nordicProfile = await buildNordicProfile()
  writeFileSync(join(PROFILES_DIR, 'nordic.json'), JSON.stringify(nordicProfile, null, 2))
  console.log(`Wrote src/data/profiles/nordic.json (${Object.keys(nordicProfile).length} elements)\n`)

  console.log('Done.')
}

main().catch((err) => { console.error(err); process.exit(1) })
```

- [ ] **Step 2: Add script to `package.json`**

In `package.json`, add to the `"scripts"` object:
```json
"fetch-profiles": "node scripts/fetch-profiles.js"
```

- [ ] **Step 3: Run the script and verify output**

```bash
npm run fetch-profiles
```

Expected output (approximately):
```
=== fetch-profiles ===

Building French profile...
  Found N XSD files
  ...
Wrote src/data/profiles/fr.json (N elements)

Building Nordic profile (from manual source)...
  5 elements
Wrote src/data/profiles/nordic.json (5 elements)

Done.
```

If the French repo structure is different from expected (0 XSD files found, or parser finds 0 types), `fr.json` will be `{}`. This is acceptable — inspect the repo manually and adjust `parseXsdRestrictions` as needed. The rest of the app works fine with an empty profile.

- [ ] **Step 4: Verify profile files exist and are valid JSON**

```bash
node -e "const f=require('./src/data/profiles/fr.json'); console.log('fr:', Object.keys(f).length, 'entries')"
node -e "const n=require('./src/data/profiles/nordic.json'); console.log('nordic:', Object.keys(n).length, 'entries')"
```

Expected: both print without errors.

- [ ] **Step 5: Commit**

```bash
git add scripts/fetch-profiles.js package.json src/data/profiles/fr.json src/data/profiles/nordic.json
git commit -m "feat: add fetch-profiles script (French XSD auto-parse + Nordic manual)"
```

---

### Task 5: Wire profile state in `App.tsx`

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Rewrite `src/App.tsx`**

```tsx
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
  const [activeGroup, setActiveGroup] = useState<string | null>(null)
  const [selectedElement, setSelectedElement] = useState<NeTExElement | null>(null)
  const [loadedFile, setLoadedFile] = useState<LoadedFile | null>(null)
  const [activeProfile, setActiveProfile] = useState<ActiveProfile>(null)

  const groups = [...new Set(allElements.map((e) => e.group))].sort()
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
          borderRight: '1px solid var(--colors-greys-grey80, #e0e0e0)',
          overflowY: 'auto',
          background: 'var(--colors-greys-grey90, #f8f8f8)',
        }}>
          <ElementTree
            elements={allElements}
            query={query}
            activeGroup={activeGroup}
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
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```
Expected: errors about `profileData`/`activeProfile`/`onProfileChange` props not existing on `ElementTree` and `AttributePanel` — these are fixed in Tasks 6 and 7.

- [ ] **Step 3: Commit (even with type errors — they are resolved in subsequent tasks)**

```bash
git add src/App.tsx
git commit -m "feat: add activeProfile state and profile imports in App.tsx"
```

---

### Task 6: Add profile selector and badges to `ElementTree`

**Files:**
- Modify: `src/components/ElementTree.tsx`

- [ ] **Step 1: Rewrite `src/components/ElementTree.tsx`**

```tsx
import { useState, useMemo } from 'react'
import type { NeTExElement, LoadedFile, ProfileData, ActiveProfile } from '../types'

const GROUP_COLOURS: Record<string, string> = {
  FareProduct: '#ff6c6c',
  FarePrice: '#181c56',
  SalesOfferPackage: '#e07b00',
  FareStructureElement: '#c0392b',
  UsageParameter: '#6a1b9a',
  TimeStructureFactor: '#1565c0',
}

interface ElementTreeProps {
  elements: NeTExElement[]
  query: string
  activeGroup: string | null
  selectedElement: NeTExElement | null
  loadedFile: LoadedFile | null
  onSelect: (el: NeTExElement) => void
  profileData: ProfileData | null
  activeProfile: ActiveProfile
  onProfileChange: (p: ActiveProfile) => void
}

function ProfileBadge({ status }: { status: 'required' | 'optional' | 'not-in-profile' | undefined }) {
  if (!status) return null
  if (status === 'required') return (
    <span style={{ background: '#e8f5e9', color: '#2e7d32', fontSize: '9px', padding: '1px 5px', borderRadius: '6px', fontWeight: 600, flexShrink: 0 }}>✓</span>
  )
  if (status === 'optional') return (
    <span style={{ background: '#e3f2fd', color: '#1565c0', fontSize: '9px', padding: '1px 5px', borderRadius: '6px', fontWeight: 600, flexShrink: 0 }}>~</span>
  )
  return (
    <span style={{ background: '#f5f5f5', color: '#aaa', fontSize: '9px', padding: '1px 5px', borderRadius: '6px', flexShrink: 0 }}>✕</span>
  )
}

export function ElementTree({
  elements, query, activeGroup, selectedElement, loadedFile, onSelect,
  profileData, activeProfile, onProfileChange,
}: ElementTreeProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => new Set())
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null)
  const [hoveredElement, setHoveredElement] = useState<string | null>(null)

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

  const profileLabel: Record<string, string> = {
    fr: '🇫🇷 Fransk profil',
    nordic: '🇳🇴 Nordisk profil',
  }

  return (
    <div style={{ paddingTop: '0', paddingBottom: '8px' }}>

      {/* Profile selector */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 10px',
        borderBottom: '1px solid var(--colors-greys-grey80, #e0e0e0)',
        background: 'var(--colors-greys-white, #ffffff)',
      }}>
        <span style={{ fontSize: '10px', color: 'var(--colors-greys-grey50, #888)', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
          Profil
        </span>
        <select
          value={activeProfile ?? ''}
          onChange={(e) => onProfileChange((e.target.value || null) as ActiveProfile)}
          style={{
            flex: 1,
            border: '1px solid var(--colors-greys-grey80, #e0e0e0)',
            borderRadius: '4px',
            padding: '3px 6px',
            fontSize: '11px',
            color: 'var(--colors-greys-grey10, #2a2a2a)',
            background: 'var(--colors-greys-white, #ffffff)',
            fontWeight: 500,
          }}
        >
          <option value="">— Ingen profil</option>
          <option value="fr">🇫🇷 Fransk profil</option>
          <option value="nordic">🇳🇴 Nordisk profil</option>
        </select>
      </div>

      {/* Elementer label */}
      <div style={{ padding: '8px 12px 4px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--colors-greys-grey50, #888)', fontWeight: 600 }}>
        Elementer
      </div>

      {groups.length === 0 && (
        <div style={{ padding: '8px 12px', fontSize: '12px', color: 'var(--colors-greys-grey50, #888)' }}>
          Ingen elementer funnet
        </div>
      )}

      {groups.map((group) => {
        const colour = GROUP_COLOURS[group] ?? '#555'
        const isExpanded = expandedGroups.has(group)
        const children = byGroup.get(group)!
        const isGroupHovered = hoveredGroup === group
        return (
          <div key={group}>
            <button
              type="button"
              onClick={() => toggleGroup(group)}
              onMouseEnter={() => setHoveredGroup(group)}
              onMouseLeave={() => setHoveredGroup(null)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                background: isGroupHovered ? 'var(--colors-greys-grey90, #f8f8f8)' : 'none',
                border: 'none', color: colour,
              }}
            >
              <span>{isExpanded ? '▼' : '▶'}</span>
              <span>{group}</span>
              <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--colors-greys-grey50, #888)', fontWeight: 400 }}>
                {children.length}
              </span>
            </button>
            {isExpanded && children.map((el) => {
              const count = loadedFile?.instanceMap[el.name]?.length ?? 0
              const isSelected = selectedElement?.name === el.name
              const isElHovered = hoveredElement === el.name
              const showHighlight = isSelected || isElHovered
              const profileStatus = profileData?.[el.name]?.status
              const notInProfile = profileStatus === 'not-in-profile'
              return (
                <button
                  key={el.name}
                  type="button"
                  onClick={() => onSelect(el)}
                  onMouseEnter={() => setHoveredElement(el.name)}
                  onMouseLeave={() => setHoveredElement(null)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '5px 12px 5px 28px', fontSize: '11px', cursor: 'pointer',
                    background: showHighlight ? 'var(--colors-greys-grey90, #f8f8f8)' : 'none',
                    border: 'none', borderLeft: '3px solid transparent',
                    borderLeftColor: isSelected ? colour : 'transparent',
                    color: showHighlight ? 'var(--colors-greys-grey10, #2a2a2a)' : 'var(--colors-greys-grey40, #555)',
                    fontWeight: isSelected ? 500 : undefined,
                    opacity: notInProfile ? 0.35 : 1,
                  }}
                >
                  <span style={{
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    textDecoration: notInProfile ? 'line-through' : 'none',
                  }}>
                    ● {el.name}
                  </span>
                  <span style={{ display: 'flex', gap: '3px', alignItems: 'center', flexShrink: 0, marginLeft: '4px' }}>
                    {profileData && <ProfileBadge status={profileStatus} />}
                    {count > 0 && (
                      <span style={{ background: '#e8f5e9', color: '#2e7d32', fontSize: '9px', padding: '0 5px', borderRadius: '8px', fontWeight: 600 }}>
                        {count}
                      </span>
                    )}
                  </span>
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

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```
Expected: only errors from `AttributePanel` (fixed in Task 7). No errors from `ElementTree` or `App`.

- [ ] **Step 3: Commit**

```bash
git add src/components/ElementTree.tsx
git commit -m "feat: add profile selector and element badges to ElementTree"
```

---

### Task 7: Add profile column to `AttributePanel`

**Files:**
- Modify: `src/components/AttributePanel.tsx`

- [ ] **Step 1: Add `profileData` and `activeProfile` props to the interfaces and thread them through**

The changes are in three places: the `AttributePanelProps` interface, the `SchemaTab` component, and the `AttributePanel` export function.

Replace the entire `src/components/AttributePanel.tsx` with:

```tsx
import { useState } from 'react'
import { Tabs, TabList, Tab, TabPanels, TabPanel } from '@entur/tab'
import { Table, TableHead, TableBody, TableRow, HeaderCell, DataCell } from '@entur/table'
import { ExpandablePanel } from '@entur/expand'
import type { NeTExElement, LoadedFile, NeTExAttribute, NeTExInheritedAttribute, ProfileData, ActiveProfile, ProfileStatus } from '../types'

interface AttributePanelProps {
  element: NeTExElement
  allElements: NeTExElement[]
  loadedFile: LoadedFile | null
  profileData: ProfileData | null
  activeProfile: ActiveProfile
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

const PROFILE_LABEL: Record<string, string> = {
  fr: '🇫🇷',
  nordic: '🇳🇴',
}

function ProfileAttrBadge({ status }: { status: ProfileStatus | undefined }) {
  if (!status) return null
  if (status === 'required') return (
    <span style={{ background: '#e8f5e9', color: '#2e7d32', fontSize: '9px', padding: '1px 6px', borderRadius: '6px', fontWeight: 600, whiteSpace: 'nowrap' }}>påkrevd</span>
  )
  if (status === 'optional') return (
    <span style={{ background: '#e3f2fd', color: '#1565c0', fontSize: '9px', padding: '1px 6px', borderRadius: '6px', fontWeight: 600, whiteSpace: 'nowrap' }}>valgfri</span>
  )
  return (
    <span style={{ background: '#f5f5f5', color: '#aaa', fontSize: '9px', padding: '1px 6px', borderRadius: '6px', whiteSpace: 'nowrap' }}>ikke i profil</span>
  )
}

function cardinality(attr: NeTExAttribute | NeTExInheritedAttribute) {
  const max = attr.maxOccurs === 'unbounded' ? '∞' : attr.maxOccurs
  return `${attr.minOccurs}..${max}`
}

function SchemaTab({ element, profileData, activeProfile }: { element: NeTExElement; profileData: ProfileData | null; activeProfile: ActiveProfile }) {
  const byAncestor = new Map<string, NeTExInheritedAttribute[]>()
  for (const a of element.inheritedAttributes) {
    if (!byAncestor.has(a.inheritedFrom)) byAncestor.set(a.inheritedFrom, [])
    byAncestor.get(a.inheritedFrom)!.push(a)
  }

  const elementProfile = profileData?.[element.name]
  const showProfileCol = !!profileData

  function attrRow(a: NeTExAttribute | NeTExInheritedAttribute, dim = false) {
    const attrStatus = elementProfile?.attributes[a.name]
    const notInProfile = attrStatus === 'not-in-profile'
    return (
      <TableRow key={a.name} style={{ opacity: dim || notInProfile ? 0.4 : 1 }}>
        <DataCell style={{ textDecoration: notInProfile ? 'line-through' : 'none' }}>{a.name}</DataCell>
        <DataCell>
          <span style={{ fontFamily: 'monospace', color: KIND_COLOUR[a.kind] ?? '#555' }}>{a.kind}</span>
        </DataCell>
        <DataCell align="center" style={{ color: 'var(--colors-greys-grey50, #888)' }}>{cardinality(a)}</DataCell>
        <DataCell style={{ color: 'var(--colors-greys-grey50, #888)' }}>{a.description}</DataCell>
        {showProfileCol && <DataCell align="center"><ProfileAttrBadge status={attrStatus} /></DataCell>}
      </TableRow>
    )
  }

  return (
    <div>
      {element.description && (
        <div style={{ borderLeft: '3px solid var(--colors-brand-coral, #ff6c6c)', paddingLeft: '12px', margin: '16px', color: 'var(--colors-greys-grey40, #555)', fontSize: '14px' }}>
          {element.description}
        </div>
      )}

      {element.attributes.length > 0 && (
        <div style={{ padding: '0 16px 16px' }}>
          <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--colors-greys-grey50, #888)', fontWeight: 600, marginBottom: '8px' }}>
            Egne attributter
          </div>
          <Table>
            <TableHead>
              <TableRow>
                <HeaderCell>Navn</HeaderCell>
                <HeaderCell>Type</HeaderCell>
                <HeaderCell align="center">Kard.</HeaderCell>
                <HeaderCell>Beskrivelse</HeaderCell>
                {showProfileCol && <HeaderCell align="center">{activeProfile ? PROFILE_LABEL[activeProfile] : ''} Profil</HeaderCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {element.attributes.map((a) => attrRow(a))}
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
                      {showProfileCol && <HeaderCell align="center">{activeProfile ? PROFILE_LABEL[activeProfile] : ''} Profil</HeaderCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {attrs.map((a) => attrRow(a, true))}
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
      <div style={{ padding: '24px 16px', fontSize: '14px', color: 'var(--colors-greys-grey50, #888)' }}>
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
                fontSize: '12px', padding: '4px 12px', borderRadius: '9999px',
                border: selectedIdx === i ? '1px solid var(--colors-brand-coral, #ff6c6c)' : '1px solid var(--colors-greys-grey80, #e0e0e0)',
                background: selectedIdx === i ? 'var(--colors-brand-coral, #ff6c6c)' : 'transparent',
                color: selectedIdx === i ? 'var(--colors-greys-white, #ffffff)' : 'var(--colors-greys-grey40, #555)',
                fontWeight: selectedIdx === i ? 600 : 400,
                cursor: 'pointer',
              }}
            >
              {inst.id || `Instans ${i + 1}`}
            </button>
          ))}
        </div>
      )}

      {instance && (
        <>
          <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--colors-greys-grey50, #888)', fontWeight: 600, marginBottom: '8px' }}>
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
                    <DataCell><span style={{ fontFamily: 'monospace', color: 'var(--colors-greys-grey40, #555)' }}>{a.value}</span></DataCell>
                    <DataCell style={{ color: 'var(--colors-greys-grey50, #888)' }}>{a.kind}</DataCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--colors-greys-grey50, #888)', fontWeight: 600, marginBottom: '8px' }}>
            Rå XML
          </div>
          <pre style={{ background: 'var(--colors-greys-grey90, #f8f8f8)', border: '1px solid var(--colors-greys-grey80, #e0e0e0)', borderRadius: '8px', padding: '12px', fontSize: '11px', fontFamily: 'monospace', color: 'var(--colors-greys-grey40, #555)', overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {instance.rawXml}
          </pre>
        </>
      )}
    </div>
  )
}

export function AttributePanel({ element, allElements: _allElements, loadedFile, profileData, activeProfile }: AttributePanelProps) {
  const [activeTabIdx, setActiveTabIdx] = useState(0)
  const groupColour = GROUP_COLOURS[element.group] ?? '#555'
  const hasInstances = !!loadedFile?.instanceMap[element.name]?.length
  const elementProfileStatus = profileData?.[element.name]?.status

  return (
    <div>
      {/* Header */}
      <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--colors-greys-grey80, #e0e0e0)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--colors-greys-grey10, #2a2a2a)' }}>
            {element.name}
          </span>
          <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '9999px', background: 'var(--colors-greys-grey90, #f8f8f8)', color: groupColour, border: '1px solid var(--colors-greys-grey80, #e0e0e0)' }}>
            {element.group}
          </span>
          {elementProfileStatus && elementProfileStatus !== 'not-in-profile' && (
            <span style={{ fontSize: '11px', background: elementProfileStatus === 'required' ? '#e8f5e9' : '#e3f2fd', color: elementProfileStatus === 'required' ? '#2e7d32' : '#1565c0', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>
              {elementProfileStatus === 'required' ? '✓ Påkrevd' : '~ Valgfri'} — {activeProfile === 'fr' ? 'Fransk profil' : 'Nordisk profil'}
            </span>
          )}
          {elementProfileStatus === 'not-in-profile' && (
            <span style={{ fontSize: '11px', background: '#f5f5f5', color: '#aaa', padding: '2px 8px', borderRadius: '10px' }}>
              ✕ Ikke i profil
            </span>
          )}
          {hasInstances && (
            <span style={{ fontSize: '12px', color: 'var(--colors-brand-coral, #ff6c6c)', marginLeft: '4px' }}>
              {loadedFile!.instanceMap[element.name].length} instanser i filen
            </span>
          )}
        </div>
        {element.inheritedFrom.length > 0 && (
          <div style={{ fontSize: '12px', color: 'var(--colors-greys-grey50, #888)' }}>
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
            <SchemaTab element={element} profileData={profileData} activeProfile={activeProfile} />
          </TabPanel>
          <TabPanel>
            {loadedFile && <InstanceTab element={element} loadedFile={loadedFile} />}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript is clean**

```bash
npx tsc --noEmit
```
Expected: no output (zero errors).

- [ ] **Step 3: Run all tests**

```bash
npx vitest run
```
Expected: all existing tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/components/AttributePanel.tsx
git commit -m "feat: add profile column and header badge to AttributePanel"
```

---

### Task 8: GitHub Actions nightly workflow

**Files:**
- Create: `.github/workflows/update-data.yml`

- [ ] **Step 1: Create `.github/workflows/update-data.yml`**

```yaml
name: Update NeTEx data

on:
  schedule:
    # Run at 02:00 UTC every night
    - cron: '0 2 * * *'
  workflow_dispatch:  # Allow manual trigger from GitHub UI

jobs:
  update:
    runs-on: ubuntu-latest
    permissions:
      contents: write

    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Fetch NeTEx schema
        run: npm run fetch-schema
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Fetch profile data
        run: npm run fetch-profiles
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Commit updated data files
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add src/data/netex-elements.json src/data/netex-examples.json src/data/profiles/fr.json src/data/profiles/nordic.json
          if git diff --staged --quiet; then
            echo "No changes to commit"
          else
            git commit -m "chore: update NeTEx data [skip ci]"
            git push
          fi
```

The `[skip ci]` tag in the commit message tells GitHub Actions not to re-trigger itself. Vercel picks up the push independently and deploys.

- [ ] **Step 2: Commit the workflow file**

```bash
git add .github/workflows/update-data.yml
git commit -m "ci: add nightly NeTEx data update workflow"
```

---

## Vercel Setup (one-time manual steps — not automated)

1. Go to https://vercel.com/new and import your GitHub repository
2. Framework preset: **Vite**
3. Build command: `npm run build` (default)
4. Output directory: `dist` (default)
5. Click **Deploy**

Vercel will automatically redeploy on every push to `main`, including the nightly data-update commits from GitHub Actions.

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task |
|---|---|
| ProfileStatus / ProfileElementData / ProfileData / ActiveProfile types | Task 1 |
| `scripts/fetch-profiles.js` with French XSD parsing | Task 4 |
| `scripts/profiles/nordic-manual.json` manually curated | Task 2 |
| `src/data/profiles/fr.json` and `nordic.json` | Tasks 2 + 4 |
| `package.json` fetch-profiles script | Task 4 |
| Profile selector `<select>` in ElementTree sidebar | Task 6 |
| Element badges ✓/~/✕ in ElementTree | Task 6 |
| Not-in-profile elements dimmed (opacity 0.35) + strikethrough | Task 6 |
| Profile column in AttributePanel attribute tables | Task 7 |
| Profile status badge in AttributePanel header | Task 7 |
| App.tsx state + prop wiring | Task 5 |
| GitHub Actions nightly cron | Task 8 |
| Vercel setup | Manual steps documented |

All spec requirements covered. No placeholders. Type names consistent across all tasks (`ProfileData`, `ActiveProfile`, `ProfileStatus`, `ProfileElementData`).
