import { createClient } from '@/utils/supabase/server'

export const runtime = 'nodejs'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // 병렬로 대시보드 정보와 섹션+카드 정보 가져오기
    const [dashboardResponse, sectionsResponse] = await Promise.all([
      // 1. 대시보드 카드 정보
      supabase
        .from('cards')
        .select('*')
        .eq('id', id)
        .single(),
      
      // 2. 대시보드의 섹션들과 각 섹션의 카드들 한번에 (명시적 관계 참조)
      supabase
        .from('sections')
        .select(`
          *,
          cards!cards_section_id_fkey (*)
        `)
        .eq('parent_card_id', id)
        .not('id', 'like', 'hidden_%')
        .order('section_order', { ascending: true })
        .order('created_at', { foreignTable: 'cards', ascending: true })
    ])

    // 대시보드 존재 여부 확인
    if (dashboardResponse.error || !dashboardResponse.data) {
      return new Response(JSON.stringify({ error: 'Dashboard not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    if (sectionsResponse.error) {
      console.error('Failed to fetch sections:', sectionsResponse.error)
      return new Response(JSON.stringify({ error: 'Failed to fetch sections' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 섹션 정렬
    const sortedSections = sectionsResponse.data?.sort((a, b) => {
      if (a.section_order && b.section_order) {
        return a.section_order - b.section_order
      }
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    }) || []

    const result = {
      dashboard: dashboardResponse.data,
      sections: sortedSections
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=30, s-maxage=180' // 대시보드는 더 짧은 캐시
      }
    })
  } catch (error) {
    console.error('Dashboard full API error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}