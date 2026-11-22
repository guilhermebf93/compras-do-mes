'use client'

interface ProductDateProps {
  date: Date
}

export function ProductDate({ date }: ProductDateProps) {
  const formattedDate = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'long',
    timeStyle: 'short'
  }).format(date)

  return <>{formattedDate}</>
}