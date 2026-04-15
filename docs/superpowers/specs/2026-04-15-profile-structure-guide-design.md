# Profile Structure Guide — Design Spec

**Date:** 2026-04-15
**Status:** Approved

---

## Goal

When a NeTEx profile is selected, replace the XSD-hierarchy element tree with a view that shows the actual XML export file structure for that profile. Users should see how elements nest in a real NeTEx export file, get Norwegian descriptions of each node, and see an annotated XML template — all curated per profile. This gives developers working with a specific profile a practical, document-oriented reference rather than a schema-oriented one.

---

## Users

- Developers building NeTEx export files for a specific national profile (Nordic, French)
- Internal team members who need a quick check of what belongs where in an export file

---

## Architecture

### Data flow

```
scripts/profiles/nordic-structure-manual.json   (hand-curated)
scripts/profiles/fr-structure-manual.json       (hand-curated)
         │
         │  npm run fetch-profiles (copy step, no parsing)
         ▼
src/data/profiles/nordic-structure.json
src/data/profiles/fr-structure.json
         │
         │  imported by React app
         ▼
ProfileStructureTree (left panel)  +  ProfileGuidePanel (right panel)
```

The existing `nordic.json` / `fr.json` (element status maps) remain unchanged and are used by `ProfileGuidePanel` to show attribute status in the «Beskrivelse» tab.

### When profile is active

| Panel | No profile | Profile active |
|-------|-----------|----------------|
| Left  | `ElementTree` (XSD hierarchy) | `ProfileStructureTree` (XML export structure) |
| Right | `AttributePanel` (schema detail) | `ProfileGuidePanel` (profile guide) |

When no profile is active, the app behaves exactly as today.

---

## Data Format

### `src/data/profiles/nordic-structure.json`

```json
{
  "profile": "nordic",
  "label": "Nordisk profil — Eksportstruktur",
  "root": {
    "id": "pub-delivery",
    "type": "container",
    "label": "PublicationDelivery",
    "description": "Rotelementet i alle NeTEx-filer. Inneholder metadata og én eller flere datarammer.",
    "xmlSnippet": "<PublicationDelivery version=\"1.0\" xmlns=\"http://www.netex.org.uk/netex\">\n  <dataObjects> … </dataObjects>\n</PublicationDelivery>",
    "children": [
      {
        "id": "composite-frame",
        "type": "container",
        "label": "CompositeFrame",
        "description": "Samler alle rammer for ett datasett. Påkrevd i nordisk profil.",
        "xmlSnippet": "<CompositeFrame id=\"CF1\" version=\"1\">\n  <frames> … </frames>\n</CompositeFrame>",
        "children": [
          {
            "id": "fare-frame",
            "type": "container",
            "label": "FareFrame",
            "description": "Inneholder alle billettstrukturer. Må ha minst én Tariff og ett FareProduct.",
            "xmlSnippet": "<FareFrame id=\"FF1\" version=\"1\">\n  <tariffs> … </tariffs>\n  <fareProducts> … </fareProducts>\n</FareFrame>",
            "children": [
              {
                "id": "tariffs",
                "type": "collection",
                "label": "tariffs",
                "description": "Liste over tariffer som definerer prisstrukturen.",
                "xmlSnippet": "<tariffs>\n  <Tariff id=\"T1\" version=\"1\"> … </Tariff>\n</tariffs>",
                "children": [
                  {
                    "id": "Tariff",
                    "type": "element",
                    "elementRef": "Tariff",
                    "label": "Tariff",
                    "description": "Definerer den grunnleggende prisstrukturen. Knyttes til FareStructureElements som beskriver gyldighetsregler.",
                    "xmlSnippet": "<Tariff id=\"TAR:Tariff:1\" version=\"1\">\n  <!-- Name: valgfri -->\n  <Name>Enkeltbillett</Name>\n  <!-- fareStructureElements: påkrevd, minst 1 -->\n  <fareStructureElements>\n    <FareStructureElement id=\"FAR:FSE:1\" version=\"1\"> … </FareStructureElement>\n  </fareStructureElements>\n</Tariff>",
                    "children": []
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
}
```

### Node types

| Type | Description | Has `elementRef` |
|------|-------------|-----------------|
| `container` | NeTEx frame (FareFrame) or top-level wrapper (PublicationDelivery) | No |
| `collection` | XML list element (`tariffs`, `fareProducts`) | No |
| `element` | Concrete NeTEx element (Tariff, FareProduct) | Yes — points to `NeTExElement.name` |

`elementRef` on `element` nodes links to both `netex-elements.json` (for the «Skjema» tab) and the profile status JSON (for attribute badges in «Beskrivelse»).

### Source files (hand-curated)

`scripts/profiles/nordic-structure-manual.json` and `fr-structure-manual.json` are the source of truth. `npm run fetch-profiles` copies them verbatim to `src/data/profiles/`. No parsing step needed for structure files.

---

## TypeScript Types

Add to `src/types.ts`:

