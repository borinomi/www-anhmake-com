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

interface AuthCache {
  user: User | null
  loading: boolean
  error: string | null
  lastFetch: number
}

// 전역 캐시 (5분 TTL)
const AUTH_CACHE_TTL = 5 * 60 * 1000 // 5분
let globalAuthCache: AuthCache | null = null
let cacheSubscribers: Set<() => void> = new Set()

// 캐시 만료 확인
const isAuthCacheExpired = (): boolean => {
  if (!globalAuthCache) return true
  return Date.now() - globalAuthCache.lastFetch > AUTH_CACHE_TTL
}

// 캐시 업데이트 및 구독자 알림
const updateAuthCache = (newCache: AuthCache) => {
  globalAuthCache = newCache
  cacheSubscribers.forEach(callback => callback())
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthCache>(() => {
    // 초기값: 캐시가 있고 만료되지 않았으면 캐시 사용
    if (globalAuthCache && !isAuthCacheExpired()) {
      return globalAuthCache
    }
    return {
      user: null,
      loading: true,
      error: null,
      lastFetch: 0
    }
  })

  // 인증 상태 확인
  const checkAuthState = useCallback(async () => {
    // 캐시가 유효하면 API 호출 건너뛰기
    if (globalAuthCache && !isAuthCacheExpired()) {
      setAuthState(globalAuthCache)
      return globalAuthCache.user
    }

    try {
      const newState: AuthCache = {
        user: null,
        loading: true,
        error: null,
        lastFetch: Date.now()
      }
      updateAuthCache(newState)
      setAuthState(newState)

      const response = await fetch('/api/auth/user', {
        credentials: 'same-origin'
      })
      
      if (response.ok) {
        const user = await response.json()
        const successState: AuthCache = {
          user,
          loading: false,
          error: null,
          lastFetch: Date.now()
        }
        updateAuthCache(successState)
        return user
      } else {
        const errorState: AuthCache = {
          user: null,
          loading: false,
          error: 'Authentication failed',
          lastFetch: Date.now()
        }
        updateAuthCache(errorState)
        return null
      }
    } catch (error) {
      console.error('Auth check error:', error)
      const errorState: AuthCache = {
        user: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        lastFetch: Date.now()
      }
      updateAuthCache(errorState)
      return null
    }
  }, [])

  // 로그인
  const login = useCallback(() => {
    window.location.href = '/api/auth/login'
  }, [])

  // 로그아웃
  const logout = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'same-origin'
      })
      
      if (response.ok) {
        // 캐시 초기화
        const loggedOutState: AuthCache = {
          user: null,
          loading: false,
          error: null,
          lastFetch: Date.now()
        }
        updateAuthCache(loggedOutState)
        window.location.reload()
      } else {
        console.error('Logout failed')
      }
    } catch (error) {
      console.error('Logout error:', error)
    }
  }, [])

  // 캐시 무효화 (강제 새로고침)
  const invalidateAuth = useCallback(() => {
    globalAuthCache = null
    checkAuthState()
  }, [checkAuthState])

  // 컴포넌트 마운트시 인증 상태 확인
  useEffect(() => {
    checkAuthState()
    
    // 캐시 구독
    const updateState = () => {
      if (globalAuthCache) {
        setAuthState(globalAuthCache)
      }
    }
    cacheSubscribers.add(updateState)
    
    // 언마운트시 구독 해제
    return () => {
      cacheSubscribers.delete(updateState)
    }
  }, [checkAuthState])

  return {
    user: authState.user,
    loading: authState.loading,
    error: authState.error,
    isAdmin: authState.user?.role === 'admin',
    isAuthenticated: !!authState.user,
    login,
    logout,
    refresh: checkAuthState,
    invalidate: invalidateAuth
  }
}