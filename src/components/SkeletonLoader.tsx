'use client'

interface SkeletonLoaderProps {
  isDashboard?: boolean // 메인페이지(false) vs 대시보드(true)
}

export default function SkeletonLoader({ isDashboard = false }: SkeletonLoaderProps) {
  return (
    <div className="container">
      {/* 대시보드인 경우 뒤로가기 버튼 */}
      {isDashboard && (
        <div className="skeleton skeleton-back-btn"></div>
      )}

      {/* 헤더 (메인페이지) vs 페이지헤더 (대시보드) */}
      {!isDashboard ? (
        <div className="skeleton-header">
          <div className="skeleton-header-main">
            <div className="skeleton skeleton-header-logo"></div>
            <div className="skeleton-header-text">
              <div className="skeleton skeleton-header-line"></div>
              <div className="skeleton skeleton-header-line"></div>
              <div className="skeleton skeleton-header-line"></div>
            </div>
          </div>
          <div className="skeleton skeleton-header-auth"></div>
        </div>
      ) : (
        <div className="skeleton-page-header">
          <div className="skeleton skeleton-page-logo"></div>
          <div className="skeleton-page-text">
            <div className="skeleton skeleton-page-title"></div>
            <div className="skeleton skeleton-page-desc"></div>
          </div>
        </div>
      )}

      {/* 섹션들 */}
      {[1, 2, 3].map(sectionIndex => (
        <div key={sectionIndex} className="skeleton-section">
          <div className="skeleton-section-header">
            <div className="skeleton skeleton-section-title"></div>
            <div className="skeleton-section-actions">
              <div className="skeleton skeleton-section-btn"></div>
              <div className="skeleton skeleton-section-btn"></div>
            </div>
          </div>
          <div className="skeleton-cards-grid">
            {[1, 2, 3, 4].map(cardIndex => (
              <div key={cardIndex} className="skeleton-card"></div>
            ))}
          </div>
        </div>
      ))}

      {/* 섹션 추가 버튼 */}
      <div className="skeleton skeleton-add-section"></div>

      {/* 메인페이지인 경우 연락처 */}
      {!isDashboard && (
        <div className="skeleton skeleton-contact"></div>
      )}
    </div>
  )
}
