import { createClient } from '@/utils/supabase/server'
import { requireAdmin } from '@/utils/auth-guard'
import { NextRequest } from 'next/server'

export const runtime = 'nodejs'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireAdmin()
    if (!auth.authorized) return auth.response

    const supabase = await createClient()
    const params = await context.params
    const id = params.id
    const body = await request.json()
    const { title, content } = body

    if (!title || !content) {
      return new Response(JSON.stringify({ error: 'Title and content are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const { data, error } = await supabase
      .from('code_snippets')
      .update({ title, content, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()

    if (error) {
      console.error('Database error:', error)
      return new Response(JSON.stringify({ error: 'Failed to update code snippet' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    if (!data || data.length === 0) {
      return new Response(JSON.stringify({ error: 'Code snippet not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify(data[0]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('API error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireAdmin()
    if (!auth.authorized) return auth.response

    const supabase = await createClient()
    const params = await context.params
    const id = params.id

    const { error } = await supabase
      .from('code_snippets')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Database error:', error)
      return new Response(JSON.stringify({ error: 'Failed to delete code snippet' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('API error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}