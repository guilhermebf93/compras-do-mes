import { Suspense } from 'react'
import { connection } from 'next/server'
import { notFound } from 'next/navigation'
import { z } from 'zod'

import { ProductForm } from '@/components/products/product-form'
import { BackLink } from '@/components/back-link'
import { getUserProductById } from '@/lib/products/queries'
import { updateProduct } from '@/lib/products/actions'
import { getConversionFactor } from '@/lib/units'

interface EditProductPageProps {
  params: Promise<{
    id: string
  }>
}

export default function EditProductPage({
  params
}: EditProductPageProps) {
  return(
    <Suspense fallback={
      <div className='page-loading'>
        Carregando produto...
      </div>
    }>
      <EditProductContent params={params} />
    </Suspense>
  )
}

async function EditProductContent({
  params
}: EditProductPageProps) {
  await connection()

  const { id } = await params

  if (!z.uuid().safeParse(id).success) {
    notFound()
  }

  const product = await getUserProductById(id)

  if (!product || !product.isActive) {
    notFound()
  }

  const conversionFactor = getConversionFactor(product.packageUnit)

  const packageQuantity = (
    Number(product.packageQuantity) / conversionFactor
  ).toString()

  const estimatedMonthlyConsumption = 
    product.estimatedMonthlyConsumption !== null
    ? (
      Number(product.estimatedMonthlyConsumption) / conversionFactor
    ).toString() 
    : ''

  const updateProductWithId = updateProduct.bind(null, product.id)

  return(
    <main>
      <div className='page-container'>
        <BackLink 
          href={`/produtos/${product.id}`}
          label='← Voltar ao produto'
        />

        <header className='page-header'>
          <h1>Editar Produto</h1>
          <p>
            Atualize as informações de {product.name}
          </p>
        </header>

        <section
          className='surface'
          aria-label='Edição de produto'
        >
          <ProductForm
            action={updateProductWithId}
            initialValues={{
              name: product.name,
              category: product.category,
              packageQuantity,
              packageUnit: product.packageUnit,
              estimatedMonthlyConsumption
            }}
            submitLabel='Salvar alterações'
            pendingLabel='Salvando...'
          />
        </section>
      </div>
    </main>
  )
}