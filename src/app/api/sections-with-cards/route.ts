import { createClient } from '@/utils/supabase/server'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // 단일 쿼리로 sections와 cards 한번에 가져오기
    const { data: sectionsWithCards, error } = await supabase
      .from('sections')
      .select(`
        *,
        cards (*)
      `)
      .is('parent_card_id', null) // Root level sections only
      .order('section_order', { ascending: true })
      .order('created_at', { foreignTable: 'cards', ascending: true })

    if (error) {
      console.error('Failed to fetch sections with cards:', error)
      return new Response(JSON.stringify({ error: 'Failed to fetch data' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 섹션 순서대로 정렬 (section_order가 null인 경우 created_at으로)
    const sortedSections = sectionsWithCards?.sort((a, b) => {
      if (a.section_order && b.section_order) {
        return a.section_order - b.section_order
      }
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    }) || []

    return new Response(JSON.stringify(sortedSections), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60, s-maxage=300' // 캐싱 최적화
      }
    })
  } catch (error) {
    console.error('Sections with cards API error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}