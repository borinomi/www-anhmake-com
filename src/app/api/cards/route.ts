import { createClient } from '@/utils/supabase/server'
import { NextRequest } from 'next/server'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const section_id = searchParams.get('section_id')
    
    if (!section_id) {
      return new Response(JSON.stringify({ error: 'section_id is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .eq('section_id', section_id)
      .order('created_at', { ascending: true })
    
    if (error) {
      console.error('Cards fetch error:', error)
      return new Response(JSON.stringify({ error: 'Failed to fetch cards' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    return new Response(JSON.stringify(data || []), {
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

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { section_id, title, description, icon, type, url, created_at } = body

    // Basic validation
    if (!title || !description) {
      return new Response(JSON.stringify({ error: 'Title and description are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    if (!section_id) {
      return new Response(JSON.stringify({ error: 'section_id is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // URL validation for URL type cards
    if (type === 'url' && !url) {
      return new Response(JSON.stringify({ error: 'URL is required for URL type cards' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Prepare data for insertion with unified fields
    const cardDataToInsert = {
      section_id: section_id,
      title: title,
      description: description,
      icon: icon || 'logo.png',
      type: type || 'dashboard',
      url: type === 'url' ? url : null,
      created_at: created_at || new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('cards')
      .insert([cardDataToInsert])
      .select()
      .single()

    if (error) {
      console.error('Supabase insert error:', error)
      return new Response(JSON.stringify({ error: 'Failed to insert card into Supabase.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ success: true, message: 'Card saved to Supabase.', data: data }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error in API handler:', error)
    return new Response(JSON.stringify({ error: 'An internal server error occurred.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { id, title, description, icon, type, url } = body
    
    if (!id || !title) {
      return new Response(JSON.stringify({ error: 'id and title are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    const updateData = {
      title,
      description,
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

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { id } = body
    
    if (!id) {
      return new Response(JSON.stringify({ error: 'id is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    const { error } = await supabase
      .from('cards')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Card delete error:', error)
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