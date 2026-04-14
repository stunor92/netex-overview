import { describe, it, expect } from 'vitest'
import { parseXsdRestrictions } from '../profile-xsd-parser.js'

const FIXTURE_XSD = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema"
           xmlns:netex="http://www.netex.org.uk/netex">
  <xs:complexType name="PreassignedFareProduct_VersionStructure">
    <xs:complexContent>
      <xs:restriction base="netex:PreassignedFareProduct_VersionStructure">
        <xs:sequence>
          <xs:element name="ProductType" minOccurs="1" maxOccurs="1"/>
          <xs:element name="ConditionSummaryRef" minOccurs="0" maxOccurs="1"/>
        </xs:sequence>
      </xs:restriction>
    </xs:complexContent>
  </xs:complexType>
  <xs:complexType name="SaleDiscountRight_VersionStructure">
    <xs:complexContent>
      <xs:restriction base="netex:SaleDiscountRight_VersionStructure">
        <xs:sequence>
          <xs:element name="Name" minOccurs="1"/>
        </xs:sequence>
      </xs:restriction>
    </xs:complexContent>
  </xs:complexType>
</xs:schema>`

describe('parseXsdRestrictions', () => {
  it('returns a map keyed by element base name (strip _VersionStructure)', () => {
    const result = parseXsdRestrictions(FIXTURE_XSD)
    expect(result).toHaveProperty('PreassignedFareProduct')
    expect(result).toHaveProperty('SaleDiscountRight')
  })

  it('marks minOccurs=1 elements as required', () => {
    const result = parseXsdRestrictions(FIXTURE_XSD)
    expect(result['PreassignedFareProduct']['ProductType']).toBe('required')
  })

  it('marks minOccurs=0 elements as optional', () => {
    const result = parseXsdRestrictions(FIXTURE_XSD)
    expect(result['PreassignedFareProduct']['ConditionSummaryRef']).toBe('optional')
  })

  it('handles missing minOccurs as required (XSD default)', () => {
    const result = parseXsdRestrictions(FIXTURE_XSD)
    expect(result['SaleDiscountRight']['Name']).toBe('required')
  })

  it('returns empty object for XSD with no restrictions', () => {
    const result = parseXsdRestrictions('<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema"/>')
    expect(result).toEqual({})
  })
})
