
 export const productCategories = [
  'FOOD',
  'CLEANING',
  'PERSONAL_CARE',
  'OTHER',
] as const

export type ProductCategory = (typeof productCategories)[number]