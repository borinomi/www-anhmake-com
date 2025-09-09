'use client'

import { useState, useEffect, useCallback } from 'react'

interface IconsCache {
  icons: string[]
  loading: boolean
  error: string | null
  lastFetch: number
}

// 전역 캐시 (30분 TTL - 아이콘은 자주 변경되지 않음)
const ICONS_CACHE_TTL = 30 * 60 * 1000 // 30분
let globalIconsCache: IconsCache | null = null
let cacheSubscribers: Set<() => void> = new Set()

// 캐시 만료 확인
const isIconsCacheExpired = (): boolean => {
  if (!globalIconsCache) return true
  return Date.now() - globalIconsCache.lastFetch > ICONS_CACHE_TTL
}

// 캐시 업데이트 및 구독자 알림
const updateIconsCache = (newCache: IconsCache) => {
  globalIconsCache = newCache
  cacheSubscribers.forEach(callback => callback())
}

export const useIcons = () => {
  const [iconsState, setIconsState] = useState<IconsCache>(() => {
    // 초기값: 캐시가 있고 만료되지 않았으면 캐시 사용
    if (globalIconsCache && !isIconsCacheExpired()) {
      return globalIconsCache
    }
    return {
      icons: ['logo.png'], // 기본 아이콘
      loading: true,
      error: null,
      lastFetch: 0
    }
  })

  // 아이콘 목록 로딩
  const loadIcons = useCallback(async () => {
    // 캐시가 유효하면 API 호출 건너뛰기
    if (globalIconsCache && !isIconsCacheExpired()) {
      setIconsState(globalIconsCache)
      return globalIconsCache.icons
    }

    try {
      const newState: IconsCache = {
        icons: ['logo.png'],
        loading: true,
        error: null,
        lastFetch: Date.now()
      }
      updateIconsCache(newState)
      setIconsState(newState)

      const response = await fetch('/api/icons')
      
      if (response.ok) {
        const icons = await response.json()
        const successState: IconsCache = {
          icons: Array.isArray(icons) ? icons : ['logo.png'],
          loading: false,
          error: null,
          lastFetch: Date.now()
        }
        updateIconsCache(successState)
        return successState.icons
      } else {
        const errorState: IconsCache = {
          icons: ['logo.png'], // 실패시 기본 아이콘 사용
          loading: false,
          error: 'Failed to load icons',
          lastFetch: Date.now()
        }
        updateIconsCache(errorState)
        return errorState.icons
      }
    } catch (error) {
      console.error('Icons loading error:', error)
      const errorState: IconsCache = {
        icons: ['logo.png'],
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        lastFetch: Date.now()
      }
      updateIconsCache(errorState)
      return errorState.icons
    }
  }, [])

  // 캐시 무효화 (강제 새로고침)
  const invalidateIcons = useCallback(() => {
    globalIconsCache = null
    loadIcons()
  }, [loadIcons])

  // 컴포넌트 마운트시 아이콘 로딩
  useEffect(() => {
    loadIcons()
    
    // 캐시 구독
    const updateState = () => {
      if (globalIconsCache) {
        setIconsState(globalIconsCache)
      }
    }
    cacheSubscribers.add(updateState)
    
    // 언마운트시 구독 해제
    return () => {
      cacheSubscribers.delete(updateState)
    }
  }, [loadIcons])

  return {
    icons: iconsState.icons,
    loading: iconsState.loading,
    error: iconsState.error,
    refresh: loadIcons,
    invalidate: invalidateIcons
  }
}