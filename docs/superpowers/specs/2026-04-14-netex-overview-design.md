# NeTEx Part 3 Overview — Design Spec

**Date:** 2026-04-14
**Status:** Approved

---

## Goal

A React web app that gives developers and internal teams a visual, interactive reference for NeTEx Part 3 (Fares) element types, their attributes, and their inheritance structure. Data is parsed from the official NeTEx XSD schemas at build time. Users can also load NeTEx XML instance files and see actual values side-by-side with the schema.

---

## Users

- Developers implementing NeTEx in systems (need technical precision and depth)
- Internal team members working with NeTEx on a daily basis (need a quick reference)

---

## Architecture

### High-level flow

```
GitHub (NeTEx-CEN/NeTEx)
  └── xsd/netex_part_3/**/*.xsd    ──┐
  └── examples/functions/fares/*.xml ─┤  scripts/fetch-and-parse.js (Node.js)
                                      │
                              src/data/netex-elements.json
                              src/data/netex-examples.json
                                      │
                              Vite + React app (reads JSON, no runtime fetches)
```

### Repository structure

```
netex-overview/
├── scripts/
│   └── fetch-and-parse.js       # Node.js — fetches XSD + examples from GitHub API, outputs JSON
├── src/
│   ├── data/
│   │   ├── netex-elements.json  # Generated: all Part 3 element types, attributes, hierarchy
│   │   └── netex-examples.json  # Generated: bundled example XML files with metadata
│   ├── components/
│   │   ├── ElementTree.tsx      # Left panel — collapsible hierarchy tree
│   │   ├── AttributePanel.tsx   # Right panel — schema + instance detail view
│   │   ├── SearchBar.tsx        # Search input + group filter chips
│   │   └── ExampleLoader.tsx    # Built-in example browser + file upload/paste
│   ├── App.tsx                  # Layout shell
│   └── main.tsx
├── package.json
└── vite.config.ts
```

---

## Build script: `scripts/fetch-and-parse.js`

Runs manually (`node scripts/fetch-and-parse.js`) or as a `package.json` script (`npm run fetch-schema`). Fetches fresh data from GitHub and regenerates the JSON bundles.

**Steps:**

1. Fetch all XSD files under `xsd/netex_part_3/` via GitHub API (no auth needed for public repo)
2. Parse XML using `fast-xml-parser`
3. Resolve the NeTEx class hierarchy:
   - `xsd:complexType` with `xsd:extension base="..."` → parent/child inheritance chains
   - `substitutionGroup` on abstract elements → concrete subtype groupings
   - `xsd:group` references → flatten attribute lists per element
4. For each concrete element type, output: name, abstract flag, parent, group label, description, own attributes, inherited-from chain
5. Fetch example files from `examples/functions/fares/` and store as raw XML strings with filename metadata
6. Write `src/data/netex-elements.json` and `src/data/netex-examples.json`

---

## Data model

### `netex-elements.json`

```json
[
  {
    "name": "PreassignedFareProduct",
    "abstract": false,
    "parent": "FareProduct",
    "group": "FareProduct",
    "description": "A FARE PRODUCT consisting of one or more VALIDABLE ELEMENTs...",
    "inheritedFrom": ["FareProduct", "ServiceAccessRight", "PriceableObject", "DataManagedObject"],
    "attributes": [
      {
        "name": "ProductType",
        "type": "ProductTypeEnumeration",
        "kind": "enum",
        "minOccurs": "0",
        "maxOccurs": "1",
        "description": "singleTrip, timeLimitedSingleTrip, dayReturn, periodReturn, multiStepTrip, dayPass, periodPass, other"
      }
    ],
    "inheritedAttributes": [
      {
        "name": "TariffRef",
        "inheritedFrom": "FareProduct",
        "type": "TariffRefStructure",
        "kind": "ref",
        "minOccurs": "0",
        "maxOccurs": "unbounded",
        "description": "Reference to TARIFF."
      }
    ]
  }
]
```

**`kind` values:** `enum`, `ref`, `list`, `complex`, `string`, `boolean`, `integer`, `decimal`

### `netex-examples.json`

```json
[
  {
    "filename": "Netex_51.1_Bus_SimpleFares_PointToPoint_SingleProduct.xml",
    "label": "Bus — Simple Fares, Point-to-Point, Single Product",
    "xml": "<PublicationDelivery ...>...</PublicationDelivery>"
  }
]
```

---

## UI layout

### Top bar
- Search input — filters tree + highlights matches
- Group filter chips: FareProduct · FarePrice · SalesOfferPackage · FareStructureElement · UsageParameter · (All)
- Right side: "Load XML" button (file picker or paste dialog) + "Examples" dropdown

### Left panel (260px, fixed)
- Collapsible hierarchy tree
- Root nodes are group labels (colour-coded per group)
- Abstract types shown as expandable parents; concrete types as leaf nodes
- When an XML file is loaded: green badge on each node showing instance count in file (hidden if 0)
- Selected node highlighted with left border accent

### Right panel (flex: 1)
- **Header:** element name + group badge + inheritance breadcrumb
- **Tabs:** "Schema" | "XML instance" (second tab disabled when no file is loaded)

**Schema tab:**
- Description text
- "Own attributes" table: Name · Type · Cardinality · Description
- "Inherited attributes" section (dimmed, collapsible per ancestor)

**XML instance tab:**
- Instance selector (pill buttons, one per occurrence in file)
- Attribute-value table for the selected instance: Attribute · Value · Type
- Raw XML block at the bottom (syntax-highlighted, monospace)

---

## Tech stack

| Concern | Choice | Reason |
|---|---|---|
| Bundler | Vite | Fast, zero-config for React |
| UI | React + TypeScript | As requested |
| XML parse (build) | fast-xml-parser | Lightweight, no DOM needed |
| Tree component | Recursive React component + `useState` | Expand/collapse per node, no external dep needed |
| Styling | Tailwind CSS | Utility-first, pairs naturally with Vite, no extra build config |
| GitHub fetch | Native `fetch` in Node 18+ | No extra deps needed |

---

## Scope — what is NOT included (v1)

- Validation of loaded XML against the XSD schema
- NeTEx Part 1 (Network) or Part 2 (Timetable) elements
- Editing or creating NeTEx XML
- User accounts, persistence, or sharing

---

## Running the app

```bash
# Initial setup / refresh schema data
npm run fetch-schema

# Start dev server
npm run dev
```
