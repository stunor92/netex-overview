// src/constants.ts

export const EXPORT_CHIPS: {
  key: string
  label: string
  sub: string
  groups: string[]
}[] = [
  {
    key: 'tariff',
    label: 'Tariff',
    sub: 'struktur',
    groups: [
      'Tariff', 'FareStructureElement',
      'QualityStructureFactor', 'TimeStructureFactor', 'DistanceMatrixElement',
      'ValidableElement',
    ],
  },
  {
    key: 'fareproduct',
    label: 'FareProduct',
    sub: 'typer',
    groups: ['FareProduct'],
  },
  {
    key: 'faretable',
    label: 'FareTable',
    sub: 'priser',
    groups: ['FareTable', 'FarePrice', 'PricingRule'],
  },
  {
    key: 'salesoffer',
    label: 'SalesOffer',
    sub: 'salg',
    groups: ['SalesOfferPackage', 'DistributionChannel', 'FulfilmentMethod', 'TypeOfTravelDocument'],
  },
  {
    key: 'usageparam',
    label: 'UsageParam',
    sub: 'vilkår',
    groups: ['UsageParameter'],
  },
]
