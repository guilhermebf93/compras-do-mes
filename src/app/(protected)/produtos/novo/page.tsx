import { createProduct } from '@/lib/products/actions'
import { ProductForm } from '@/components/products/product-form'

export default function NewProductPage() {
  return(
    <main>
      <div className='page-container'>
        <header className='page-header'>
          <h1>Novo Produto</h1>
          <p>
            Cadastre um produto para acompanhar seu estoque e planejar suas compras mensais
          </p>
        </header>

        <section className='surface' aria-label='Cadastro de produto'>
          <ProductForm action={createProduct} />
        </section>
      </div>
    </main>
  )
}