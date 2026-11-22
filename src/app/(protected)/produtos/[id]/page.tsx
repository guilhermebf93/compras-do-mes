import Link from 'next/link'
import { Suspense } from 'react'
import { connection } from 'next/server'
import { notFound } from 'next/navigation'

import { getUserProductById } from '@/lib/products/queries'
import { ProductDate } from '@/components/products/product-date'
import { BackLink } from '@/components/back-link'
import { FormSubmitButton } from '@/components/form-submit-button'
import { RestockForm } from '@/components/products/restock-form'
import {
  archiveProduct,
  reactivateProduct
} from '@/lib/products/actions'

import styles from './page.module.scss'

interface ProductDetailsPageProps {
  params: Promise<{
    id: string
  }>
}

const categoryLabels = {
  FOOD: 'Alimentos',
  CLEANING: 'Limpeza',
  PERSONAL_CARE: 'Higiene pessoal',
  OTHER: 'Outros',
}

const baseUnitLabels = {
  UNIT: 'unidades',
  GRAM: 'gramas (g)',
  MILLILITER: 'mililitros (ml)',
}

const packageUnitLabels = {
  UNIT: 'un.',
  GRAM: 'g',
  KILOGRAM: 'kg',
  MILLILITER: 'ml',
  LITER: 'l',
}

const packageConversionFactors = {
  UNIT: 1,
  GRAM: 1,
  KILOGRAM: 1000,
  MILLILITER: 1,
  LITER: 1000,
}

function formatQuantity(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: 3,
  }).format(value)
}

export default async function ProductDetailsPage({
  params
}: ProductDetailsPageProps) {
  return(
    <Suspense fallback={
      <div className='page-loading'>
        Carregando produto...
      </div>
    }>
      <ProductDetailsContent params={params} />
    </Suspense>
  )
}

async function ProductDetailsContent({
  params
}: ProductDetailsPageProps) {
  await connection()

  const { id } = await params
  const product = await getUserProductById(id)

  if (!product) {
    notFound()
  }

  const packageFactor = packageConversionFactors[product.packageUnit]
  const packageQuantity = 
    Number(product.packageQuantity) / packageFactor

  return(
    <main>
      <div className='page-container'>
        <BackLink
          href='/produtos'
          label='← Voltar aos produtos'
        />

        <header className={`page-header ${styles.header}`}>
          <div>
            <div className={styles.titleRow}>
              <h1>{product.name}</h1>

              <span
                className={
                  product.isActive
                    ? styles.activeBadge
                    : styles.archivedBadge 
                }
              >
                {product.isActive ? 'Ativo' : 'Arquivado'}
              </span>
            </div>

            <p>{categoryLabels[product.category]}</p>
          </div>
        </header>

        <div className={styles.actions}>
          {product.isActive ? (
            <>
              <Link
                href={`/produtos/${product.id}/editar`}
                className='button button--primary'
              >
                Editar produto
              </Link>

              <form action={archiveProduct.bind(null, product.id)}>

                <FormSubmitButton
                  className='button button--danger'
                  pendingText='Arquivando...'
                >
                  Arquivar produto
                </FormSubmitButton>
              </form>
            </>
          ) : (
            <form action={reactivateProduct.bind(null, product.id)}>
              <FormSubmitButton
                className='button button--primary'
                pendingText='Reativando...'
              >
                Reativar produto
              </FormSubmitButton>
            </form>
          )}
        </div>

        <div className={styles.content}>
          <section className={`surface ${styles.section}`}>
            <h2>Informações do Produto</h2>

            <div className={styles.detailsGrid}>
                <div className={styles.detailItem}>
                  <span>Nome</span>
                  <strong>{product.name}</strong>
                </div>

                <div className={styles.detailItem}>
                  <span>Categoria</span>
                  <strong>{categoryLabels[product.category]}</strong>
                </div>

                <div className={styles.detailItem}>
                  <span>Embalagem</span>
                  <strong>
                    {formatQuantity(packageQuantity)}{'  '}
                    {packageUnitLabels[product.packageUnit]}
                  </strong>
                </div>

                <div className={styles.detailItem}>
                  <span>Unidade-base</span>
                  <strong>{baseUnitLabels[product.baseUnit]}</strong>
                </div>

                <div className={styles.detailItem}>
                  <span>Consumo mensal estimado</span>
                  <strong>
                    {product.estimatedMonthlyConsumption !== null
                      ? `${formatQuantity(
                        Number(product.estimatedMonthlyConsumption)
                      )} ${baseUnitLabels[product.baseUnit]}`
                      : 'Não informado'}
                  </strong>
                </div>
            </div>
          </section>

          <section className={`surface ${styles.section}`}>
            <h2>Estoque</h2>

            <div className={styles.stockValue}>
              <strong>
                {formatQuantity(Number(product.currentStock))}
              </strong>
              <span>{baseUnitLabels[product.baseUnit]}</span>
            </div>

            <p className={styles.stockHint}>
              Última conferência: {<ProductDate date={product.lastStockCountAt} />}
            </p>

            {product.isActive && (
              <div className={styles.restock}>
                <h3>Registrar reposição</h3>

                <p>
                  Informe quantas embalagens você comprou para atualizar o seu estoque
                </p>

                <RestockForm
                  productId={product.id}
                  packageQuantity={product.packageQuantity}
                  currentStock={product.currentStock}
                  baseUnitLabel={baseUnitLabels[product.baseUnit]}
                />
              </div>
            )}
          </section>

          <section className={`surface ${styles.section}`}>
            <h2>Registro</h2>

            <div className={styles.detailsGrid}>
              <div className={styles.detailItem}>
                <span>Cadastrado em</span>
                <strong>{<ProductDate date={product.createdAt} />}</strong>
              </div>

              <div className={styles.detailItem}>
                <span>Última atualização</span>
                <strong>{<ProductDate date={product.updatedAt} />}</strong>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}