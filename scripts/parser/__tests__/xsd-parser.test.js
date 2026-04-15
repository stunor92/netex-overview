import { describe, it, expect } from 'vitest'
import { parseXsd } from '../xsd-parser.js'

const FIXTURE = `<?xml version="1.0" encoding="UTF-8"?>
<xsd:schema xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <xsd:element name="FareProduct_Dummy" abstract="true"/>
  <xsd:element name="PreassignedFareProduct" substitutionGroup="FareProduct_Dummy">
    <xsd:annotation><xsd:documentation>A FARE PRODUCT.</xsd:documentation></xsd:annotation>
  </xsd:element>
  <xsd:complexType name="PreassignedFareProduct_VersionStructure">
    <xsd:complexContent>
      <xsd:extension base="FareProduct_VersionStructure">
        <xsd:sequence>
          <xsd:group ref="PreassignedFareProductGroup"/>
        </xsd:sequence>
      </xsd:extension>
    </xsd:complexContent>
  </xsd:complexType>
  <xsd:group name="PreassignedFareProductGroup">
    <xsd:sequence>
      <xsd:element name="ProductType" minOccurs="0" maxOccurs="1">
        <xsd:annotation><xsd:documentation>Type of product.</xsd:documentation></xsd:annotation>
      </xsd:element>
    </xsd:sequence>
  </xsd:group>
</xsd:schema>`

describe('parseXsd', () => {
  it('extracts concrete elements with substitutionGroup and description', () => {
    const { elements } = parseXsd(FIXTURE)
    expect(elements.has('PreassignedFareProduct')).toBe(true)
    expect(elements.get('PreassignedFareProduct')).toMatchObject({
      abstract: false,
      substitutionGroup: 'FareProduct_Dummy',
      description: 'A FARE PRODUCT.',
    })
  })

  it('marks abstract elements correctly', () => {
    const { elements } = parseXsd(FIXTURE)
    expect(elements.get('FareProduct_Dummy')?.abstract).toBe(true)
  })

  it('extracts complexType extension base and group refs', () => {
    const { types } = parseXsd(FIXTURE)
    expect(types.get('PreassignedFareProduct_VersionStructure')).toMatchObject({
      extensionBase: 'FareProduct_VersionStructure',
      groupRefs: ['PreassignedFareProductGroup'],
    })
  })

  it('extracts group attributes', () => {
    const { groups } = parseXsd(FIXTURE)
    const attrs = groups.get('PreassignedFareProductGroup')
    expect(attrs).toHaveLength(1)
    expect(attrs[0]).toMatchObject({
      name: 'ProductType',
      minOccurs: '0',
      maxOccurs: '1',
      description: 'Type of product.',
    })
  })
})
