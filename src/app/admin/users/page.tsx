'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface User {
  id: string
  email: string
  name?: string
  avatar_url?: string
  role: string
  status: string
  created_at: string
  updated_at: string
  last_login?: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [error, setError] = useState('')

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/user', {
        credentials: 'same-origin'
      })
      
      if (response.ok) {
        const user = await response.json()
        setCurrentUser(user)
        
        // admin이 아니면 메인 페이지로 리디렉트
        if (user.role !== 'admin') {
          alert('관리자 권한이 필요합니다.')
          window.location.href = '/'
          return false
        }
        return true
      } else {
        alert('로그인이 필요합니다.')
        window.location.href = '/'
        return false
      }
    } catch (error) {
      console.error('Auth check error:', error)
      alert('인증 확인 중 오류가 발생했습니다.')
      window.location.href = '/'
      return false
    }
  }

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/admin/users', {
        credentials: 'same-origin'
      })
      
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      } else {
        const error = await response.json()
        setError(error.error || '사용자 목록을 불러올 수 없습니다.')
      }
    } catch (error) {
      console.error('Failed to load users:', error)
      setError('사용자 목록을 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const updateUserRole = async (userId: string, role: string, status: string) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          role,
          status
        }),
        credentials: 'same-origin'
      })

      if (response.ok) {
        await loadUsers() // 목록 새로고침
        alert('사용자 권한이 업데이트되었습니다.')
      } else {
        const error = await response.json()
        alert(error.error || '권한 업데이트에 실패했습니다.')
      }
    } catch (error) {
      console.error('Error updating user role:', error)
      alert('권한 업데이트 중 오류가 발생했습니다.')
    }
  }

  const deleteUser = async (userId: string, userName: string) => {
    if (!confirm(`${userName || '이 사용자'}를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
      return
    }

    try {
      const response = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId
        }),
        credentials: 'same-origin'
      })

      if (response.ok) {
        await loadUsers() // 목록 새로고침
        alert('사용자가 삭제되었습니다.')
      } else {
        const error = await response.json()
        alert(error.error || '사용자 삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('사용자 삭제 중 오류가 발생했습니다.')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  useEffect(() => {
    const initPage = async () => {
      const isAuthorized = await checkAuth()
      if (isAuthorized) {
        await loadUsers()
      }
    }
    initPage()
  }, [])

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
          width: 100%;
          max-width: 1400px;
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

        .page-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .page-title {
          color: #ffffff;
          font-size: 2rem;
          font-weight: 700;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }

        .users-container {
          background: rgba(255, 255, 255, 0.95);
          border-radius: 1rem;
          padding: 2rem;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          backdrop-filter: blur(10px);
        }

        .users-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 1rem;
        }

        .users-table th,
        .users-table td {
          padding: 1rem;
          text-align: left;
          border-bottom: 1px solid #e5e7eb;
        }

        .users-table th {
          background: #f8fafc;
          font-weight: 600;
          color: #374151;
          font-size: 0.9rem;
        }

        .users-table tr:hover {
          background: #f8fafc;
        }

        .user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 2px solid #e5e7eb;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 1rem;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .status-active {
          background: #dcfce7;
          color: #166534;
        }

        .status-pending {
          background: #fef3c7;
          color: #92400e;
        }

        .status-inactive {
          background: #fee2e2;
          color: #dc2626;
        }

        .role-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 1rem;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .role-admin {
          background: #e0e7ff;
          color: #3730a3;
        }

        .role-user {
          background: #dbeafe;
          color: #1e40af;
        }

        .role-pending {
          background: #f3f4f6;
          color: #6b7280;
        }

        .action-buttons {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .btn {
          padding: 0.5rem 0.75rem;
          border: none;
          border-radius: 0.375rem;
          font-size: 0.75rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-approve {
          background: #10b981;
          color: white;
        }

        .btn-approve:hover {
          background: #059669;
        }

        .btn-reject {
          background: #ef4444;
          color: white;
        }

        .btn-reject:hover {
          background: #dc2626;
        }

        .btn-admin {
          background: #8b5cf6;
          color: white;
        }

        .btn-admin:hover {
          background: #7c3aed;
        }

        .btn-user {
          background: #6b7280;
          color: white;
        }

        .btn-user:hover {
          background: #4b5563;
        }

        .btn-delete {
          background: #ef4444;
          color: white;
        }

        .btn-delete:hover {
          background: #dc2626;
        }

        .error-message {
          background: #fee2e2;
          color: #dc2626;
          padding: 1rem;
          border-radius: 0.5rem;
          margin-bottom: 1rem;
        }

        .loading-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        @media (max-width: 768px) {
          .container {
            padding: 1rem;
          }
          
          .users-table {
            font-size: 0.875rem;
          }
          
          .users-table th,
          .users-table td {
            padding: 0.5rem;
          }
          
          .action-buttons {
            flex-direction: column;
          }
        }
      `}</style>
      
      <div className="container">
        <Link href="/" className="back-btn">← 메인으로</Link>
        
        <div className="page-header">
          <h1 className="page-title">회원 관리</h1>
        </div>

        <div className="users-container">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <table className="users-table">
            <thead>
              <tr>
                <th>사용자</th>
                <th>이메일</th>
                <th>역할</th>
                <th>상태</th>
                <th>가입일</th>
                <th>최근 로그인</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="user-info">
                      {user.avatar_url && (
                        <Image
                          src={user.avatar_url}
                          alt={user.name || user.email}
                          width={40}
                          height={40}
                          className="user-avatar"
                        />
                      )}
                      <span>{user.name || 'N/A'}</span>
                    </div>
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`role-badge role-${user.role}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge status-${user.status}`}>
                      {user.status === 'active' ? '활성' : 
                       user.status === 'pending' ? '대기' : '비활성'}
                    </span>
                  </td>
                  <td>{formatDate(user.created_at)}</td>
                  <td>{user.last_login ? formatDate(user.last_login) : 'N/A'}</td>
                  <td>
                    <div className="action-buttons">
                      {user.status === 'pending' && (
                        <>
                          <button
                            className="btn btn-approve"
                            onClick={() => updateUserRole(user.id, 'user', 'active')}
                          >
                            승인
                          </button>
                          <button
                            className="btn btn-reject"
                            onClick={() => updateUserRole(user.id, 'pending', 'inactive')}
                          >
                            거부
                          </button>
                        </>
                      )}
                      {user.status === 'active' && user.role === 'user' && (
                        <button
                          className="btn btn-admin"
                          onClick={() => updateUserRole(user.id, 'admin', 'active')}
                        >
                          Admin 권한
                        </button>
                      )}
                      {user.status === 'active' && user.role === 'admin' && user.id !== currentUser?.id && (
                        <button
                          className="btn btn-user"
                          onClick={() => updateUserRole(user.id, 'user', 'active')}
                        >
                          User로 변경
                        </button>
                      )}
                      {user.id !== currentUser?.id && (
                        <button
                          className="btn btn-delete"
                          onClick={() => deleteUser(user.id, user.name || user.email)}
                        >
                          삭제
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {users.length === 0 && !error && (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
              등록된 사용자가 없습니다.
            </div>
          )}
        </div>
      </div>
    </>
  )
}