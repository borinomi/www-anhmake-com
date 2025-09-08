'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import Section from '@/components/Section'

interface User {
  id: string
  email: string
  name?: string
  avatar_url?: string
}

interface Card {
  id: string
  title: string
  description: string
  icon: string
  type: 'url' | 'dashboard' | 'code'
  url?: string
}

interface SectionType {
  id: string
  title: string
  cards: Card[]
}

export default function Home() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [sections, setSections] = useState<SectionType[]>([])
  const [loading, setLoading] = useState(true)

  // Check authentication state
  const checkAuthState = async () => {
    try {
      const response = await fetch('/api/auth/user', {
        credentials: 'same-origin'
      })
      
      if (response.ok) {
        const user = await response.json()
        setCurrentUser(user)
      } else {
        setCurrentUser(null)
      }
    } catch (error) {
      console.error('Auth check error:', error)
      setCurrentUser(null)
    }
  }

  // Load sections from API
  const loadSections = async () => {
    try {
      // Load root-level sections
      const sectionsResponse = await fetch('/api/sections')
      if (!sectionsResponse.ok) {
        throw new Error('Failed to load sections')
      }
      const sectionsData = await sectionsResponse.json()
      
      // Load cards for each section
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
    } catch (error) {
      console.error('Error loading sections:', error)
      setSections([])
    } finally {
      setLoading(false)
    }
  }

  // Auth handlers
  const handleLogin = () => {
    window.location.href = '/api/auth/login'
  }

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'same-origin'
      })
      
      if (response.ok) {
        setCurrentUser(null)
        window.location.reload()
      } else {
        console.error('Logout failed')
      }
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

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

  // Modal handlers
  const handleAddCard = (sectionId: string) => {
    if (!currentUser) return
    setModalType('addCard')
    setModalData({ sectionId })
    setShowModal(true)
  }

  const handleEditSection = (sectionId: string, title: string) => {
    if (!currentUser) return
    setModalType('editSection')
    setModalData({ sectionId, title })
    setShowModal(true)
  }

  const handleEditCard = (cardId: string, sectionId: string) => {
    if (!currentUser) return
    const card = sections
      .find(s => s.id === sectionId)
      ?.cards.find(c => c.id === cardId)
    if (card) {
      setModalType('editCard')
      setModalData({ ...card, sectionId })
      setShowModal(true)
    }
  }

  const handleAddSection = () => {
    if (!currentUser) return
    setModalType('addSection')
    setModalData(null)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setModalType(null)
    setModalData(null)
  }

  // Initialize on mount
  useEffect(() => {
    checkAuthState()
    loadSections()
    loadAvailableIcons()
  }, [])

  if (loading) {
    return (
      <div className="container">
        <div style={{ 
          textAlign: 'center', 
          color: '#ffffff', 
          marginTop: '2rem',
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
        }}>
          Loading...
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <Header 
        user={currentUser}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />

      <div id="sectionsContainer">
        {sections.map(section => (
          <Section
            key={section.id}
            section={section}
            isAuthorized={!!currentUser}
            onAddCard={handleAddCard}
            onEditSection={handleEditSection}
            onEditCard={handleEditCard}
          />
        ))}
      </div>

      {/* Add Section Button (only for authorized users) */}
      {currentUser && (
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

      <div className="contact">
        Contact: <a href="mailto:contact@anhmake.com">contact@anhmake.com</a>
      </div>

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
            <form id="mainForm" onSubmit={async (e) => {
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
                      section_order: 1
                    })
                  })
                  if (response.ok) {
                    loadSections()
                    closeModal()
                  }
                } else if (modalType === 'editSection') {
                  const title = formData.get('sectionTitle') as string
                  const response = await fetch('/api/sections', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      id: modalData?.sectionId,
                      title
                    })
                  })
                  if (response.ok) {
                    loadSections()
                    closeModal()
                  }
                } else if (modalType === 'addCard') {
                  const title = formData.get('cardTitle') as string
                  const description = formData.get('cardDescription') as string
                  const type = formData.get('cardType') as string
                  const url = formData.get('cardUrl') as string
                  const icon = formData.get('cardIcon') as string
                  
                  const response = await fetch('/api/cards', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      section_id: modalData?.sectionId,
                      title,
                      description,
                      type,
                      url: type === 'url' ? url : null,
                      icon
                    })
                  })
                  if (response.ok) {
                    loadSections()
                    closeModal()
                  }
                } else if (modalType === 'editCard') {
                  const title = formData.get('cardTitle') as string
                  const description = formData.get('cardDescription') as string
                  const type = formData.get('cardType') as string
                  const url = formData.get('cardUrl') as string
                  const icon = formData.get('cardIcon') as string
                  
                  const response = await fetch('/api/cards', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      id: modalData?.id,
                      title,
                      description,
                      type,
                      url: type === 'url' ? url : null,
                      icon
                    })
                  })
                  if (response.ok) {
                    loadSections()
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
                      <select id="cardIcon" name="cardIcon" className="form-select" defaultValue={modalData?.icon || 'logo.png'}>
                        {availableIcons.map(iconName => (
                          <option key={iconName} value={iconName}>
                            {iconName === 'logo.png' ? '기본 아이콘 (logo.png)' : iconName.replace('logo_', '').replace('logo-', '').replace('.png', '')}
                          </option>
                        ))}
                      </select>
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
                <button type="button" id="deleteCardBtn" className="btn-secondary" style={{ background: '#dc2626', display: 'none' }}>삭제</button>
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
  )
}