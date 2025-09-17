'use client'

import React from 'react'
import Card from './Card'

interface Card {
  id: string
  title: string
  description: string
  icon: string
  type: 'url' | 'dashboard' | 'code'
  url?: string
  visibility?: 'admin' | 'user' | 'all'
}

interface Section {
  id: string
  title: string
  cards: Card[]
}

interface SectionProps {
  section: Section
  isAuthorized: boolean
  onAddCard: (sectionId: string) => void
  onEditSection: (sectionId: string, title: string) => void
  onEditCard: (cardId: string, sectionId: string) => void
}

export default function Section({ 
  section, 
  isAuthorized, 
  onAddCard, 
  onEditSection, 
  onEditCard 
}: SectionProps) {
  const handleCardClick = (card: Card) => {
    switch(card.type) {
      case 'url':
        if (card.url) {
          window.open(card.url, '_blank')
        }
        break
      case 'dashboard':
        window.location.href = `/dashboard/${card.id}`
        break
      case 'code':
        window.open(`/code/${card.id}`, '_blank')
        break
    }
  }

  // Filter cards based on visibility and user role
  const filteredCards = section.cards.filter(card => {
    if (!card.visibility) return true; // 기본값 all
    
    switch(card.visibility) {
      case 'admin':
        return isAuthorized; // admin만 표시
      case 'user':  
        return isAuthorized; // admin만 표시 (일반 사용자에게는 숨김)
      case 'all':
        return true; // 모든 사용자에게 표시
      default:
        return true;
    }
  });

  return (
    <div className="section" data-section-id={section.id}>
      <div className="section-header">
        <h2 className="section-title">{section.title}</h2>
        {isAuthorized && (
          <div className="section-actions">
            <button 
              className="btn-section-action add-card" 
              onClick={() => onAddCard(section.id)}
              title="카드 추가"
            >
              +
            </button>
            <button 
              className="btn-section-action" 
              onClick={() => onEditSection(section.id, section.title)}
              title="섹션 수정"
            >
              ⋯
            </button>
          </div>
        )}
      </div>
      <div className="cards-grid">
        {filteredCards.map(card => (
          <Card
            key={card.id}
            card={card}
            isAuthorized={isAuthorized}
            onClick={() => handleCardClick(card)}
            onEdit={() => onEditCard(card.id, section.id)}
          />
        ))}
      </div>
    </div>
  )
}