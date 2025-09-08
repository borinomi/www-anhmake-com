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
        window.open(`/dashboard/${card.id}`, '_blank')
        break
      case 'code':
        window.open(`/code/${card.id}`, '_blank')
        break
    }
  }

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
        {section.cards.map(card => (
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