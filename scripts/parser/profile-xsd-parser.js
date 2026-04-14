import { XMLParser } from 'fast-xml-parser'

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  isArray: (name) => ['xs:complexType', 'xs:element', 'xsd:complexType', 'xsd:element'].includes(name),
})

/**
 * Parse a single XSD string and return a map:
 *   { ElementName: { AttributeName: 'required' | 'optional' } }
 *
 * Only xs:complexType elements that contain xs:restriction are processed.
 * The key is the restriction base name with common suffixes stripped:
 *   "netex:PreassignedFareProduct_VersionStructure" → "PreassignedFareProduct"
 *
 * @param {string} xsdText
 * @returns {Record<string, Record<string, 'required' | 'optional'>>}
 */
export function parseXsdRestrictions(xsdText) {
  let doc
  try {
    doc = parser.parse(xsdText)
  } catch {
    return {}
  }

  const schema = doc['xs:schema'] ?? doc['xsd:schema'] ?? {}
  const complexTypes = (schema['xs:complexType'] ?? schema['xsd:complexType'] ?? [])
  const result = {}

  for (const ct of complexTypes) {
    const content = ct['xs:complexContent'] ?? ct['xsd:complexContent']
    if (!content) continue

    const restriction = content['xs:restriction'] ?? content['xsd:restriction']
    if (!restriction) continue

    const base = restriction['@_base'] ?? ''
    const localBase = base.split(':').pop() ?? base
    const elementName = localBase
      .replace(/_VersionStructure$/, '')
      .replace(/_Structure$/, '')
      .replace(/_PropertiesStructure$/, '')
    if (!elementName) continue

    const sequence = restriction['xs:sequence'] ?? restriction['xsd:sequence'] ?? {}
    const rawElements = sequence['xs:element'] ?? sequence['xsd:element'] ?? []
    const elements = Array.isArray(rawElements) ? rawElements : [rawElements]

    const attrs = {}
    for (const el of elements) {
      const name = (el['@_name'] ?? el['@_ref'] ?? '').split(':').pop()
      if (!name) continue
      const minOccurs = el['@_minOccurs'] !== undefined ? parseInt(String(el['@_minOccurs']), 10) : 1
      attrs[name] = minOccurs > 0 ? 'required' : 'optional'
    }

    result[elementName] = attrs
  }

  return result
}
