'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Header from '@/components/Header'
import Section from '@/components/Section'
import SkeletonLoader from '@/components/SkeletonLoader'
import { useModal } from '@/hooks/useModal'

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
  visibility?: 'admin' | 'user' | 'all'
}

interface Section {
  id: string
  title: string
  cards: Card[]
  section_order?: number
}

interface PageData {
  id: string
  title: string
  description: string
  icon: string
}

export default function DashboardPage() {
  const params = useParams()
  const [pageData, setPageData] = useState<PageData | null>(null)
  const [sections, setSections] = useState<Section[]>([])
  const [allSections, setAllSections] = useState<Array<{id: string, title: string, dashboard_title: string}>>([])
  const [loading, setLoading] = useState(true)

  // 인증 및 아이콘 상태
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [availableIcons, setAvailableIcons] = useState<string[]>(['logo.png'])



  const dashboardId = params.id as string

  // Modal 훅 사용
  const {
    handleAddCard,
    handleEditCard,
    handleAddSection,
    handleEditSection,
    Modal
  } = useModal({
    availableIcons,
    availableSections: allSections,
    isAdmin,
    onAddCard: async (data) => {
      // 낙관적 업데이트: 즉시 UI에 카드 추가
      const tempCard: Card = {
        id: `temp_${Date.now()}`,
        title: data.title!,
        description: data.description!,
        type: data.type!,
        url: data.type === 'url' ? data.url : undefined,
        icon: data.icon!,
        visibility: data.visibility
      }

      setSections(prev => prev.map(section =>
        section.id === data.sectionId
          ? { ...section, cards: [...section.cards, tempCard] }
          : section
      ))

      // 백그라운드에서 실제 생성
      try {
        const response = await fetch('/api/cards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            section_id: data.sectionId,
            title: data.title,
            description: data.description,
            type: data.type,
            url: data.type === 'url' ? data.url : null,
            icon: data.icon,
            visibility: data.visibility
          })
        })
        if (response.ok) {
          loadDashboard()
        } else {
          setSections(prev => prev.map(section =>
            section.id === data.sectionId
              ? { ...section, cards: section.cards.filter(c => c.id !== tempCard.id) }
              : section
          ))
          throw new Error('Failed to create card')
        }
      } catch (error) {
        console.error('Error creating card:', error)
        throw error
      }
    },
    onEditCard: async (data) => {
      const response = await fetch('/api/cards', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: data.id,
          title: data.title,
          description: data.description,
          type: data.type,
          url: data.type === 'url' ? data.url : null,
          icon: data.icon,
          visibility: data.visibility,
          newSectionId: data.newSectionId
        })
      })
      if (response.ok) {
        loadDashboard()
      }
    },
    onDeleteCard: async (data) => {
      // 낙관적 업데이트: 즉시 UI에서 카드 제거
      const cardToDelete = data.id!
      const sectionId = data.sectionId!

      setSections(prev => prev.map(section =>
        section.id === sectionId
          ? { ...section, cards: section.cards.filter(c => c.id !== cardToDelete) }
          : section
      ))

      try {
        const response = await fetch('/api/cards', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: cardToDelete })
        })
        if (response.ok) {
          loadDashboard()
        } else {
          throw new Error('Failed to delete card')
        }
      } catch (error) {
        console.error('Error deleting card:', error)
        loadDashboard() // 에러시 데이터 복구
        throw error
      }
    },
    onAddSection: async (data) => {
      const response = await fetch('/api/sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: `section_${Date.now()}`,
          title: data.title,
          section_order: 1,
          parent_card_id: dashboardId
        })
      })
      if (response.ok) {
        loadDashboard()
      }
    },
    onEditSection: async (data) => {
      const currentSection = sections.find(s => s.id === data.sectionId)
      const response = await fetch('/api/sections', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: data.sectionId,
          title: data.title,
          section_order: currentSection?.section_order || 1
        })
      })
      if (response.ok) {
        loadDashboard()
      }
    },
    onDeleteSection: async (data) => {
      const response = await fetch('/api/sections', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: data.sectionId })
      })
      if (response.ok) {
        loadDashboard()
      }
    }
  })


  // 사용자 인증 로딩
  const loadUser = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/user')
      if (response.ok) {
        const user = await response.json()
        setCurrentUser(user)
        setIsAdmin(user?.role === 'admin')
      } else {
        setCurrentUser(null)
        setIsAdmin(false)
      }
    } catch (error) {
      console.error('User loading error:', error)
      setCurrentUser(null)
      setIsAdmin(false)
    }
  }, [])

  // 아이콘 목록 로딩
  const loadIcons = useCallback(async () => {
    try {
      const response = await fetch('/api/icons')
      if (response.ok) {
        const icons = await response.json()
        setAvailableIcons(Array.isArray(icons) ? icons : ['logo.png'])
      }
    } catch (error) {
      console.error('Icons loading error:', error)
      setAvailableIcons(['logo.png'])
    }
  }, [])

  const loadDashboard = useCallback(async () => {
    try {
      // 1차: 새로운 벌크 API 시도
      try {
        const bulkResponse = await fetch(`/api/dashboard/${dashboardId}/full`)
        if (bulkResponse.ok) {
          const { dashboard, sections } = await bulkResponse.json()
          setPageData(dashboard)
          setSections(sections)
          setLoading(false)
          return // 성공시 조기 리턴
        }
      } catch (bulkError) {
        console.log('Dashboard bulk API failed, falling back:', bulkError)
      }

      // 2차: 기존 방식 폴백
      // 병렬로 대시보드 정보와 섹션 정보 로딩
      const [cardResponse, sectionsResponse] = await Promise.all([
        fetch(`/api/cards/${dashboardId}`),
        fetch(`/api/sections?parent_card_id=${dashboardId}`)
      ])

      if (!cardResponse.ok) {
        throw new Error('Dashboard not found')
      }
      const cardData = await cardResponse.json()
      setPageData(cardData)

      if (sectionsResponse.ok) {
        const sectionsData = await sectionsResponse.json()

        // 병렬로 섹션별 카드 로딩 (기존 Promise.all 유지)
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
      }
    } catch {
      console.error('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }, [dashboardId])

  useEffect(() => {
    loadUser()
    loadIcons()
    loadDashboard()
    fetch('/api/sections-with-cards').then(r => r.json()).then(data => setAllSections(data))
  }, [loadUser, loadIcons, loadDashboard])

  // 브라우저 탭 타이틀 업데이트
  useEffect(() => {
    if (pageData?.title) {
      document.title = `${pageData.title} - anhmake.com`
    }
  }, [pageData?.title])

  // Modal handlers - 이제 useModal 훅에서 제공

  if (loading) {
    return <SkeletonLoader isDashboard={dashboardId !== '1'} />
  }

  if (!pageData) {
    return (
      <div className="loading-container">
        <div className="text-white text-xl">페이지를 불러올 수 없습니다.</div>
      </div>
    )
  }

  return (
    <div className="container">
      {dashboardId !== '1' && (
        <Link href="/dashboard/1" className="back-btn">← 메인으로</Link>
      )}

      {dashboardId === '1' ? (
        <Header
          user={currentUser}
          onLogin={() => {
            window.location.href = '/api/auth/login'
          }}
          onLogout={async () => {
            try {
              await fetch('/api/auth/logout', { method: 'POST' })
              setCurrentUser(null)
              setIsAdmin(false)
            } catch (error) {
              console.error('Logout error:', error)
            }
          }}
        />
      ) : (
        <div className="page-header">
          <Image
            src={pageData.icon ?
              (pageData.icon.startsWith('http') ? pageData.icon : `/icon/${pageData.icon}`)
              : '/logo.png'}
            alt="Dashboard"
            width={60}
            height={60}
            className="page-logo"
          />
          <div className="page-header-text">
            <div className="page-header-line">{pageData.title}</div>
            <div className="page-header-line">{pageData.description}</div>
          </div>
        </div>
      )}

      <div id="sectionsContainer">
        {sections.map(section => (
          <Section
            key={section.id}
            section={section}
            isAuthorized={isAdmin}
            onAddCard={handleAddCard}
            onEditSection={handleEditSection}
            onEditCard={(cardId, sectionId) => handleEditCard(cardId, sectionId, sections)}
          />
        ))}
      </div>

      {/* Add Section Button (only for admin users) */}
      {isAdmin && (
        <div id="addSectionContainer" style={{ marginBottom: '2rem' }}>
          <button
            className="btn-add-section"
            onClick={handleAddSection}
            title="섹션 추가"
          >
            + 섹션 추가
          </button>
        </div>
      )}

      {dashboardId === '1' && (
        <div className="contact">
          Contact: <a href="mailto:contact@anhmake.com">contact@anhmake.com</a>
          <br />
          사업자 등록번호: 858-22-02317
        </div>
      )}

      {Modal}
    </div>
  )
}
