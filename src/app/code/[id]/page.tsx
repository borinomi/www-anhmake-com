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

  const cardId = params.id as string

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/user')
      setIsAuthorized(response.ok)
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

  async function copyCode(content: string, button: HTMLButtonElement) {
    try {
      await navigator.clipboard.writeText(content)
      const originalText = button.textContent
      button.textContent = 'Copied!'
      button.classList.add('copied')
      
      setTimeout(() => {
        button.textContent = originalText
        button.classList.remove('copied')
      }, 2000)
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

  if (loading) {
    return (
      <div className="loading-container">
        <div className="text-white text-xl">로딩 중...</div>
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
          max-width: 1200px;
          margin: 0 auto;
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

        .add-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.5rem;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 0.5rem;
          font-weight: 500;
          cursor: pointer;
          margin-bottom: 2rem;
          transition: all 0.3s ease;
        }

        .add-btn:hover {
          background: #2563eb;
          transform: translateY(-1px);
        }

        .resources-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 2rem;
          margin-bottom: 2rem;
        }

        .resource-card {
          background: rgba(255, 255, 255, 0.95);
          border: 2px solid rgba(226, 232, 240, 0.5);
          border-radius: 1rem;
          padding: 2rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
        }

        .resource-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          border-color: #3b82f6;
        }

        .resource-title {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 1rem;
          color: #1e293b;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .card-actions {
          display: flex;
          gap: 0.5rem;
        }

        .edit-btn, .delete-btn {
          padding: 0.5rem;
          border: none;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .edit-btn {
          background: #f59e0b;
          color: white;
        }

        .edit-btn:hover {
          background: #d97706;
        }

        .delete-btn {
          background: #ef4444;
          color: white;
        }

        .delete-btn:hover {
          background: #dc2626;
        }

        .copy-btn {
          padding: 0.5rem 1rem;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .copy-btn:hover {
          background: #2563eb;
        }

        .copy-btn.copied {
          background: #10b981;
        }

        .resource-content {
          background: #e2e8f0;
          border: 1px solid #e2e8f0;
          border-radius: 0.5rem;
          padding: 1.5rem;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 0.9rem;
          line-height: 1.5;
          white-space: pre-wrap;
          overflow-x: auto;
          max-height: 300px;
          overflow-y: auto;
        }

        .modal {
          display: none;
          position: fixed;
          z-index: 1000;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(5px);
        }

        .modal.show {
          display: block;
        }

        .modal-content {
          background-color: #fefefe;
          margin: 5% auto;
          padding: 0;
          border-radius: 1rem;
          width: 90%;
          max-width: 600px;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
        }

        .modal-header {
          padding: 2rem 2rem 1rem;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
        }

        .close {
          font-size: 2rem;
          font-weight: bold;
          color: #64748b;
          cursor: pointer;
          line-height: 1;
          padding: 0;
          background: none;
          border: none;
        }

        .close:hover {
          color: #1e293b;
        }

        .modal form {
          padding: 2rem;
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

        .form-input, .form-textarea {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #e5e7eb;
          border-radius: 0.5rem;
          font-size: 1rem;
          transition: border-color 0.2s;
        }

        .form-textarea {
          min-height: 200px;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          resize: vertical;
        }

        .form-input:focus, .form-textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          margin-top: 2rem;
        }

        .btn-primary, .btn-secondary {
          padding: 0.75rem 2rem;
          border: none;
          border-radius: 0.5rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-primary {
          background: #3b82f6;
          color: white;
        }

        .btn-primary:hover {
          background: #2563eb;
        }

        .btn-secondary {
          background: #f3f4f6;
          color: #374151;
          border: 1px solid #d1d5db;
        }

        .btn-secondary:hover {
          background: #e5e7eb;
        }

        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          color: #ffffff;
        }

        .empty-state h3 {
          font-size: 1.5rem;
          margin-bottom: 1rem;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
        }

        .empty-state p {
          font-size: 1rem;
          opacity: 0.8;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
        }

        .loading-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        @media (max-width: 768px) {
          .resources-grid {
            grid-template-columns: 1fr;
          }
          
          .modal-content {
            width: 95%;
            margin: 10% auto;
          }
          
          .resource-title {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }
        }
      `}</style>
      
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
                    className="copy-btn" 
                    onClick={(e) => copyCode(snippet.content, e.target as HTMLButtonElement)}
                  >
                    Copy
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
      <div className={`modal ${showModal ? 'show' : ''}`}>
        <div className="modal-content">
          <div className="modal-header">
            <h3 className="modal-title">
              {editingId ? '코드 수정' : '새 코드 추가'}
            </h3>
            <span className="close" onClick={closeModal}>&times;</span>
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
                className="form-textarea" 
                placeholder="코드를 입력하세요..." 
                required
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              />
            </div>
            
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={closeModal}>
                취소
              </button>
              <button type="submit" className="btn-primary">
                {editingId ? '수정' : '저장'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}