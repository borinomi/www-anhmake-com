import { createClient } from '@/utils/supabase/server'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // 현재 사용자가 admin인지 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // admin 권한 확인
    const { data: adminProfile, error: adminError } = await supabase
      .from('signin')
      .select('role')
      .eq('email', user.email)
      .single()

    if (adminError || adminProfile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Access denied' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 모든 사용자 목록 조회
    const { data: users, error: usersError } = await supabase
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
    const supabase = await createClient()
    
    // 현재 사용자가 admin인지 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // admin 권한 확인
    const { data: adminProfile, error: adminError } = await supabase
      .from('signin')
      .select('role')
      .eq('email', user.email)
      .single()

    if (adminError || adminProfile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Access denied' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const { user_id, role, status } = await request.json()

    if (!user_id || !role || !status) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 사용자 권한/상태 업데이트
    const { error: updateError } = await supabase
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
    const supabase = await createClient()
    
    // 현재 사용자가 admin인지 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // admin 권한 확인
    const { data: adminProfile, error: adminError } = await supabase
      .from('signin')
      .select('role')
      .eq('email', user.email)
      .single()

    if (adminError || adminProfile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Access denied' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const { user_id } = await request.json()

    if (!user_id) {
      return new Response(JSON.stringify({ error: 'Missing user_id' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 자기 자신은 삭제할 수 없음
    if (user_id === user.id) {
      return new Response(JSON.stringify({ error: 'Cannot delete yourself' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // signin 테이블에서 사용자 삭제
    const { error: deleteError } = await supabase
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