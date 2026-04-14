import { XMLParser } from 'fast-xml-parser'

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  parseAttributeValue: false,
  isArray: (tagName) =>
    ['xsd:element', 'xsd:group', 'xsd:complexType', 'xsd:attribute'].includes(tagName),
})

/** @param {string} xsdString */
export function parseXsd(xsdString) {
  const doc = parser.parse(xsdString)
  const schema = doc['xsd:schema'] ?? {}

  const elements = new Map()
  const types = new Map()
  const groups = new Map()

  // --- elements ---
  for (const el of toArray(schema['xsd:element'])) {
    const name = el['@_name']
    if (!name) continue
    elements.set(name, {
      abstract: el['@_abstract'] === 'true',
      substitutionGroup: el['@_substitutionGroup'] ?? null,
      description: extractDescription(el),
    })
  }

  // --- complexTypes ---
  for (const ct of toArray(schema['xsd:complexType'])) {
    const name = ct['@_name']
    if (!name) continue
    const ext = ct?.['xsd:complexContent']?.['xsd:extension']
               ?? ct?.['xsd:complexContent']?.['xsd:restriction']
    if (!ext) continue
    const extensionBase = ext['@_base'] ?? null
    const groupRefs = toArray(ext?.['xsd:sequence']?.['xsd:group'])
      .map((g) => g['@_ref'])
      .filter(Boolean)
    types.set(name, { extensionBase, groupRefs })
  }

  // --- groups ---
  for (const grp of toArray(schema['xsd:group'])) {
    const name = grp['@_name']
    if (!name) continue
    const seq = grp?.['xsd:sequence'] ?? {}
    const rawEls = toArray(seq['xsd:element'])
    const attrs = rawEls.map((el) => ({
      name: el['@_name'] ?? '',
      type: el['@_type'] ?? '',
      minOccurs: el['@_minOccurs'] ?? '1',
      maxOccurs: el['@_maxOccurs'] ?? '1',
      description: extractDescription(el),
    })).filter((a) => a.name)
    groups.set(name, attrs)
  }

  return { elements, types, groups }
}

function toArray(val) {
  if (!val) return []
  return Array.isArray(val) ? val : [val]
}

function extractDescription(node) {
  return node?.['xsd:annotation']?.['xsd:documentation'] ?? ''
}