```typescript
export type StructureNodeType = 'container' | 'collection' | 'element'

export interface StructureNode {
  id: string
  type: StructureNodeType
  label: string
  description: string
  xmlSnippet: string
  elementRef?: string        // only for type === 'element'
  children: StructureNode[]
}

export interface ProfileStructure {
  profile: string
  label: string
  root: StructureNode
}
```

---

## New Components

### `ProfileStructureTree`

**File:** `src/components/ProfileStructureTree.tsx`

Replaces `ElementTree` in the left panel when a profile is active. Props:

```typescript
interface ProfileStructureTreeProps {
  structure: ProfileStructure
  profileData: ProfileData | null
  selectedNode: StructureNode | null
  onSelect: (node: StructureNode) => void
}
```

**Behaviour:**
- Renders a collapsible tree from `structure.root`
- Node colours by type: container = amber (`#e07b00`), collection = grey-italic, element = default text
- Element nodes with `elementRef` show a profile status badge from `profileData` (påkrevd / valgfri / ikke i profil) using the existing badge colours
- Selected node has left border accent (blue `#1565c0`)
- All nodes expanded by default on first render; user can collapse
- No search/chip filtering (search bar hidden when profile active — replaced by profile label in top bar)

### `ProfileGuidePanel`

**File:** `src/components/ProfileGuidePanel.tsx`

Replaces `AttributePanel` in the right panel when a profile is active. Props:

```typescript
interface ProfileGuidePanelProps {
  node: StructureNode
  allElements: NeTExElement[]
  profileData: ProfileData | null
  activeProfile: ActiveProfile
}
```

**Behaviour — tabs by node type:**

**Container / collection nodes (2 tabs):**
- «Beskrivelse»: Norwegian description text + optional tip block
- «XML-mal»: syntax-highlighted XML snippet (dark theme, matching existing instance tab style)

**Element nodes (3 tabs):**
- «Beskrivelse»: Norwegian description text + profile attribute status table (name → påkrevd/valgfri/ikke i profil badge). Attribute rows pulled from `profileData[elementRef]` cross-referenced with `allElements`
- «XML-mal»: syntax-highlighted annotated XML snippet
- «Skjema»: renders the existing `AttributePanel` schema tab content for the element (own attributes + inherited attributes table). Reuses `SchemaTab` extracted from `AttributePanel`

**Header (all nodes):**
- Element name (large)
- Breadcrumb path: e.g. `FareFrame → tariffs → Tariff`
- Profile status badge (for element nodes)

---

## Changes to Existing Files

### `src/App.tsx`

- Import `nordicStructureData` from `./data/profiles/nordic-structure.json` and `frStructureData` from `./data/profiles/fr-structure.json`
- New `PROFILE_STRUCTURES` map alongside existing `PROFILES` map
- New state: `selectedNode: StructureNode | null` (reset when profile changes)
- Left panel: render `<ProfileStructureTree>` when `activeProfile !== null`, else `<ElementTree>`
- Right panel: render `<ProfileGuidePanel>` when `activeProfile !== null && selectedNode`, else `<AttributePanel>`
- Top bar: hide `<SearchBar>` and show profile label when `activeProfile !== null`

### `src/components/AttributePanel.tsx`

Extract the schema tab body into a named export `SchemaTab` so `ProfileGuidePanel` can reuse it without duplicating code:

```typescript
// AttributePanel.tsx — add named export
export function SchemaTab({ element, profileData, activeProfile }: SchemaTabProps) { … }
```

### `scripts/fetch-profiles.js`

Add a copy step for the two new structure files:

```javascript
// After writing nordic.json and fr.json:
for (const name of ['nordic-structure', 'fr-structure']) {
  const src = join(MANUAL_DIR, `${name}-manual.json`)
  const dst = join(PROFILES_DIR, `${name}.json`)
  if (existsSync(src)) {
    writeFileSync(dst, readFileSync(src))
    console.log(`Copied ${name}.json`)
  }
}
```

---

## Initial Structure Content

For the initial commit, `nordic-structure-manual.json` will cover the core Nordic profile export structure:

```
PublicationDelivery
  └── CompositeFrame
        ├── ResourceFrame (valgfri)
        │     └── organisations → [Authority, Operator]
        ├── FareFrame (påkrevd)
        │     ├── tariffs → [Tariff → fareStructureElements → [FareStructureElement]]
        │     ├── fareProducts → [PreassignedFareProduct, AmountOfPriceUnitProduct]
        │     └── usageParameters → [UserProfile, RoundTrip, FrequencyOfUse, …]
        └── SalesOfferPackageFrame (valgfri)
              └── salesOfferPackages → [SalesOfferPackage → salesOfferPackageElements → […]]
```

`fr-structure-manual.json` starts as a stub (same top-level structure, descriptions in Norwegian based on the French profile's markdown documentation goals) — can be expanded later.

---

## Out of Scope

- Parsing markdown or XML examples from the French GitHub repo automatically
- Validation of loaded XML against the profile structure
- Editing or exporting the structure JSON from within the app
- Search/filtering within the structure tree (tree is small enough to navigate visually)

---

## Running

```bash
# After editing scripts/profiles/nordic-structure-manual.json:
npm run fetch-profiles

# Verify app:
npm run dev
```
