import { requireAdmin } from '@/utils/auth-guard'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

// 관리자용 서버 클라이언트 (RLS 우회)
function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

export async function GET() {
  try {
    const auth = await requireAdmin()
    if (!auth.authorized) return auth.response

    // 관리자 권한으로 모든 사용자 목록 조회 (RLS 우회)
    const adminClient = createAdminClient()
    const { data: users, error: usersError } = await adminClient
      .from('signin')
      .select('*')
      .order('created_at', { ascending: false })

    if (usersError) {
      console.error('Failed to fetch users:', usersError)
      return new Response(JSON.stringify({ error: 'Failed to fetch users' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ users }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Admin users API error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireAdmin()
    if (!auth.authorized) return auth.response

    const { user_id, role, status } = await request.json()

    if (!user_id || !role || !status) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 관리자 권한으로 사용자 권한/상태 업데이트 (RLS 우회)
    const adminClient = createAdminClient()
    const { error: updateError } = await adminClient
      .from('signin')
      .update({ role, status, updated_at: new Date().toISOString() })
      .eq('id', user_id)

    if (updateError) {
      console.error('Failed to update user:', updateError)
      return new Response(JSON.stringify({ error: 'Failed to update user' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Admin update user API error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await requireAdmin()
    if (!auth.authorized) return auth.response

    const { user_id } = await request.json()

    if (!user_id) {
      return new Response(JSON.stringify({ error: 'Missing user_id' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 자기 자신은 삭제할 수 없음
    if (user_id === auth.userId) {
      return new Response(JSON.stringify({ error: 'Cannot delete yourself' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 관리자 권한으로 사용자 삭제 (RLS 우회)
    const adminClient = createAdminClient()
    const { error: deleteError } = await adminClient
      .from('signin')
      .delete()
      .eq('id', user_id)

    if (deleteError) {
      console.error('Failed to delete user:', deleteError)
      return new Response(JSON.stringify({ error: 'Failed to delete user' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Admin delete user API error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}