'use server'

import { Prisma } from '@/generated/prisma/client'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { getAuthenticatedUser } from '@/lib/auth/get-authenticated-user'
import { convertToBaseUnit, getBaseUnit } from '@/lib/units'
import {
  createProductSchema,
  updateProductSchema
} from '@/lib/validations/product.schema'
import { restockSchema } from '../validations/stock.schema'

import { z } from 'zod'
import { prisma } from '@/lib/prisma'

type RestockTransactionResult =
  | { success: true }
  | { success: false; reason: 'NOT_FOUND' | 'LIMIT_EXCEEDED' }

export type ProductActionState = {
  success?: boolean
  errors?: {
    name?: string[]
    category?: string[]
    packageUnit?: string[]
    packageQuantity?: string[]
    estimatedMonthlyConsumption?: string[]
    initialStock?: string[]
    packageCount?: string[]
  }
  message?: string
}

export async function createProduct(
  _prevState: ProductActionState,
  formData: FormData
): Promise<ProductActionState> {

  const user = await getAuthenticatedUser()

  if (!user) {
    redirect('/login')
  }

  const parsedData = createProductSchema.safeParse({
    name: formData.get('name'),
    category: formData.get('category'),
    packageQuantity: formData.get('packageQuantity'),
    packageUnit: formData.get('packageUnit'),
    estimatedMonthlyConsumption: formData.get(
      'estimatedMonthlyConsumption',
    ),
    initialStock: formData.get('initialStock')
  })

  if (!parsedData.success) {
    return {
      errors: parsedData.error.flatten().fieldErrors,
      message: 'Verifique os campos e tente novamente.'
    }
  }

  const data = parsedData.data
  const initialStock = convertToBaseUnit(
    data.initialStock,
    data.packageUnit
  )

  try {
    await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          userId: user.id,
          name: data.name,
          category: data.category,
          baseUnit: getBaseUnit(data.packageUnit),
          packageUnit: data.packageUnit,
          packageQuantity: convertToBaseUnit(
            data.packageQuantity,
            data.packageUnit
          ),
          currentStock: new Prisma.Decimal(0),
          estimatedMonthlyConsumption:
            data.estimatedMonthlyConsumption !== undefined
              ? convertToBaseUnit(
                data.estimatedMonthlyConsumption,
                data.packageUnit
              )
              : null,
        }
      })

      if (initialStock.greaterThan(0)) {
        await tx.stockMovement.create({
          data: {
            productId: product.id,
            type: 'INITIAL_STOCK',
            quantity: initialStock
          }
        })

        await tx.product.update({
          where: {
            id: product.id
          },
          data: {
            currentStock: initialStock
          }
        })
      }
    })
  } catch (error) {
    console.error('Erro ao cadastrar produto: ', error)

    return {
      message: 'Não foi possível cadastrar o produto, tente novamente.'
    }
  }

  revalidatePath('/produtos')
  redirect('/produtos')
}

export async function updateProduct(
  productId: string,
  _prevState: ProductActionState,
  formData: FormData
): Promise<ProductActionState> {

  const user = await getAuthenticatedUser()

  if (!user) {
    redirect('/login')
  }

  if (!z.uuid().safeParse(productId).success) {
    return {
      message: 'Produto não encontrado.'
    }
  }

  const parsedData = updateProductSchema.safeParse({
    name: formData.get('name'),
    category: formData.get('category'),
    packageQuantity: formData.get('packageQuantity'),
    packageUnit: formData.get('packageUnit'),
    estimatedMonthlyConsumption: formData.get(
      'estimatedMonthlyConsumption'
    )
  })

  if (!parsedData.success) {
    return {
      errors: parsedData.error.flatten().fieldErrors,
      message: 'Verifique os campos e tente novamente.'
    }
  }

  const data = parsedData.data

  try {
    const result = await prisma.product.updateMany({
      where: {
        id: productId,
        userId: user.id,
        isActive: true
      },
      data: {
        name: data.name,
        category: data.category,
        baseUnit: getBaseUnit(data.packageUnit),
        packageUnit: data.packageUnit,
        packageQuantity: convertToBaseUnit(
          data.packageQuantity,
          data.packageUnit
        ),
        estimatedMonthlyConsumption: 
          data.estimatedMonthlyConsumption !== undefined
             ? convertToBaseUnit(
              data.estimatedMonthlyConsumption,
              data.packageUnit
             )
             : null
      }
    })

    if (result.count === 0) {
      return {
        message: 'Produto não encontrado.'
      }
    }
  } catch (error) {
    console.log('Erro ao atualizar o produto:', error)

    return {
      message: 'Não foi possível atualizar o produto, tente novamente.'
    }
  }

  revalidatePath('/produtos')
  revalidatePath(`/produtos/${productId}`)

  redirect(`/produtos/${productId}`)
}

