'use client'

import Image from 'next/image'

interface User {
  id: string
  email: string
  name?: string
  avatar_url?: string
  role?: string
  status?: string
}

interface HeaderProps {
  user: User | null
  onLogin: (email: string, password: string) => Promise<boolean>
  onLogout: () => void
}

export default function Header({ user, onLogin, onLogout }: HeaderProps) {
  return (
    <div className="header">
      <div className="header-main">
        <Image 
          src="/icon/logo.png" 
          alt="ANHMAKE" 
          width={60} 
          height={60}
          className="logo" 
        />
        <div className="header-text">
          <div className="header-line">Anh Kim</div>
          <div className="header-line">AI & Automation builder</div>
          <div className="header-line">Drawing a Map of AI & Automation</div>
        </div>
      </div>
      <div className="header-auth">
        <div id="authSection">
          {user ? (
            <div className="user-info">
              {user.role === 'admin' && (
                <button 
                  className="admin-btn" 
                  onClick={() => window.location.href = '/admin/users'}
                >
                  회원관리
                </button>
              )}
              {user.avatar_url && (
                <Image 
                  src={user.avatar_url} 
                  alt="Avatar" 
                  width={32}
                  height={32}
                  className="user-avatar"
                />
              )}
              <span>
                {user.status === 'pending' 
                  ? '가입 승인 대기' 
                  : user.role === 'admin' 
                    ? `${user.name || user.email} (admin)` 
                    : user.name || user.email
                }
              </span>
              <button className="logout-btn" onClick={onLogout}>
                로그아웃
              </button>
            </div>
          ) : (
            <button className="login-btn" onClick={() => {
              const email = prompt('이메일:')
              const password = prompt('비밀번호:')
              if (email && password) {
                onLogin(email, password)
              }
            }}>
              Login
            </button>
          )}
        </div>
      </div>
    </div>
  )
}