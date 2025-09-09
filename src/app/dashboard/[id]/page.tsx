'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
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
  const [isAuthorized, setIsAuthorized] = useState(false)
  
  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState<'addCard' | 'editSection' | 'editCard' | 'addSection' | null>(null)
  const [modalData, setModalData] = useState<{
    sectionId?: string
    title?: string
    id?: string
    description?: string
    icon?: string
    type?: 'url' | 'dashboard' | 'code'
    url?: string
  } | null>(null)

  // Load available icons
  const [availableIcons, setAvailableIcons] = useState<string[]>(['logo.png'])

  const loadAvailableIcons = async () => {
    try {
      const response = await fetch('/api/icons')
      if (response.ok) {
        const icons = await response.json()
        setAvailableIcons(icons)
      }
    } catch (error) {
      console.error('Error loading icons:', error)
    }
  }

  const dashboardId = params.id as string

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/user')
      if (response.ok) {
        const user = await response.json()
        setIsAuthorized(user.role === 'admin')
      } else {
        setIsAuthorized(false)
      }
    } catch {
      setIsAuthorized(false)
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
    checkAuth()
    loadDashboard()
    loadAvailableIcons()
  }, [checkAuth, loadDashboard])

  // Modal handlers
  function handleAddCard(sectionId: string) {
    if (!isAuthorized) return
    setModalType('addCard')
    setModalData({ sectionId })
    setShowModal(true)
  }

  function handleEditSection(sectionId: string, title: string) {
    if (!isAuthorized) return
    setModalType('editSection')
    setModalData({ sectionId, title })
    setShowModal(true)
  }

  function handleEditCard(cardId: string, sectionId: string) {
    if (!isAuthorized) return
    const card = sections
      .find(s => s.id === sectionId)
      ?.cards.find(c => c.id === cardId)
    if (card) {
      setModalType('editCard')
      setModalData({ ...card, sectionId })
      setShowModal(true)
    }
  }

  function handleAddSection() {
    if (!isAuthorized) return
    setModalType('addSection')
    setModalData(null)
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setModalType(null)
    setModalData(null)
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
        }

        .modal-content {
          background: white;
          margin: 5% auto;
          padding: 2rem;
          border-radius: 1rem;
          width: 90%;
          max-width: 500px;
          position: relative;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
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
          margin-bottom: 1.5rem;
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
        <Link href="/" className="back-btn">← 메인으로</Link>
        
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

        {sections.length === 0 ? (
          <div className="empty-dashboard">
            <p>아직 섹션이 없습니다.</p>
            {isAuthorized && (
              <button className="btn-add-section" onClick={handleAddSection}>
                + 섹션 추가
              </button>
            )}
          </div>
        ) : (
          <>
            {isAuthorized && (
              <div style={{ marginBottom: '2rem' }}>
                <button className="btn-add-section" onClick={handleAddSection}>+ 섹션 추가</button>
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

        {/* Modal */}
        {showModal && (
          <div className="modal" style={{ display: 'block' }}>
            <div className="modal-content">
              <div className="modal-header">
                <h3 className="modal-title">
                  {modalType === 'addSection' && '섹션 추가'}
                  {modalType === 'editSection' && '섹션 수정'}
                  {modalType === 'addCard' && '카드 추가'}
                  {modalType === 'editCard' && '카드 수정'}
                </h3>
                <span className="close" onClick={closeModal}>&times;</span>
              </div>
              <form onSubmit={async (e) => {
                e.preventDefault()
                const formData = new FormData(e.target as HTMLFormElement)
                
                try {
                  if (modalType === 'addSection') {
                    const title = formData.get('sectionTitle') as string
                    const response = await fetch('/api/sections', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        id: `section_${Date.now()}`,
                        title,
                        section_order: 1,
                        parent_card_id: dashboardId
                      })
                    })
                    if (response.ok) {
                      loadDashboard()
                      closeModal()
                    }
                  } else if (modalType === 'editSection') {
                    const title = formData.get('sectionTitle') as string
                    // 현재 섹션 정보를 가져와서 section_order 보존
                    const currentSection = sections.find(s => s.id === modalData?.sectionId)
                    const response = await fetch('/api/sections', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        id: modalData?.sectionId,
                        title,
                        section_order: currentSection?.section_order || 1
                      })
                    })
                    if (response.ok) {
                      loadDashboard()
                      closeModal()
                    }
                  } else if (modalType === 'addCard') {
                    const title = formData.get('cardTitle') as string
                    const description = formData.get('cardDescription') as string
                    const type = formData.get('cardType') as string
                    const url = formData.get('cardUrl') as string
                    const iconSelect = formData.get('cardIcon') as string
                    const iconUrl = formData.get('cardIconUrl') as string
                    
                    // 웹 링크 선택 시 URL 사용, 아니면 기본 아이콘 사용
                    const finalIcon = iconSelect === 'web-link' ? iconUrl : iconSelect
                    
                    const response = await fetch('/api/cards', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        section_id: modalData?.sectionId,
                        title,
                        description,
                        type,
                        url: type === 'url' ? url : null,
                        icon: finalIcon
                      })
                    })
                    if (response.ok) {
                      loadDashboard()
                      closeModal()
                    }
                  } else if (modalType === 'editCard') {
                    const title = formData.get('cardTitle') as string
                    const description = formData.get('cardDescription') as string
                    const type = formData.get('cardType') as string
                    const url = formData.get('cardUrl') as string
                    const iconSelect = formData.get('cardIcon') as string
                    const iconUrl = formData.get('cardIconUrl') as string
                    
                    // 웹 링크 선택 시 URL 사용, 아니면 기본 아이콘 사용
                    const finalIcon = iconSelect === 'web-link' ? iconUrl : iconSelect
                    
                    const response = await fetch('/api/cards', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        id: modalData?.id,
                        title,
                        description,
                        type,
                        url: type === 'url' ? url : null,
                        icon: finalIcon
                      })
                    })
                    if (response.ok) {
                      loadDashboard()
                      closeModal()
                    }
                  }
                } catch (error) {
                  console.error('Error:', error)
                  alert('저장에 실패했습니다.')
                }
              }}>
                <div className="form-fields">
                  {(modalType === 'addSection' || modalType === 'editSection') && (
                    <div className="form-group">
                      <label className="form-label" htmlFor="sectionTitle">섹션 제목</label>
                      <input 
                        type="text" 
                        id="sectionTitle" 
                        name="sectionTitle"
                        className="form-input"
                        defaultValue={modalData?.title || ''} 
                        required 
                      />
                    </div>
                  )}
                  {(modalType === 'addCard' || modalType === 'editCard') && (
                    <>
                      <div className="form-group">
                        <label className="form-label" htmlFor="cardType">카드 타입</label>
                        <select id="cardType" name="cardType" className="form-select" defaultValue={modalData?.type || 'url'}>
                          <option value="url">URL - 외부 링크</option>
                          <option value="dashboard">Dashboard - 하위 카드 시스템</option>
                          <option value="code">Code - 코드 스니펫 보드</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label" htmlFor="cardTitle">제목</label>
                        <input 
                          type="text" 
                          id="cardTitle" 
                          name="cardTitle"
                          className="form-input"
                          placeholder="카드 제목"
                          defaultValue={modalData?.title || ''} 
                          required 
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label" htmlFor="cardDescription">설명</label>
                        <textarea 
                          id="cardDescription" 
                          name="cardDescription"
                          className="form-textarea"
                          placeholder="카드 설명"
                          defaultValue={modalData?.description || ''}
                          required
                        ></textarea>
                      </div>
                      <div className="form-group">
                        <label className="form-label" htmlFor="cardIcon">아이콘 선택</label>
                        <select 
                          id="cardIcon" 
                          name="cardIcon" 
                          className="form-select" 
                          defaultValue={modalData?.icon || 'logo.png'}
                          onChange={(e) => {
                            const urlField = document.getElementById('iconUrlField') as HTMLDivElement
                            if (e.target.value === 'web-link') {
                              urlField.style.display = 'block'
                            } else {
                              urlField.style.display = 'none'
                            }
                          }}
                        >
                          {availableIcons.map(iconName => (
                            <option key={iconName} value={iconName}>
                              {iconName === 'logo.png' ? '기본 아이콘 (logo.png)' : iconName.replace('logo_', '').replace('logo-', '').replace('.png', '')}
                            </option>
                          ))}
                          <option value="web-link">🌐 웹 링크로 아이콘 사용</option>
                        </select>
                      </div>
                      <div 
                        className="form-group" 
                        id="iconUrlField" 
                        style={{ display: (modalData?.icon && modalData.icon.startsWith('http')) ? 'block' : 'none' }}
                      >
                        <label className="form-label" htmlFor="cardIconUrl">아이콘 이미지 URL</label>
                        <input 
                          type="url" 
                          id="cardIconUrl" 
                          name="cardIconUrl"
                          className="form-input"
                          placeholder="https://example.com/icon.png"
                          defaultValue={modalData?.icon && modalData.icon.startsWith('http') ? modalData.icon : ''} 
                        />
                      </div>
                      <div className="form-group" id="urlFields">
                        <label className="form-label" htmlFor="cardUrl">URL</label>
                        <input 
                          type="url" 
                          id="cardUrl" 
                          name="cardUrl"
                          className="form-input"
                          placeholder="https://example.com"
                          defaultValue={modalData?.url || ''} 
                        />
                      </div>
                    </>
                  )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button 
                    type="button" 
                    id="deleteCardBtn" 
                    className="btn-secondary" 
                    style={{ background: '#dc2626', display: (modalType === 'editCard' || modalType === 'editSection') ? 'block' : 'none' }}
                    onClick={async () => {
                      if (modalType === 'editCard' && modalData?.id && modalData?.sectionId) {
                        if (confirm('이 카드를 삭제하시겠습니까?')) {
                          try {
                            const response = await fetch('/api/cards', {
                              method: 'DELETE',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ id: modalData.id })
                            })
                            if (response.ok) {
                              closeModal()
                              loadDashboard()
                            } else {
                              alert('카드 삭제에 실패했습니다.')
                            }
                          } catch (error) {
                            console.error('Error:', error)
                            alert('삭제 중 오류가 발생했습니다.')
                          }
                        }
                      } else if (modalType === 'editSection' && modalData?.sectionId) {
                        if (confirm('이 섹션을 삭제하시겠습니까?')) {
                          try {
                            const response = await fetch('/api/sections', {
                              method: 'DELETE',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ id: modalData.sectionId })
                            })
                            if (response.ok) {
                              closeModal()
                              loadDashboard()
                            } else {
                              alert('섹션 삭제에 실패했습니다.')
                            }
                          } catch (error) {
                            console.error('Error:', error)
                            alert('삭제 중 오류가 발생했습니다.')
                          }
                        }
                      }
                    }}
                  >
                    삭제
                  </button>
                  <div>
                    <button type="button" className="btn-secondary" onClick={closeModal}>
                      취소
                    </button>
                    <button type="submit" className="btn-primary">
                      저장
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  )
}