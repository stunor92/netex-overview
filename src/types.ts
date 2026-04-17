/** Top-level grouping categories for NeTEx elements */
export type ElementGroup =
  // Part 1 — Network & Stops
  | 'AccessSpace'
  | 'Connection'
  | 'FareZone'
  | 'FlexibleLine'
  | 'Line'
  | 'NavigationPath'
  | 'Network'
  | 'Parking'
  | 'PathLink'
  | 'Quay'
  | 'Route'
  | 'ScheduledStopPoint'
  | 'ServiceLink'
  | 'SiteFrame'
  | 'StopArea'
  | 'StopPlace'
  // Part 2 — Timetables
  | 'Block'
  | 'DeadRun'
  | 'Interchange'
  | 'ServiceJourney'
  | 'TimetabledPassingTime'
  | 'TrainNumber'
  | 'VehicleJourney'
  | 'VehicleService'
  // Part 3 — Fares
  | 'DistanceMatrixElement'
  | 'DistributionChannel'
  | 'FarePrice'
  | 'FareProduct'
  | 'FareStructureElement'
  | 'FareTable'
  | 'FulfilmentMethod'
  | 'PricingRule'
  | 'QualityStructureFactor'
  | 'SalesOfferPackage'
  | 'Tariff'
  | 'TimeStructureFactor'
  | 'TypeOfTravelDocument'
  | 'UsageParameter'
  | 'ValidableElement'
  // All parts
  | 'Other'
  // Virtual group for enumerations
  | 'Enumerations'

export type AttributeKind =
  | 'enum'
  | 'ref'
  | 'list'
  | 'complex'
  | 'string'
  | 'boolean'
  | 'integer'
  | 'decimal'

export interface NeTExAttribute {
  name: string
  type: string
  kind: AttributeKind
  minOccurs: string
  maxOccurs: string
  description: string
}

export interface NeTExInheritedAttribute extends NeTExAttribute {
  inheritedFrom: string
}

export interface NeTExElement {
  name: string
  abstract: boolean
  parent: string | null
  group: ElementGroup
  part: 0 | 1 | 2 | 3
  description: string
  inheritedFrom: string[]       // ordered closest-first, e.g. ["FareProduct", "PriceableObject", "DataManagedObject"]
  attributes: NeTExAttribute[]
  inheritedAttributes: NeTExInheritedAttribute[]
}

export interface NeTExExample {
  filename: string
  label: string
  xml: string
}

export interface ParsedInstanceAttribute {
  name: string
  value: string
  kind: AttributeKind
}

export interface ParsedInstance {
  id: string
  elementName: string
  attributes: ParsedInstanceAttribute[]
  rawXml: string
}

/** Map from NeTEx element name to all its instances found in a loaded XML file */
export type InstanceMap = Record<string, ParsedInstance[]>

export interface LoadedFile {
  filename: string
  instanceMap: InstanceMap
}

// --- Profile annotation types ---

export type ProfileStatus = 'required' | 'optional' | 'not-in-profile'

export interface ProfileElementData {
  status: ProfileStatus
  attributes: Record<string, ProfileStatus>
}

/** Keyed by NeTEx element name, e.g. "PreassignedFareProduct" */
export type ProfileData = Record<string, ProfileElementData>

export type ActiveProfile = 'fr' | 'nordic' | 'uk' | null

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

/** Maps enum type name to array of allowed values */
export type NeTExEnums = Record<string, string[]>
