import { describe, it, expect } from 'vitest'
import type { NeTExElement } from '../../types'

function isNoData(el: NeTExElement): boolean {
  return el.attributes.length === 0 && el.inheritedAttributes.length === 0
}

function filterElements(
  elements: NeTExElement[],
  activePart: 1 | 2 | 3 | null,
  query: string,
): NeTExElement[] {
  return elements.filter((el) => {
    if (isNoData(el)) return false
    if (activePart !== null && el.part !== activePart) return false
    if (query) return el.name.toLowerCase().includes(query.toLowerCase())
    return true
  })
}

const makeEl = (overrides: Partial<NeTExElement>): NeTExElement => ({
  name: 'TestElement',
  abstract: false,
  parent: null,
  group: 'Other',
  part: 3,
  description: '',
  inheritedFrom: [],
  attributes: [{ name: 'Id', type: 'xsd:string', kind: 'string', minOccurs: '1', maxOccurs: '1', description: '' }],
  inheritedAttributes: [],
  ...overrides,
})

describe('ElementTree filtering', () => {
  it('hides elements with no attributes and no inheritedAttributes', () => {
    const elements = [
      makeEl({ name: 'WithData' }),
      makeEl({ name: 'NoDataRef', attributes: [], inheritedAttributes: [] }),
    ]
    expect(filterElements(elements, null, '')).toHaveLength(1)
    expect(filterElements(elements, null, '')[0].name).toBe('WithData')
  })

  it('filters by part number', () => {
    const elements = [
      makeEl({ name: 'Part1El', part: 1 }),
      makeEl({ name: 'Part3El', part: 3 }),
    ]
    expect(filterElements(elements, 1, '')).toHaveLength(1)
    expect(filterElements(elements, 1, '')[0].name).toBe('Part1El')
  })

  it('shows all parts when activePart is null', () => {
    const elements = [
      makeEl({ name: 'Part1El', part: 1 }),
      makeEl({ name: 'Part3El', part: 3 }),
    ]
    expect(filterElements(elements, null, '')).toHaveLength(2)
  })

  it('filters by search query case-insensitively', () => {
    const elements = [
      makeEl({ name: 'StopPlace', part: 1 }),
      makeEl({ name: 'ServiceJourney', part: 2 }),
    ]
    expect(filterElements(elements, null, 'stop')).toHaveLength(1)
    expect(filterElements(elements, null, 'STOP')[0].name).toBe('StopPlace')
  })
})
