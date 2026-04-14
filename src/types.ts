/** Top-level grouping categories for NeTEx Part 3 elements */
export type ElementGroup =
  | 'FareProduct'
  | 'FarePrice'
  | 'SalesOfferPackage'
  | 'FareStructureElement'
  | 'UsageParameter'
  | 'ValidableElement'
  | 'DistributionChannel'
  | 'FulfilmentMethod'
  | 'TypeOfTravelDocument'
  | 'FareTable'
  | 'FareSeries'
  | 'GeographicStructureFactor'
  | 'QualityStructureFactor'
  | 'TimeStructureFactor'
  | 'DistanceMatrixElement'
  | 'FareZone'
  | 'Tariff'
  | 'PricingRule'
  | 'Other'

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

export type ActiveProfile = 'fr' | 'nordic' | null
