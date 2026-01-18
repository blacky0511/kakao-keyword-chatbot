# 새 PC 빠른 설치 가이드

새로운 컴퓨터에 **3~5분 내**로 설치하는 초간단 가이드입니다.

## 🔀 설치 방식 선택

| 항목 | Git 클론 (권장) | 폴더 복사 |
|------|----------------|----------|
| **장점** | 깔끔한 설치, Git 히스토리 유지 | 오프라인 설치 가능 |
| **단점** | Git 필요, 인터넷 필요 | node_modules 제외 필요, .env 파일 주의 |
| **추천** | ✅ 권장 | ⚠️ 특수한 경우만 |

---

## 방법 1: Git 클론 (권장)

### 사전 준비
- [ ] Node.js 20 이상 설치 ([다운로드](https://nodejs.org/))
- [ ] Git 설치 ([다운로드](https://git-scm.com/))
- [ ] 네이버 검색광고 API 키 준비
- [ ] 네이버 로그인 계정 준비

### 설치 단계

#### 1. 프로젝트 클론
```powershell
git clone <repository-url>
cd 카카오톡\ 검색량\ 조회\ 챗봇
```

#### 2. 자동 설치 실행
```powershell
npm run setup
```

이 명령어가 다음을 자동으로 수행합니다:
- Node.js 버전 확인
- 의존성 설치 (메인 + 크롤링 서버)
- 환경 변수 템플릿 복사
- 프로젝트 빌드

#### 3. 환경 변수 설정

**`.env.local` 파일 편집** (프로젝트 루트):
```bash
NAVER_AD_API_KEY=<네이버 검색광고 API 키>
NAVER_AD_SECRET_KEY=<네이버 검색광고 시크릿 키>
NAVER_AD_CUSTOMER_ID=<광고주 ID>
CRAWLING_SERVER_URL=http://localhost:3001
```

**`crawling-server\.env` 파일 편집**:
```bash
NAVER_ID=<네이버 계정>
NAVER_PASSWORD=<네이버 비밀번호>
PORT=3001
```

> 💡 API 키 발급 방법은 [SETUP_GUIDE.md](./SETUP_GUIDE.md)를 참고하세요.

#### 4. 서버 실행

**개발 모드** (테스트용):
```powershell
npm run dev:both
```

**프로덕션 모드** (PM2):
```powershell
npm run pm2:start
```

#### 5. (선택) Windows 서비스 등록

PC 부팅 시 자동으로 서버가 시작되도록 설정:
```powershell
# 관리자 권한 PowerShell에서
.\install-as-service.ps1
```

### 완료 확인
- [ ] http://localhost:3000 접속 확인
- [ ] http://localhost:3001 접속 확인
- [ ] PM2 상태 확인: `npm run pm2:list`

---

## 방법 2: 폴더 복사 (특수한 경우)

### ⚠️ 주의사항
- `node_modules` 폴더는 **절대 복사하지 마세요** (용량 크고 불필요)
- `.env.local`, `crawling-server\.env` 파일은 **복사하지 마세요** (보안)
- `logs/` 폴더 내 로그 파일도 제외

### 복사할 파일/폴더 체크리스트

#### ✅ 복사할 것
- [ ] `src/` (소스 코드)
- [ ] `crawling-server/src/` (크롤링 서버 소스)
- [ ] `public/` (있는 경우)
- [ ] `.env.example`
- [ ] `crawling-server/.env.example`
- [ ] `package.json`, `package-lock.json`
- [ ] `crawling-server/package.json`, `crawling-server/package-lock.json`
- [ ] `*.ps1` (PowerShell 스크립트)
- [ ] `pm2.config.cjs`
- [ ] `.gitignore`, `README.md`, `SETUP_GUIDE.md` 등 문서
- [ ] `next.config.ts`, `tailwind.config.ts` 등 설정 파일

#### ❌ 제외할 것
- [ ] `node_modules/` (양쪽 모두)
- [ ] `.next/` (빌드 파일)
- [ ] `logs/*.log` (로그 파일)
- [ ] `.env.local` (보안)
- [ ] `crawling-server/.env` (보안)
- [ ] `.git/` (Git 히스토리, 선택)

### 설치 단계

#### 1. 폴더 복사 후 이동
```powershell
cd C:\path\to\카카오톡\ 검색량\ 조회\ 챗봇
```

#### 2. 의존성 설치
```powershell
# 메인 프로젝트
npm install

# 크롤링 서버
cd crawling-server
npm install
cd ..
```

#### 3. 환경 변수 파일 생성
```powershell
Copy-Item .env.example .env.local
Copy-Item crawling-server\.env.example crawling-server\.env
```

#### 4. 환경 변수 설정
위의 **Git 클론 방식의 3단계**와 동일하게 설정

#### 5. 빌드 및 실행
```powershell
# 빌드
npm run build

# 서버 실행
npm run pm2:start
```

---

## 유용한 명령어

### 서버 관리
```powershell
# 개발 서버 (양쪽 동시 실행)
npm run dev:both

# PM2로 시작
npm run pm2:start

# PM2 중지
npm run pm2:stop

# PM2 재시작
npm run pm2:restart

# PM2 로그 확인
npm run pm2:logs

# PM2 상태 확인
npm run pm2:list

# PM2 실시간 모니터링
npm run pm2:monit
```

### 문제 해결
```powershell
# 로그 확인
Get-Content logs\main-error.log -Tail 50
Get-Content logs\crawler-error.log -Tail 50

# 포트 사용 확인
Get-NetTCPConnection -LocalPort 3000
Get-NetTCPConnection -LocalPort 3001

# 프로세스 종료
Stop-Process -Id <PID> -Force
```

---

## 자세한 정보

- **전체 설치 가이드**: [SETUP_GUIDE.md](./SETUP_GUIDE.md) - 네이버 API 발급, 카카오톡 연동 등
- **문제 해결**: [docs/TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md) - 모든 오류 상황별 해결 방법
- **프로젝트 개요**: [README.md](./README.md) - 기능, 구조, 개발 가이드

---

**설치 완료!** 🎉

문제가 발생하면 [TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md)를 먼저 확인하세요.
