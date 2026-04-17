import { describe, it, expect } from 'vitest'
import type { NeTExElement } from '../../types'

// Pure logic extracted for testability (mirrors getRefTargetDescription in AttributePanel.tsx)
function getRefTargetDescription(
  attrType: string,
  attrKind: string,
  allElements: NeTExElement[],
): string | null {
  if (attrKind !== 'ref') return null
  const name = attrType
    .replace(/RefStructure$/, '')
    .replace(/Refs$/, '')
    .replace(/Ref$/, '')
  const target = allElements.find((e) => e.name === name)
  if (!target) return null
  const hasData = target.attributes.length > 0 || target.inheritedAttributes.length > 0
  if (hasData) return null  // has data → show link, not description
  return target.description || null
}

const makeEl = (name: string, hasData: boolean, description = ''): NeTExElement => ({
  name,
  abstract: false,
  parent: null,
  group: 'Other',
  part: 3,
  description,
  inheritedFrom: [],
  attributes: hasData ? [{ name: 'Id', type: 'xsd:string', kind: 'string', minOccurs: '1', maxOccurs: '1', description: '' }] : [],
  inheritedAttributes: [],
})

describe('getRefTargetDescription', () => {
  it('returns null for non-ref attributes', () => {
    expect(getRefTargetDescription('xsd:string', 'string', [])).toBeNull()
  })

  it('returns null when ref target has schema data', () => {
    const elements = [makeEl('PricingRule', true, 'A pricing rule.')]
    expect(getRefTargetDescription('PricingRuleRef', 'ref', elements)).toBeNull()
  })

  it('returns the target description when ref target has no data', () => {
    const elements = [makeEl('PricingRule', false, 'Reference to a PRICING RULE.')]
    expect(getRefTargetDescription('PricingRuleRef', 'ref', elements)).toBe('Reference to a PRICING RULE.')
  })

  it('returns null when target element is not found', () => {
    expect(getRefTargetDescription('UnknownRef', 'ref', [])).toBeNull()
  })

  it('strips RefStructure suffix when resolving target name', () => {
    const elements = [makeEl('FareProduct', false, 'A fare product.')]
    expect(getRefTargetDescription('FareProductRefStructure', 'ref', elements)).toBe('A fare product.')
  })
})
