import { z } from 'zod'

const decimalInput = z
  .string()
  .trim()
  .regex(
    /^-?\d{1,9}([.,]\d{1,3})?$/,
    'Informe um número válido com até 3 casas decimais.',
  )
  .transform((value) => value.replace(',', '.'))

export const restockSchema = z.object({
  packageCount: z
    .string()
    .trim()
    .regex(/^[1-9]\d*$/, 'Informe uma quantidade inteira maior que zero.')
    .transform(Number)
})

export const consumptionSchema = z.object({
  remainingStock: decimalInput.refine(
    (value) => Number(value) >= 0,
    'O estoque restante não pode ser negativo.',
  ),
})

// Ajuste: correção positiva ou negativa do estoque.
export const adjustmentSchema = z.object({
  quantity: decimalInput.refine(
    (value) => Number(value) !== 0,
    'O ajuste não pode ser zero.',
  ),
})

export type RestockInput = z.infer<typeof restockSchema>

export type ConsumptionInput = z.infer<typeof consumptionSchema>

export type AdjustmentInput = z.infer<typeof adjustmentSchema>