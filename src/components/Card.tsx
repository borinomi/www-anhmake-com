'use client'

import Image from 'next/image'

interface Card {
  id: string
  title: string
  description: string
  icon: string
  type: 'url' | 'dashboard' | 'code'
  url?: string
  visibility?: 'admin' | 'user' | 'all'
}

interface CardProps {
  card: Card
  isAuthorized: boolean
  onClick: () => void
  onEdit: () => void
}

export default function Card({ card, isAuthorized, onClick, onEdit }: CardProps) {
  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit()
  }

  const getActionText = () => {
    return card.type === 'url' ? 'Visit' : 'Open'
  }

  return (
    <div className="tool-card" onClick={onClick}>
      {isAuthorized && card.visibility && card.visibility !== 'all' && (
        <div 
          className="card-visibility"
          title={`${card.visibility} 전용`}
          style={{
            position: 'absolute',
            top: '1rem',
            left: '1rem',
            background: card.visibility === 'admin' ? '#dc2626' : '#f59e0b',
            color: 'white',
            padding: '0.25rem 0.5rem',
            borderRadius: '0.25rem',
            fontSize: '0.75rem',
            fontWeight: '500',
            textTransform: 'uppercase'
          }}
        >
          {card.visibility}
        </div>
      )}
      {isAuthorized && (
        <button
          type="button"
          className="card-menu"
          onClick={handleMenuClick}
          title="카드 메뉴"
          aria-label="카드 메뉴"
        >
          ⋯
        </button>
      )}
      <div className="tool-content">
        <div className="tool-icon">
          <Image 
            src={card.icon.startsWith('http') ? card.icon : `/icon/${card.icon}`}
            alt={card.title}
            width={60}
            height={60}
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = '/icon/logo.png'
            }}
          />
        </div>
        <h3>{card.title}</h3>
        <p>{card.description}</p>
      </div>
      <div className="btn-tool">{getActionText()}</div>
    </div>
  )
}