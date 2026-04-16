# UK NeTEx Profile Implementation

## Oversikt

Jeg har implementert støtte for den britiske NeTEx-profilen (UK Profile) i netex-overview-applikasjonen. Profilen er basert på dokumentasjon fra Department for Transport (DfT) for Bus Open Data Service (BODS).

## Datakilder

Informasjonen er hentet fra:
- **UK NeTEx Profile dokumentasjon** fra http://netex.uk/farexchange/
- **Offisiell spesifikasjon**: DfT NeTEx UK Profile v1.0 (June 2019 draft)
- **Eksempelfiler**: Metrobus Line 1 trip og Metrorider pass
- **Bus Open Data Service**: https://www.bus-data.dft.gov.uk/

## Implementerte filer

### 1. `src/data/profiles/uk-structure.json` (35 KB)
Komplett strukturguide for UK-profilen med:
- **PublicationDelivery** → **CompositeFrame** → **FareFrame** hierarki
- **Tariff-basert struktur** (alle takstelementer organisert under Tariff)
- Detaljerte beskrivelser av alle hovedelementer:
  - FareZone / TariffZone (soner)
  - Tariff med fareStructureElements
  - FareStructureElement med TypeOfFareStructureElement (access, eligibility, durations)
  - DistanceMatrixElement for OD-par
  - TimeInterval for pass-produkter
  - GeographicalInterval for prisband
  - QualityStructureFactor for klippekort
  - PreassignedFareProduct og AmountOfPriceUnitProduct
  - SalesOfferPackage med distributionAssignments
  - FareTable med columns/rows/cells (matrise-struktur)
  - PriceGroup med GeographicalIntervalPrice

### 2. `src/data/profiles/uk.json` (3 B)
Tom ProfileData-fil (`{}`). Kan fylles ut med element-status senere når detaljerte krav er kartlagt.

## Kodeendringer

### App.tsx
- Importerer `ukProfileData` og `ukStructureData`
- Lagt til UK i `PROFILES` og `PROFILE_STRUCTURES` objektene
- Oppdatert topbar-logikk til å vise 🇬🇧 flagg og tekst for UK

### types.ts
- Oppdatert `ActiveProfile` type: `'fr' | 'nordic' | 'uk' | null`

### ElementTree.tsx
- Lagt til `<option value="uk">🇬🇧 Britisk profil</option>` i profilvelgeren

### ProfileStructureTree.tsx
- Lagt til `<option value="uk">🇬🇧 Britisk profil</option>` i profilvelgeren

## Nøkkelforskjeller: UK vs Fransk profil

| Aspekt | UK Profile | Fransk profil |
|--------|-----------|---------------|
| **Frame-type** | FareFrame | GeneralFrame (NETEX_TARIF) |
| **Organisering** | Tariff med nested collections | Flat `<members>` liste |
| **Takststruktur** | FareStructureElement med TypeOfFareStructureElement | FareStructureElement uten eksplisitt type |
| **Prisband** | PriceGroup + GeographicalIntervalPrice | Direkte priser |
| **FareTable** | Columns/Rows (matrise) | Flat cells-liste |
| **OD-priser** | DistanceMatrixElementPrice i Cell | SalesOfferPackagePrice direkte |

## Unike UK-konsepter

1. **TypeOfFareStructureElement** — kategoriserer takstelementer:
   - `access` — geografisk (OD-par, soner)
   - `eligibility` — brukerprofil (voksen, barn)
   - `durations` — tidsperioder (dag, uke)
   - `conditions` — spesielle betingelser

2. **Tariff-hierarki** — alt er nøstet under Tariff:
   ```
   Tariff
   ├── fareStructureElements
   ├── timeIntervals
   ├── geographicalIntervals
   └── qualityStructureFactors
   ```

3. **GeographicalInterval + PriceGroup** — prisband-system:
   - Band A = £1.60 (korte distanser)
   - Band B = £2.40 (mellom distanser)
   - Flere DistanceMatrixElement kan peke til samme PriceGroup

4. **FareTable matrise-struktur**:
   - Columns = fra-soner
   - Rows = til-soner
   - Cell = pris for kombinasjonen
   - DistanceMatrixElementPrice refererer til GeographicalIntervalPrice

## Testing

Applikasjonen bygger uten feil:
```bash
npm run build  # ✓ OK
```

Dev-server kjører på http://localhost:5177/ med UK-profil tilgjengelig i dropdown.

## Videre arbeid

1. **Populate uk.json** med detaljert element-status når UK-profilkrav er fullt kartlagt
2. **Legg til flere eksempler** i strukturguiden (carnet, multi-operator pass, PlusBus)
3. **Valider mot faktiske BODS-filer** fra bus-data.dft.gov.uk
4. **Dokumenter spesielle UK-regler** (f.eks. Basic vs Complex fares fra 2023-regelverket)

## Ressurser

- UK NeTEx dokumentasjon: http://netex.uk/
- Bus Open Data Service: https://www.bus-data.dft.gov.uk/
- UK Profile specs: http://netex.uk/farexchange/downloads.htm
- Legislation: https://www.legislation.gov.uk/uksi/2020/749/contents/made

