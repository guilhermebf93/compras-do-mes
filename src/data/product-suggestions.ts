import type { PackageUnit } from '@/lib/units'
import type { ProductCategory } from '@/lib/product-constants'

export type ProductSuggestion = {
  name: string,
  category: ProductCategory,
  packageUnit: PackageUnit
}

export const productSuggestions: ProductSuggestion[] = [
  // Alimentação
  {
    name: 'Arroz',
    category: 'FOOD',
    packageUnit: 'KILOGRAM',
  },
  {
    name: 'Feijão',
    category: 'FOOD',
    packageUnit: 'KILOGRAM',
  },
  {
    name: 'Açúcar',
    category: 'FOOD',
    packageUnit: 'KILOGRAM',
  },
  {
    name: 'Farinha de trigo',
    category: 'FOOD',
    packageUnit: 'KILOGRAM',
  },
  {
    name: 'Macarrão',
    category: 'FOOD',
    packageUnit: 'GRAM',
  },
  {
    name: 'Óleo',
    category: 'FOOD',
    packageUnit: 'LITER',
  },
  {
    name: 'Café',
    category: 'FOOD',
    packageUnit: 'GRAM',
  },
  {
    name: 'Leite',
    category: 'FOOD',
    packageUnit: 'LITER',
  },
  {
    name: 'Sal',
    category: 'FOOD',
    packageUnit: 'KILOGRAM',
  },
  {
    name: 'Azeite',
    category: 'FOOD',
    packageUnit: 'MILLILITER',
  },

  // Limpeza
  {
    name: 'Detergente',
    category: 'CLEANING',
    packageUnit: 'MILLILITER',
  },
  {
    name: 'Sabão em pó',
    category: 'CLEANING',
    packageUnit: 'KILOGRAM',
  },
  {
    name: 'Amaciante',
    category: 'CLEANING',
    packageUnit: 'LITER',
  },
  {
    name: 'Água sanitária',
    category: 'CLEANING',
    packageUnit: 'LITER',
  },
  {
    name: 'Desinfetante',
    category: 'CLEANING',
    packageUnit: 'LITER',
  },
  {
    name: 'Esponja',
    category: 'CLEANING',
    packageUnit: 'UNIT',
  },
  {
    name: 'Multiuso',
    category: 'CLEANING',
    packageUnit: 'MILLILITER',
  },

  // Higiene pessoal
  {
    name: 'Sabonete',
    category: 'PERSONAL_CARE',
    packageUnit: 'UNIT',
  },
  {
    name: 'Shampoo',
    category: 'PERSONAL_CARE',
    packageUnit: 'MILLILITER',
  },
  {
    name: 'Condicionador',
    category: 'PERSONAL_CARE',
    packageUnit: 'MILLILITER',
  },
  {
    name: 'Creme dental',
    category: 'PERSONAL_CARE',
    packageUnit: 'GRAM',
  },
  {
    name: 'Fio dental',
    category: 'PERSONAL_CARE',
    packageUnit: 'UNIT',
  },
  {
    name: 'Papel higiênico',
    category: 'PERSONAL_CARE',
    packageUnit: 'UNIT',
  },
  {
    name: 'Desodorante',
    category: 'PERSONAL_CARE',
    packageUnit: 'MILLILITER',
  },

  // Outros
  {
    name: 'Pilhas',
    category: 'OTHER',
    packageUnit: 'UNIT',
  },
  {
    name: 'Lâmpadas',
    category: 'OTHER',
    packageUnit: 'UNIT',
  },
  {
    name: 'Sacos de lixo',
    category: 'OTHER',
    packageUnit: 'UNIT',
  },
  {
    name: 'Guardanapos',
    category: 'OTHER',
    packageUnit: 'UNIT',
  },
]
