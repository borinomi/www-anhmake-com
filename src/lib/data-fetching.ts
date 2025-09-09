import { cache } from 'react'
import 'server-only'

// 타입 정의
export interface Card {
  id: string
  title: string
  description: string
  icon: string
  type: 'url' | 'dashboard' | 'code'
  url?: string
}

export interface Section {
  id: string
  title: string
  section_order?: number
  cards: Card[]
}

export interface DashboardData {
  id: string
  title: string
  description: string
  icon: string
  type: 'url' | 'dashboard' | 'code'
  url?: string
}

export interface DashboardFullData {
  dashboard: DashboardData
  sections: Section[]
}

// 메모이제이션된 섹션+카드 로딩 (메인페이지용)
export const getSectionsWithCards = cache(async (): Promise<Section[]> => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/sections-with-cards`, {
      cache: 'force-cache', // 정적 캐싱
      next: { revalidate: 300 } // 5분마다 재검증
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching sections with cards:', error)
    return []
  }
})

// 메모이제이션된 대시보드 전체 데이터 로딩
export const getDashboardFull = cache(async (dashboardId: string): Promise<DashboardFullData | null> => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/dashboard/${dashboardId}/full`, {
      cache: 'force-cache',
      next: { revalidate: 180 } // 3분마다 재검증
    })
    
    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching dashboard full data:', error)
    return null
  }
})

// 아이콘 목록 캐싱
export const getAvailableIcons = cache(async (): Promise<string[]> => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/icons`, {
      cache: 'force-cache',
      next: { revalidate: 3600 } // 1시간마다 재검증 (아이콘은 거의 변경되지 않음)
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching available icons:', error)
    return ['logo.png'] // 기본값
  }
})

// 사용자 인증 정보 캐싱
export const getCurrentUser = cache(async () => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/auth/user`, {
      cache: 'no-store' // 인증 정보는 캐시하지 않음
    })
    
    if (!response.ok) {
      return null
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching current user:', error)
    return null
  }
})

// 프리로딩 함수들 (사용자 인터랙션 대비)
export const preloadSectionsWithCards = () => {
  void getSectionsWithCards()
}

export const preloadDashboardFull = (dashboardId: string) => {
  void getDashboardFull(dashboardId)
}

export const preloadAvailableIcons = () => {
  void getAvailableIcons()
}