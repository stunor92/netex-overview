# Quick Start Guide: Dynamisk Versjonsbytting

## Slik bruker du den nye funksjonen

### 1️⃣ Første gangs oppsett

```bash
# Installer avhengigheter
npm install

# Hent ALLE NeTEx-versjoner fra GitHub
# ⚠️ Dette tar 5-15 minutter første gang
npm run fetch-schema

# Start utviklingsserveren
npm run dev
```

Du vil se output som dette:
```
=== NeTEx Multi-Version Fetch & Parse ===

🔍 Fetching available NeTEx versions from GitHub...
Found 4 versions: v1.3, v2.0, v2.1-wip, v3.0-wip

============================================================
Processing v1.3
============================================================
📦 Building elements for v1.3...
  ✓ Wrote netex-v1.3.json

============================================================
Processing v2.0
============================================================
📦 Building elements for v2.0...
  ✓ Wrote netex-v2.0.json

...og så videre for alle versjoner
```

### 2️⃣ Bytt versjon i appen

Når appen kjører, se øverst til høyre:

```
┌─────────────────────────────────────────────────────────┐
│ NeTEx-utforsker                                        │
│                                                         │
│  🌿 Versjon: [v2.0 (stable) ▼]  📄 Last eksempel...   │
└─────────────────────────────────────────────────────────┘
```

1. Klikk på dropdown-menyen ved branch-ikonet 🌿
2. Velg ønsket versjon (f.eks. "v2.1-wip")
3. Se "Laster..." mens data hentes
4. Utforsk den nye versjonen! ✨

### 3️⃣ Hva skjer når du bytter versjon?

- ✅ Alle elementer oppdateres til valgt versjon
- ✅ Alle attributter oppdateres
- ✅ Alle enums oppdateres
- ✅ Alle eksempler oppdateres
- ✅ **Ingen rebuild nødvendig!**

## Versjonsoversikt

| Versjon | Status | Beskrivelse | Bruk når... |
|---------|--------|-------------|-------------|
| v1.3 | Eldre stabil | Legacy-versjon | Du jobber med eldre systemer |
| v2.0 | **STABLE** ⭐ | Anbefalt | Normalt bruk (standard) |
| v2.1-wip | Work in progress | Neste versjon | Du vil se fremtidige endringer |
| v3.0-wip | Work in progress | Fremtidig | Du vil se langsiktige planer |

## Teknisk info

### Filstørrelse
- Hver versjon: ~3-5 MB JSON
- Totalt for 4 versjoner: ~15-20 MB
- Laster kun én versjon av gangen

### Laste-tid
- Første lasting: ~200-500ms
- Påfølgende bytter: ~100-300ms (fra cache)
- Ingen server round-trip nødvendig

### Data-struktur
```
src/data/
├── versions/                    # Alle versjoner lagres her
│   ├── netex-v1.3.json         # Full data for v1.3
│   ├── netex-v2.0.json         # Full data for v2.0
│   ├── netex-v2.1-wip.json     # Full data for v2.1-wip
│   └── netex-v3.0-wip.json     # Full data for v3.0-wip
└── versions-manifest.json       # Metadata om alle versjoner
```

Hver versjonsfil inneholder:
```json
{
  "version": "v2.0",
  "elements": [...],      // Alle NeTEx-elementer
  "enums": {...},         // Alle enumerasjoner
  "examples": [...],      // Alle XML-eksempler
  "fetchedAt": "2026-04-17T..."
}
```

## Feilsøking

### "Failed to load version"
- ✅ Sjekk at du har kjørt `npm run fetch-schema`
- ✅ Sjekk at `src/data/versions/` inneholder JSON-filer
- ✅ Se i browser console for detaljer

### "No versions available"
- ✅ Sjekk at `versions-manifest.json` finnes
- ✅ Kjør `npm run fetch-schema` på nytt

### Versjonen laster ikke
- ✅ Åpne DevTools → Network-fanen
- ✅ Se om JSON-filen lastes
- ✅ Sjekk for CORS eller 404-feil

## Pro tips

### 💡 Sammenlign versjoner
1. Åpne et element i v2.0
2. Noter hvilke attributter som finnes
3. Bytt til v2.1-wip
4. Se nye attributter markert i grønt!

### 💡 Test med ulike versjoner
- Bruk v1.3 for eldre XML-filer
- Bruk v2.0 for produksjonssystemer
- Bruk v2.1-wip for å forberede oppdateringer

### 💡 Oppdater versjoner
```bash
# Hent nye versjoner fra GitHub
npm run fetch-schema

# Ingen rebuild nødvendig!
# Bare refresh nettleseren
```

## Neste steg

Vil du bidra? Se:
- `docs/VERSJONSSTOTTE.md` for teknisk dokumentasjon
- `IMPLEMENTATION_SUMMARY.md` for implementeringsdetaljer
- `README.md` for generell informasjon

