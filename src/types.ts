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
  group: string
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
