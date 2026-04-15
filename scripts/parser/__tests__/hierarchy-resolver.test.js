import { describe, it, expect } from 'vitest'
import { resolveHierarchy } from '../hierarchy-resolver.js'

const TOP_GROUP_NAMES = ['FareProduct', 'FarePrice', 'SalesOfferPackage', 'FareStructureElement', 'UsageParameter', 'ValidableElement', 'DistributionChannel', 'FulfilmentMethod', 'TypeOfTravelDocument', 'FareTable', 'FareSeries', 'GeographicStructureFactor', 'QualityStructureFactor', 'TimeStructureFactor', 'DistanceMatrixElement', 'FareZone', 'Tariff', 'PricingRule']

const context = {
  elements: new Map([
    ['DataManagedObject', { abstract: true, substitutionGroup: null, description: '' }],
    ['PriceableObject_Dummy', { abstract: true, substitutionGroup: 'DataManagedObject', description: '' }],
    ['FareProduct_Dummy', { abstract: true, substitutionGroup: 'PriceableObject_Dummy', description: '' }],
    ['PreassignedFareProduct', { abstract: false, substitutionGroup: 'FareProduct_Dummy', description: 'A FARE PRODUCT.' }],
  ]),
  types: new Map([
    ['PreassignedFareProduct_VersionStructure', { extensionBase: 'FareProduct_VersionStructure', groupRefs: ['PreassignedFareProductGroup'] }],
    ['FareProduct_VersionStructure', { extensionBase: 'PriceableObject_VersionStructure', groupRefs: ['FareProductGroup'] }],
    ['PriceableObject_VersionStructure', { extensionBase: null, groupRefs: ['PriceableObjectGroup'] }],
  ]),
  groups: new Map([
    ['PreassignedFareProductGroup', [{ name: 'ProductType', type: 'ProductTypeEnum', minOccurs: '0', maxOccurs: '1', description: 'Type of product.' }]],
    ['FareProductGroup', [{ name: 'TariffRef', type: 'TariffRefStructure', minOccurs: '0', maxOccurs: 'unbounded', description: 'Ref to tariff.' }]],
    ['PriceableObjectGroup', [{ name: 'Name', type: 'MultilingualString', minOccurs: '0', maxOccurs: '1', description: 'Name.' }]],
  ]),
}

describe('resolveHierarchy', () => {
  it('returns only concrete (non-abstract) elements', () => {
    const result = resolveHierarchy(context, TOP_GROUP_NAMES)
    expect(result.every((e) => !e.abstract)).toBe(true)
  })

  it('resolves group label from substitution chain', () => {
    const result = resolveHierarchy(context, TOP_GROUP_NAMES)
    const el = result.find((e) => e.name === 'PreassignedFareProduct')
    expect(el.group).toBe('FareProduct')
  })

  it('resolves inheritedFrom chain', () => {
    const result = resolveHierarchy(context, TOP_GROUP_NAMES)
    const el = result.find((e) => e.name === 'PreassignedFareProduct')
    expect(el.inheritedFrom).toEqual(['FareProduct', 'PriceableObject'])
  })

  it('own attributes come from the element\'s own group', () => {
    const result = resolveHierarchy(context, TOP_GROUP_NAMES)
    const el = result.find((e) => e.name === 'PreassignedFareProduct')
    expect(el.attributes).toHaveLength(1)
    expect(el.attributes[0].name).toBe('ProductType')
  })

  it('inherited attributes tagged with inheritedFrom', () => {
    const result = resolveHierarchy(context, TOP_GROUP_NAMES)
    const el = result.find((e) => e.name === 'PreassignedFareProduct')
    const tariff = el.inheritedAttributes.find((a) => a.name === 'TariffRef')
    expect(tariff).toBeDefined()
    expect(tariff.inheritedFrom).toBe('FareProduct')
  })
})
