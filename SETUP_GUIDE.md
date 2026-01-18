# 카카오톡 검색량 조회 챗봇 - 상세 설치 가이드

이 가이드는 새로운 PC에서 카카오톡 검색량 조회 챗봇을 처음부터 설정하는 전체 과정을 단계별로 설명합니다.

## 목차

1. [사전 요구사항](#사전-요구사항)
2. [프로젝트 설치](#프로젝트-설치)
3. [네이버 API 키 발급](#네이버-api-키-발급)
4. [환경 변수 설정](#환경-변수-설정)
5. [카카오톡 채널 연동](#카카오톡-채널-연동)
6. [서버 실행 방법](#서버-실행-방법)
7. [PM2 자동 실행 설정](#pm2-자동-실행-설정)
8. [문제 해결](#문제-해결)

---

## 사전 요구사항

### 필수 소프트웨어

1. **Node.js 20 이상**
   - 다운로드: https://nodejs.org/
   - 설치 확인: PowerShell에서 `node -v` 실행
   - 권장 버전: LTS (Long Term Support)

2. **npm** (Node.js 설치 시 자동 설치됨)
   - 확인: PowerShell에서 `npm -v` 실행

3. **Git**
   - 다운로드: https://git-scm.com/
   - 확인: PowerShell에서 `git --version` 실행

### 필수 계정

1. **네이버 검색광고 계정**
   - 검색광고 센터: https://searchad.naver.com/
   - API 키 발급용

2. **카카오 i 오픈빌더 계정**
   - 오픈빌더: https://i.kakao.com/
   - 챗봇 생성 및 연동용

---

## 프로젝트 설치

### 1단계: 프로젝트 클론

PowerShell을 열고 다음 명령어를 실행하세요:

```powershell
# 원하는 디렉토리로 이동
cd C:\Users\YourName\Documents

# 프로젝트 클론
git clone <repository-url>

# 프로젝트 디렉토리로 이동
cd 카카오톡\ 검색량\ 조회\ 챗봇
```

### 2단계: 자동 설치 스크립트 실행

```powershell
# PowerShell 실행 정책 설정 (최초 1회만)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# 자동 설치 스크립트 실행
.\setup-windows.ps1
```

**자동 설치 스크립트가 수행하는 작업:**
- Node.js 버전 확인 (v20 이상 필요)
- 메인 프로젝트 의존성 설치
- 크롤링 서버 의존성 설치
- 환경 변수 템플릿 파일 복사
- PM2 설치 여부 확인 및 설치 제안
- 프로젝트 빌드

설치가 완료되면 다음 단계로 진행하세요.

---

## 네이버 API 키 발급

### 1단계: 네이버 검색광고 센터 접속

1. https://searchad.naver.com/ 접속
2. 네이버 계정으로 로그인
3. 광고주 등록 (아직 등록하지 않았다면)

### 2단계: API 키 발급

1. 상단 메뉴에서 **도구** 클릭
2. **API 사용관리** 선택
3. **API Key 신청** 버튼 클릭
4. 다음 정보를 복사하여 저장:
   - **액세스 라이선스** (API Key)
   - **비밀키** (Secret Key)
   - **광고주 ID** (Customer ID) - 우측 상단에서 확인

> **주의**: API 키는 한 번만 표시되므로 반드시 안전한 곳에 저장하세요!

### 3단계: 네이버 로그인 정보 준비

크롤링 서버에서 사용할 네이버 계정 정보를 준비합니다:
- 네이버 ID
- 네이버 비밀번호

> **권장**: 보안을 위해 별도의 네이버 계정을 사용하는 것이 좋습니다.

---

## 환경 변수 설정

### 1단계: 메인 서버 환경 변수 (.env.local)

프로젝트 루트 디렉토리의 `.env.local` 파일을 편집합니다:

```bash
# 네이버 검색광고 API 설정
NAVER_AD_API_KEY=<발급받은 액세스 라이선스>
NAVER_AD_SECRET_KEY=<발급받은 비밀키>
NAVER_AD_CUSTOMER_ID=<광고주 ID (숫자만)>

# 크롤링 서버 URL (기본값 유지)
CRAWLING_SERVER_URL=http://localhost:3001
```

**예시:**
```bash
NAVER_AD_API_KEY=01000000006576af30d197cd7c6efe91e805617e24f74726ebd8da658acc179e3031343d12
NAVER_AD_SECRET_KEY=AQAAAABldq8w0ZfNfG7+kegFYX4kj4db8G6Stc1OYWnH64pUTQ==
NAVER_AD_CUSTOMER_ID=3795000
CRAWLING_SERVER_URL=http://localhost:3001
```

### 2단계: 크롤링 서버 환경 변수 (crawling-server/.env)

`crawling-server\.env` 파일을 편집합니다:

```bash
# 네이버 로그인 정보
NAVER_ID=<네이버 아이디>
NAVER_PASSWORD=<네이버 비밀번호>

# 서버 포트 (기본값 유지)
PORT=3001
```

**예시:**
```bash
NAVER_ID=myid@naver.com
NAVER_PASSWORD=mypassword123
PORT=3001
```

> **보안 주의**: `.env.local` 및 `crawling-server\.env` 파일은 절대 Git에 커밋하지 마세요! (`.gitignore`에 이미 추가되어 있습니다)

### 3단계: 환경 변수 검증

```powershell
# 메인 서버 환경 변수 파일 확인
Get-Content .env.local

# 크롤링 서버 환경 변수 파일 확인
Get-Content crawling-server\.env
```

---

## 카카오톡 채널 연동

### 1단계: 카카오 i 오픈빌더 챗봇 생성

1. https://i.kakao.com/ 접속
2. 로그인 후 **챗봇 만들기** 클릭
3. 봇 이름 입력 (예: "검색량 조회 봇")
4. 챗봇 생성 완료

### 2단계: 스킬 생성

1. 좌측 메뉴에서 **스킬** 선택
2. **스킬 만들기** 클릭
3. 다음 정보 입력:
   - **스킬 이름**: 검색량 조회
   - **URL**: `http://localhost:3000/api/kakao/webhook` (로컬 테스트용)
   - **Method**: POST

> **중요**: 로컬 테스트는 ngrok 등의 터널링 도구를 사용해야 합니다. 실제 배포 시에는 공개 도메인 URL을 사용하세요.

### 3단계: 시나리오 구성

1. 좌측 메뉴에서 **시나리오** 선택
2. **시나리오 만들기** 클릭
3. 블록 추가:
   - **폴백 블록** (Fallback Block): 모든 사용자 입력 처리
   - **스킬 연결**: 위에서 만든 "검색량 조회" 스킬 선택

### 4단계: 배포

1. 우측 상단 **배포** 버튼 클릭
2. 배포 완료 후 카카오톡에서 테스트

### 5단계: 실제 도메인 설정 (프로덕션)

실제 서비스를 위해서는 다음이 필요합니다:

1. **도메인 준비**: 예) `https://your-domain.com`
2. **SSL 인증서 설정** (HTTPS 필수)
3. **스킬 URL 업데이트**: `https://your-domain.com/api/kakao/webhook`
4. **서버 배포**: AWS, Azure, 또는 기타 클라우드 서비스

---

## 서버 실행 방법

### 개발 모드

로컬에서 개발하면서 테스트할 때 사용합니다:

```powershell
# 메인 서버와 크롤링 서버를 별도 터미널에서 실행
npm run dev               # 메인 서버 (터미널 1)
cd crawling-server
npm run dev               # 크롤링 서버 (터미널 2)
```

또는 한 번에 실행:

```powershell
# 개발 모드로 양쪽 서버 시작
npm run dev:both
```

### 프로덕션 모드 (일반 실행)

```powershell
# 프로덕션 모드로 양쪽 서버 시작
.\start-servers.ps1 -Mode prod
```

### 프로덕션 모드 (PM2)

PM2를 사용하면 서버 크래시 시 자동 재시작, 로그 관리 등의 기능을 사용할 수 있습니다:

```powershell
# PM2로 서버 시작
npm run pm2:start

# 서버 상태 확인
npm run pm2:list

# 로그 실시간 확인
npm run pm2:logs

# 서버 재시작
npm run pm2:restart

# 서버 중지
npm run pm2:stop
```

---

## PM2 자동 실행 설정

PC가 재부팅되어도 자동으로 서버가 시작되도록 Windows 서비스로 등록할 수 있습니다.

### 1단계: 관리자 권한으로 PowerShell 실행

1. Windows 검색에서 "PowerShell" 검색
2. 우클릭 > **관리자 권한으로 실행**
3. 프로젝트 디렉토리로 이동:
   ```powershell
   cd C:\Users\YourName\Documents\카카오톡\ 검색량\ 조회\ 챗봇
   ```

### 2단계: Windows 서비스 설치 스크립트 실행

```powershell
.\install-as-service.ps1
```

**스크립트가 수행하는 작업:**
1. PM2 설치 확인
2. 프로젝트 빌드 확인
3. 환경 변수 파일 확인
4. 기존 PM2 프로세스 정리
5. PM2 프로세스 등록
6. pm2-windows-service 설치
7. Windows 서비스 등록 및 자동 시작 설정

### 3단계: 서비스 등록 중 질문 응답

스크립트 실행 중 다음 질문이 나타납니다:

```
Service name: PM2
PM2 runtime: pm2
```

모두 기본값(Enter)으로 진행하세요.

### 4단계: 서비스 확인

```powershell
# 서비스 상태 확인
Get-Service PM2

# 서비스가 실행 중이어야 합니다 (Status: Running)
```

### 5단계: PC 재부팅 후 테스트

1. PC 재부팅
2. 부팅 완료 후 브라우저에서 `http://localhost:3000` 접속
3. 서버가 자동으로 실행되었는지 확인

### Windows 서비스 관리 명령어

```powershell
# 서비스 시작
Start-Service PM2

# 서비스 중지
Stop-Service PM2

# 서비스 재시작
Restart-Service PM2

# 서비스 상태 확인
Get-Service PM2

# 서비스 제거 (필요 시)
pm2-service-uninstall
```

---

## 문제 해결

### 설치 오류

**문제**: `npm install` 실패
- **해결**: Node.js를 재설치하고 관리자 권한으로 PowerShell을 실행하세요.

**문제**: PowerShell 스크립트 실행 불가
- **해결**:
  ```powershell
  Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
  ```

### 환경 변수 오류

**문제**: `.env.local` 파일을 찾을 수 없음
- **해결**: `.\setup-windows.ps1`을 다시 실행하거나 `.env.example`을 수동으로 복사하세요.

**문제**: 네이버 API 401 오류
- **해결**:
  1. API 키가 올바르게 입력되었는지 확인
  2. 네이버 검색광고 센터에서 API 키가 활성화되었는지 확인
  3. Customer ID가 숫자만 입력되었는지 확인

### 서버 실행 오류

**문제**: 포트 3000 또는 3001이 이미 사용 중
- **해결**:
  ```powershell
  # 포트 사용 중인 프로세스 확인
  Get-NetTCPConnection -LocalPort 3000
  Get-NetTCPConnection -LocalPort 3001

  # 프로세스 종료 (PID 확인 후)
  Stop-Process -Id <PID> -Force
  ```

**문제**: 크롤링 서버 로그인 실패
- **해결**:
  1. `crawling-server\.env` 파일의 네이버 계정 정보 확인
  2. 네이버에서 로그인 시도가 차단되지 않았는지 확인
  3. 네이버 보안 설정에서 비밀번호 변경 후 다시 시도

### PM2 오류

**문제**: PM2 프로세스가 자동으로 재시작되지 않음
- **해결**:
  ```powershell
  pm2 delete all
  pm2 start pm2.config.cjs
  pm2 save
  ```

**문제**: Windows 서비스가 시작되지 않음
- **해결**:
  1. 관리자 권한으로 PowerShell 실행
  2. `Start-Service PM2` 실행
  3. 로그 확인: `npm run pm2:logs`

### 카카오톡 연동 오류

**문제**: 카카오톡에서 응답이 없음
- **해결**:
  1. 서버가 실행 중인지 확인: `http://localhost:3000/api/kakao/webhook` 접속
  2. 로컬 테스트는 ngrok 등의 터널링 도구 사용
  3. 카카오 i 오픈빌더에서 스킬 URL 확인

더 자세한 문제 해결 방법은 [docs/TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md)를 참고하세요.

---

## 다음 단계

설치가 완료되었다면:

1. **테스트**: 카카오톡에서 챗봇에게 메시지를 보내 정상 작동 확인
2. **모니터링**: `npm run pm2:monit`로 서버 상태 모니터링
3. **로그 확인**: `logs/` 디렉토리의 로그 파일 주기적으로 확인
4. **배포**: 실제 서비스를 위한 클라우드 배포 고려

질문이나 문제가 있으면 프로젝트 이슈를 등록하거나 [TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md)를 참고하세요.

---

**축하합니다! 카카오톡 검색량 조회 챗봇 설치가 완료되었습니다!** 🎉
