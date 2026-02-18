# www-anhmake-com 코드 검사 결과

> 검사일: 2026-02-18
> 프로젝트: Next.js 15 + React 19 + Supabase + Tailwind v4 기반 대시보드/카드 시스템

---

## 1. 보안 문제 (Critical)

### 1.1 API 라우트에 인증 없음
- `POST/PUT/DELETE /api/cards`와 `POST/PUT/DELETE /api/sections`에 인증 체크가 전혀 없음
- 누구나 카드와 섹션을 생성/수정/삭제할 수 있음
- `/api/admin/users`만 admin 체크가 있음
- **파일**: `src/app/api/cards/route.ts`, `src/app/api/sections/route.ts`

### 1.2 XSS 위험
- `card.url`이 검증 없이 `window.open(card.url, '_blank')`로 사용됨
- `javascript:` 프로토콜 URL이 저장되면 XSS 공격 가능
- **파일**: `src/components/Section.tsx:41`

### 1.3 Supabase 미들웨어 없음
- `middleware.ts`가 없어서 세션 자동 갱신이 안 됨
- Supabase SSR에서 권장하는 패턴이 빠져 있음

---

## 2. 구조적 문제 (Major)

### 2.1 CSS 대규모 중복
| 파일 | inline CSS 라인수 |
|---|---|
| `globals.css` | ~480줄 |
| `dashboard/[id]/page.tsx` | ~260줄 `<style jsx global>` |
| `code/[id]/page.tsx` | ~370줄 `<style jsx global>` |
| `admin/users/page.tsx` | ~250줄 `<style jsx global>` |
| `SkeletonLoader.tsx` | ~220줄 `<style jsx global>` |

body 스타일, `.container`, `.modal`, `.form-group` 등이 4~5곳에서 거의 동일하게 복붙되어 있음. Tailwind CSS v4가 설치되어 있지만 거의 사용되지 않고 있음.

### 2.2 타입 중복 정의
- `Card` 인터페이스: 4곳에서 중복 (`Card.tsx`, `Section.tsx`, `useModal.tsx`, `dashboard/[id]/page.tsx`)
- `Section` 인터페이스: 3곳에서 중복
- `User` 인터페이스: 2곳에서 중복
- **해결**: `src/types/index.ts` 같은 공통 타입 파일 필요

### 2.3 폰트 충돌
- `layout.tsx`에서 Geist 폰트를 `next/font/google`로 로드
- `globals.css`에서 Inter 폰트를 `@import url()`로 또 로드
- body에서 `font-family: 'Inter'`로 덮어씌워서 Geist 로딩이 완전히 낭비
- **파일**: `src/app/layout.tsx`, `src/app/globals.css`

---

## 3. Next.js App Router 오용 (Major)

### 3.1 `<Head>` 사용 불가
- `dashboard/[id]/page.tsx:327-331`에서 `import Head from 'next/head'` 사용
- App Router에서는 작동하지 않음
- `document.title = ...`로 우회하고 있지만, `generateMetadata()`를 써야 함

### 3.2 전부 Client Component
- 모든 페이지가 `'use client'`로 선언
- Next.js App Router의 서버 컴포넌트 이점이 완전히 사라짐
- 초기 데이터를 서버에서 fetching 할 수 있는데 전부 클라이언트에서 API 호출

### 3.3 `window.location.href` 남용
- `Header.tsx:44`, `admin/users/page.tsx:39,44` 등에서 사용
- Next.js의 `useRouter().push()` 대신 풀 페이지 리로드 발생

### 3.4 `loading.tsx` 미사용
- Next.js 내장 Suspense 패턴 대신 수동으로 `SkeletonLoader` 컴포넌트 관리

---

## 4. 성능 문제

### 4.1 N+1 쿼리 (fallback)
- `loadDashboard`의 fallback 경로에서 섹션 목록을 가져온 후 각 섹션별로 개별 API 호출
- **파일**: `src/app/dashboard/[id]/page.tsx:261-288`

### 4.2 캐싱 없음
- API에 Cache-Control 헤더 없음
- React Query/SWR 같은 클라이언트 캐싱 라이브러리 미사용
- 매 mutation 후 `loadDashboard()` 전체 재호출

### 4.3 이미지 최적화 비활성화
- `next.config.ts`에서 `images.unoptimized: true` 설정
- Next.js 이미지 최적화를 완전 비활성화

---

## 5. 접근성(a11y) 문제

| 문제 | 위치 |
|---|---|
| `<html lang="en">` 인데 콘텐츠는 한국어 | `layout.tsx:26` |
| Modal에 `role="dialog"`, `aria-modal` 없음 | `useModal.tsx` |
| ESC 키로 모달 닫기 미구현 | 전체 |
| 모달 닫기 버튼이 `<span>` (의미론적 오류) | `useModal.tsx:168` |
| 카드 메뉴가 `<div>`에 onClick (키보드 접근 불가) | `Card.tsx:56-61` |

---

## 6. 코드 품질

### 6.1 React에서 DOM 직접 조작
- `useModal.tsx:239` - `document.getElementById('iconUrlField')` 사용 (React state로 관리해야 함)
- `code/[id]/page.tsx:148-149` - `button.textContent`, `button.classList` 직접 수정

### 6.2 반응형 불일치
- `globals.css`: 1024px에서 2열, 768px에서 1열
- `SkeletonLoader.tsx`: 1024px에서 3열, 768px에서 2열, 480px에서 1열
- 실제 콘텐츠와 스켈레톤의 레이아웃이 안 맞음

### 6.3 기타
- `padlet-style-card-system-analysis.md` 분석 문서가 프로젝트 루트에 있음
- `.DS_Store`가 커밋되어 있음

---

## 7. 개선 우선순위

| 순위 | 작업 | 난이도 | 상태 |
|---|---|---|---|
| 1 | API 라우트에 인증 미들웨어 추가 | 중 | 완료 |
| 2 | `middleware.ts` 추가 (세션 갱신) | 하 | 대기 |
| 3 | 공통 타입 파일 `src/types/` 생성 | 하 | 대기 |
| 4 | CSS 중복 제거 → `globals.css`로 통합 또는 Tailwind 활용 | 중 | 대기 |
| 5 | `<Head>` 제거 → `generateMetadata` 사용 | 하 | 대기 |
| 6 | `<html lang="ko">` 수정 | 하 | 대기 |
| 7 | 폰트 정리 (Inter or Geist 하나만 사용) | 하 | 대기 |
| 8 | URL 유효성 검증 추가 (XSS 방지) | 하 | 대기 |
| 9 | DOM 직접 조작 → React state로 전환 | 중 | 대기 |
| 10 | 서버 컴포넌트 패턴 적용 (장기) | 상 | 대기 |
