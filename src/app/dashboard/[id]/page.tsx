'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Section from '@/components/Section'

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
  const [isAuthorized, setIsAuthorized] = useState(false)

  const dashboardId = params.id as string

  useEffect(() => {
    checkAuth()
    loadDashboard()
  }, [dashboardId])

  async function checkAuth() {
    try {
      const response = await fetch('/api/auth/user')
      setIsAuthorized(response.ok)
    } catch (error) {
      setIsAuthorized(false)
    }
  }

  async function loadDashboard() {
    try {
      // Load card data
      const cardResponse = await fetch(`/api/cards/${dashboardId}`)
      if (!cardResponse.ok) {
        throw new Error('Dashboard not found')
      }
      const cardData = await cardResponse.json()
      setPageData(cardData)

      // Load sections for this dashboard
      const sectionsResponse = await fetch(`/api/sections?parent_card_id=${dashboardId}`)
      if (sectionsResponse.ok) {
        const sectionsData = await sectionsResponse.json()
        
        // Load cards for each section
        const sectionsWithCards = await Promise.all(
          sectionsData.map(async (section: any) => {
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
    } catch (error) {
      console.error('Failed to load dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  function handleAddCard(sectionId: string) {
    // TODO: Implement add card modal
    console.log('Add card to section:', sectionId)
  }

  function handleEditSection(sectionId: string, title: string) {
    // TODO: Implement edit section modal
    console.log('Edit section:', sectionId, title)
  }

  function handleEditCard(cardId: string, sectionId: string) {
    // TODO: Implement edit card modal
    console.log('Edit card:', cardId, 'in section:', sectionId)
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="text-white text-xl">로딩 중...</div>
      </div>
    )
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

        .btn-add-section {
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

        .btn-add-section:hover {
          background: rgba(0, 0, 0, 0.5);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        @media (max-width: 768px) {
          body {
            padding: 1rem;
          }
        }
      `}</style>
      
      <div className="container">
        <Link href="/" className="back-btn">← 메인으로</Link>
        
        <div className="page-header">
          <img 
            src={pageData.icon ? `/icon/${pageData.icon}` : '/logo.png'} 
            alt="Dashboard" 
            className="page-logo"
            onError={(e) => {
              e.currentTarget.src = '/logo.png'
            }}
          />
          <div className="page-header-text">
            <div className="page-header-line">{pageData.title}</div>
            <div className="page-header-line">{pageData.description}</div>
          </div>
        </div>

        {sections.length === 0 ? (
          <div className="empty-dashboard">
            <p>아직 섹션이 없습니다.</p>
            {isAuthorized && (
              <button className="btn-add-section">
                + 섹션 추가
              </button>
            )}
          </div>
        ) : (
          <>
            {isAuthorized && (
              <div style={{ marginBottom: '2rem' }}>
                <button className="btn-add-section">+ 섹션 추가</button>
              </div>
            )}
            {sections.map(section => (
              <Section
                key={section.id}
                section={section}
                isAuthorized={isAuthorized}
                onAddCard={handleAddCard}
                onEditSection={handleEditSection}
                onEditCard={handleEditCard}
              />
            ))}
          </>
        )}
      </div>
    </>
  )
}