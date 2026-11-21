import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function getAuthenticatedUser() {
  const supabase = await createClient()

  const {
    data: { user: supabaseUser },
    error
  } = await supabase.auth.getUser()

  if (error?.name === 'AuthSessionMissingError') {
    return null
  }
  
  if (error) {
    throw new Error('Não foi possível verificar a autenticação.')
  }

  if (!supabaseUser) {
    return null
  }

  if (!supabaseUser.email) {
    throw new Error('O usuário autenticado não possui um e-mail.')
  }

  const metadata = supabaseUser.user_metadata ?? {}

  const name =
    typeof metadata.full_name === 'string'
      ? metadata.full_name
      : typeof metadata.name === 'string'
      ? metadata.name
      : null

  const avatarUrl = 
    typeof metadata.avatar_url === "string"
      ? metadata.avatar_url
      : typeof metadata.picture === "string"
        ? metadata.picture
        : null

  const user = await prisma.user.upsert({
    where: {
      supabaseId: supabaseUser.id,
    },
    update: {
      email: supabaseUser.email
    },
    create: {
      supabaseId: supabaseUser.id,
      email: supabaseUser.email,
      name,
      avatarUrl
    }
  })

  return user
}