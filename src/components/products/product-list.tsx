'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

import type { UserProduct } from '@/lib/products/queries'

import styles from './product-list.module.scss'

type ProductStatus = 'active' | 'archived' | 'all'

type ProductSort = 
  | 'name-asc'
  | 'name-desc'
  | 'newest'
  | 'oldest'
  | 'stock-asc'
  | 'stock-desc'

const categoryLabels = {
  FOOD: 'Alimentos',
  CLEANING: 'Limpeza',
  PERSONAL_CARE: 'Higiene Pessoal',
  OTHER: 'Outros'
}

const baseUnitLabels = {
  UNIT: 'un.',
  GRAM: 'g',
  MILLILITER: 'ml'
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
    maximumFractionDigits: 3
  }).format(value)
}

function getPackageQuantity(product: UserProduct) {
  const factor = packageConversionFactors[product.packageUnit]

  return Number(product.packageQuantity) / factor
}

export function ProductList({ products }: { products: UserProduct[] }) {
  const [status, setStatus] = useState<ProductStatus>('active')
  const [category, setCategory] = useState('all')
  const [sort, setSort] = useState<ProductSort>('name-asc')
  const [search, setSearch] = useState('')

  const activeCount = products.filter(product => product.isActive).length
  const archivedCount = products.length - activeCount

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase('pt-BR')

    const filtered = products.filter(product => {
      const matchesStatus = 
        status === 'all' ||
        status === 'active' && product.isActive ||
        status === 'archived' && !product.isActive

      const matchesCategory = 
        category === 'all' || category === product.category

      const matchesSearch = product.name
        .toLocaleLowerCase('pt-BR')
        .includes(normalizedSearch)

      return matchesStatus && matchesCategory && matchesSearch
    })

    return [...filtered].sort((a, b) => {
      switch(sort) {
        case 'name-asc':
          return a.name.localeCompare(b.name, 'pt-BR')
        case 'name-desc':
          return b.name.localeCompare(a.name, 'pt-BR')
        case 'newest':
          return b.createdAt.getTime() - a.createdAt.getTime()
        case 'oldest':
          return a.createdAt.getTime() - b.createdAt.getTime()
        case 'stock-asc':
          return Number(a.currentStock) - Number(b.currentStock)
        case 'stock-desc':
          return Number(b.currentStock) - Number(a.currentStock)
        default:
          return 0
      }
    })
  }, [products, status, category, sort, search])

  return(
    <div className={styles.container}>
      <section className={styles.filters} aria-label='Filtros de Produtos'>
        <div className='form-field'>
          <label className='field-label' htmlFor='product-search'>
            Pesquisar Produto
          </label>

          <input
            id='product-search'
            type='search'
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder='Digite o nome do produto'
          />
        </div>

        <div className='form-field'>
          <label className='field-label' htmlFor='product-status'>
            Status
          </label>

          <select
            id='product-status'
            value={status}
            onChange={
              event => setStatus(event.target.value as ProductStatus)
            }
          >
            <option value='active'>Ativos ({activeCount})</option>
            <option value='archived'>Arquivados ({archivedCount})</option>
            <option value='all'>Todos ({products.length})</option>
          </select>
        </div>

        <div className='form-field'>
          <label className='field-label' htmlFor='product-category'>
              Categoria
          </label>

          <select
            id='product-category'
            value={category}
            onChange={event => setCategory(event.target.value)}
          >
            <option value='all'>Todas as Categorias</option>
            <option value='FOOD'>Alimentos</option>
            <option value='CLEANING'>Limpeza</option>
            <option value='PERSONAL_CARE'>Higiene Pessoal</option>
            <option value='OTHER'>Outros</option>
          </select>
        </div>

        <div className='form-field'>
            <label className='field-label' htmlFor='product-sort'>
              Ordenar por
            </label>

            <select
              id='product-sort'
              value={sort}
              onChange={
                event => setSort(event.target.value as ProductSort)
              }
            >
              <option value='name-asc'>Nome: A–Z</option>
              <option value='name-desc'>Nome: Z–A</option>
              <option value='newest'>Mais recentes</option>
              <option value='oldest'>Mais antigos</option>
              <option value='stock-asc'>Menor estoque</option>
              <option value='stock-desc'>Maior estoque</option>
            </select>
        </div>
      </section>

      <div className={styles.resultsHeader}>
        <span>
          {filteredProducts.length}{'  '}
          {filteredProducts.length === 1 ? 'produto encontrado' : 'produtos encontrados'}
        </span>
      </div>

      {filteredProducts.length === 0 ? (
        <div className={styles.emptyState}>
          <h2>Nenhum produto encontrado</h2>

          <p>
            {products.length === 0 
              ? 'Você ainda não cadastrou nenhum produto'
              : 'Não encontramos produtos com o filtro selecionado'}
          </p>
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredProducts.map(product => (
            <Link 
              key={product.id}
              href={`/produtos/${product.id}`}
              className={styles.card}
            >
              <div className={styles.cardHeader}>
                <h2>{product.name}</h2>

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

              <p className={styles.category}>
                  {categoryLabels[product.category]}
              </p>

              <div className={styles.details}>
                  <div>
                    <span>Embalagem</span>
                    <strong>
                      {formatQuantity(getPackageQuantity(product))}{'  '}
                      {packageUnitLabels[product.packageUnit]}
                    </strong>
                  </div>

                  <div>
                    <span>Estoque Atual</span>
                    <strong>
                      {formatQuantity(Number(product.currentStock))}{'  '}
                      {baseUnitLabels[product.baseUnit]}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Consumo Mensal Estimado
                    </span>
                    <strong>
                      {product.estimatedMonthlyConsumption !== null
                        ? `${formatQuantity(
                          Number(product.estimatedMonthlyConsumption)
                        )} ${baseUnitLabels[product.baseUnit]}`
                        : 'Não informado'}
                    </strong>
                  </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}