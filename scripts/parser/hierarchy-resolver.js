/**
 * @param {{ elements: Map, types: Map, groups: Map }} context
 * @param {string[]} topGroupNames
 * @returns {Array} NeTExElement[]
 */
export function resolveHierarchy(context, topGroupNames) {
  const { elements, types, groups } = context
  const result = []

  for (const [name, el] of elements) {
    if (el.abstract) continue

    const group = findTopGroup(name, elements, topGroupNames)
    const typeName = `${name}_VersionStructure`
    const { chain } = resolveTypeChain(typeName, types)

    // inheritedFrom = ancestors in the substitution group chain, excluding self and framework base types
    const SKIP = new Set(['DataManagedObject', 'EntityInVersion', 'VersionedChild', 'GroupOfEntities'])
    const subChain = resolveSubstitutionChain(el.substitutionGroup, elements)
    const inheritedFrom = subChain
      .map((n) => stripDummy(n))
      .filter((n) => n !== name && !SKIP.has(n))
      .filter((v, i, a) => a.indexOf(v) === i)

    // own attributes = from the first group ref of own type
    const ownGroupRef = types.get(typeName)?.groupRefs?.[0]
    const ownAttrs = ownGroupRef ? (groups.get(ownGroupRef) ?? []) : []

    // inherited attributes = all group refs from ancestor types (chain[1] onward)
    const inheritedAttrs = []
    for (let i = 1; i < chain.length; i++) {
      const ancestorType = chain[i]
      const ancestorGroupRefs = types.get(ancestorType)?.groupRefs ?? []
      const ancestorName = ancestorType.replace(/_VersionStructure$/, '').replace(/_Dummy$/, '')
      for (const ref of ancestorGroupRefs) {
        for (const attr of (groups.get(ref) ?? [])) {
          inheritedAttrs.push({ ...attr, inheritedFrom: ancestorName })
        }
      }
    }

    result.push({
      name,
      abstract: false,
      parent: el.substitutionGroup ? stripDummy(el.substitutionGroup) : null,
      group: group ?? 'Other',
      description: el.description,
      inheritedFrom,
      attributes: ownAttrs.map(normaliseAttr),
      inheritedAttributes: inheritedAttrs.map(normaliseAttr),
    })
  }

  return result
}

function stripDummy(name) {
  return name?.replace(/_Dummy$/, '') ?? name
}

function findTopGroup(elementName, elements, topGroupNames) {
  let current = elements.get(elementName)
  while (current) {
    const parent = current.substitutionGroup
    if (!parent) return null
    const parentClean = stripDummy(parent)
    if (topGroupNames.includes(parentClean)) return parentClean
    current = elements.get(parent)
  }
  return null
}

function resolveSubstitutionChain(substitutionGroup, elements) {
  const chain = []
  let current = substitutionGroup
  while (current) {
    chain.push(current)
    current = elements.get(current)?.substitutionGroup ?? null
  }
  return chain
}

function resolveTypeChain(typeName, types) {
  const chain = []
  let current = typeName
  while (current && types.has(current)) {
    chain.push(current)
    current = types.get(current).extensionBase ?? null
  }
  return { chain }
}

function inferKind(type, name) {
  if (!type) return 'string'
  if (type.endsWith('Enumeration') || type.endsWith('EnumType')) return 'enum'
  if (type.endsWith('RefStructure') || name.endsWith('Ref') || name.endsWith('Refs')) return 'ref'
  if (type.endsWith('RelStructure')) return 'list'
  if (type === 'xsd:boolean') return 'boolean'
  if (type === 'xsd:integer') return 'integer'
  if (type === 'xsd:decimal') return 'decimal'
  return 'string'
}

function normaliseAttr(attr) {
  return {
    name: attr.name,
    type: attr.type || attr.name,
    kind: inferKind(attr.type, attr.name),
    minOccurs: attr.minOccurs,
    maxOccurs: attr.maxOccurs,
    description: attr.description,
    ...(attr.inheritedFrom !== undefined ? { inheritedFrom: attr.inheritedFrom } : {}),
  }
}
