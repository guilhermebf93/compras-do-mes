'use client'
import { createClient } from '@/lib/supabase/client'

export function GoogleLoginButton() {

  async function handleGoogleLogin() {
    const supabase = createClient()

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })

    if (error) {
      console.error('Erro ao iniciar o login: ', error.message)
    }
  }

  return(
    <button onClick={handleGoogleLogin}>
      Entrar com Google
    </button>
  )
}