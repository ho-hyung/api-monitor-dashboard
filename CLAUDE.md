# API Monitor Dashboard

## 프로젝트 개요

API 엔드포인트 헬스체크, 응답시간 추적, 다운타임 알림, 공개 상태 페이지를 제공하는 모니터링 대시보드입니다.

## 기술 스택

- **Frontend**: Next.js 15 (App Router) + Tailwind CSS + shadcn/ui
- **Backend**: Next.js API Routes + Vercel Cron
- **Database**: Supabase (PostgreSQL + Auth + Realtime)
- **Charts**: Recharts
- **Deployment**: Vercel

## 디렉토리 구조

```
src/
├── app/
│   ├── (auth)/           # 인증 페이지 (login, signup)
│   ├── (dashboard)/      # 대시보드 페이지
│   │   ├── monitors/     # 모니터 관리
│   │   ├── incidents/    # 인시던트 관리
│   │   ├── notifications/# 알림 채널 관리
│   │   └── settings/     # 상태 페이지 설정
│   ├── (public)/         # 공개 페이지
│   │   └── status/[slug] # 공개 상태 페이지
│   └── api/              # API 라우트
│       ├── cron/         # Cron 작업
│       ├── monitors/     # 모니터 CRUD
│       ├── notifications/# 알림 채널 CRUD
│       ├── incidents/    # 인시던트 CRUD
│       ├── alert-rules/  # 알림 규칙
│       ├── status-page/  # 상태 페이지 설정
│       └── public/       # 공개 API
├── components/
│   ├── ui/               # shadcn/ui 컴포넌트
│   ├── layouts/          # 레이아웃 컴포넌트
│   ├── monitors/         # 모니터 관련 컴포넌트
│   ├── charts/           # 차트 컴포넌트
│   └── notifications/    # 알림 관련 컴포넌트
├── hooks/                # 커스텀 훅
├── lib/
│   ├── supabase/         # Supabase 클라이언트
│   ├── health-check/     # 헬스체크 엔진
│   ├── notifications/    # 알림 발송 로직
│   └── validations/      # Zod 스키마
└── types/                # TypeScript 타입 정의
```

## 핵심 기능

### 1. 헬스체크 모니터링
- URL 등록 및 주기적 체크 (1분~1시간 간격)
- GET/POST/HEAD 메서드 지원
- 응답시간 및 상태 코드 기록
- 30일간 업타임 히스토리

### 2. 알림 시스템
- Slack Webhook
- Discord Webhook
- Email (Resend)
- 연속 실패 후 알림 트리거
- 복구 알림 지원

### 3. 공개 상태 페이지
- statuspage.io 스타일 UI
- 실시간 서비스 상태
- 인시던트 타임라인
- 커스텀 테마 색상

## 환경 변수

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Vercel Cron
CRON_SECRET=

# Email (Resend)
RESEND_API_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 데이터베이스 설정

Supabase에서 `supabase/schema.sql` 파일을 실행하여 테이블을 생성합니다.

## 개발

```bash
npm install
npm run dev
```

## 배포

Vercel에 배포 후 환경 변수를 설정합니다. Cron 작업은 `vercel.json`에 설정되어 있습니다.

## API 엔드포인트

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET/POST | /api/monitors | 모니터 목록/생성 |
| GET/PATCH/DELETE | /api/monitors/[id] | 모니터 상세/수정/삭제 |
| GET | /api/monitors/[id]/health-checks | 헬스체크 이력 |
| GET | /api/cron/health-check | Cron 헬스체크 실행 |
| GET/POST | /api/notifications/channels | 알림 채널 |
| POST | /api/notifications/channels/[id]/test | 테스트 알림 |
| GET/POST/PATCH/DELETE | /api/incidents | 인시던트 관리 |
| GET/POST | /api/incidents/[id]/updates | 인시던트 업데이트 |
| GET/POST | /api/status-page | 상태 페이지 설정 |
| GET | /api/public/status/[slug] | 공개 상태 API |
