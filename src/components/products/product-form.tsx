'use client'

import { useActionState } from 'react'

import type { ProductActionState } from '@/lib/products/actions'
import type { ProductCategory } from '@/lib/product-constants'
import type { PackageUnit } from '@/lib/units'

type ProductFormAction = (
  prevState: ProductActionState,
  formData: FormData
) => Promise<ProductActionState>

type ProductFormProps = {
  action: ProductFormAction
  initialValues?: {
    name?: string
    category?: ProductCategory
    packageQuantity?: string
    packageUnit?: PackageUnit
    estimatedMonthlyConsumption?: string
  }
  submitLabel?: string
  pendingLabel?: string
}

const initialState: ProductActionState = {}

export function ProductForm({
  action,
  initialValues,
  submitLabel = 'Cadastrar produto',
  pendingLabel = 'Cadastrando...'
}: ProductFormProps) {
  const [state, formAction, isPending] = useActionState(
    action,
    initialState
  )

  return(
    <form action={formAction} className='form' noValidate>
      {state.message && (
        <div className='alert alert--error' role='alert'>
          {state.message}
        </div>
      )}

      <div className='form-grid'>
        <div className='form-field'>
          <label className='field-label' htmlFor='name'>
            Nome do produto
          </label>

          <input
            id='name'
            name='name'
            type='text'
            placeholder='Ex: Arroz'
            minLength={2}
            maxLength={80}
            required
            defaultValue={initialValues?.name ?? ''}
            aria-invalid={Boolean(state.errors?.name)}
          />

          {state.errors?.name && (
            <span className='field-error'>
              {state.errors.name[0]}
            </span>
          )}
        </div>

        <div className='form-field'>
          <label className='field-label' htmlFor='category'>
            Categoria
          </label>

          <select
            id='category'
            name='category'
            defaultValue={initialValues?.category ?? ''}
            required
            aria-invalid={Boolean(state.errors?.category)}
          >
            <option value='' disabled>
              Selecione uma categoria
            </option>
            <option value='FOOD'>Alimentos</option>
            <option value='CLEANING'>Limpeza</option>
            <option value='PERSONAL_CARE'>Higiene pessoal</option>
            <option value='OTHER'>Outros</option>
          </select>

          {state.errors?.category && (
            <span className='field-error'>
              {state.errors.category[0]}
            </span>
          )}
        </div>

        <div className='form-field'>
          <label className='field-label' htmlFor='packageQuantity'>
            Quantidade por embalagem
          </label>

          <input
            id='packageQuantity'
            name='packageQuantity'
            type='text'
            inputMode='decimal'
            placeholder='Ex.: 1 ou 500'
            required
            defaultValue={initialValues?.packageQuantity ?? ''}
            aria-invalid={Boolean(state.errors?.packageQuantity)}
          />

          <span className='field-hint'>
            Informe a quantidade contida em uma embalagem.
          </span>

          {state.errors?.packageQuantity && (
            <span className='field-error'>
              {state.errors.packageQuantity[0]}
            </span>
          )}
        </div>

        <div className='form-field'>
          <label className='field-label' htmlFor='packageUnit'>
            Unidade da embalagem
          </label>

          <select
            id='packageUnit'
            name='packageUnit'
            defaultValue={initialValues?.packageUnit ?? ''}
            required
            aria-invalid={Boolean(state.errors?.packageUnit)}
          >
            <option value='' disabled>
              Selecione uma unidade
            </option>
            <option value='UNIT'>Unidade</option>
            <option value='GRAM'>Gramas (g)</option>
            <option value='KILOGRAM'>Quilogramas (kg)</option>
            <option value='MILLILITER'>Mililitros (ml)</option>
            <option value='LITER'>Litros (l)</option>
          </select>

          {state.errors?.packageUnit && (
            <span className='field-error'>
              {state.errors.packageUnit[0]}
            </span>
          )}
        </div>

        <div className='form-field'>
          <label
            className='field-label'
            htmlFor='estimatedMonthlyConsumption'
          >
            Consumo mensal estimado (opcional)
          </label>

          <input
            id='estimatedMonthlyConsumption'
            name='estimatedMonthlyConsumption'
            type='text'
            inputMode='decimal'
            placeholder='Ex.: 2000'
            defaultValue={
              initialValues?.estimatedMonthlyConsumption ?? ''
            }
            aria-invalid={Boolean(
              state.errors?.estimatedMonthlyConsumption,
            )}
          />

          <span className='field-hint'>
            Informe quanto você estima consumir por mês, utilizando
            a mesma unidade da embalagem.
          </span>

          {state.errors?.estimatedMonthlyConsumption && (
            <span className='field-error'>
              {state.errors.estimatedMonthlyConsumption[0]}
            </span>
          )}
        </div>
      </div>

      <button
        type='submit'
        className='button button--primary'
        disabled={isPending}
      >
        {isPending ? pendingLabel : submitLabel}
      </button>
    </form>
  )
}
