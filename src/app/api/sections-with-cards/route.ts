import { createClient } from '@/utils/supabase/server'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // 모든 섹션과 연결된 대시보드 정보 가져오기
    const { data: sectionsWithCards, error } = await supabase
      .from('sections')
      .select(`
        *,
        cards!cards_section_id_fkey (*),
        dashboard:cards!sections_parent_card_id_fkey (id, title)
      `)
      .not('parent_card_id', 'is', null)
      .order('section_order', { ascending: true })
      .order('created_at', { foreignTable: 'cards', ascending: true })

    if (error) {
      console.error('Failed to fetch sections with cards:', error)
      return new Response(JSON.stringify({ error: 'Failed to fetch data' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // dashboard_title 필드 추가
    const sectionsWithDashboard = sectionsWithCards?.map(section => ({
      ...section,
      dashboard_title: section.dashboard?.title || 'Unknown Dashboard'
    })) || []

    return new Response(JSON.stringify(sectionsWithDashboard), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json'
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