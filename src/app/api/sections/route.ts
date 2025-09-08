import { createClient } from '@/utils/supabase/server'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // First, test basic API route functionality
    console.log('API Route called')
    console.log('Environment check:', {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'present' : 'missing'
    })
    
    const supabase = createClient()
    console.log('Supabase client created')
    
    const { searchParams } = new URL(request.url)
    const parent_card_id = searchParams.get('parent_card_id')
    
    let query = supabase
      .from('sections')
      .select('*')
      
    // Filter by parent_card_id or get root sections (parent_card_id IS NULL)
    if (parent_card_id) {
      query = query.eq('parent_card_id', parent_card_id)
    } else {
      query = query.is('parent_card_id', null)
    }
    
    console.log('About to execute query')
    const { data, error } = await query.order('section_order', { ascending: true })
    console.log('Query completed:', { data: data?.length, error: error?.message })
    
    if (error) {
      console.error('Sections fetch error:', error)
      return new Response(JSON.stringify({ 
        error: 'Failed to fetch sections',
        details: error.message,
        code: error.code
      }), {
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
    return new Response(JSON.stringify({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()
    const { id, title, section_order, parent_card_id } = body
    
    if (!id || !title) {
      return new Response(JSON.stringify({ error: 'id and title are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    const { data, error } = await supabase
      .from('sections')
      .insert([{ 
        id, 
        title, 
        section_order: section_order || 1,
        parent_card_id: parent_card_id || null
      }])
      .select()
      .single()
    
    if (error) {
      console.error('Section insert error:', error)
      return new Response(JSON.stringify({ error: 'Failed to create section' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    return new Response(JSON.stringify(data), {
      status: 201,
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

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()
    const { id, title, section_order, parent_card_id } = body
    
    if (!id || !title) {
      return new Response(JSON.stringify({ error: 'id and title are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    const { data, error } = await supabase
      .from('sections')
      .update({ 
        title, 
        section_order,
        parent_card_id: parent_card_id || null
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Section update error:', error)
      return new Response(JSON.stringify({ error: 'Failed to update section' }), {
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
    const supabase = createClient()
    const body = await request.json()
    const { id } = body
    
    if (!id) {
      return new Response(JSON.stringify({ error: 'id is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    const { error } = await supabase
      .from('sections')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Section delete error:', error)
      return new Response(JSON.stringify({ error: 'Failed to delete section' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    return new Response(JSON.stringify({ success: true, message: 'Section deleted successfully' }), {
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