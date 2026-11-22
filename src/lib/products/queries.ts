import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/auth/get-authenticated-user'
import { redirect } from 'next/navigation'

export async function getUserProducts() {
  const user = await getAuthenticatedUser()

  if (!user) {
    redirect('/login')
  }

  const products = await prisma.product.findMany({
    where: {
      userId: user.id,
    },
    select: {
      id: true,
      name: true,
      category: true,
      baseUnit: true,
      packageUnit: true,
      packageQuantity: true,
      currentStock: true,
      estimatedMonthlyConsumption: true,
      isActive: true,
      createdAt: true,
      updatedAt: true
    }
  })

  return products.map(product => ({
    ...product,
    packageQuantity: product.packageQuantity.toString(),
    currentStock: product.currentStock.toString(),
    estimatedMonthlyConsumption:
      product.estimatedMonthlyConsumption?.toString() ?? null
  }))
}

export type UserProduct = Awaited<
  ReturnType<typeof getUserProducts>
  >[number]

export async function getUserProductById(id: string) {
  const user = await getAuthenticatedUser()

  if (!user) {
    redirect('/login')
  }

  const product = await prisma.product.findFirst({
    where: {
      id,
      userId: user.id
    },
    select: {
      id: true,
      name: true,
      category: true,
      baseUnit: true,
      packageUnit: true,
      packageQuantity: true,
      currentStock: true,
      estimatedMonthlyConsumption: true,
      lastStockCountAt: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    }
  })

  if (!product) {
    return null
  }

  return {
    ...product,
    packageQuantity: product.packageQuantity.toString(),
    currentStock: product.currentStock.toString(),
    estimatedMonthlyConsumption:
      product.estimatedMonthlyConsumption?.toString() ?? null
  }
}

export type UserProductDetails = NonNullable<
  Awaited<ReturnType<typeof getUserProductById>>
>