'use client'

import { useState, useCallback } from 'react'

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

interface ModalData {
  sectionId?: string
  title?: string
  id?: string
  description?: string
  icon?: string
  type?: 'url' | 'dashboard' | 'code'
  url?: string
}

type ModalType = 'addCard' | 'editSection' | 'editCard' | 'addSection'

interface UseModalOptions {
  onAddCard?: (data: ModalData) => Promise<void>
  onEditCard?: (data: ModalData) => Promise<void>
  onDeleteCard?: (data: ModalData) => Promise<void>
  onAddSection?: (data: ModalData) => Promise<void>
  onEditSection?: (data: ModalData) => Promise<void>
  onDeleteSection?: (data: ModalData) => Promise<void>
  availableIcons?: string[]
  isAdmin?: boolean
}

export const useModal = (options: UseModalOptions = {}) => {
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState<ModalType | null>(null)
  const [modalData, setModalData] = useState<ModalData | null>(null)

  const handleAddCard = useCallback((sectionId: string) => {
    if (!options.isAdmin) return
    setModalType('addCard')
    setModalData({ sectionId })
    setShowModal(true)
  }, [options.isAdmin])

  const handleEditCard = useCallback((cardId: string, sectionId: string, sections: Section[]) => {
    if (!options.isAdmin) return
    const card = sections.find(s => s.id === sectionId)?.cards.find(c => c.id === cardId)
    if (card) {
      setModalType('editCard')
      setModalData({ ...card, sectionId })
      setShowModal(true)
    }
  }, [options.isAdmin])

  const handleAddSection = useCallback(() => {
    if (!options.isAdmin) return
    setModalType('addSection')
    setModalData(null)
    setShowModal(true)
  }, [options.isAdmin])

  const handleEditSection = useCallback((sectionId: string, title: string) => {
    if (!options.isAdmin) return
    setModalType('editSection')
    setModalData({ sectionId, title })
    setShowModal(true)
  }, [options.isAdmin])

  const closeModal = useCallback(() => {
    setShowModal(false)
    setModalType(null)
    setModalData(null)
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)

    try {
      if (modalType === 'addCard' && options.onAddCard) {
        const cardData = {
          sectionId: modalData?.sectionId,
          title: formData.get('cardTitle') as string,
          description: formData.get('cardDescription') as string,
          type: formData.get('cardType') as 'url' | 'dashboard' | 'code',
          url: formData.get('cardUrl') as string,
          icon: formData.get('cardIcon') === 'web-link' 
            ? formData.get('cardIconUrl') as string 
            : formData.get('cardIcon') as string
        }
        await options.onAddCard(cardData)
      } else if (modalType === 'editCard' && options.onEditCard) {
        const cardData = {
          id: modalData?.id,
          title: formData.get('cardTitle') as string,
          description: formData.get('cardDescription') as string,
          type: formData.get('cardType') as 'url' | 'dashboard' | 'code',
          url: formData.get('cardUrl') as string,
          icon: formData.get('cardIcon') === 'web-link' 
            ? formData.get('cardIconUrl') as string 
            : formData.get('cardIcon') as string
        }
        await options.onEditCard(cardData)
      } else if (modalType === 'addSection' && options.onAddSection) {
        const sectionData = {
          title: formData.get('sectionTitle') as string
        }
        await options.onAddSection(sectionData)
      } else if (modalType === 'editSection' && options.onEditSection) {
        const sectionData = {
          sectionId: modalData?.sectionId,
          title: formData.get('sectionTitle') as string
        }
        await options.onEditSection(sectionData)
      }

      closeModal()
    } catch (error) {
      console.error('Modal submit error:', error)
      alert('저장에 실패했습니다.')
    }
  }, [modalType, modalData, options, closeModal])

  const handleDelete = useCallback(async () => {
    if (modalType === 'editCard' && modalData?.id && options.onDeleteCard) {
      if (confirm('이 카드를 삭제하시겠습니까?')) {
        await options.onDeleteCard(modalData)
        closeModal()
      }
    } else if (modalType === 'editSection' && modalData?.sectionId && options.onDeleteSection) {
      if (confirm('이 섹션을 삭제하시겠습니까?')) {
        await options.onDeleteSection(modalData)
        closeModal()
      }
    }
  }, [modalType, modalData, options, closeModal])

  // Modal JSX 컴포넌트
  const Modal = showModal ? (
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
        <form onSubmit={handleSubmit}>
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
                    {options.availableIcons?.map(iconName => (
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
              className="btn-secondary" 
              style={{ background: '#dc2626', display: (modalType === 'editCard' || modalType === 'editSection') ? 'block' : 'none' }}
              onClick={handleDelete}
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
  ) : null

  return {
    // State
    showModal,
    modalType,
    modalData,

    // Actions
    handleAddCard,
    handleEditCard,
    handleAddSection,
    handleEditSection,
    closeModal,
    handleSubmit,
    handleDelete,

    // JSX Component
    Modal
  }
}