import { XMLParser, XMLBuilder } from 'fast-xml-parser'
import type { InstanceMap, ParsedInstanceAttribute } from '../types'

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  parseAttributeValue: false,
  removeNSPrefix: true,
  isArray: () => false,
})

const builder = new XMLBuilder({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  format: true,
  indentBy: '  ',
  suppressEmptyNode: true,
})

export function parseXmlInstance(xml: string): InstanceMap {
  let doc: Record<string, unknown>
  try {
    doc = parser.parse(xml)
  } catch {
    return {}
  }

  const result: InstanceMap = {}
  walkNode(doc, result)
  return result
}

function walkNode(node: unknown, result: InstanceMap): void {
  if (!node || typeof node !== 'object') return
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    if (key.startsWith('@_') || key === '#text') continue
    if (looksLikeNeTExElement(key, value)) {
      const instances = toArray(value)
      for (const inst of instances) {
        if (typeof inst !== 'object' || inst === null) continue
        const id = (inst as any)['@_id'] ?? ''
        const attributes = extractAttributes(inst as Record<string, unknown>)
        const rawXml = buildRawXml(key, inst as Record<string, unknown>)
        if (!result[key]) result[key] = []
        result[key].push({ id, elementName: key, attributes, rawXml })
      }
    }
    walkNode(value, result)
  }
}

/** Heuristic: a NeTEx element node is an object with an @_id attribute */
function looksLikeNeTExElement(_key: string, value: unknown): boolean {
  if (!value || typeof value !== 'object') return false
  const obj = value as Record<string, unknown>
  return '@_id' in obj || (Array.isArray(value) && value.some((v) => v && typeof v === 'object' && '@_id' in v))
}

function extractAttributes(node: Record<string, unknown>): ParsedInstanceAttribute[] {
  const attrs: ParsedInstanceAttribute[] = []
  for (const [k, v] of Object.entries(node)) {
    if (k.startsWith('@_')) {
      attrs.push({ name: k.slice(2), value: String(v), kind: 'string' })
    } else if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
      attrs.push({ name: k, value: String(v), kind: 'string' })
    }
  }
  return attrs
}

function buildRawXml(tagName: string, node: Record<string, unknown>): string {
  try {
    return builder.build({ [tagName]: node })
  } catch {
    return `<${tagName} />`
  }
}

function toArray<T>(val: T | T[]): T[] {
  if (!val) return []
  return Array.isArray(val) ? val : [val]
}
