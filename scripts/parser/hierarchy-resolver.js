// Framework base types that add no useful information for the UI
const SKIP_TYPES = new Set(['DataManagedObject', 'EntityInVersion', 'VersionedChild', 'GroupOfEntities'])

/**
 * @param {{ elements: Map, types: Map, groups: Map }} context
 * @param {string[]} topGroupNames
 * @returns {import('../../src/types.js').NeTExElement[]}
 */
export function resolveHierarchy(context, topGroupNames) {
  const { elements, types, groups } = context
  const result = []

  for (const [name, el] of elements) {
    if (el.abstract) continue

    const group = topGroupNames.includes(name) ? name : findTopGroup(name, elements, topGroupNames)
    const typeName = resolveTypeName(name, types)
    const chain = resolveTypeChain(typeName, types)

    // inheritedFrom = ancestors in the substitution group chain, excluding self and framework base types
    const subChain = resolveSubstitutionChain(el.substitutionGroup, elements)
    const inheritedFrom = subChain
      .map((n) => stripDummy(n))
      .filter((n) => n !== name && !SKIP_TYPES.has(n))
      .filter((v, i, a) => a.indexOf(v) === i)

    // own attributes = all group refs of own type (not just first — NeTEx types can have multiple)
    const ownGroupRefs = types.get(typeName)?.groupRefs ?? []
    const ownAttrs = ownGroupRefs.flatMap((ref) => resolveGroupAttrs(ref, groups))

    // inherited attributes = all group refs from ancestor types (chain[1] onward)
    const inheritedAttrs = []
    for (let i = 1; i < chain.length; i++) {
      const ancestorType = chain[i]
      const ancestorGroupRefs = types.get(ancestorType)?.groupRefs ?? []
      const ancestorName = ancestorType.replace(/_VersionStructure$/, '').replace(/_Dummy$/, '')
      for (const ref of ancestorGroupRefs) {
        for (const attr of resolveGroupAttrs(ref, groups)) {
          inheritedAttrs.push({ ...attr, inheritedFrom: ancestorName })
        }
      }
    }

    result.push({
      name,
      abstract: false,
      // parent: closest named ancestor (stripping _Dummy suffix from substitutionGroup)
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

const TYPE_SUFFIXES = [
  '_VersionStructure',
  '_VersionedStructure',
  '_VersionedChildStructure',
  '_VersionFrameStructure',
  '_DerivedViewStructure',
]

/**
 * Find the actual type name for an element by trying known NeTEx suffixes.
 * Returns the first matching type name, or the default `_VersionStructure` if none found.
 * @param {string} name
 * @param {Map} types
 * @returns {string}
 */
function resolveTypeName(name, types) {
  for (const suffix of TYPE_SUFFIXES) {
    const candidate = `${name}${suffix}`
    if (types.has(candidate)) return candidate
  }
  return `${name}_VersionStructure`
}

/**
 * Recursively resolve all attributes from a group and its nested group refs.
 * @param {string} ref
 * @param {Map} groups
 * @param {Set} [visited]
 * @returns {object[]}
 */
function resolveGroupAttrs(ref, groups, visited = new Set()) {
  if (visited.has(ref)) return []  // cycle guard
  visited.add(ref)
  const group = groups.get(ref)
  if (!group) return []
  const direct = group.attrs ?? []
  const nested = (group.groupRefs ?? []).flatMap((r) => resolveGroupAttrs(r, groups, visited))
  return [...direct, ...nested]
}

function stripDummy(name) {
  return name?.replace(/_Dummy$/, '').replace(/_$/, '') ?? name
}

function findTopGroup(elementName, elements, topGroupNames) {
  const visited = new Set()
  let current = elements.get(elementName)
  while (current) {
    const parent = current.substitutionGroup
    if (!parent) return null
    if (visited.has(parent)) break // cycle guard
    visited.add(parent)
    const parentClean = stripDummy(parent)
    if (topGroupNames.includes(parentClean)) return parentClean
    current = elements.get(parent)
  }
  return null
}

function resolveSubstitutionChain(substitutionGroup, elements) {
  const chain = []
  const visited = new Set()
  let current = substitutionGroup
  while (current) {
    if (visited.has(current)) break // cycle guard
    visited.add(current)
    chain.push(current)
    current = elements.get(current)?.substitutionGroup ?? null
  }
  return chain
}

function resolveTypeChain(typeName, types) {
  const chain = []
  const visited = new Set()
  let current = typeName
  while (current && types.has(current)) {
    if (visited.has(current)) break // cycle guard
    visited.add(current)
    chain.push(current)
    current = types.get(current).extensionBase ?? null
  }
  return chain
}

function inferKind(type, name) {
  if (!type) return 'string'
  if (type.endsWith('Enumeration') || type.endsWith('EnumType')) return 'enum'
  if (type.endsWith('RefStructure') || name.endsWith('Ref') || name.endsWith('Refs')) return 'ref'
  if (type.endsWith('RelStructure')) return 'list'
  // complex = named structure that doesn't fit ref/list/enum — used for nested objects
  if (type.endsWith('Structure') || type.endsWith('Group')) return 'complex'
  if (type === 'xsd:boolean') return 'boolean'
  if (type === 'xsd:integer') return 'integer'
  if (type === 'xsd:decimal') return 'decimal'
  return 'string'
}

function normaliseAttr(attr) {
  return {
    name: attr.name,
    // Empty type means inline anonymous type in XSD — use 'unknown' as a safe sentinel
    type: attr.type || 'unknown',
    kind: inferKind(attr.type, attr.name),
    minOccurs: attr.minOccurs,
    maxOccurs: attr.maxOccurs,
    description: attr.description,
    ...(attr.inheritedFrom !== undefined ? { inheritedFrom: attr.inheritedFrom } : {}),
  }
}
