# YouTube 채널 애널리틱스

YouTube Data API v3를 활용한 채널 검색 및 분석 웹 애플리케이션입니다.

## 주요 기능

- **로그인 시스템**: 사용자 인증 및 API 키 관리
- **API 키 설정**: YouTube Data API v3 키 설정 화면
- **채널 검색**: 키워드로 YouTube 채널 검색
- **다양한 필터**:
  - 국가별 검색 (20개 이상의 국가 지원)
  - 정렬 옵션: 관련성, 최신순, 조회수순, 구독자순
- **트렌딩 채널**: 국가별 인기 채널 확인
- **상세 정보**: 구독자 수, 동영상 수, 총 조회수, 개설일 등

## 기술 스택

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **State Management**: React Context API

## 시작하기

### 필수 요구사항

- Node.js 16 이상
- YouTube Data API v3 키

### YouTube API 키 발급

1. [Google Cloud Console](https://console.cloud.google.com/)에 접속
2. 새 프로젝트를 생성하거나 기존 프로젝트 선택
3. "API 및 서비스" > "라이브러리"로 이동
4. "YouTube Data API v3"를 검색하고 활성화
5. "API 및 서비스" > "사용자 인증 정보"로 이동
6. "사용자 인증 정보 만들기" > "API 키" 선택
7. 생성된 API 키를 복사

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 빌드된 파일 미리보기
npm run preview
```

## 사용 방법

1. **로그인**: 임의의 사용자명과 비밀번호로 로그인 (데모용)
2. **API 키 설정**: 설정 페이지에서 YouTube API 키 입력
3. **채널 검색**:
   - 대시보드에서 키워드 입력
   - 국가 및 정렬 옵션 선택
   - 검색 버튼 클릭
4. **트렌딩 채널**: 트렌딩 페이지에서 국가별 인기 채널 확인

## 프로젝트 구조

```
src/
├── components/       # 재사용 가능한 컴포넌트
│   ├── ChannelCard.tsx
│   ├── Navbar.tsx
│   └── SearchBar.tsx
├── contexts/        # React Context (상태 관리)
│   └── AuthContext.tsx
├── pages/           # 페이지 컴포넌트
│   ├── Dashboard.tsx
│   ├── Login.tsx
│   ├── Settings.tsx
│   └── Trending.tsx
├── services/        # API 서비스
│   └── youtubeApi.ts
├── types/           # TypeScript 타입 정의
│   └── index.ts
├── utils/           # 유틸리티 함수
│   └── countries.ts
├── App.tsx          # 메인 앱 컴포넌트
├── main.tsx         # 진입점
└── index.css        # 전역 스타일
```

## API 제한사항

YouTube Data API v3는 일일 할당량 제한이 있습니다 (기본 10,000 단위/일).
각 API 호출은 서로 다른 할당량을 소비하므로 사용에 주의가 필요합니다.

- 검색: 100 단위
- 채널 상세 정보: 1 단위
- 인기 동영상: 1 단위

## 라이선스

MIT

## 기여

이슈 및 풀 리퀘스트는 언제나 환영합니다!
