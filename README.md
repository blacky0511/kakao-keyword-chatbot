# 카카오톡 검색량 조회 챗봇

네이버 검색광고 API와 크롤링을 활용한 키워드 검색량 조회 및 파워링크 단가 분석 카카오톡 챗봇입니다.

## 주요 기능

- **검색량 조회**: 네이버 검색광고 API를 통한 월간 검색량 조회
- **연관검색어**: 입력한 키워드의 연관 검색어 조회
- **파워링크 단가**: Puppeteer 크롤링으로 실제 입찰가 정보 수집
- **마케팅 문의**: 카카오톡 채널을 통한 직접 문의 기능

## 기술 스택

### 메인 서버
- **프레임워크**: Next.js 16 (App Router)
- **언어**: TypeScript
- **런타임**: Node.js 20+
- **API**: 네이버 검색광고 API

### 크롤링 서버
- **프레임워크**: Express 5
- **크롤링**: Puppeteer, puppeteer-extra
- **포트**: 3001

### 프로세스 관리
- **PM2**: 자동 재시작, 로그 관리, Windows 서비스 등록

## 빠른 시작

> **💡 초간단 설치**: 새 PC에 3분 안에 설치하려면 [QUICKSTART.md](./QUICKSTART.md)를 참고하세요.

### 1. 사전 요구사항

- Node.js 20 이상
- npm
- Git
- 네이버 검색광고 계정 (API 키 발급용)

### 2. 설치

```powershell
# 프로젝트 클론
git clone <repository-url>
cd 카카오톡\ 검색량\ 조회\ 챗봇

# 자동 설치 (의존성 설치 + 환경 변수 설정)
npm run setup
```

자동 설치 스크립트가 다음을 수행합니다:
- Node.js 버전 확인
- 메인 프로젝트 및 크롤링 서버 의존성 설치
- 환경 변수 템플릿 복사
- 빌드 수행

### 3. 환경 변수 설정

설치 후 생성된 `.env.local` 파일과 `crawling-server/.env` 파일에 다음 정보를 입력하세요:

**`.env.local`**
```bash
NAVER_AD_API_KEY=<네이버 검색광고 API 키>
NAVER_AD_SECRET_KEY=<네이버 검색광고 시크릿 키>
NAVER_AD_CUSTOMER_ID=<광고주 ID>
CRAWLING_SERVER_URL=http://localhost:3001
```

**`crawling-server/.env`**
```bash
NAVER_ID=<네이버 계정>
NAVER_PASSWORD=<네이버 비밀번호>
PORT=3001
```

자세한 발급 방법은 [SETUP_GUIDE.md](./SETUP_GUIDE.md)를 참고하세요.

### 4. 서버 실행

#### 개발 모드
```powershell
npm run dev:both
```

#### 프로덕션 모드 (PM2)
```powershell
# PM2로 서버 시작
npm run pm2:start

# 서버 상태 확인
npm run pm2:list

# 로그 확인
npm run pm2:logs
```

### 5. 카카오톡 채널 연동

1. [카카오 i 오픈빌더](https://i.kakao.com/)에서 챗봇 생성
2. 스킬 서버 URL 설정: `https://your-domain.com/api/kakao/webhook`
3. 배포 후 테스트

자세한 연동 방법은 [SETUP_GUIDE.md](./SETUP_GUIDE.md)를 참고하세요.

## 프로젝트 구조

```
카카오톡 검색량 조회 챗봇/
├── src/
│   ├── app/
│   │   └── api/kakao/webhook/
│   │       └── route.ts           # 카카오톡 웹훅 핸들러
│   └── lib/
│       ├── kakao/
│       │   ├── types.ts           # 카카오톡 API 타입 정의
│       │   └── response.ts        # 응답 생성 유틸
│       └── naver/
│           ├── auth.ts            # 네이버 API 인증
│           └── keywordTool.ts     # 검색량/연관어 조회
├── crawling-server/               # 파워링크 크롤링 서버
│   ├── src/
│   │   ├── server.js             # Express 서버
│   │   └── crawler.js            # Puppeteer 크롤러
│   ├── .env.example
│   └── package.json
├── logs/                          # PM2 로그 디렉토리
├── .env.example
├── pm2.config.cjs                # PM2 설정 파일
├── setup-windows.ps1             # 자동 설치 스크립트
├── start-servers.ps1             # 서버 시작 스크립트
├── install-as-service.ps1        # Windows 서비스 등록
└── package.json
```

## PM2 관리 명령어

```powershell
# 서버 시작
npm run pm2:start

# 서버 중지
npm run pm2:stop

# 서버 재시작
npm run pm2:restart

# 로그 확인
npm run pm2:logs

# 실시간 모니터링
npm run pm2:monit

# 프로세스 목록
npm run pm2:list
```

## Windows 서비스로 등록

PC 부팅 시 자동으로 서버가 시작되도록 설정할 수 있습니다:

```powershell
# 관리자 권한으로 PowerShell 실행 후
.\install-as-service.ps1
```

등록 후 PC를 재부팅하면 자동으로 서버가 시작됩니다.

## 문제 해결

서버 실행 중 문제가 발생하면 다음을 확인하세요:

1. **로그 확인**: `logs/` 디렉토리의 로그 파일 또는 `npm run pm2:logs`
2. **포트 충돌**: 3000, 3001 포트가 이미 사용 중인지 확인
3. **환경 변수**: `.env.local` 및 `crawling-server/.env` 파일이 올바른지 확인
4. **네이버 API**: API 키가 유효하고 할당량이 남아있는지 확인

자세한 내용은 [docs/TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md)를 참고하세요.

## 개발 가이드

### 로컬 개발

```powershell
# 메인 서버만 실행 (개발 모드)
npm run dev

# 크롤링 서버 실행 (별도 터미널)
cd crawling-server
npm run dev

# 양쪽 서버 동시 실행
npm run dev:both
```

### 빌드

```powershell
npm run build
```

### 환경 변수 추가

새로운 환경 변수를 추가할 때는 다음 파일들을 모두 업데이트하세요:
- `.env.example` (템플릿)
- `.env.local` (로컬 개발)
- `SETUP_GUIDE.md` (문서)

## 라이선스

ISC

## 문의

프로젝트 관련 문의사항은 이슈를 등록해주세요.
