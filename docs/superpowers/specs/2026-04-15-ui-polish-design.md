# UI Polish — Sub-project A Design Spec

## Goal

Replace the 19 group-chips with 5 export-type chips, improve profile status visibility with colored borders and text badges, and migrate remaining native HTML elements to Entur components.

## Approach

Sequential: chips first, then profile visibility, then Entur migration. Each step is independently committable and reviewable.

---

## Section 1: Chip Restructuring

### Problem
The top bar currently shows one `FilterChip` per NeTEx element group — 19 chips total. This is too many to scan, and the grouping doesn't reflect how users think about building NeTEx exports.

### Solution
Replace with 5 export-type chips plus "Alle". Each chip filters the sidebar to the element groups needed for that export type.

### Shared constant — `src/constants.ts` (new file)

```typescript
export const EXPORT_CHIPS: { key: string; label: string; sub: string; groups: string[] }[] = [
  {
    key: 'tariff',
    label: 'Tariff',
    sub: 'struktur',
    groups: ['Tariff', 'FareZone', 'FareStructureElement', 'GeographicStructureFactor',
             'QualityStructureFactor', 'TimeStructureFactor', 'DistanceMatrixElement',
             'FareSeries', 'ValidableElement'],
  },
  {
    key: 'fareproduct',
    label: 'FareProduct',
    sub: 'typer',
    groups: ['FareProduct'],
  },
  {
    key: 'faretable',
    label: 'FareTable',
    sub: 'priser',
    groups: ['FareTable', 'FarePrice', 'PricingRule'],
  },
  {
    key: 'salesoffer',
    label: 'SalesOffer',
    sub: 'salg',
    groups: ['SalesOfferPackage', 'DistributionChannel', 'FulfilmentMethod', 'TypeOfTravelDocument'],
  },
  {
    key: 'usageparam',
    label: 'UsageParam',
    sub: 'vilkår',
    groups: ['UsageParameter'],
  },
]
```

Chip display: `"Tariff · struktur"` (NeTEx name + muted Norwegian subtitle).

### State changes

- `App.tsx`: `activeGroup: string | null` → `activeChip: string | null`
- `SearchBar.tsx` props: remove `groups: string[]`, rename `activeGroup` → `activeChip`, `onGroupChange` → `onChipChange`
- `ElementTree.tsx` props: rename `activeGroup` → `activeChip: string | null`

### Filtering logic

`ElementTree.tsx` — replace `el.group !== activeGroup` with:

```typescript
const activeChipDef = activeChip ? EXPORT_CHIPS.find(c => c.key === activeChip) : null
// in filter:
if (activeChipDef && !activeChipDef.groups.includes(el.group)) return false
```

Elements whose group doesn't appear in any chip (e.g. "Other") are only visible when "Alle" is selected.

### `SearchBar.tsx` chip rendering

```tsx
<FilterChip value="" checked={activeChip === null} onChange={() => onChipChange(null)}>
  Alle
</FilterChip>
{EXPORT_CHIPS.map((chip) => (
  <FilterChip
    key={chip.key}
    value={chip.key}
    checked={activeChip === chip.key}
    onChange={() => onChipChange(activeChip === chip.key ? null : chip.key)}
  >
    {chip.label} <span style={{ color: '#aaa', fontWeight: 400 }}>· {chip.sub}</span>
  </FilterChip>
))}
```

---

## Section 2: Profile Visibility

### Problem
Current state: symbol-only badges (✓ ~ ✕) with no label; `opacity: 0.35` is too subtle for not-in-profile elements; no distinction between "no profile selected" and "element not in profile".

### Solution (Option C — border + text badge + legend)

#### Colored left border on element rows

Border color is driven by `profileStatus`:

| Status | Border color | Opacity |
|--------|-------------|---------|
| `required` | `#2e7d32` (green) | 1 |
| `optional` | `#1565c0` (blue) | 1 |
| `not-in-profile` | `#e0e0e0` (grey) | 0.5 |
| `undefined` (no profile / unknown) | `transparent` | 1 |

The `borderLeft` style on element row buttons:

```typescript
const borderColor =
  profileStatus === 'required' ? '#2e7d32' :
  profileStatus === 'optional' ? '#1565c0' :
  profileStatus === 'not-in-profile' ? '#e0e0e0' :
  'transparent'
```

#### Updated `ProfileBadge` — symbol + text label