export async function archiveProduct(productId: string): Promise<void> {
  const user = await getAuthenticatedUser()

  if (!user) {
    redirect('/login')
  }

  if (!z.uuid().safeParse(productId).success) {
    redirect('/produtos')
  }

  let result

  try {
    result = await prisma.product.updateMany({
      where: {
        id: productId,
        userId: user.id,
        isActive: true
      },
      data: {
        isActive: false
      }
    })
  } catch (error) {
    console.error('Erro ao arquivar produto:', error)
    throw new Error('Não foi possível arquivar o produto')
  }

  if (result.count === 0) {
    redirect('/produtos')
  }

  revalidatePath('/produtos')
  revalidatePath(`/produtos/${productId}`)

  redirect(`/produtos/${productId}`)
}

export async function reactivateProduct(productId: string): Promise<void> {
  const user = await getAuthenticatedUser()

  if (!user) {
    redirect('/login')
  }

  if (!z.uuid().safeParse(productId).success) {
    redirect('/produtos')
  }

  let result

  try {
    result = await prisma.product.updateMany({
      where: {
        id: productId,
        userId: user.id,
        isActive: false
      },
      data: {
        isActive: true
      }
    })
  } catch (error) {
    console.error('Erro ao reativar produto:', error)
    throw new Error('Não foi possível reativar o produto')
  }

  if (result.count === 0) {
    redirect('/produtos')
  }

  revalidatePath('/produtos')
  revalidatePath(`/produtos/${productId}`)

  redirect(`/produtos/${productId}`)
}

export async function restockProduct(
  productId: string,
  _prevState: ProductActionState,
  formData: FormData
): Promise<ProductActionState> {
  const user = await getAuthenticatedUser()

  if (!user) {
    redirect('/login')
  }

  if (!z.uuid().safeParse(productId).success) {
    return {
      message: 'Produto não encontrado.'
    }
  }

  const parsedData = restockSchema.safeParse({
    packageCount: formData.get('packageCount')
  })

  if (!parsedData.success) {
    return {
      errors: parsedData.error.flatten().fieldErrors,
      message: 'Verifique a quantidade informada.'
    }
  }

  const { packageCount } = parsedData.data

  const maxStock = new Prisma.Decimal('999999999.999')

  try {
    const result: RestockTransactionResult = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findFirst({
        where: {
          id: productId,
          userId: user.id,
          isActive: true
        },
        select: {
          packageQuantity: true
        }
      })

      if (!product) {
        return {
          success: false,
          reason: 'NOT_FOUND'
        }
      }

      const restockQuantity = product.packageQuantity.mul(packageCount)

      if (restockQuantity.greaterThan(maxStock)) {
        return {
          success: false,
          reason: 'LIMIT_EXCEEDED'
        }
      }

      const updateResult = await tx.product.updateMany({
        where: {
          id: productId,
          userId: user.id,
          isActive: true,
          currentStock: {
            lte: maxStock.minus(restockQuantity)
          }
        },
        data: {
          currentStock: {
            increment: restockQuantity
          }
        }
      })

      if (updateResult.count === 0) {
        return {
          success: false,
          reason: 'LIMIT_EXCEEDED'
        }
      }

      await tx.stockMovement.create({
        data: {
          productId,
          type: 'RESTOCK',
          quantity: restockQuantity
        }
      })

      return {
        success: true
      }
    })

    if (!result.success) {
      if (result.reason === 'NOT_FOUND') {
        return {
          message: 'Produto não encontrado ou indisponível para reposição.'
        }
      }

      if (result.reason === 'LIMIT_EXCEEDED') {
        return {
          message: 'A quantidade informada ultrapassa o limite permitido para o estoque.'
        }
      }
    }
  } catch (error) {
    console.error('Erro ao registrar reposição:', error)

    return {
      message: 'Não foi possível registrar a reposição. Tente novamente.'
    }
  }

  revalidatePath('/produtos')
  revalidatePath(`/produtos/${productId}`)

  return {
    success: true,
    message: 'Reposição registrada com sucesso!'
  }
}