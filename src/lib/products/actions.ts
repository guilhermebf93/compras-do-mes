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

import { z } from 'zod'
import { prisma } from '@/lib/prisma'

export type ProductActionState = {
  errors?: {
    name?: string[]
    category?: string[]
    packageUnit?: string[]
    packageQuantity?: string[]
    estimatedMonthlyConsumption?: string[]
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
    await prisma.product.create({
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