```tsx
function ProfileBadge({ status }: { status: ProfileStatus | undefined }) {
  if (!status) return null
  if (status === 'required') return (
    <span style={{ background: '#e8f5e9', color: '#2e7d32', fontSize: '9px',
                   padding: '1px 5px', borderRadius: '6px', fontWeight: 600, flexShrink: 0 }}>
      ✓ påkrevd
    </span>
  )
  if (status === 'optional') return (
    <span style={{ background: '#e3f2fd', color: '#1565c0', fontSize: '9px',
                   padding: '1px 5px', borderRadius: '6px', fontWeight: 600, flexShrink: 0 }}>
      ~ valgfri
    </span>
  )
  // not-in-profile
  return (
    <span style={{ background: '#f5f5f5', color: '#aaa', fontSize: '9px',
                   padding: '1px 5px', borderRadius: '6px', flexShrink: 0 }}>
      ✕ ikke i profil
    </span>
  )
}
```

When a profile is active and an element has no entry in `profileData`, render an "ukjent" badge:

```tsx
// In element row rendering:
const profileStatus = profileData?.[el.name]?.status
const showUnknown = profileData !== null && profileStatus === undefined

// In badge area:
{profileData && profileStatus && <ProfileBadge status={profileStatus} />}
{showUnknown && (
  <span style={{ fontSize: '9px', color: '#ccc', border: '1px dashed #ddd',
                 padding: '1px 5px', borderRadius: '6px', flexShrink: 0 }}>
    ? ukjent
  </span>
)}
```

#### Legend

Shown below the profile `<select>`, only when `activeProfile !== null`:

```tsx
{activeProfile && (
  <div style={{ display: 'flex', gap: '10px', padding: '4px 10px 6px',
                fontSize: '10px', flexWrap: 'wrap' }}>
    <LegendItem color="#2e7d32" label="påkrevd" />
    <LegendItem color="#1565c0" label="valgfri" />
    <LegendItem color="#e0e0e0" label="ikke i profil" />
    <span style={{ color: '#ccc', fontStyle: 'italic' }}>╎ ukjent</span>
  </div>
)}
```

Where `LegendItem` is a tiny inline component:

```tsx
function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      <span style={{ display: 'inline-block', width: '3px', height: '12px',
                     background: color, borderRadius: '2px' }} />
      <span style={{ color: color === '#e0e0e0' ? '#aaa' : color }}>{label}</span>
    </span>
  )
}
```

---

## Section 3: Entur Component Migration

### Scope

Only two concrete changes — everything else is already using Entur or has no Entur equivalent.

#### `ExampleLoader.tsx` — `<textarea>` → `<TextArea>`

```tsx
import { TextArea, TextField } from '@entur/form'   // add TextArea

// Replace:
<textarea
  value={pasteXml}
  onChange={(e) => setPasteXml(e.target.value)}
  style={{ width: '100%', height: '256px', ... }}
  placeholder="..."
/>

// With:
<TextArea
  label="NeTEx XML"
  value={pasteXml}
  onChange={(e) => setPasteXml(e.target.value)}
  style={{ width: '100%', height: '256px', fontFamily: 'monospace', fontSize: '12px' }}
  placeholder="<PublicationDelivery ...>...</PublicationDelivery>"
/>
```

#### `ElementTree.tsx` — section labels → `<Label>`

```tsx
import { Label } from '@entur/typography'

// Replace the "Profil" span:
<Label>Profil</Label>

// Replace the "Elementer" div:
<Label style={{ padding: '8px 12px 4px', display: 'block' }}>Elementer</Label>
```

---

## Files Touched

| File | Change |
|------|--------|
| `src/constants.ts` | New — `EXPORT_CHIPS` constant |
| `src/App.tsx` | `activeGroup` → `activeChip`; remove `groups` derivation |
| `src/components/SearchBar.tsx` | Static 5 chips from `EXPORT_CHIPS`; remove `groups` prop |
| `src/components/ElementTree.tsx` | `activeGroup` → `activeChip`; colored borders; updated `ProfileBadge`; legend; `Label` |
| `src/components/ExampleLoader.tsx` | `<textarea>` → `<TextArea>` |

---

## Out of Scope

- Sub-project B (structural NeTEx export guides with annotated XML) — separate spec
- Installing new Entur packages (no `@entur/select`, no `@entur/tag` needed)
- Changing `AttributePanel.tsx` profile badges (already uses `BADGE_CONFIG` pattern, consistent with new `ProfileBadge` style)
