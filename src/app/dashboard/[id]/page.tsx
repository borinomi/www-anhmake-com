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
    isAdmin,
    onAddCard: async (data) => {
      // 낙관적 업데이트: 즉시 UI에 카드 추가
      const tempCard: Card = {
        id: `temp_${Date.now()}`,
        title: data.title!,
        description: data.description!,
        type: data.type!,
        url: data.type === 'url' ? data.url : undefined,
        icon: data.icon!
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
            icon: data.icon
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
          icon: data.icon
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
  }, [loadUser, loadIcons, loadDashboard])

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
    <>
      <style jsx global>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Inter', sans-serif;
          background-image: url("/chalk-bg.jpg");
          background-size: cover;
          background-attachment: fixed;
          background-position: center;
          background-repeat: no-repeat;
          color: #1e293b;
          min-height: 100vh;
          padding: 2rem;
        }

        .container {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
        }

        .back-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(0, 0, 0, 0.3);
          color: #ffffff;
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 2rem;
          text-decoration: none;
          font-weight: 500;
          font-size: 0.9rem;
          margin-bottom: 2rem;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .back-btn:hover {
          background: rgba(0, 0, 0, 0.5);
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
        }

        .loading-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .page-header {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          margin-bottom: 2rem;
          width: fit-content;
        }

        .page-logo {
          width: 60px;
          height: 60px;
          flex-shrink: 0;
        }

        .page-header-text {
          display: flex;
          flex-direction: column;
        }

        .page-header-line {
          color: #ffffff;
          font-weight: 600;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
          margin: 0;
          line-height: 1.4;
        }

        .page-header-line:first-child {
          font-size: 1.5rem;
          font-weight: 700;
        }

        .page-header-line:nth-child(2) {
          font-size: 1rem;
        }

        .empty-dashboard {
          text-align: center;
          color: #64748b;
          margin-top: 2rem;
        }

        .btn-add-section,
        .btn-section-action {
          background: rgba(0, 0, 0, 0.3);
          border: none;
          border-radius: 2rem;
          width: auto;
          padding: 0.8rem 1.5rem;
          color: #ffffff;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 1rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }

        .btn-add-section:hover,
        .btn-section-action:hover {
          background: rgba(0, 0, 0, 0.5);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .contact {
          text-align: center;
          margin-top: 2rem;
          color: #ffffff;
          font-weight: 500;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }

        .contact a {
          color: #60a5fa;
          text-decoration: none;
        }

        .contact a:hover {
          text-decoration: underline;
        }

        @media (max-width: 768px) {
          body {
            padding: 1rem;
          }
        }

        /* Modal Styles */
        .modal {
          position: fixed;
          z-index: 1000;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(5px);
          overflow-y: auto;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 3rem 1rem;
        }

        .modal-content {
          background: white;
          margin: 0;
          padding: 1.5rem;
          border-radius: 1rem;
          width: 100%;
          max-width: 500px;
          max-height: calc(100vh - 4rem);
          position: relative;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid #e2e8f0;
        }

        .modal-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: #1e293b;
        }

        .close {
          font-size: 1.5rem;
          font-weight: bold;
          color: #64748b;
          cursor: pointer;
          transition: color 0.3s;
        }

        .close:hover {
          color: #1e293b;
        }

        .form-group {
          margin-bottom: 1rem;
        }

        .form-label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: #374151;
        }

        .form-input, .form-select, .form-textarea {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #e5e7eb;
          border-radius: 0.5rem;
          font-size: 1rem;
          transition: border-color 0.3s;
        }

        .form-input:focus, .form-select:focus, .form-textarea:focus {
          outline: none;
          border-color: #4338ca;
        }

        .form-textarea {
          resize: vertical;
          min-height: 100px;
        }

        .btn-primary {
          background: #4338ca;
          color: white;
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 0.5rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s;
        }

        .btn-primary:hover {
          background: #3730a3;
          transform: translateY(-2px);
        }

        .btn-secondary {
          background: #6b7280;
          color: white;
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 0.5rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s;
        }

        .btn-secondary:hover {
          background: #4b5563;
          transform: translateY(-2px);
        }
      `}</style>
      
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
              className="btn-section-action" 
              onClick={handleAddSection}
              title="섹션 추가" 
              style={{ 
                width: 'auto', 
                padding: '0.8rem 1.5rem', 
                borderRadius: '2rem' 
              }}
            >
              + 섹션 추가
            </button>
          </div>
        )}

        {dashboardId === '1' && (
          <div className="contact">
            Contact: <a href="mailto:contact@anhmake.com">contact@anhmake.com</a>
          </div>
        )}

        {Modal}
      </div>
    </>
  )
}