# 네이버 데이터랩 쇼핑 트렌드 API 서버

네이버 데이터랩에서 쇼핑 실시간 트렌드를 하루에 한번 수집하여 저장하고, REST API를 통해 제공하는 서버입니다.

## 🚀 주요 기능

- **자동 데이터 수집**: 매일 오전 9시에 네이버 데이터랩에서 쇼핑 트렌드 데이터를 자동 수집
- **REST API 제공**: 수집된 데이터를 REST API를 통해 조회 가능
- **데이터베이스 저장**: SQLite를 사용하여 트렌드 데이터를 영구 저장
- **키워드 히스토리**: 특정 키워드의 과거 트렌드 변화 추적
- **통계 정보**: 트렌드 데이터의 통계 정보 제공
- **헬스체크**: API 서버 상태 모니터링

## 📋 API 엔드포인트

### 기본 정보

- **Base URL**: `http://localhost:3000/api/trends`
- **Content-Type**: `application/json`

### 엔드포인트 목록

#### 1. 최신 트렌드 데이터 조회

```
GET /api/trends/latest
```

- **설명**: 가장 최근에 수집된 트렌드 데이터를 조회합니다.
- **쿼리 파라미터**:
  - `limit` (선택): 조회할 개수 (기본값: 100, 최대: 500)

**응답 예시**:

```json
{
  "success": true,
  "data": [
    {
      "keyword": "아이폰",
      "ratio": 100,
      "rank": 1,
      "date": "2024-01-15",
      "created_at": "2024-01-15T09:00:00.000Z"
    }
  ],
  "count": 100,
  "lastUpdated": "2024-01-15",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### 2. 특정 날짜의 트렌드 데이터 조회

```
GET /api/trends/date/:date
```

- **설명**: 특정 날짜의 트렌드 데이터를 조회합니다.
- **경로 파라미터**:
  - `date`: 날짜 (YYYY-MM-DD 형식)
- **쿼리 파라미터**:
  - `limit` (선택): 조회할 개수 (기본값: 100, 최대: 500)

#### 3. 키워드 히스토리 조회

```
GET /api/trends/keyword/:keyword/history
```

- **설명**: 특정 키워드의 과거 트렌드 변화를 조회합니다.
- **경로 파라미터**:
  - `keyword`: 검색할 키워드
- **쿼리 파라미터**:
  - `days` (선택): 조회할 일수 (기본값: 30, 최대: 365)

#### 4. 트렌드 통계 정보 조회

```
GET /api/trends/stats
```

- **설명**: 트렌드 데이터의 통계 정보를 조회합니다.

**응답 예시**:

```json
{
  "success": true,
  "stats": {
    "totalKeywords": 100,
    "averageRatio": 45.5,
    "topKeywords": [
      {
        "keyword": "아이폰",
        "ratio": 100,
        "rank": 1
      }
    ],
    "lastUpdated": "2024-01-15"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### 5. 수동 데이터 수집 실행

```
POST /api/trends/collect
```

- **설명**: 스케줄에 관계없이 즉시 데이터 수집을 실행합니다.
- **주의**: 실제 운영 환경에서는 인증이 필요할 수 있습니다.

#### 6. 스케줄러 상태 조회

```
GET /api/trends/scheduler/status
```

- **설명**: 데이터 수집 스케줄러의 현재 상태를 조회합니다.

#### 7. API 상태 확인 (헬스체크)

```
GET /api/trends/health
```

- **설명**: API 서버와 데이터베이스 연결 상태를 확인합니다.

## 🛠 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`env.example` 파일을 참고하여 `.env` 파일을 생성하고 필요한 값을 설정합니다.

```bash
cp env.example .env
```

`.env` 파일 내용:

```env
# 네이버 데이터랩 API 설정
NAVER_CLIENT_ID=your_naver_client_id
NAVER_CLIENT_SECRET=your_naver_client_secret

# 서버 설정
PORT=3000
NODE_ENV=development

# 데이터베이스 설정
DB_PATH=./data/trends.db

# 스케줄러 설정 (매일 오전 9시 실행)
CRON_SCHEDULE=0 9 * * *

# 서버 시작 시 즉시 데이터 수집 실행 (선택사항)
RUN_ON_START=true
```

### 3. 네이버 데이터랩 API 키 발급

1. [네이버 개발자 센터](https://developers.naver.com/)에 접속
2. 애플리케이션 등록
3. 데이터랩 API 사용 신청
4. 발급받은 Client ID와 Client Secret을 `.env` 파일에 설정

### 4. 서버 실행

```bash
# 개발 모드 (nodemon 사용)
npm run dev

# 프로덕션 모드
npm start

# 스케줄러만 실행
npm run scheduler
```

## 📁 프로젝트 구조

```
rank-sever/
├── src/
│   ├── controllers/          # 컨트롤러 (비즈니스 로직)
│   │   └── trendController.js
│   ├── models/              # 데이터 모델
│   │   ├── database.js
│   │   └── trendModel.js
│   ├── routes/              # API 라우트
│   │   └── trendRoutes.js
│   ├── services/            # 외부 서비스 연동
│   │   └── naverDatalabService.js
│   ├── utils/               # 유틸리티 함수
│   ├── server.js            # 메인 서버 파일
│   └── scheduler.js         # 스케줄러
├── data/                    # 데이터베이스 파일 저장소
├── package.json
├── env.example
└── README.md
```

## 🔧 설정 옵션

### 환경 변수

- `NAVER_CLIENT_ID`: 네이버 데이터랩 API 클라이언트 ID
- `NAVER_CLIENT_SECRET`: 네이버 데이터랩 API 클라이언트 시크릿
- `PORT`: 서버 포트 (기본값: 3000)
- `NODE_ENV`: 실행 환경 (development/production)
- `DB_PATH`: SQLite 데이터베이스 파일 경로
- `CRON_SCHEDULE`: 데이터 수집 스케줄 (기본값: 매일 오전 9시)
- `RUN_ON_START`: 서버 시작 시 즉시 데이터 수집 실행 여부

### 스케줄 설정

크론 표현식을 사용하여 데이터 수집 시간을 설정할 수 있습니다:

- `0 9 * * *`: 매일 오전 9시
- `0 */6 * * *`: 6시간마다
- `0 0 * * 1`: 매주 월요일 자정

## 📊 데이터베이스 스키마

### shopping_trends 테이블

```sql
CREATE TABLE shopping_trends (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  keyword TEXT NOT NULL,
  ratio REAL NOT NULL,
  rank INTEGER NOT NULL,
  date TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(keyword, date)
);
```

### api_logs 테이블

```sql
CREATE TABLE api_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  response_time INTEGER,
  status_code INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 🚨 주의사항

1. **API 키 관리**: 네이버 데이터랩 API 키는 안전하게 관리하고 공개하지 마세요.
2. **데이터 수집 제한**: 네이버 데이터랩 API는 일일 호출 제한이 있을 수 있습니다.
3. **데이터 정확성**: 현재 구현은 샘플 데이터를 사용하고 있습니다. 실제 네이버 데이터랩 API 연동이 필요합니다.
4. **보안**: 프로덕션 환경에서는 인증/권한 체크를 추가하세요.

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 📞 문의

프로젝트에 대한 문의사항이 있으시면 이슈를 생성해 주세요.
