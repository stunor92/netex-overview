# NeTEx Dynamisk Versjonsstøtte - Implementeringsoppsummering

## Endringer implementert (April 17, 2026)

### Arkitektur

Appen støtter nå **dynamisk bytte mellom NeTEx-versjoner** uten å måtte bygge appen på nytt. Alle versjoner hentes én gang og lagres i separate filer.

### 1. Multi-versjon fetching
**Fil:** `scripts/fetch-and-parse.js`

Scriptet har blitt omskrevet til å:
- 🔍 Hente alle tilgjengelige branches dynamisk fra GitHub API
- 📦 Parse og lagre hver versjon separat
- 📋 Generere en manifest-fil med metadata om alle versjoner

**Nye funksjoner:**
- `fetchBranches()` - Henter alle v*.* branches fra GitHub (filtrerer bort changelog-branches)
- `buildElementsJson(version)` - Bygger elementer for en spesifikk versjon
- `buildExamplesJson(version)` - Bygger eksempler for en spesifikk versjon

**Branch-filter:**
- Aksepterer: `vX.Y` (f.eks. v1.3, v2.0) eller `vX.Y-wip` (f.eks. v2.1-wip, v3.0-wip)
- Filtrerer bort: `v2.0-changelog-update`, `v2_remove_unique`, osv.

**Outputfiler:**
```
src/data/
├── versions/
│   ├── netex-v1.3.json      # v1.3 data
│   ├── netex-v2.0.json      # v2.0 data
│   ├── netex-v2.1-wip.json  # v2.1-wip data
│   └── netex-v3.0-wip.json  # v3.0-wip data
├── versions-manifest.json    # Metadata om alle versjoner
├── netex-elements.json       # v2.0 (bakoverkompatibilitet)
├── netex-enums.json          # v2.0 (bakoverkompatibilitet)
└── netex-examples.json       # v2.0 (bakoverkompatibilitet)
```

### 2. Dynamisk versjonslasting i appen
**Filer:** `src/App.tsx`, `src/types.ts`

**Nye types:**
- `VersionManifest` - Beskriver alle tilgjengelige versjoner
- `VersionInfo` - Metadata for én versjon
- `VersionData` - Fullstendige data for én versjon

**State management:**
- `availableVersions` - Liste over tilgjengelige versjoner fra manifest
- `versionData` - Nåværende lastede versjon (elements, enums, examples)
- `isLoadingVersion` - Loading state mens ny versjon lastes
- `netexVersion` - Valgt versjon

**useEffect hooks:**
1. Laster manifest ved oppstart → populerer `availableVersions`
2. Laster versjon-spesifikke data når `netexVersion` endres

### 3. UI forbedringer
**Fil:** `src/App.tsx`

- ✅ Branch-ikon (🌿) ved versjonvelgeren
- ✅ Loading-indikator mens versjon byttes
- ✅ Disabled state på dropdown mens laster
- ✅ "(stable)" label på v2.0
- ✅ Automatisk tilbakestilling av selection ved versjonsbytte

### 4. Utvidet netex_framework dekking
Alle 5 undermapper i `netex_framework` inkluderes:
- ✅ `netex_frames`
- ✅ `netex_genericFramework`
- ✅ `netex_responsibility`
- ✅ `netex_reusableComponents`
- ✅ `netex_utility`

## Bruk

### Første gangs oppsett
```bash
# Installer avhengigheter
npm install

# Hent alle NeTEx-versjoner (kan ta 5-15 minutter)
npm run fetch-schema

# Start utviklingsserver
npm run dev
```

### Bytte versjon
1. Åpne appen i nettleseren
2. Finn versjonvelgeren øverst (med branch-ikon)
3. Velg ønsket versjon fra dropdown
4. Appen laster automatisk den nye versjonen

**Alt som oppdateres ved versjonsbytte:**
- ✅ **Elementer** - Nye/endrede element-typer
- ✅ **Enumerasjoner** - Nye verdier i enums (f.eks. PaymentMethodEnumeration)
- ✅ **Attributter** - Nye/endrede attributter på elementer
- ✅ **Eksempler** - XML-eksempler for den versjonen
- ✅ **Dokumentasjon** - Beskrivelser og metadata

## Teknisk implementering

### Versjonshåndtering

**Fetching (build-time):**
```javascript
// Hent branches
const branches = await fetchBranches()  // ['v1.3', 'v2.0', 'v2.1-wip', ...]

// For hver branch:
for (const version of branches) {
  const { elements, enums } = await buildElementsJson(version)
  const examples = await buildExamplesJson(version)
  
  // Lagre til fil
  writeFileSync(`versions/netex-${version}.json`, JSON.stringify({
    version, elements, enums, examples
  }))
}
```

**Loading (runtime):**
```typescript
useEffect(() => {
  async function loadVersionData() {
    const response = await fetch(`/src/data/versions/netex-${netexVersion}.json`)
    const data: VersionData = await response.json()
    setVersionData({ elements: data.elements, enums: data.enums, examples: data.examples })
  }
  loadVersionData()
}, [netexVersion])
```

## Fremtidige forbedringer

1. **Caching i browser:** Bruk IndexedDB for å cache versjonsfiler
2. **Lazy loading:** Last bare nødvendige deler av store versjoner
3. **Diff-visning:** Vis forskjeller mellom versjoner side-ved-side
4. **Version picker presets:** "Show only stable", "Show WIP versions"
5. **Service Worker:** Offline support med cached versjoner

## Testing

```bash
✓ npm run build        # Bygger uten feil
✓ npm run dev          # Starter utviklingsserver
✓ npm run fetch-schema # Henter alle versjoner
✓ Dynamisk versjonsbytte fungerer
✓ Branch-ikon vises korrekt
✓ Loading state fungerer
```

## Filstruktur

```
scripts/
└── fetch-and-parse.js        # Multi-version fetcher

src/
├── types.ts                  # Inkluderer VersionManifest, VersionData
├── App.tsx                   # Versjonshåndtering med useEffect
└── data/
    ├── versions/
    │   ├── netex-v1.3.json
    │   ├── netex-v2.0.json
    │   ├── netex-v2.1-wip.json
    │   └── netex-v3.0-wip.json
    └── versions-manifest.json
```


