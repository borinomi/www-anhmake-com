'use client'

import Image from 'next/image'

interface Card {
  id: string
  title: string
  description: string
  icon: string
  type: 'url' | 'dashboard' | 'code'
  url?: string
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
      {isAuthorized && (
        <div 
          className="card-menu" 
          onClick={handleMenuClick}
          title="카드 메뉴"
        >
          ⋯
        </div>
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