'use client'

interface SkeletonLoaderProps {
  isDashboard?: boolean // 메인페이지(false) vs 대시보드(true)
}

export default function SkeletonLoader({ isDashboard = false }: SkeletonLoaderProps) {
  return (
    <>
      <style jsx global>{`
        /* 실제 페이지와 동일한 배경 적용 */
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
        .skeleton {
          background: linear-gradient(90deg, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 75%);
          background-size: 200% 100%;
          animation: skeleton-loading 1.5s infinite;
          border-radius: 8px;
        }

        @keyframes skeleton-loading {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }

        .skeleton-container {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
        }

        /* 뒤로가기 버튼 (대시보드에만) */
        .skeleton-back-btn {
          width: 120px;
          height: 42px;
          margin-bottom: 2rem;
          border-radius: 2rem;
        }

        /* 헤더 스타일 (메인페이지용) */
        .skeleton-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .skeleton-header-main {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
        }

        .skeleton-header-logo {
          width: 60px;
          height: 60px;
          border-radius: 8px;
          flex-shrink: 0;
        }

        .skeleton-header-text {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .skeleton-header-line {
          height: 20px;
          border-radius: 4px;
        }

        .skeleton-header-line:first-child {
          width: 120px;
        }

        .skeleton-header-line:nth-child(2) {
          width: 180px;
        }

        .skeleton-header-line:nth-child(3) {
          width: 220px;
        }

        .skeleton-header-auth {
          width: 80px;
          height: 36px;
          border-radius: 6px;
        }

        /* 페이지 헤더 스타일 (대시보드용) */
        .skeleton-page-header {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          margin-bottom: 2rem;
          width: fit-content;
        }

        .skeleton-page-logo {
          width: 60px;
          height: 60px;
          border-radius: 8px;
          flex-shrink: 0;
        }

        .skeleton-page-text {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .skeleton-page-title {
          width: 150px;
          height: 24px;
          border-radius: 4px;
        }

        .skeleton-page-desc {
          width: 200px;
          height: 16px;
          border-radius: 4px;
        }

        /* 섹션 스타일 - 실제와 동일하게 */
        .skeleton-section {
          margin-bottom: 3rem;
        }

        .skeleton-section-header {
          display: flex;
          justify-content: flex-start;
          align-items: center;
          margin-bottom: 0.5rem;
          gap: 1rem;
        }

        .skeleton-section-title {
          width: 180px;
          height: 45px;
          border-radius: 2rem;
        }

        .skeleton-section-actions {
          display: flex;
          gap: 0.5rem;
        }

        .skeleton-section-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
        }

        /* 카드 그리드 */
        .skeleton-cards-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
        }

        .skeleton-card {
          background: rgba(255,255,255,0.1);
          border-radius: 1rem;
          height: 300px;
          width: 93%;
          margin: 0 auto;
          animation: skeleton-loading 1.5s infinite;
        }

        /* 섹션 추가 버튼 */
        .skeleton-add-section {
          width: 150px;
          height: 45px;
          margin-top: 1rem;
          border-radius: 2rem;
        }

        /* 연락처 */
        .skeleton-contact {
          width: 250px;
          height: 20px;
          margin: 2rem auto 0;
          border-radius: 4px;
        }

        /* 반응형 */
        @media (max-width: 1024px) {
          .skeleton-cards-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (max-width: 768px) {
          .skeleton-cards-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .skeleton-container {
            padding: 1rem;
          }
        }

        @media (max-width: 480px) {
          .skeleton-cards-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

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
    </>
  )
}