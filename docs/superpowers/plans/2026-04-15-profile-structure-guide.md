# Profile Structure Guide — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a NeTEx profile is active, replace the XSD-hierarchy element tree with a curated XML export structure tree, and replace the attribute detail panel with a profile guide panel (Norwegian descriptions + annotated XML template + schema tab for element nodes).

**Architecture:** Two new hand-curated JSON files per profile (`nordic-structure.json`, `fr-structure.json`) define the XML document tree. `fetch-profiles.js` copies them verbatim. `App.tsx` swaps `ElementTree`→`ProfileStructureTree` and `AttributePanel`→`ProfileGuidePanel` based on `activeProfile`. `SchemaTab` is extracted as a named export from `AttributePanel` so `ProfileGuidePanel` can reuse it for element nodes.

**Tech Stack:** React 18, TypeScript (strict), `@entur/tab`, `@entur/typography`. Verification: `npx tsc -p tsconfig.app.json --noEmit` + visual check in `npm run dev`.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/types.ts` | Modify | Add `StructureNodeType`, `StructureNode`, `ProfileStructure` |
| `scripts/profiles/nordic-structure-manual.json` | Create | Hand-curated Nordic export structure (source of truth) |
| `scripts/profiles/fr-structure-manual.json` | Create | French export structure stub |
| `scripts/fetch-profiles.js` | Modify | Add copy step for structure files |
| `src/data/profiles/nordic-structure.json` | Generated | Copied from manual source by fetch-profiles |
| `src/data/profiles/fr-structure.json` | Generated | Copied from manual source by fetch-profiles |
| `src/components/AttributePanel.tsx` | Modify | Export `SchemaTab` as named export |
| `src/components/ProfileStructureTree.tsx` | Create | Left panel: collapsible XML export structure tree |
| `src/components/ProfileGuidePanel.tsx` | Create | Right panel: Beskrivelse / XML-mal / Skjema tabs |
| `src/App.tsx` | Modify | Load structure JSONs, swap panels when profile active, hide SearchBar |

---

## Task 1: TypeScript types

**Files:**
- Modify: `src/types.ts`

- [ ] **Step 1: Append three new types at the end of `src/types.ts`**

Open `src/types.ts` and add after the last line:

```typescript
// --- Profile structure guide types ---

export type StructureNodeType = 'container' | 'collection' | 'element'

export interface StructureNode {
  id: string
  type: StructureNodeType
  label: string
  description: string
  xmlSnippet: string
  elementRef?: string        // only for type === 'element'; matches NeTExElement.name
  children: StructureNode[]
}

