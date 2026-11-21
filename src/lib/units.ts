import { Prisma } from '@/generated/prisma/client'

export const packageUnits = [
  'UNIT',
  'GRAM',
  'KILOGRAM',
  'MILLILITER',
  'LITER',
] as const

export type PackageUnit = (typeof packageUnits)[number]

export type BaseUnit = 
  | 'UNIT'
  | 'GRAM'
  | 'MILLILITER'

const unitConfig: Record<
  PackageUnit,
  {
    baseUnit: BaseUnit,
    factor: number
  }
> = {
  UNIT: {
    baseUnit: 'UNIT',
    factor: 1
  },
  GRAM: {
    baseUnit: 'GRAM',
    factor: 1,
  },
  KILOGRAM: {
    baseUnit: 'GRAM',
    factor: 1000,
  },
  MILLILITER: {
    baseUnit: 'MILLILITER',
    factor: 1,
  },
  LITER: {
    baseUnit: 'MILLILITER',
    factor: 1000,
  },
}

export function getBaseUnit(unit: PackageUnit): BaseUnit {
  return unitConfig[unit].baseUnit
}

export function getConversionFactor(unit: PackageUnit): number {
  return unitConfig[unit].factor
}

export function convertToBaseUnit(
  value: string,
  unit: PackageUnit
): Prisma.Decimal {
  const quantity = new Prisma.Decimal(value)
  const factor = getConversionFactor(unit)

  return quantity.mul(factor)
}

