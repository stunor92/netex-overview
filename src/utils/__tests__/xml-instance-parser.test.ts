import { describe, it, expect } from 'vitest'
import { parseXmlInstance } from '../xml-instance-parser'

const FIXTURE = `<?xml version="1.0" encoding="UTF-8"?>
<PublicationDelivery xmlns="http://www.netex.org.uk/netex" version="1.0">
  <dataObjects>
    <CompositeFrame id="CF:1" version="any">
      <frames>
        <FareFrame id="FF:1" version="any">
          <fareProducts>
            <PreassignedFareProduct id="FP:Adult" version="any">
              <Name>Single Adult</Name>
              <ProductType>singleTrip</ProductType>
            </PreassignedFareProduct>
            <PreassignedFareProduct id="FP:Child" version="any">
              <Name>Single Child</Name>
              <ProductType>singleTrip</ProductType>
            </PreassignedFareProduct>
          </fareProducts>
        </FareFrame>
      </frames>
    </CompositeFrame>
  </dataObjects>
</PublicationDelivery>`

describe('parseXmlInstance', () => {
  it('finds all instances of a named element type', () => {
    const result = parseXmlInstance(FIXTURE)
    expect(result['PreassignedFareProduct']).toHaveLength(2)
  })

  it('extracts the id attribute', () => {
    const result = parseXmlInstance(FIXTURE)
    const ids = result['PreassignedFareProduct'].map((i) => i.id)
    expect(ids).toContain('FP:Adult')
    expect(ids).toContain('FP:Child')
  })

  it('extracts child element values as attributes', () => {
    const result = parseXmlInstance(FIXTURE)
    const adult = result['PreassignedFareProduct'].find((i) => i.id === 'FP:Adult')
    const productType = adult?.attributes.find((a) => a.name === 'ProductType')
    expect(productType?.value).toBe('singleTrip')
  })

  it('includes raw XML string for each instance', () => {
    const result = parseXmlInstance(FIXTURE)
    const adult = result['PreassignedFareProduct'].find((i) => i.id === 'FP:Adult')
    expect(adult?.rawXml).toContain('PreassignedFareProduct')
    expect(adult?.rawXml).toContain('FP:Adult')
  })
})