export interface ProfileStructure {
  profile: string
  label: string
  root: StructureNode
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc -p tsconfig.app.json --noEmit
```

Expected: no output (clean).

- [ ] **Step 3: Commit**

```bash
git add src/types.ts
git commit -m "feat: add StructureNode and ProfileStructure types for profile guide"
```

---

## Task 2: Nordic structure manual JSON

**Files:**
- Create: `scripts/profiles/nordic-structure-manual.json`

- [ ] **Step 1: Create `scripts/profiles/nordic-structure-manual.json`**

```json
{
  "profile": "nordic",
  "label": "Nordisk profil — Eksportstruktur",
  "root": {
    "id": "pub-delivery",
    "type": "container",
    "label": "PublicationDelivery",
    "description": "Rotelementet i alle NeTEx-filer. Inneholder versjonsinformasjon og selve dataene i én eller flere datarammer.",
    "xmlSnippet": "<PublicationDelivery version=\"1.0\" xmlns=\"http://www.netex.org.uk/netex\">\n  <PublicationTimestamp>2024-01-01T00:00:00</PublicationTimestamp>\n  <ParticipantRef>ENT</ParticipantRef>\n  <dataObjects>\n    <!-- Se CompositeFrame -->\n  </dataObjects>\n</PublicationDelivery>",
    "children": [
      {
        "id": "composite-frame",
        "type": "container",
        "label": "CompositeFrame",
        "description": "Samler alle datarammer for ett datasett. Påkrevd i nordisk profil — én CompositeFrame per fil.",
        "xmlSnippet": "<CompositeFrame id=\"ENT:CompositeFrame:1\" version=\"1\">\n  <codespaces>\n    <Codespace>\n      <Xmlns>ENT</Xmlns>\n      <XmlnsUrl>http://www.entur.org/ns/v1</XmlnsUrl>\n    </Codespace>\n  </codespaces>\n  <FrameDefaults>\n    <DefaultLocale>\n      <TimeZone>Europe/Oslo</TimeZone>\n      <DefaultLanguage>no</DefaultLanguage>\n    </DefaultLocale>\n  </FrameDefaults>\n  <frames>\n    <!-- ResourceFrame, FareFrame, SalesOfferPackageFrame -->\n  </frames>\n</CompositeFrame>",
        "children": [
          {
            "id": "resource-frame",
            "type": "container",
            "label": "ResourceFrame",
            "description": "Inneholder organisasjonsressurser som myndigheter og operatører. Valgfri, men nødvendig hvis du refererer til operatører fra billettkonfigurasjonen.",
            "xmlSnippet": "<ResourceFrame id=\"ENT:ResourceFrame:1\" version=\"1\">\n  <organisations>\n    <Authority id=\"ENT:Authority:ENT\" version=\"1\">\n      <Name>Entur</Name>\n    </Authority>\n    <Operator id=\"ENT:Operator:Ruter\" version=\"1\">\n      <Name>Ruter</Name>\n    </Operator>\n  </organisations>\n</ResourceFrame>",
            "children": [
              {
                "id": "organisations",
                "type": "collection",
                "label": "organisations",
                "description": "Liste over organisasjoner — myndigheter og operatører — som er relevante for billettkonfigurasjonen.",
                "xmlSnippet": "<organisations>\n  <Authority id=\"ENT:Authority:1\" version=\"1\"> … </Authority>\n  <Operator id=\"ENT:Operator:1\" version=\"1\"> … </Operator>\n</organisations>",
                "children": [
                  {
                    "id": "Authority",
                    "type": "element",
                    "elementRef": "Authority",
                    "label": "Authority",
                    "description": "Representerer en transportmyndighet (f.eks. Ruter, AtB, Skyss). Brukes som referanse i billettkonfigurasjonen for å angi hvem som eier tariffstrukturen.",
                    "xmlSnippet": "<!-- Myndighet som eier billettkonfigurasjonen -->\n<Authority id=\"ENT:Authority:Ruter\" version=\"1\">\n  <!-- Påkrevd: Name -->\n  <Name>Ruter</Name>\n</Authority>",
                    "children": []
                  },
                  {
                    "id": "Operator",
                    "type": "element",
                    "elementRef": "Operator",
                    "label": "Operator",
                    "description": "Representerer en transportoperatør som leverer reiser. Kan refereres til fra FareFrame for å knytte produkter til spesifikke operatører.",
                    "xmlSnippet": "<!-- Operatør som leverer transporten -->\n<Operator id=\"ENT:Operator:Ruter\" version=\"1\">\n  <!-- Påkrevd: Name -->\n  <Name>Ruter AS</Name>\n</Operator>",
                    "children": []
                  }
                ]
              }
            ]
          },
          {
            "id": "fare-frame",
            "type": "container",
            "label": "FareFrame",
            "description": "Inneholder alle billettstrukturer: tariffer, produkter og bruksparametere. Kjernen i en NeTEx-billettkonfigurasjon — påkrevd i nordisk profil.",
            "xmlSnippet": "<FareFrame id=\"ENT:FareFrame:1\" version=\"1\">\n  <tariffs> … </tariffs>\n  <fareProducts> … </fareProducts>\n  <usageParameters> … </usageParameters>\n</FareFrame>",
            "children": [
              {
                "id": "tariffs",
                "type": "collection",
                "label": "tariffs",
                "description": "Liste over tariffer. En Tariff definerer prisstrukturen og knyttes til FareStructureElements som beskriver gyldighetsregler.",
                "xmlSnippet": "<tariffs>\n  <Tariff id=\"ENT:Tariff:Enkeltbillett\" version=\"1\"> … </Tariff>\n</tariffs>",
                "children": [
                  {
                    "id": "Tariff",
                    "type": "element",
                    "elementRef": "Tariff",
                    "label": "Tariff",
                    "description": "Definerer den grunnleggende prisstrukturen for ett billettypenivå. Knyttes til FareStructureElements som beskriver gyldighetsregler (soner, tidsbegrensning osv.) og til FareProducts som bruker tariffen.",
                    "xmlSnippet": "<Tariff id=\"ENT:Tariff:Enkeltbillett\" version=\"1\">\n  <!-- Valgfri: Name -->\n  <Name>Enkeltbillett</Name>\n  <!-- Påkrevd: minst ett FareStructureElement -->\n  <fareStructureElements>\n    <FareStructureElement id=\"ENT:FSE:Zone\" version=\"1\"> … </FareStructureElement>\n  </fareStructureElements>\n</Tariff>",
                    "children": [
                      {
                        "id": "fare-structure-elements",
                        "type": "collection",
                        "label": "fareStructureElements",
                        "description": "Liste over gyldighetsregler knyttet til tariffen. Minimum én regel er nødvendig.",
                        "xmlSnippet": "<fareStructureElements>\n  <FareStructureElement id=\"ENT:FSE:Zone\" version=\"1\"> … </FareStructureElement>\n</fareStructureElements>",
                        "children": [
                          {
                            "id": "FareStructureElement",
                            "type": "element",
                            "elementRef": "FareStructureElement",
                            "label": "FareStructureElement",
                            "description": "Definerer én dimensjon av gyldighet for en tariff — for eksempel soner, tidsbegrensning eller antall reiser. Et element kan referere til UsageParameters for mer detaljerte regler.",
                            "xmlSnippet": "<FareStructureElement id=\"ENT:FSE:Zone\" version=\"1\">\n  <Name>Sonebasert gyldighet</Name>\n  <GenericParameterAssignment id=\"ENT:GPA:1\" version=\"1\" order=\"1\">\n    <limitations>\n      <UserProfile ref=\"ENT:UserProfile:Adult\" version=\"1\"/>\n    </limitations>\n  </GenericParameterAssignment>\n</FareStructureElement>",
                            "children": []
                          }
                        ]
                      }
                    ]
                  }
                ]
              },
              {
                "id": "fare-products",
                "type": "collection",
                "label": "fareProducts",
                "description": "Liste over billettprodukter. Et produkt kobles til en Tariff og definerer hva kunden kjøper.",
                "xmlSnippet": "<fareProducts>\n  <PreassignedFareProduct id=\"ENT:PreassignedFareProduct:Enkeltbillett\" version=\"1\"> … </PreassignedFareProduct>\n</fareProducts>",
                "children": [
                  {
                    "id": "PreassignedFareProduct",
                    "type": "element",
                    "elementRef": "PreassignedFareProduct",
                    "label": "PreassignedFareProduct",
                    "description": "Et forhåndsbestemt billettprodukt med fast definerte gyldighetsregler — for eksempel enkeltbillett eller periodebillett. Den vanligste produkttypen i nordisk profil.",
                    "xmlSnippet": "<PreassignedFareProduct id=\"ENT:PreassignedFareProduct:Enkeltbillett\" version=\"1\">\n  <!-- Påkrevd: Name -->\n  <Name>Enkeltbillett voksen</Name>\n  <!-- Valgfri: ProductType -->\n  <ProductType>singleTrip</ProductType>\n  <!-- Valgfri: ChargingMomentType -->\n  <ChargingMomentType>beforeTravel</ChargingMomentType>\n  <fareStructureElements>\n    <FareStructureElementRef ref=\"ENT:FSE:Zone\" version=\"1\"/>\n  </fareStructureElements>\n</PreassignedFareProduct>",
                    "children": []
                  },
                  {
                    "id": "AmountOfPriceUnitProduct",
                    "type": "element",
                    "elementRef": "AmountOfPriceUnitProduct",
                    "label": "AmountOfPriceUnitProduct",
                    "description": "Et produkt definert som et antall priseenheter — for eksempel et klippekort med 10 reiser. Valgfri i nordisk profil.",
                    "xmlSnippet": "<!-- Valgfri: AmountOfPriceUnitProduct -->\n<AmountOfPriceUnitProduct id=\"ENT:AmountOfPriceUnitProduct:Klipp10\" version=\"1\">\n  <Name>10-klipp voksen</Name>\n  <ProductType>multiStepTrip</ProductType>\n  <fareStructureElements>\n    <FareStructureElementRef ref=\"ENT:FSE:Zone\" version=\"1\"/>\n  </fareStructureElements>\n</AmountOfPriceUnitProduct>",
                    "children": []
                  }
                ]
              },
              {
                "id": "usage-parameters",
                "type": "collection",
                "label": "usageParameters",
                "description": "Liste over bruksparametere som styrer gyldighetsbetingelsene for produkter — hvem kan bruke dem, og under hvilke betingelser.",
                "xmlSnippet": "<usageParameters>\n  <UserProfile id=\"ENT:UserProfile:Adult\" version=\"1\"> … </UserProfile>\n  <RoundTrip id=\"ENT:RoundTrip:Single\" version=\"1\"> … </RoundTrip>\n</usageParameters>",
                "children": [
                  {
                    "id": "UserProfile",
                    "type": "element",
                    "elementRef": "UserProfile",
                    "label": "UserProfile",
                    "description": "Definerer hvilken passasjergruppe produktet gjelder for — voksen, barn, honnør, student osv. Refereres til fra FareStructureElement via GenericParameterAssignment.",
                    "xmlSnippet": "<UserProfile id=\"ENT:UserProfile:Adult\" version=\"1\">\n  <Name>Voksen</Name>\n  <!-- Type bruker: adult, child, senior etc. -->\n  <UserType>adult</UserType>\n  <!-- Valgfri: aldersgrenser -->\n  <MinimumAge>16</MinimumAge>\n</UserProfile>",
                    "children": []
                  },
                  {
                    "id": "RoundTrip",
                    "type": "element",
                    "elementRef": "RoundTrip",
                    "label": "RoundTrip",
                    "description": "Definerer om produktet gjelder for enkeltreise eller tur-retur. Påvirker gyldigheten til produktet.",
                    "xmlSnippet": "<RoundTrip id=\"ENT:RoundTrip:Single\" version=\"1\">\n  <Name>Enkeltreise</Name>\n  <TripType>single</TripType>\n</RoundTrip>",
                    "children": []
                  },
                  {
                    "id": "FrequencyOfUse",
                    "type": "element",
                    "elementRef": "FrequencyOfUse",
                    "label": "FrequencyOfUse",
                    "description": "Begrenser bruken av et produkt — for eksempel maks antall aktiveringer per dag. Brukes typisk for periodebilletter med bruksgrenser.",
                    "xmlSnippet": "<FrequencyOfUse id=\"ENT:FrequencyOfUse:Once\" version=\"1\">\n  <Name>Én gang per validering</Name>\n  <FrequencyOfUseType>single</FrequencyOfUseType>\n</FrequencyOfUse>",
                    "children": []
                  }
                ]
              }
            ]
          },
          {
            "id": "sales-offer-package-frame",
            "type": "container",
            "label": "SalesOfferPackageFrame",
            "description": "Inneholder salgspakker som definerer hvordan billetter selges og distribueres. Valgfri, men vanlig i nordisk profil for å spesifisere distribusjonskanaler og betalingsmetoder.",
            "xmlSnippet": "<SalesOfferPackageFrame id=\"ENT:SalesOfferPackageFrame:1\" version=\"1\">\n  <salesOfferPackages>\n    <SalesOfferPackage id=\"ENT:SalesOfferPackage:Enkeltbillett\" version=\"1\"> … </SalesOfferPackage>\n  </salesOfferPackages>\n</SalesOfferPackageFrame>",
            "children": [
              {
                "id": "sales-offer-packages",
                "type": "collection",
                "label": "salesOfferPackages",
                "description": "Liste over salgspakker. Hver pakke kobler ett eller flere produkter til salgs- og distribusjonsbetingelser.",
                "xmlSnippet": "<salesOfferPackages>\n  <SalesOfferPackage id=\"ENT:SalesOfferPackage:Enkeltbillett\" version=\"1\"> … </SalesOfferPackage>\n</salesOfferPackages>",
                "children": [
                  {
                    "id": "SalesOfferPackage",
                    "type": "element",
                    "elementRef": "SalesOfferPackage",
                    "label": "SalesOfferPackage",
                    "description": "Definerer en komplett salgspakke — kombinasjonen av ett eller flere billettprodukt med distribusjonsregler, prisinfo og mediebegrensninger. Det er SalesOfferPackage-en som faktisk selges til kunden.",
                    "xmlSnippet": "<SalesOfferPackage id=\"ENT:SalesOfferPackage:Enkeltbillett\" version=\"1\">\n  <!-- Påkrevd: Name -->\n  <Name>Enkeltbillett</Name>\n  <!-- Valgfri: Description -->\n  <Description>Enkeltbillett voksen, gyldig i alle soner</Description>\n  <salesOfferPackageElements>\n    <SalesOfferPackageElement id=\"ENT:SOPE:1\" version=\"1\" order=\"1\">\n      <PreassignedFareProductRef ref=\"ENT:PreassignedFareProduct:Enkeltbillett\" version=\"1\"/>\n    </SalesOfferPackageElement>\n  </salesOfferPackageElements>\n</SalesOfferPackage>",
                    "children": [
                      {
                        "id": "sales-offer-package-elements",
                        "type": "collection",
                        "label": "salesOfferPackageElements",
                        "description": "Liste over elementer som kobler billettprodukt til salgspakken. Én pakke kan ha flere elementer for kombinasjonsprodukter.",
                        "xmlSnippet": "<salesOfferPackageElements>\n  <SalesOfferPackageElement id=\"ENT:SOPE:1\" version=\"1\" order=\"1\">\n    <PreassignedFareProductRef ref=\"ENT:PreassignedFareProduct:1\" version=\"1\"/>\n  </SalesOfferPackageElement>\n</salesOfferPackageElements>",
                        "children": [
                          {
                            "id": "SalesOfferPackageElement",
                            "type": "element",
                            "elementRef": "SalesOfferPackageElement",
                            "label": "SalesOfferPackageElement",
                            "description": "Kobler ett billettprodukt (PreassignedFareProduct eller AmountOfPriceUnitProduct) til en salgspakke.",
                            "xmlSnippet": "<SalesOfferPackageElement id=\"ENT:SOPE:1\" version=\"1\" order=\"1\">\n  <PreassignedFareProductRef ref=\"ENT:PreassignedFareProduct:Enkeltbillett\" version=\"1\"/>\n</SalesOfferPackageElement>",
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
        ]
      }
    ]
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add scripts/profiles/nordic-structure-manual.json
git commit -m "feat: add Nordic profile export structure (manual source)"
```

---

## Task 3: French structure stub + fetch-profiles update

**Files:**
- Create: `scripts/profiles/fr-structure-manual.json`
- Modify: `scripts/fetch-profiles.js`

- [ ] **Step 1: Create `scripts/profiles/fr-structure-manual.json`**

```json
{
  "profile": "fr",
  "label": "Fransk profil — Eksportstruktur",
  "root": {
    "id": "pub-delivery",
    "type": "container",
    "label": "PublicationDelivery",
    "description": "Rotelementet i alle NeTEx-filer. Inneholder versjonsinformasjon og dataene i én eller flere datarammer.",
    "xmlSnippet": "<PublicationDelivery version=\"1.0\" xmlns=\"http://www.netex.org.uk/netex\">\n  <dataObjects> … </dataObjects>\n</PublicationDelivery>",
    "children": [
      {
        "id": "composite-frame",
        "type": "container",
        "label": "CompositeFrame",
        "description": "Samler alle datarammer for ett datasett.",
        "xmlSnippet": "<CompositeFrame id=\"FR1:CompositeFrame:1\" version=\"1\">\n  <frames> … </frames>\n</CompositeFrame>",
        "children": [
          {
            "id": "fare-frame",
            "type": "container",
            "label": "FareFrame",
            "description": "Inneholder billettstrukturer for den franske profilen. Detaljert struktur er under utarbeidelse.",
            "xmlSnippet": "<FareFrame id=\"FR1:FareFrame:1\" version=\"1\">\n  <!-- Innhold spesifiseres av den franske profilen -->\n</FareFrame>",
            "children": []
          }
        ]
      }
    ]
  }
}
```

- [ ] **Step 2: Add copy step to `scripts/fetch-profiles.js`**

In `scripts/fetch-profiles.js`, find the end of the `main()` function — after the line `console.log('Done.')` and before `}`. Add these lines **before** `console.log('Done.')`:

```javascript
  // Copy structure files verbatim from manual sources
  for (const name of ['nordic-structure', 'fr-structure']) {
    const src = join(MANUAL_DIR, `${name}-manual.json`)
    const dst = join(PROFILES_DIR, `${name}.json`)
    if (existsSync(src)) {
      writeFileSync(dst, readFileSync(src))
      console.log(`Copied ${name}.json`)
    } else {
      console.warn(`WARNING: ${src} not found — skipping`)
    }
  }
```

- [ ] **Step 3: Run fetch-profiles to generate the two new files**

```bash
npm run fetch-profiles
```

Expected output includes:
```
Copied nordic-structure.json
Copied fr-structure.json
Done.
```

Verify the files exist:
```bash
ls src/data/profiles/
```

Expected: `fr.json  fr-structure.json  nordic.json  nordic-structure.json`

- [ ] **Step 4: Commit**

```bash
git add scripts/profiles/fr-structure-manual.json scripts/fetch-profiles.js src/data/profiles/nordic-structure.json src/data/profiles/fr-structure.json
git commit -m "feat: add French structure stub and copy step in fetch-profiles"
```

---

## Task 4: Export SchemaTab from AttributePanel

**Files:**
- Modify: `src/components/AttributePanel.tsx`

- [ ] **Step 1: Export `SchemaTab` and its props interface**

In `src/components/AttributePanel.tsx`, find the `SchemaTab` function declaration on line 61:

```typescript
function SchemaTab({ element, profileData, activeProfile }: { element: NeTExElement; profileData: ProfileData | null; activeProfile: ActiveProfile }) {
```

Replace with:

```typescript
export interface SchemaTabProps {
  element: NeTExElement
  profileData: ProfileData | null
  activeProfile: ActiveProfile
}

export function SchemaTab({ element, profileData, activeProfile }: SchemaTabProps) {
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc -p tsconfig.app.json --noEmit
```

Expected: no output (clean).

- [ ] **Step 3: Commit**

```bash
git add src/components/AttributePanel.tsx
git commit -m "refactor: export SchemaTab from AttributePanel for reuse in ProfileGuidePanel"
```

---

## Task 5: ProfileStructureTree component

**Files:**
- Create: `src/components/ProfileStructureTree.tsx`

- [ ] **Step 1: Create `src/components/ProfileStructureTree.tsx`**

```tsx
import { useState } from 'react'
import { Label } from '@entur/typography'
import type { StructureNode, ProfileStructure, ProfileData, ActiveProfile, ProfileStatus } from '../types'

const STATUS_COLOR: Record<ProfileStatus, string> = {
  required: '#2e7d32',
  optional: '#1565c0',
  'not-in-profile': '#e0e0e0',
}

interface TreeNodeProps {
  node: StructureNode
  depth: number
  selectedNode: StructureNode | null
  onSelect: (node: StructureNode) => void
  profileData: ProfileData | null
}

function TreeNode({ node, depth, selectedNode, onSelect, profileData }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(true)
  const hasChildren = node.children.length > 0
  const isSelected = selectedNode?.id === node.id
  const profileStatus: ProfileStatus | undefined = node.elementRef
    ? profileData?.[node.elementRef]?.status
    : undefined
  const isNotInProfile = profileStatus === 'not-in-profile'

  const borderColor = isSelected
    ? '#1565c0'
    : profileStatus
      ? STATUS_COLOR[profileStatus]
      : node.type === 'container'
        ? '#e07b00'
        : 'transparent'

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          onSelect(node)
          if (hasChildren) setExpanded((e) => !e)
        }}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: `4px 10px 4px ${8 + depth * 12}px`,
          fontSize: '11px',
          cursor: 'pointer',
          background: isSelected
            ? '#e3f2fd'
            : node.type === 'container'
              ? '#fff8f0'
              : 'transparent',
          border: 'none',
          borderLeft: `3px solid ${borderColor}`,
          color: isNotInProfile ? '#bbb' : node.type === 'collection' ? '#888' : '#2a2a2a',
          fontStyle: node.type === 'collection' ? 'italic' : 'normal',
          fontWeight: node.type === 'container' ? 600 : isSelected ? 500 : 'normal',
          opacity: isNotInProfile ? 0.5 : 1,
          textAlign: 'left',
          textDecoration: isNotInProfile ? 'line-through' : 'none',
        }}
      >
        <span style={{ width: '10px', flexShrink: 0, fontSize: '9px', color: '#aaa' }}>
          {hasChildren ? (expanded ? '▼' : '▶') : '●'}
        </span>
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {node.label}
        </span>
        {node.type === 'element' && profileData && profileStatus && (
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: STATUS_COLOR[profileStatus],
            flexShrink: 0,
          }} />
        )}
      </button>
      {hasChildren && expanded && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedNode={selectedNode}
              onSelect={onSelect}
              profileData={profileData}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export interface ProfileStructureTreeProps {
  structure: ProfileStructure
  profileData: ProfileData | null
  selectedNode: StructureNode | null
  onSelect: (node: StructureNode) => void
  activeProfile: ActiveProfile
  onProfileChange: (p: ActiveProfile) => void
}

export function ProfileStructureTree({
  structure, profileData, selectedNode, onSelect, activeProfile, onProfileChange,
}: ProfileStructureTreeProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Profile selector */}
      <div style={{ borderBottom: '1px solid var(--colors-greys-grey80, #e0e0e0)', background: 'var(--colors-greys-white, #ffffff)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px' }}>
          <Label as="span" margin="none" style={{ fontSize: '10px', color: 'var(--colors-greys-grey50, #888)', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
            Profil
          </Label>
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
      </div>

      {/* Tree label */}
      <Label as="div" margin="none" style={{ padding: '6px 10px 3px', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', color: '#aaa' }}>
        Eksportstruktur
      </Label>

      {/* Tree */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '8px' }}>
        <TreeNode
          node={structure.root}
          depth={0}
          selectedNode={selectedNode}
          onSelect={onSelect}
          profileData={profileData}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc -p tsconfig.app.json --noEmit
```

Expected: no output (clean).

- [ ] **Step 3: Commit**

```bash
git add src/components/ProfileStructureTree.tsx
git commit -m "feat: add ProfileStructureTree component for profile-mode left panel"
```

---

## Task 6: ProfileGuidePanel component

**Files:**
- Create: `src/components/ProfileGuidePanel.tsx`

- [ ] **Step 1: Create `src/components/ProfileGuidePanel.tsx`**

```tsx
import { useState } from 'react'
import { Tabs, TabList, Tab, TabPanels, TabPanel } from '@entur/tab'
import type { StructureNode, NeTExElement, ProfileData, ActiveProfile, ProfileStatus } from '../types'
import { SchemaTab } from './AttributePanel'

const BADGE_CONFIG: Record<ProfileStatus, { bg: string; color: string; label: string; fw?: number }> = {
  required:          { bg: '#e8f5e9', color: '#2e7d32', label: '✓ påkrevd',       fw: 600 },
  optional:          { bg: '#e3f2fd', color: '#1565c0', label: '~ valgfri',        fw: 600 },
  'not-in-profile':  { bg: '#f5f5f5', color: '#aaa',    label: '✕ ikke i profil'         },
}

function StatusBadge({ status }: { status: ProfileStatus }) {
  const { bg, color, label, fw } = BADGE_CONFIG[status]
  return (
    <span style={{ background: bg, color, fontSize: '11px', padding: '2px 10px', borderRadius: '12px', fontWeight: fw }}>
      {label}
    </span>
  )
}

export interface ProfileGuidePanelProps {
  node: StructureNode
  nodePath: string[]
  allElements: NeTExElement[]
  profileData: ProfileData | null
  activeProfile: ActiveProfile
}

export function ProfileGuidePanel({ node, nodePath, allElements, profileData, activeProfile }: ProfileGuidePanelProps) {
  const [activeTabIdx, setActiveTabIdx] = useState(0)

  const element = node.elementRef
    ? allElements.find((e) => e.name === node.elementRef) ?? null
    : null
  const elementProfile = node.elementRef ? profileData?.[node.elementRef] : undefined
  const isElement = node.type === 'element'
  const breadcrumb = nodePath.slice(0, -1).join(' → ')

  const nodeTypeLabel =
    node.type === 'container' ? 'ramme' :
    node.type === 'collection' ? 'liste' :
    'element'

  return (
    <div>
      {/* Header */}
      <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid var(--colors-greys-grey80, #e0e0e0)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--colors-greys-grey10, #2a2a2a)' }}>
            {node.label}
          </span>
          <span style={{ fontSize: '11px', color: '#aaa', fontStyle: 'italic' }}>
            {nodeTypeLabel}
          </span>
          {elementProfile?.status && (
            <StatusBadge status={elementProfile.status} />
          )}
        </div>
        {breadcrumb && (
          <div style={{ fontSize: '11px', color: 'var(--colors-greys-grey50, #888)' }}>
            {breadcrumb} → <strong>{node.label}</strong>
          </div>
        )}
      </div>

      {/* Tabs — outside the header div */}
      <Tabs index={activeTabIdx} onChange={setActiveTabIdx}>
        <TabList>
          <Tab>Beskrivelse</Tab>
          <Tab>XML-mal</Tab>
          {isElement && <Tab>Skjema</Tab>}
        </TabList>
        <TabPanels>
          {/* Tab 1: Beskrivelse */}
          <TabPanel>
            <div style={{ padding: '16px' }}>
              <p style={{ fontSize: '13px', lineHeight: 1.7, color: 'var(--colors-greys-grey40, #555)', marginBottom: '16px', marginTop: 0 }}>
                {node.description}
              </p>

              {isElement && elementProfile && element && (
                <>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#aaa', fontWeight: 600, marginBottom: '8px' }}>
                    Attributter i profil
                  </div>
                  {Object.keys(elementProfile.attributes).length > 0 ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <tbody>
                        {[...element.attributes, ...element.inheritedAttributes].map((attr) => {
                          const attrStatus = elementProfile.attributes[attr.name]
                          if (!attrStatus) return null
                          const { bg, color, label, fw } = BADGE_CONFIG[attrStatus]
                          return (
                            <tr key={attr.name} style={{ borderBottom: '1px solid #f0f0f0', opacity: attrStatus === 'not-in-profile' ? 0.4 : 1 }}>
                              <td style={{ padding: '5px 8px', fontWeight: 500, textDecoration: attrStatus === 'not-in-profile' ? 'line-through' : 'none' }}>
                                {attr.name}
                              </td>
                              <td style={{ padding: '5px 8px' }}>
                                <span style={{ background: bg, color, fontSize: '9px', padding: '1px 6px', borderRadius: '6px', fontWeight: fw, whiteSpace: 'nowrap' }}>
                                  {label}
                                </span>
                              </td>
                              <td style={{ padding: '5px 8px', fontSize: '11px', color: '#888' }}>
                                {attr.description}
                              </td>
                            </tr>
                          )
                        }).filter(Boolean)}
                      </tbody>
                    </table>
                  ) : (
                    <p style={{ fontSize: '12px', color: '#aaa', fontStyle: 'italic' }}>
                      Ingen attributter spesifisert for dette elementet i profilen.
                    </p>
                  )}
                </>
              )}
            </div>
          </TabPanel>

          {/* Tab 2: XML-mal */}
          <TabPanel>
            <div style={{ padding: '16px' }}>
              <pre style={{
                background: '#1e1e2e',
                borderRadius: '8px',
                padding: '14px 16px',
                fontFamily: 'monospace',
                fontSize: '12px',
                lineHeight: 1.7,
                color: '#cdd6f4',
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                margin: 0,
              }}>
                {node.xmlSnippet}
              </pre>
            </div>
          </TabPanel>

          {/* Tab 3: Skjema (element nodes only) */}
          {isElement && (
            <TabPanel>
              {element ? (
                <SchemaTab element={element} profileData={profileData} activeProfile={activeProfile} />
              ) : (
                <div style={{ padding: '24px 16px', fontSize: '14px', color: '#888' }}>
                  Fant ikke skjemainfo for {node.label}.
                </div>
              )}
            </TabPanel>
          )}
        </TabPanels>
      </Tabs>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc -p tsconfig.app.json --noEmit
```

Expected: no output (clean).

- [ ] **Step 3: Commit**

```bash
git add src/components/ProfileGuidePanel.tsx
git commit -m "feat: add ProfileGuidePanel with Beskrivelse, XML-mal, and Skjema tabs"
```

---

## Task 7: Update App.tsx

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Replace the entire content of `src/App.tsx`**

```tsx
import { useState } from 'react'
import type { NeTExElement, LoadedFile, NeTExExample, ProfileData, ActiveProfile, StructureNode, ProfileStructure } from './types'
import elementsData from './data/netex-elements.json'
import examplesData from './data/netex-examples.json'
import frProfileData from './data/profiles/fr.json'
import nordicProfileData from './data/profiles/nordic.json'
import frStructureData from './data/profiles/fr-structure.json'
import nordicStructureData from './data/profiles/nordic-structure.json'
import { SearchBar } from './components/SearchBar'
import { ElementTree } from './components/ElementTree'
import { AttributePanel } from './components/AttributePanel'
import { ExampleLoader } from './components/ExampleLoader'
import { ProfileStructureTree } from './components/ProfileStructureTree'
import { ProfileGuidePanel } from './components/ProfileGuidePanel'

const allElements = elementsData as NeTExElement[]
const allExamples = examplesData as NeTExExample[]

const PROFILES: Record<string, ProfileData> = {
  fr: frProfileData as ProfileData,
  nordic: nordicProfileData as ProfileData,
}

const PROFILE_STRUCTURES: Record<string, ProfileStructure> = {
  fr: frStructureData as ProfileStructure,
  nordic: nordicStructureData as ProfileStructure,
}

function findPath(node: StructureNode, targetId: string, path: string[] = []): string[] | null {
  const current = [...path, node.label]
  if (node.id === targetId) return current
  for (const child of node.children) {
    const result = findPath(child, targetId, current)
    if (result) return result
  }
  return null
}

export default function App() {
  const [query, setQuery] = useState('')
  const [activeChip, setActiveChip] = useState<string | null>(null)
  const [selectedElement, setSelectedElement] = useState<NeTExElement | null>(null)
  const [loadedFile, setLoadedFile] = useState<LoadedFile | null>(null)
  const [activeProfile, setActiveProfile] = useState<ActiveProfile>(null)
  const [selectedNode, setSelectedNode] = useState<StructureNode | null>(null)

  const profileData = activeProfile ? PROFILES[activeProfile] : null
  const structureData = activeProfile ? PROFILE_STRUCTURES[activeProfile] : null

  function handleProfileChange(p: ActiveProfile) {
    setActiveProfile(p)
    setSelectedNode(null)
  }

  const selectedNodePath = selectedNode && structureData
    ? findPath(structureData.root, selectedNode.id) ?? []
    : []

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

        {activeProfile ? (
          <span style={{ fontSize: '13px', color: 'var(--colors-greys-grey50, #888)', fontStyle: 'italic' }}>
            {activeProfile === 'nordic' ? '🇳🇴 Nordisk profil — eksportstruktur' : '🇫🇷 Fransk profil — eksportstruktur'}
          </span>
        ) : (
          <SearchBar
            query={query}
            onQueryChange={setQuery}
            activeChip={activeChip}
            onChipChange={setActiveChip}
          />
        )}

        <div style={{ marginLeft: 'auto' }}>
          <ExampleLoader examples={allExamples} onFileLoaded={setLoadedFile} />
        </div>
      </div>

      {/* Main area */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left panel */}
        <div style={{
          width: '260px',
          flexShrink: 0,
          borderRight: '1px solid var(--colors-greys-grey80, #e0e0e0)',
          overflowY: 'auto',
          background: 'var(--colors-greys-grey90, #f8f8f8)',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {activeProfile && structureData ? (
            <ProfileStructureTree
              structure={structureData}
              profileData={profileData}
              selectedNode={selectedNode}
              onSelect={setSelectedNode}
              activeProfile={activeProfile}
              onProfileChange={handleProfileChange}
            />
          ) : (
            <ElementTree
              elements={allElements}
              query={query}
              activeChip={activeChip}
              selectedElement={selectedElement}
              loadedFile={loadedFile}
              onSelect={setSelectedElement}
              profileData={profileData}
              activeProfile={activeProfile}
              onProfileChange={handleProfileChange}
            />
          )}
        </div>

        {/* Right panel */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          background: 'var(--colors-greys-white, #ffffff)',
        }}>
          {activeProfile && selectedNode ? (
            <ProfileGuidePanel
              node={selectedNode}
              nodePath={selectedNodePath}
              allElements={allElements}
              profileData={profileData}
              activeProfile={activeProfile}
            />
          ) : activeProfile ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'var(--colors-greys-grey50, #888)',
              fontSize: '14px',
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
npx tsc -p tsconfig.app.json --noEmit
```

Expected: no output (clean).

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: swap panels to ProfileStructureTree and ProfileGuidePanel when profile active"
```

---

## Task 8: Visual verification

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Verify profile-inactive state (baseline)**

Open http://localhost:5173. Confirm:
- Top bar shows search input + 5 filter chips as before
- Left panel shows element tree (XSD hierarchy) as before
- Selecting an element shows AttributePanel on the right

- [ ] **Step 3: Activate Nordic profile**

In the left panel, select "🇳🇴 Nordisk profil" in the Profil dropdown. Confirm:
- Search bar in top bar is replaced by "🇳🇴 Nordisk profil — eksportstruktur" label
- Left panel switches to the export structure tree (PublicationDelivery at top, expandable)
- Element nodes show a coloured dot (green = påkrevd, blue = valgfri, grey = ikke i profil)
- Right panel shows "Velg et element i eksportstrukturen til venstre"

- [ ] **Step 4: Click nodes in the tree**

Click `FareFrame` (container node). Confirm:
- Right panel shows header "FareFrame · ramme"
- Two tabs: Beskrivelse and XML-mal
- Beskrivelse tab shows the Norwegian description
- XML-mal tab shows the dark-background annotated snippet

Click `PreassignedFareProduct` (element node). Confirm:
- Right panel shows three tabs: Beskrivelse, XML-mal, Skjema
- Beskrivelse tab shows description + attribute status table
- Skjema tab shows the full attribute table from AttributePanel

- [ ] **Step 5: Switch back to no profile**

Select "— Ingen profil" in the Profil dropdown. Confirm:
- Search bar reappears in top bar
- Left panel returns to the XSD element tree
- Previously selected element is shown in right panel (or empty state if none)

- [ ] **Step 6: Run all tests to confirm no regressions**

```bash
npx vitest run
```

Expected: 18 tests passing, 0 failures.

- [ ] **Step 7: Commit any fixes if needed, then final commit**

```bash
git add -A
git commit -m "feat: complete profile structure guide — Sub-project B"
```
