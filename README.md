# YouTube API Web

YouTube Explorer는 YouTube Data API v3를 이용하여 손쉽게 영상을 검색하고 살펴볼 수 있는 경량 웹 애플리케이션입니다. API 키만 준비되어 있다면 별도의 빌드 과정 없이 즉시 실행할 수 있습니다.

## 주요 기능

- 🔍 키워드 기반 동영상 검색 (YouTube Data API v3 `search.list` 사용)
- ▶️ 검색 결과에서 바로 영상 재생 (오버레이 플레이어 제공)
- 📊 조회수, 등록일, 재생 길이 등 주요 메타데이터 표시
- ⏭️ 페이지 토큰 기반 이전/다음 페이지 탐색
- 🛡️ 서버 사이드 프록시로 API 키 보호 및 오류 처리

## 시작하기

### 1. 필수 조건

- [Node.js](https://nodejs.org/) 18 이상 (권장: 최신 LTS)
- YouTube Data API v3 키 (Google Cloud Console에서 발급)

### 2. 환경 변수 설정

1. `.env.example` 파일을 복사하여 `.env` 파일을 생성합니다.

   ```bash
   cp .env.example .env
   ```

2. `.env` 파일을 열어 `YOUTUBE_API_KEY` 값을 발급받은 API 키로 교체합니다.

   ```dotenv
   YOUTUBE_API_KEY=여기에_발급받은_API_키
   # PORT=3000  # 기본값을 변경하려면 주석을 해제하세요.
   ```

   > 참고: API 키는 YouTube Data API v3에 대한 액세스 권한이 있어야 하며, 쿼터 제한을 초과하면 요청이 차단될 수 있습니다.

   > ⚠️ **보안 주의:** API 키는 반드시 비공개로 보관하세요. `.env` 파일은 이미 `.gitignore`에 포함되어 있으므로 버전 관리에 올라가지 않지만, 저장소나 프론트엔드 코드에 키 문자열을 직접 작성하면 누구나 사용할 수 있게 됩니다. 키가 노출되었다면 즉시 Google Cloud Console에서 키를 폐기하고 새로 발급받은 뒤, [API 제한](https://cloud.google.com/docs/authentication/api-keys#api_key_restrictions)을 설정하여 사용할 서비스와 출처(HTTP referer, IP 등)를 제한하는 것이 좋습니다.

### 3. 로컬 실행

의존성 패키지 없이 실행할 수 있도록 제작되었습니다. 저장소 루트에서 다음 명령을 실행하세요.

```bash
npm start
```

서버가 `http://localhost:3000` (또는 `PORT` 환경 변수로 지정한 포트)에서 실행됩니다.

## 사용 방법

1. 브라우저에서 `http://localhost:3000`에 접속합니다.
2. 검색어를 입력하고 **검색** 버튼 또는 Enter 키를 눌러 결과를 불러옵니다.
3. 카드의 썸네일이나 제목을 클릭하면 오버레이가 열리고, 동영상이 즉시 재생됩니다.
4. 결과 하단의 **이전**, **다음** 버튼으로 페이지를 이동할 수 있습니다.
5. 영상 상세 정보 영역의 링크를 클릭하면 새로운 탭에서 YouTube 재생 페이지가 열립니다.

## 서버 API

프론트엔드는 동일한 도메인에서 제공되는 간단한 Node.js 서버와 통신합니다.

- `GET /api/search`
  - 필수 쿼리: `q` (검색어)
  - 선택 쿼리: `pageToken`, `maxResults` (1~25), `regionCode`, `order`
  - 반환 예시:

    ```json
    {
      "query": "lofi hip hop",
      "nextPageToken": "CBQQAA",
      "prevPageToken": null,
      "pageInfo": {
        "totalResults": 1000000,
        "resultsPerPage": 12
      },
      "items": [
        {
          "id": "5qap5aO4i9A",
          "title": "lofi hip hop radio - beats to relax/study to",
          "description": "방송 설명...",
          "channelTitle": "Lofi Girl",
          "publishedAt": "2020-04-22T21:00:00Z",
          "thumbnailUrl": "https://i.ytimg.com/vi/5qap5aO4i9A/hqdefault.jpg",
          "viewCount": 12345678,
          "likeCount": 987654,
          "duration": "PT0H0M0S"
        }
      ]
    }
    ```

오류가 발생하면 JSON 형태의 메시지와 함께 적절한 HTTP 상태 코드를 반환합니다. (예: 인증 실패 시 401/403, API 제한 시 403, 시간 초과 시 504 등)

## 프로젝트 구조

```
.
├── .env.example        # 환경 변수 샘플
├── package.json        # npm 스크립트 및 메타데이터
├── src
│   ├── server.js       # 정적 파일 서빙 및 YouTube API 프록시 서버
│   └── public
│       ├── index.html  # 메인 페이지
│       ├── styles.css  # UI 스타일
│       ├── app.js      # 프론트엔드 로직
│       └── favicon.svg # 파비콘
└── README.md
```

## 추가 팁

- 서버 시작 시 `YOUTUBE_API_KEY`가 설정되어 있지 않다면 경고 메시지가 출력되며, 검색 요청은 실패합니다.
- 필요한 경우 `order`(정렬) 또는 `regionCode`(지역 코드) 등의 파라미터를 직접 조정하여 요청을 확장할 수 있습니다.
- 개발 환경에서 더 자세한 오류 메시지를 확인하려면 `NODE_ENV=development`로 실행하세요.

즐거운 탐색이 되길 바랍니다! 🎬
