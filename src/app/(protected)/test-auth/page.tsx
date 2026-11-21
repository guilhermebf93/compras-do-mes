import { getAuthenticatedUser } from '@/lib/auth/get-authenticated-user'
import { connection } from 'next/server'
import { Suspense } from 'react'

import { LogoutButton } from '@/components/logout-button'

export default async function TesteAuthPage() {

  return(
    <main>
      <Suspense fallback={<p>Carregando informações do usuário...</p>}>
        <TesteAuthContent />
      </Suspense>
    </main>
  )
}

async function TesteAuthContent() {
  await connection()

  const user = await getAuthenticatedUser()

  if (!user) {
    return <p>Usuário não autenticado!</p>
  }

  return(
    <>
      <h1>Autenticação funcionando!</h1>

      <p>Id interno: {user.id}</p>
      <p>Supabase Id: {user.supabaseId}</p>
      <p>Nome: {user.name}</p>
      <p>E-mail: {user.email}</p>

      <LogoutButton />
    </>
  )
}