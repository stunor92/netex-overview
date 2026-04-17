# Design: Full NeTEx Model — Navigation Redesign

**Date:** 2026-04-17
**Status:** Approved

## Overview

Expand the netex-overview app from covering only NeTEx Part 3 (Fares) to covering the full NeTEx standard (Parts 1, 2, and 3). Redesign navigation so that the top bar chips select which part of the model to view, with finer granularity available in the sidebar. Remove clutter from ref-elements with no schema data, surfacing their descriptions inline in the attribute table instead.

---

## Section 1: Data Layer

### What changes
- `scripts/fetch-and-parse.js` is extended to also fetch XSD files from:
  - `xsd/netex_part_1/` (network topology: stops, lines, routes, network, organisations, etc.)
  - `xsd/netex_part_2/` (timetables: vehicle journeys, service journeys, timetable frames, etc.)
  - Part 3 and framework dirs remain as-is
- Each element in `netex-elements.json` gets a new field: `part: 1 | 2 | 3`
  - Framework elements that are shared across parts are assigned to whichever part primarily defines them, or tagged `part: 0` if they are purely structural base types
- New group names are introduced for Part 1 and Part 2 content, derived from the XSD directory structure (e.g. `StopPlace`, `Line`, `Route`, `Network`, `Journey`, `Timetable`, `DayType`, `Organisation`)
- `ElementGroup` union type in `src/types.ts` is extended with all new groups
- `NeTExElement` interface gets `part: 0 | 1 | 2 | 3`

### What does NOT change
- Ref-elements with no attributes remain in the JSON — their `description` field is needed for inline display in the attribute panel
- The existing Part 3 element groups and their colours are unchanged
- Profile data (FR, NO, UK) is unaffected

---

## Section 2: Top Navigation

### What changes
- The current search field + filter chips are removed from the top bar
- Four new chips replace them: `Alle | Del 1 | Del 2 | Del 3`
  - Del 1 label: «Del 1 · Nettverk & stoppesteder»
  - Del 2 label: «Del 2 · Rutetabeller»
  - Del 3 label: «Del 3 · Billetter & takster»
- When a part chip is active, a short description string appears to the right of the chips in the top bar, styled grey and italic, e.g.:
  - Del 1: «Stoppestedsstruktur, linjer, ruter og nettverkstopologi»
  - Del 2: «Avganger, kjøretøyruter, tidsplaner og tjenestekalender»
  - Del 3: «Takststruktur, billetter, salg og bruksvilkår»
- The search field moves to the sidebar (above the element list)
- The profile selector remains in the sidebar, unchanged

### State model
- `activeChip` expands from `string | null` to `'1' | '2' | '3' | null` (null = Alle)
- Chip state and profile state remain independent

---

## Section 3: Sidebar Element List

### What changes
- A search field is added at the top of the sidebar, above the group list (replaces the one removed from the top bar)
- Ref-elements with no `attributes` and no `inheritedAttributes` are hidden from the element list — they are never rendered as clickable rows
- Group headers are filtered to show only groups that belong to the `part` selected by the active chip (or all groups when «Alle» is active)
- The collapsible group structure, group colours, instance counts, and profile badges are preserved

### What does NOT change
- Profile mode (FR/NO/UK) still takes over the sidebar with `ProfileStructureTree`, as before

---

## Section 4: Inline Ref Descriptions in Attribute Panel

### What changes
- In `AttributePanel` / `SchemaTab`, when a `ref`-typed attribute's target element has no schema data (empty `attributes` and `inheritedAttributes`), the attribute row shows:
  - Type-kolonnen: type-navn som i dag, men uten klikkbar lenke (ingenting å navigere til)
  - Beskrivelse-kolonnen: attributtens egen `description` som normalt, etterfulgt av en liten kursiv grå linje med målementets `description` tekst (fra ref-elementet i JSON-en)
- This applies in both «Egne attributter» and «Arvet fra»-sections
- The `findLinkedElement` helper already resolves ref targets — the rendering logic in `attrRow` is updated to check for no-data and append the ref element's description in the Beskrivelse cell

### Example
```
Navn            Type           Kard.   Beskrivelse
PricingRuleRef  ref            0..1    Refers to the pricing rule applied.
                PricingRuleRef         Reference to a PRICING RULE.  ← italic grey, new
```

---

## Section 5: Right Panel Part Description

### What changes
- When a part chip is active but no element is selected, the right panel renders a part description card instead of «Velg et element i treet til venstre»
- The card contains:
  - Part number and name as heading (e.g. «Del 1 — Nett & stopp»)
  - A descriptive paragraph about what the part covers
  - Element count for this part (e.g. «247 elementer tilgjengelig»)
- When «Alle» is active and no element is selected, the existing placeholder text is shown as before (or a similar welcome card listing all three parts)

---

## Architecture Notes

- No new components are required — existing `ElementTree`, `AttributePanel`, `SearchBar`, and `App` are modified
- The `EXPORT_CHIPS` constant in `constants.ts` is replaced with a `PARTS` constant describing the three NeTEx parts and their group memberships
- Group-to-part mapping is either derived from the `part` field on each element, or encoded in the `PARTS` constant as a list of group names per part
- The data fetch script change is independent of the UI changes — the script can be run once to regenerate `netex-elements.json`, after which all UI changes follow

---

## Out of Scope

- No changes to profile data (FR, NO, UK) or the profile structure tree
- No changes to the XML instance loader
- No new components — edits only to existing files
- No deep linking or URL state
