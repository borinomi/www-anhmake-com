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
        // For dashboard cards, navigate to a dashboard route or handle differently
        console.log('Dashboard card clicked:', card.id)
        // TODO: Implement dashboard route navigation
        alert(`Dashboard feature not implemented yet. Card ID: ${card.id}`)
        break
      case 'code':
        // For code cards, navigate to a code route or handle differently  
        console.log('Code card clicked:', card.id)
        // TODO: Implement code route navigation
        alert(`Code feature not implemented yet. Card ID: ${card.id}`)
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