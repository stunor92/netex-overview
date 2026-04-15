# NeTEx Profile Selection — Design Spec

**Goal:** Add a profile selector to the NeTEx Part 3 overview app that annotates elements and attributes with their status in a selected NeTEx profile (French or Nordic), while keeping all elements visible.

---

## Profiles Supported

| Profile | Label | Data Source |
|---|---|---|
| *(none)* | — Ingen profil | No annotations shown |
| French | 🇫🇷 Fransk profil | Auto-parsed from `etalab/transport-profil-netex-fr` XSD files |
| Nordic | 🇳🇴 Nordisk profil | Manually curated JSON file |

---

## Profile Data Format

Each profile is stored as a pre-generated JSON file at `src/data/profiles/<id>.json`:

```jsonc
{
  "PreassignedFareProduct": {
    "status": "required",        // "required" | "optional" | "not-in-profile"
    "attributes": {
      "ProductType": "required",
      "ConditionSummaryRef": "optional",
      "ChargingMomentRef": "not-in-profile"
    }
  },
  "SaleDiscountRight": {
    "status": "not-in-profile",
    "attributes": {}
  }
}
```

Elements not present in the profile JSON have no annotation (unknown status).

---

## Script Architecture

### New script: `scripts/fetch-profiles.js`

Run via `npm run fetch-profiles`. Two independent functions:

**French profile (auto-parse):**
- Fetches XSD files from `https://github.com/etalab/transport-profil-netex-fr`
- Parses `xs:complexType` restrictions to extract element/attribute cardinality:
  - `minOccurs > 0` → `"required"`
  - `minOccurs = 0` → `"optional"`
  - Present in base type but absent from restriction → `"not-in-profile"`
- Maps results against existing `netex-elements.json` element names
- Outputs `src/data/profiles/fr.json`

> Note: exact XSD structure of the French profile repo must be inspected during implementation. Parser may need adjustment based on actual file layout.

**Nordic profile (manual):**
- Reads `scripts/profiles/nordic-manual.json` (hand-maintained)
- Validates format, copies to `src/data/profiles/nordic.json`

### Existing script unchanged

`scripts/fetch-and-parse.js` is not modified.

### `package.json` addition

```json
"fetch-profiles": "node scripts/fetch-profiles.js"
```

---

## TypeScript Types (`src/types.ts`)

```typescript
export type ProfileStatus = 'required' | 'optional' | 'not-in-profile'

export interface ProfileElementData {
  status: ProfileStatus
  attributes: Record<string, ProfileStatus>
}

// Keyed by element name
export type ProfileData = Record<string, ProfileElementData>

export type ActiveProfile = 'fr' | 'nordic' | null
```

---

## React Architecture

### State in `App.tsx`

```typescript
const [activeProfile, setActiveProfile] = useState<ActiveProfile>(null)
```

Profile JSON files are imported statically:

```typescript
import frProfile from './data/profiles/fr.json'
import nordicProfile from './data/profiles/nordic.json'

const PROFILES: Record<string, ProfileData> = {
  fr: frProfile as ProfileData,
  nordic: nordicProfile as ProfileData,
}

const profileData = activeProfile ? PROFILES[activeProfile] : null
```

`profileData` and `activeProfile` are passed as props to `ElementTree` and `AttributePanel`.

### Profile selector

Rendered inside `ElementTree` (above the "Elementer" label in the sidebar), as a native `<select>` styled with `@entur/tokens` CSS variables. State lives in `App.tsx`; `ElementTree` receives `activeProfile: ActiveProfile` and `onProfileChange: (p: ActiveProfile) => void` as props.

### `ElementTree.tsx` changes

New props: `profileData: ProfileData | null`

For each element item:
- Look up `profileData?.[el.name]?.status`
- `"required"` → green ✓ badge (`background: #e8f5e9; color: #2e7d32`)
- `"optional"` → blue ~ badge (`background: #e3f2fd; color: #1565c0`)
- `"not-in-profile"` → grey ✕ badge, element row dimmed to `opacity: 0.35`, name has `text-decoration: line-through`
- `undefined` (no data) → no badge, normal display

### `AttributePanel.tsx` changes

New prop: `profileData: ProfileData | null`

When `profileData` is set:
- Show a "Profil" column header with flag emoji (🇫🇷 or 🇳🇴) in attribute tables
- For each attribute row, look up `profileData[element.name]?.attributes[attr.name]`
- Same badge style as element-level: green påkrevd / blue valgfri / grey ikke i profil
- Attributes with `"not-in-profile"` status: row dimmed (`opacity: 0.4`), name strikethrough
- Profile status also shown in the element header: e.g. `✓ Påkrevd — Fransk profil`

---

## Annotation Badges

| Status | Label | Style |
|---|---|---|
| `required` | ✓ påkrevd | `background: #e8f5e9; color: #2e7d32` |
| `optional` | ~ valgfri | `background: #e3f2fd; color: #1565c0` |
| `not-in-profile` | ✕ ikke i profil | `background: #f5f5f5; color: #aaa` + row dimmed |
| *(no data)* | — | No badge |

---

## GitHub Actions

File: `.github/workflows/update-data.yml`

Runs on schedule: `cron: '0 2 * * *'` (02:00 UTC nightly)

Steps:
1. `actions/checkout@v4` with `token: ${{ secrets.GITHUB_TOKEN }}`
2. `actions/setup-node@v4` with Node 20
3. `npm ci`
4. `npm run fetch-schema`
5. `npm run fetch-profiles`
6. Commit and push any changes to `main` with message `chore: update NeTEx data [skip ci]`
7. Uses `git diff --quiet` check — skips commit step if nothing changed

The `[skip ci]` tag prevents Vercel from double-deploying (Vercel will pick up the push naturally).

---

## Vercel Hosting

- Connect GitHub repo to Vercel project
- Build command: `npm run build` (data already committed in repo)
- Output directory: `dist`
- Auto-deploy on every push to `main` (triggered by nightly data commit)
- No `vercel.json` required for a standard Vite SPA

---

## Files Changed / Created

| File | Change |
|---|---|
| `src/types.ts` | Add `ProfileStatus`, `ProfileElementData`, `ProfileData`, `ActiveProfile` |
| `src/App.tsx` | Add `activeProfile` state, import profile JSONs, pass props |
| `src/components/ElementTree.tsx` | Profile selector UI, element badges, dim not-in-profile |
| `src/components/AttributePanel.tsx` | Profile column in tables, header badge |
| `src/data/profiles/fr.json` | Generated French profile data |
| `src/data/profiles/nordic.json` | Generated Nordic profile data |
| `scripts/fetch-profiles.js` | New fetch+parse script |
| `scripts/profiles/nordic-manual.json` | Manual Nordic profile source |
| `package.json` | Add `fetch-profiles` script |
| `.github/workflows/update-data.yml` | Nightly cron job |

---

## What Does NOT Change

- `scripts/fetch-and-parse.js` — unchanged
- `scripts/parser/` — unchanged
- All existing tests — unchanged
- `vite.config.ts` — unchanged
