'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { createClient } from '@/lib/supabase/client'

export function LogoutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogout() {
    setLoading(true)
    setError(null)

    const supabase = createClient()

    const { error } = await supabase.auth.signOut({
      scope: 'local'
    })

    if (error) {
      setError('Não foi possível encerrar a sessão.')
      setLoading(false)
      return
    }

    router.replace('/login')
    router.refresh()
  }

  return(
    <div>
      <button onClick={handleLogout} disabled={loading}>
        {loading ? 'Saindo...' : 'Sair'}
      </button>

      {error && <p role='alert'>{error}</p>}
    </div>
  )
}