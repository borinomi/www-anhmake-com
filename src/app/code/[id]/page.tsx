'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface CodeSnippet {
  id: number
  card_id: number
  title: string
  content: string
  created_at: string
  updated_at: string
}

interface CardData {
  id: string
  title: string
  description: string
  icon: string
}

export default function CodePage() {
  const params = useParams()
  const [cardData, setCardData] = useState<CardData | null>(null)
  const [codeSnippets, setCodeSnippets] = useState<CodeSnippet[]>([])
  const [loading, setLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({ title: '', content: '' })
  const [copiedId, setCopiedId] = useState<number | null>(null)

  const cardId = params.id as string

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

  const loadCodeData = useCallback(async () => {
    try {
      // Load card data
      const cardResponse = await fetch(`/api/cards/${cardId}`)
      if (cardResponse.ok) {
        const cardData = await cardResponse.json()
        setCardData(cardData)
      }

      // Load code snippets
      const codeResponse = await fetch(`/api/code-snippets?card_id=${cardId}`)
      if (codeResponse.ok) {
        const codeData = await codeResponse.json()
        setCodeSnippets(codeData)
      }
    } catch {
      console.error('Failed to load code data')
    } finally {
      setLoading(false)
    }
  }, [cardId])

  useEffect(() => {
    checkAuth()
    loadCodeData()
  }, [checkAuth, loadCodeData])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const data = {
      card_id: cardId,
      title: formData.title.trim(),
      content: formData.content.trim()
    }

    try {
      let response
      if (editingId) {
        response = await fetch(`/api/code-snippets/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
      } else {
        response = await fetch('/api/code-snippets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
      }

      if (response.ok) {
        closeModal()
        loadCodeData()
      } else {
        alert('저장에 실패했습니다.')
      }
    } catch (error) {
      console.error('Error saving code:', error)
      alert('저장 중 오류가 발생했습니다.')
    }
  }

  function showAddModal() {
    setEditingId(null)
    setFormData({ title: '', content: '' })
    setShowModal(true)
  }

  function editCode(snippet: CodeSnippet) {
    setEditingId(snippet.id)
    setFormData({ title: snippet.title, content: snippet.content })
    setShowModal(true)
  }

  async function deleteCode(id: number) {
    if (!confirm('이 코드 스니펫을 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/code-snippets/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setCodeSnippets(prev => prev.filter(c => c.id !== id))
      } else {
        alert('삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('Error deleting code:', error)
      alert('삭제 중 오류가 발생했습니다.')
    }
  }

  async function copyCode(content: string, snippetId: number) {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedId(snippetId)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
      alert('클립보드 복사에 실패했습니다.')
    }
  }

  function closeModal() {
    setShowModal(false)
    setEditingId(null)
    setFormData({ title: '', content: '' })
  }

  // ESC 키로 모달 닫기
  useEffect(() => {
    if (!showModal) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [showModal])

  if (loading) {
    return (
      <div className="loading-container">
        <div className="text-white text-xl">로딩 중...</div>
      </div>
    )
  }

  return (
    <>
      <div className="container">
        <Link href="/" className="back-btn">← 메인으로</Link>
        <div className="page-header">
          <Image
            src={cardData?.icon ? `/icon/${cardData.icon}` : '/logo.png'}
            alt="Code"
            width={60}
            height={60}
            className="page-logo"
          />
          <div className="page-header-text">
            <div className="page-header-line">{cardData ? cardData.title : 'Code Snippets'}</div>
            <div className="page-header-line">{cardData ? cardData.description : '코드 스니펫을 관리하고 공유하세요'}</div>
          </div>
        </div>

        {isAuthorized && (
          <button className="add-btn" onClick={showAddModal}>
            + 새 코드 추가
          </button>
        )}

        <div className="resources-grid">
          {codeSnippets.map(snippet => (
            <div key={snippet.id} className="resource-card">
              <div className="resource-title">
                <span>{snippet.title}</span>
                <div className="card-actions">
                  <button
                    className={`copy-btn${copiedId === snippet.id ? ' copied' : ''}`}
                    onClick={() => copyCode(snippet.content, snippet.id)}
                  >
                    {copiedId === snippet.id ? 'Copied!' : 'Copy'}
                  </button>
                  {isAuthorized && (
                    <>
                      <button className="edit-btn" onClick={() => editCode(snippet)}>
                        Edit
                      </button>
                      <button className="delete-btn" onClick={() => deleteCode(snippet.id)}>
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className="resource-content">{snippet.content}</div>
            </div>
          ))}
        </div>

        {codeSnippets.length === 0 && !loading && (
          <div className="empty-state">
            <h3>아직 코드 스니펫이 없습니다</h3>
            <p>첫 번째 코드 스니펫을 추가해보세요!</p>
          </div>
        )}
      </div>

      {/* Modal */}
      <div className={`modal ${showModal ? 'show' : ''}`} role="dialog" aria-modal="true">
        <div className="modal-content modal-content-wide">
          <div className="modal-header">
            <h3 className="modal-title">
              {editingId ? '코드 수정' : '새 코드 추가'}
            </h3>
            <button type="button" className="close" onClick={closeModal} aria-label="닫기">&times;</button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="codeTitle">제목</label>
              <input
                type="text"
                id="codeTitle"
                className="form-input"
                placeholder="코드 제목을 입력하세요"
                required
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="codeContent">코드</label>
              <textarea
                id="codeContent"
                className="form-textarea code-textarea"
                placeholder="코드를 입력하세요..."
                required
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button type="button" id="deleteCodeBtn" className="btn-secondary" style={{ background: '#dc2626', display: editingId ? 'block' : 'none' }} onClick={() => editingId && deleteCode(editingId)}>삭제</button>
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
    </>
  )
}
