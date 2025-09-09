'use client'

import { useState, useEffect, useCallback } from 'react'

interface User {
  id: string
  email: string
  name?: string
  avatar_url?: string
  role?: string
  status?: string
}

interface Card {
  id: string
  title: string
  description: string
  icon: string
  type: 'url' | 'dashboard' | 'code'
  url?: string
}

interface Section {
  id: string
  title: string
  cards: Card[]
  section_order?: number
}

// 전역 캐시 저장소
const globalCache = new Map<string, { data: unknown; timestamp: number; ttl: number }>()

const isExpired = (timestamp: number, ttl: number) => {
  return Date.now() - timestamp > ttl
}

const getCachedData = <T>(cacheKey: string): T | null => {
  const cached = globalCache.get(cacheKey)
  if (!cached || isExpired(cached.timestamp, cached.ttl)) {
    globalCache.delete(cacheKey)
    return null
  }
  return cached.data as T
}

const setCachedData = (cacheKey: string, data: unknown, ttl: number = 300000) => { // 기본 5분
  globalCache.set(cacheKey, {
    data,
    timestamp: Date.now(),
    ttl
  })
}

// 사용자 인증 훅
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const checkAuth = useCallback(async () => {
    const cacheKey = 'auth-user'
    const cached = getCachedData<User>(cacheKey)
    
    if (cached) {
      setUser(cached)
      setLoading(false)
      return cached
    }

    try {
      const response = await fetch('/api/auth/user', {
        credentials: 'same-origin'
      })
      
      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
        setCachedData(cacheKey, userData, 60000) // 1분 캐시
        return userData
      } else {
        setUser(null)
        globalCache.delete(cacheKey)
        return null
      }
    } catch (error) {
      console.error('Auth check error:', error)
      setUser(null)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'same-origin'
      })
      
      if (response.ok) {
        setUser(null)
        globalCache.delete('auth-user')
        window.location.reload()
      }
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  return {
    user,
    loading,
    isAdmin: user?.role === 'admin',
    checkAuth,
    logout
  }
}

// 섹션 데이터 훅 (메인페이지용)
export const useSectionsWithCards = () => {
  const [sections, setSections] = useState<Section[]>([])
  const [loading, setLoading] = useState(true)

  const loadSections = useCallback(async () => {
    const cacheKey = 'sections-with-cards'
    const cached = getCachedData<Section[]>(cacheKey)
    
    if (cached) {
      setSections(cached)
      setLoading(false)
      return cached
    }

    try {
      // 1차: 새로운 벌크 API 시도
      try {
        const bulkResponse = await fetch('/api/sections-with-cards')
        if (bulkResponse.ok) {
          const sectionsWithCards = await bulkResponse.json()
          setSections(sectionsWithCards)
          setCachedData(cacheKey, sectionsWithCards, 300000) // 5분 캐시
          return sectionsWithCards
        }
      } catch {
        console.log('Bulk API failed, falling back to individual calls')
      }
      
      // 2차: 기존 방식 폴백
      const sectionsResponse = await fetch('/api/sections')
      if (!sectionsResponse.ok) {
        throw new Error('Failed to load sections')
      }
      const sectionsData = await sectionsResponse.json()
      
      const sectionsWithCards = await Promise.all(
        sectionsData.map(async (section: { id: string; title: string }) => {
          const cardsResponse = await fetch(`/api/cards?section_id=${section.id}`)
          const cardsData = cardsResponse.ok ? await cardsResponse.json() : []
          return {
            ...section,
            cards: cardsData
          }
        })
      )
      
      setSections(sectionsWithCards)
      setCachedData(cacheKey, sectionsWithCards, 180000) // 3분 캐시 (폴백은 짧게)
      return sectionsWithCards
    } catch (error) {
      console.error('Error loading sections:', error)
      setSections([])
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const refetchSections = () => {
    globalCache.delete('sections-with-cards')
    return loadSections()
  }

  useEffect(() => {
    loadSections()
  }, [loadSections])

  return {
    sections,
    loading,
    loadSections,
    refetchSections
  }
}

// 아이콘 목록 훅
export const useAvailableIcons = () => {
  const [icons, setIcons] = useState<string[]>(['logo.png'])
  const [loading, setLoading] = useState(true)

  const loadIcons = useCallback(async () => {
    const cacheKey = 'available-icons'
    const cached = getCachedData<string[]>(cacheKey)
    
    if (cached) {
      setIcons(cached)
      setLoading(false)
      return cached
    }

    try {
      const response = await fetch('/api/icons')
      if (response.ok) {
        const iconsData = await response.json()
        setIcons(iconsData)
        setCachedData(cacheKey, iconsData, 3600000) // 1시간 캐시 (아이콘은 거의 변경되지 않음)
        return iconsData
      }
    } catch (error) {
      console.error('Error loading icons:', error)
    } finally {
      setLoading(false)
    }
    return icons
  }, [icons])

  useEffect(() => {
    loadIcons()
  }, [loadIcons])

  return {
    icons,
    loading,
    loadIcons
  }
}

// 캐시 관리 유틸리티
export const useCacheManager = () => {
  const clearCache = (pattern?: string) => {
    if (pattern) {
      const keysToDelete = Array.from(globalCache.keys()).filter(key => key.includes(pattern))
      keysToDelete.forEach(key => globalCache.delete(key))
    } else {
      globalCache.clear()
    }
  }

  const getCacheStats = () => {
    return {
      size: globalCache.size,
      keys: Array.from(globalCache.keys())
    }
  }

  return {
    clearCache,
    getCacheStats
  }
}