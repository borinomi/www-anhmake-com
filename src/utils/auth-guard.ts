import { createClient } from '@/utils/supabase/server'

type AuthSuccess = {
  authorized: true
  userId: string
  email: string
  role: string
}

type AuthFailure = {
  authorized: false
  response: Response
}

type AuthResult = AuthSuccess | AuthFailure

/**
 * API 라우트용 admin 인증 체크
 * POST/PUT/DELETE 등 mutating 요청에서 사용
 */
export async function requireAdmin(): Promise<AuthResult> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return {
      authorized: false,
      response: new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }

  const { data: profile, error: profileError } = await supabase
    .from('signin')
    .select('role')
    .eq('email', user.email)
    .single()

  if (profileError || profile?.role !== 'admin') {
    return {
      authorized: false,
      response: new Response(JSON.stringify({ error: 'Access denied' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }

  return {
    authorized: true,
    userId: user.id,
    email: user.email!,
    role: profile.role
  }
}
