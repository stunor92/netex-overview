# NeTEx-utforsker

En interaktiv applikasjon for å utforske NeTEx-standarden (Network Timetable Exchange).

## Funksjoner

- 📊 Utforsk NeTEx-elementene organisert i 3 deler (Nettverk, Rutetabeller, Billetter)
- 🔍 Søk etter elementer og attributter
- 🌍 Se nasjonale profiler (Nordisk, Britisk, Fransk)
- 📚 Vis eksempeldata og validering
- 🔢 Utforsk enumerasjoner med gyldige verdier
- 🔄 Velg mellom ulike NeTEx-versjoner (v1.3, v2.0, v2.1-wip, v3.0-wip)

## Kom i gang

### Installasjon

```bash
npm install
```

### Hent NeTEx-schema

Før du kan bruke appen, må du hente NeTEx-schema fra GitHub:

```bash
# Hent standard versjon (v2.0)
npm run fetch-schema

# Eller hent en spesifikk versjon
npm run fetch-schema:v1.3   # NeTEx v1.3
npm run fetch-schema:v2.0   # NeTEx v2.0 (stabil)
npm run fetch-schema:v2.1   # NeTEx v2.1 (arbeidskopi)
npm run fetch-schema:v3.0   # NeTEx v3.0 (arbeidskopi)
```

### Kjør appen

```bash
# Utviklingsmodus
npm run dev

# Bygg for produksjon
npm run build

# Forhåndsvis produksjonsbygg
npm run preview
```

## NeTEx-versjoner

Appen støtter dynamisk bytte mellom flere NeTEx-versjoner:

- **v1.3**: Eldre stabil versjon
- **v2.0**: Nåværende stabil versjon (anbefalt)
- **v2.1-wip**: Arbeidskopi - neste versjon under utvikling
- **v3.0-wip**: Arbeidskopi - fremtidig hovedversjon

### Slik bytter du versjon

1. Velg ønsket versjon i nedtrekksmenyen øverst i appen (med branch-ikonet 🌿)
2. Appen laster automatisk den valgte versjonen uten at du trenger å bygge på nytt
3. Alle elementer, attributter, **enumerasjoner** og eksempler oppdateres til den valgte versjonen

**Eksempel:** Når du bytter fra v2.0 til v2.1-wip:
- Nye element-typer vises
- Nye verdier i enums (f.eks. `PaymentMethodEnumeration`) blir tilgjengelige
- Oppdaterte attributter og beskrivelser lastes inn

Versjoner hentes dynamisk fra GitHub når du kjører `npm run fetch-schema`, så appen vil alltid ha de nyeste versjonene tilgjengelig.

## NeTEx Framework

Appen henter nå data fra alle undermapper i `netex_framework`:

- `netex_frames` - Rammestrukturer
- `netex_genericFramework` - Generisk rammeverk
- `netex_responsibility` - Ansvarsområder
- `netex_reusableComponents` - Gjenbrukbare komponenter
- `netex_utility` - Hjelpefunksjoner

## Nasjonale profiler

Appen støtter visning av nasjonale NeTEx-profiler:

- 🇳🇴 **Nordisk profil** - Felles profil for Norge, Sverige, Danmark
- 🇬🇧 **Britisk profil** - UK Bus Open Data Service
- 🇫🇷 **Fransk profil** - Profil France

## Testing

```bash
# Kjør tester
npm test

# Kjør tester med UI
npm run test:ui
```

## Teknologier

- **React 19** - UI-bibliotek
- **TypeScript** - Type-sikkerhet
- **Vite** - Byggsystem
- **Entur Design System** - UI-komponenter
- **fast-xml-parser** - XML-parsing
- **Vitest** - Testing

## Bidra

Se [docs/superpowers/](docs/superpowers/) for planlegging og design-dokumenter.



