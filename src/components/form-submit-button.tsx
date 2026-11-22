'use client'

import { useFormStatus } from 'react-dom'

interface FormSubmitButtonProps {
  children: React.ReactNode
  pendingText: string
  className: string
}

export function FormSubmitButton({
  children,
  pendingText,
  className
}: FormSubmitButtonProps) {
  const { pending } = useFormStatus()

  return(
    <button
      type='submit'
      className={className}
      disabled={pending}
    >
      {pending ? pendingText : children}
    </button>
  )
}