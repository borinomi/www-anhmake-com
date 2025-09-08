'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import Section from '@/components/Section'

interface User {
  id: string
  email: string
  name?: string
  avatar_url?: string
}

interface Card {
  id: string
  title: string
  description: string
  icon: string
  type: 'url' | 'dashboard' | 'code'
  url?: string
}

interface SectionType {
  id: string
  title: string
  cards: Card[]
}

export default function Home() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [sections, setSections] = useState<SectionType[]>([])
  const [loading, setLoading] = useState(true)

  // Check authentication state
  const checkAuthState = async () => {
    try {
      const response = await fetch('/api/auth/user', {
        credentials: 'same-origin'
      })
      
      if (response.ok) {
        const user = await response.json()
        setCurrentUser(user)
      } else {
        setCurrentUser(null)
      }
    } catch (error) {
      console.error('Auth check error:', error)
      setCurrentUser(null)
    }
  }

  // Load sections from API
  const loadSections = async () => {
    try {
      // Load root-level sections
      const sectionsResponse = await fetch('/api/sections')
      if (!sectionsResponse.ok) {
        throw new Error('Failed to load sections')
      }
      const sectionsData = await sectionsResponse.json()
      
      // Load cards for each section
      const sectionsWithCards = await Promise.all(
        sectionsData.map(async (section: { id: string; title: string }) => {
          const cardsResponse = await fetch(`/api/cards?section_id=${section.id}`)
          const cardsData = cardsResponse.ok ? await cardsResponse.json() : []
          
          return {
            ...section,
            cards: cardsData
          }
        })
      )
      
      setSections(sectionsWithCards)
    } catch (error) {
      console.error('Error loading sections:', error)
      setSections([])
    } finally {
      setLoading(false)
    }
  }

  // Auth handlers
  const handleLogin = () => {
    window.location.href = '/api/auth/login'
  }

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'same-origin'
      })
      
      if (response.ok) {
        setCurrentUser(null)
        window.location.reload()
      } else {
        console.error('Logout failed')
      }
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  // Modal handlers (to be implemented with modals)
  const handleAddCard = (sectionId: string) => {
    if (!currentUser) return
    // TODO: Implement add card modal
    console.log('Add card to section:', sectionId)
  }

  const handleEditSection = (sectionId: string, title: string) => {
    if (!currentUser) return
    // TODO: Implement edit section modal
    console.log('Edit section:', sectionId, title)
  }

  const handleEditCard = (cardId: string, sectionId: string) => {
    if (!currentUser) return
    // TODO: Implement edit card modal
    console.log('Edit card:', cardId, 'in section:', sectionId)
  }

  // Initialize on mount
  useEffect(() => {
    checkAuthState()
    loadSections()
  }, [])

  if (loading) {
    return (
      <div className="container">
        <div style={{ 
          textAlign: 'center', 
          color: '#ffffff', 
          marginTop: '2rem',
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
        }}>
          Loading...
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <Header 
        user={currentUser}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />

      <div id="sectionsContainer">
        {sections.map(section => (
          <Section
            key={section.id}
            section={section}
            isAuthorized={!!currentUser}
            onAddCard={handleAddCard}
            onEditSection={handleEditSection}
            onEditCard={handleEditCard}
          />
        ))}
      </div>

      {/* Add Section Button (only for authorized users) */}
      {currentUser && (
        <div id="addSectionContainer" style={{ marginBottom: '2rem' }}>
          <button 
            className="btn-section-action" 
            onClick={() => {
              // TODO: Implement add section modal
              console.log('Add section')
            }}
            title="섹션 추가" 
            style={{ 
              width: 'auto', 
              padding: '0.8rem 1.5rem', 
              borderRadius: '2rem' 
            }}
          >
            + 섹션 추가
          </button>
        </div>
      )}

      <div className="contact">
        Contact: <a href="mailto:contact@anhmake.com">contact@anhmake.com</a>
      </div>
    </div>
  )
}