import { z } from 'zod'
import { packageUnits } from '../units'
import { productCategories } from '../product-constants'

const decimalInput = z
  .string()
  .trim()
  .regex(
    /^\d{1,9}([.,]\d{1,3})?$/,
    'Informe um número válido com até 3 casas decimais.',
  )
  .transform((value) => value.replace(',', '.'))

const positiveDecimal = decimalInput.refine(
  (value) => Number(value) > 0,
  'O valor deve ser maior que zero.',
)

const nonNegativeDecimal = decimalInput.refine(
  (value) => Number(value) >= 0,
  'O valor não pode ser negativo.',
)

export const createProductSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'O nome deve ter pelo menos 2 caracteres.')
    .max(80, 'O nome deve ter no máximo 80 caracteres.'),

  category: z.enum(productCategories),

  packageQuantity: positiveDecimal,

  packageUnit: z.enum(packageUnits),

  currentStock: nonNegativeDecimal,

  estimatedMonthlyConsumption: z.preprocess(
    (value) => (value === '' || value === null ? undefined : value),
    positiveDecimal.optional(),
  ),
})

export type CreateProductInput = z.infer<typeof createProductSchema>