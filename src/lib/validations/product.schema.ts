
import { z } from 'zod'
import { packageUnits } from '../units'
import { productCategories } from '../product-constants'

import { getConversionFactor } from '../units'

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
const productFieldsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'O nome deve ter pelo menos 2 caracteres.')
    .max(80, 'O nome deve ter no máximo 80 caracteres.'),

  category: z.enum(productCategories, {
    error: 'Selecione uma categoria.'
  }),

  packageQuantity: positiveDecimal,

  packageUnit: z.enum(packageUnits, {
    error: 'Selecione uma unidade de embalagem.'
  }),

  estimatedMonthlyConsumption: z.preprocess(
    (value) => (value === '' || value === null ? undefined : value),
    positiveDecimal.optional(),
  ),
}).superRefine((data, ctx) => {
  const conversionFactor = getConversionFactor(data.packageUnit)
  const maxValue = 999999999.999

  const packageQuantityInBaseUnit = 
    Number(data.packageQuantity) * conversionFactor

  if (packageQuantityInBaseUnit > maxValue) {
    ctx.addIssue({
      code: 'custom',
      path: ['packageQuantity'],
      message: 'A quantidade convertida ultrapassa o limite permitido.'
    })
  }

  if (data.estimatedMonthlyConsumption !== undefined) {
    const consumptionInBaseUnit = 
      Number(data.estimatedMonthlyConsumption) * conversionFactor

    if (consumptionInBaseUnit > maxValue) {
      ctx.addIssue({
        code: 'custom',
        path: ['estimatedMonthlyConsumption'],
        message: 'O consumo convertido ultrapassa o limite permitido.'
      })
    }
  }
})

export const createProductSchema = productFieldsSchema
export const updateProductSchema = productFieldsSchema

export type CreateProductInput = z.infer<typeof createProductSchema>
export type UpdateProductInput = z.infer<typeof updateProductSchema>
