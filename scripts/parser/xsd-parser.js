import { XMLParser } from 'fast-xml-parser'

/** @param {string} xsdString */
export function parseXsd(xsdString) {
  // Construct per-call to avoid shared mutable state issues
  // parseAttributeValue: false is required — xsd:abstract is checked as string '=== "true"'
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    parseAttributeValue: false,
    isArray: (tagName) =>
      ['xsd:element', 'xsd:group', 'xsd:complexType', 'xsd:attribute', 'xsd:choice'].includes(tagName),
  })

  const doc = parser.parse(xsdString)
  const schema = doc['xsd:schema'] ?? {}

  const elements = new Map()
  const types = new Map()
  const groups = new Map()
  const enums = new Map()

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

    let extensionBase = null
    let groupRefs = []

    const complexContent = ct['xsd:complexContent']
    if (complexContent) {
      // Most NeTEx types: complexContent > extension (or restriction)
      const ext = complexContent['xsd:extension'] ?? complexContent['xsd:restriction']
      if (ext) {
        extensionBase = ext['@_base'] ?? null
        groupRefs = extractGroupRefs(ext)
      }
    } else {
      // Some NeTEx types use a bare xsd:sequence directly on the complexType
      groupRefs = extractGroupRefs(ct)
    }

    types.set(name, { extensionBase, groupRefs })
  }

  // --- groups ---
  for (const grp of toArray(schema['xsd:group'])) {
    const name = grp['@_name']
    if (!name) continue
    // Groups can use xsd:sequence or xsd:choice as their container
    const container = grp['xsd:sequence'] ?? grp['xsd:choice'] ?? {}
    const rawEls = toArray(container['xsd:element'])
    const attrs = rawEls.map((el) => ({
      name: el['@_name'] ?? el['@_ref'] ?? '',
      type: el['@_type'] ?? '',
      minOccurs: el['@_minOccurs'] ?? '1',
      maxOccurs: el['@_maxOccurs'] ?? '1',
      description: extractDescription(el),
    })).filter((a) => a.name)
    // Also capture nested group refs (NeTEx groups often nest other groups)
    const nestedGroupRefs = toArray(container['xsd:group'])
      .map((g) => g['@_ref'])
      .filter(Boolean)
    // xsd:choice may contain nested xsd:sequence blocks with elements
    const choiceEls = toArray(container['xsd:choice'])
      .flatMap((c) => toArray(c['xsd:element']))
      .map((el) => ({
        name: el['@_name'] ?? el['@_ref'] ?? '',
        type: el['@_type'] ?? '',
        minOccurs: '0',
        maxOccurs: el['@_maxOccurs'] ?? '1',
        description: extractDescription(el),
      }))
      .filter((a) => a.name)
    groups.set(name, { attrs: [...attrs, ...choiceEls], groupRefs: nestedGroupRefs })
  }

  // --- simpleType enumerations ---
  for (const st of toArray(schema['xsd:simpleType'])) {
    const name = st['@_name']
    if (!name || !name.endsWith('Enumeration')) continue
    
    const restriction = st['xsd:restriction']
    if (!restriction) continue
    
    const enumValues = toArray(restriction['xsd:enumeration'])
      .map((e) => e['@_value'])
      .filter(Boolean)
    
    if (enumValues.length > 0) {
      enums.set(name, enumValues)
    }
  }

  return { elements, types, groups, enums }
}

/**
 * Extract xsd:group @ref values from a sequence or choice block within a parent node.
 * Handles both xsd:sequence and xsd:choice containers.
 * @param {object} parent
 * @returns {string[]}
 */
function extractGroupRefs(parent) {
  const fromSeq = toArray(parent?.['xsd:sequence']?.['xsd:group'])
  const fromChoice = toArray(parent?.['xsd:choice']?.['xsd:group'])
  const direct = toArray(parent?.['xsd:group'])
  return [...fromSeq, ...fromChoice, ...direct]
    .map((g) => g['@_ref'])
    .filter(Boolean)
}

function toArray(val) {
  if (!val) return []
  return Array.isArray(val) ? val : [val]
}

function extractDescription(node) {
  return node?.['xsd:annotation']?.['xsd:documentation'] ?? ''
}
