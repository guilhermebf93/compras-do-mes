'use client'

import styles from './restock-form.module.scss'
import { useActionState, useState } from 'react'

import {
  restockProduct,
  type ProductActionState
} from '@/lib/products/actions'

interface RestockFormProps {
  productId: string,
  packageQuantity: string,
  currentStock: string,
  baseUnitLabel: string
}

const initialState: ProductActionState = {}

function formatQuantity(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: 3
  }).format(value)
}

export function RestockForm({
  productId,
  packageQuantity,
  currentStock,
  baseUnitLabel
}: RestockFormProps) {
  const [packageCount, setPackageCount] = useState('')
  
  const action = restockProduct.bind(null, productId)

  const [state, formAction, isPending] = useActionState(
    async (prevState: ProductActionState, formData: FormData) => {
      const result = await action(prevState, formData)

      if (result.success) {
        setPackageCount('')
      }

      return result
    },
    initialState
  )

  const count = Number(packageCount)
  const packageValue = Number(packageQuantity)
  const stockValue = Number(currentStock)

  const isValidCount = 
    Number.isSafeInteger(count) && count > 0

  const addedQuantity = isValidCount 
    ? packageValue * count
    : 0

  const newStock = addedQuantity + stockValue

  return(
    <form
      action={formAction}
      className='form'
      noValidate
    >
      {state.message && (
        <div
          className={`alert ${
            state.success ? 'alert--success' : 'alert--error'
          }`}
          role='status'
        >
          {state.message}
        </div>
      )}

      <div className='form-field'>
        <label className='field-label' htmlFor='packageCount'>
          Quantidade de Embalagens
        </label>

        <input
          id='packageCount'
          name='packageCount'
          type='number'
          min={1}
          step={1}
          inputMode='numeric'
          placeholder='Ex: 2'
          value={packageCount}
          onChange={(event) => setPackageCount(event.target.value)}
          aria-invalid={Boolean(state.errors?.packageCount)}
          required
        />

        {state.errors?.packageCount && (
          <span className='field-error'>
            {state.errors.packageCount[0]}
          </span>
        )}
      </div>

      {isValidCount && Number.isFinite(newStock) && (
        <div className={styles.preview}>
          <div className={styles.previewItem}>
            <span>Quantidade a adicionar</span>

            <strong>
              {formatQuantity(addedQuantity)} {baseUnitLabel}
            </strong>
          </div>

          <div className={styles.previewItem}>
            <span>Novo estoque</span>
            <strong>
              {formatQuantity(newStock)} {baseUnitLabel}
            </strong>
          </div>
        </div>
      )}

      <button
        type='submit'
        className='button button--primary'
        disabled={isPending || !isValidCount}
      >
        {isPending ? 'Registrando...' : 'Registrar'}
      </button>
    </form>
  )
}