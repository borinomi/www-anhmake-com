'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
  const router = useRouter()
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
          router.push('/')
          return false
        }
        return true
      } else {
        alert('로그인이 필요합니다.')
        router.push('/')
        return false
      }
    } catch (error) {
      console.error('Auth check error:', error)
      alert('인증 확인 중 오류가 발생했습니다.')
      router.push('/')
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
    <div className="container container-wide">
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
  )
}
