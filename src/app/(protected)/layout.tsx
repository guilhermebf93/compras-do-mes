import { Suspense } from 'react'
import { connection } from 'next/server'
import { redirect } from 'next/navigation'

import { getAuthenticatedUser } from '@/lib/auth/get-authenticated-user'

interface ProtectedLayoutProps {
  children: React.ReactNode
}

export default function ProtectedLayout({
  children
}: ProtectedLayoutProps) {
  return(
    <Suspense fallback={
      <div className='page-loading'>Verificando autenticação...</div>
    }>
      <ProtectedContent>
        {children}
      </ProtectedContent>
    </Suspense>
  )
}

async function ProtectedContent({
  children
}: ProtectedLayoutProps) {
  await connection()

  const user = await getAuthenticatedUser()

  if (!user) {
    redirect('/login')
  }

  return children
}