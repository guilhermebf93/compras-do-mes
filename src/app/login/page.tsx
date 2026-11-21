import { GoogleLoginButton } from './components/GoogleLoginButton'

export default function LoginPage() {

  return(
    <main>
      <h1>Compras do Mês</h1>

      <p>Entre para gerenciar seus produtos e listas de compras.</p>

      <GoogleLoginButton />
    </main>
  )
}