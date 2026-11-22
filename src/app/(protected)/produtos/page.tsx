import { Suspense } from 'react'
import Link from 'next/link'
import { connection } from 'next/server'

import { getUserProducts } from '@/lib/products/queries'
import { ProductList } from '@/components/products/product-list'

import styles from './page.module.scss'

export default function ProductsPage() {
  return(
    <main>
      <div className='page-container'>
        <header className={`page-header ${styles.header}`}>
          <div>
            <h1>Meus Produtos</h1>
            <p>
              Gerencie seus produtos e acompanhe seu estoque.
            </p>
          </div>

          <Link
            href='/produtos/novo'
            className={`button button-primary ${styles.newProductButton}`}
          >
            Novo Produto
          </Link>
        </header>

        <Suspense fallback={
          <div className='page-loading'>
            Carregando produtos...
          </div>
        }>
          <ProductsContent />
        </Suspense>
      </div>
    </main>
  )
}

async function ProductsContent() {
  await connection()
  
  const products = await getUserProducts()
  
  return <ProductList products={products} />
}