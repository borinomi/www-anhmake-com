import { createClient } from '@/utils/supabase/server'
import { NextRequest } from 'next/server'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const supabase = createClient()
    const { id } = await context.params

    if (!id) {
      return new Response(JSON.stringify({ error: 'Card ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const { data: cardData, error: cardError } = await supabase
      .from('cards')
      .select('*')
      .eq('id', id)
      .single()

    if (cardError) {
      if (cardError.code === 'PGRST116') {
        return new Response(JSON.stringify({ error: 'Card not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        })
      }
      console.error('Card fetch error:', cardError)
      return new Response(JSON.stringify({ error: 'Failed to fetch card' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify(cardData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('API Error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const supabase = createClient()
    const { id } = await context.params
    const body = await request.json()
    const { title, description, icon, type, url } = body

    if (!id) {
      return new Response(JSON.stringify({ error: 'Card ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    if (!title) {
      return new Response(JSON.stringify({ error: 'title is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const updateData = {
      title,
      description: description || '',
      icon: icon || 'logo.png',
      type: type || 'dashboard',
      url: type === 'url' ? url : null,
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('cards')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Card update error:', error)
      return new Response(JSON.stringify({ error: 'Failed to update card' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('API Error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const supabase = createClient()
    const { id } = await context.params

    if (!id) {
      return new Response(JSON.stringify({ error: 'Card ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const { error } = await supabase
      .from('cards')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Delete error:', error)
      return new Response(JSON.stringify({ error: 'Failed to delete card' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ success: true, message: 'Card deleted successfully' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('API Error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}