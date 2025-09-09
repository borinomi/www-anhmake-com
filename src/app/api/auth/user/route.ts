import { createClient } from '@/utils/supabase/server'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // signin 테이블에서 사용자 프로필 및 역할 확인
    const { data: profile, error: profileError } = await supabase
      .from('signin')
      .select('*')
      .eq('email', user.email)
      .single()

    if (profileError || !profile) {
      // 프로필이 없으면 로그아웃
      await supabase.auth.signOut()
      return new Response(JSON.stringify({ error: 'User profile not found' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({
      id: user.id,
      email: user.email,
      name: profile.name || user.user_metadata?.name || user.user_metadata?.full_name,
      avatar_url: profile.avatar_url || user.user_metadata?.avatar_url,
      role: profile.role,
      status: profile.status
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('User check error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}