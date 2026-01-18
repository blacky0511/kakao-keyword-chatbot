# 트러블슈팅 가이드

이 문서는 카카오톡 검색량 조회 챗봇 운영 중 발생할 수 있는 문제와 해결 방법을 정리한 가이드입니다.

## 목차

1. [네이버 API 오류](#네이버-api-오류)
2. [크롤링 서버 오류](#크롤링-서버-오류)
3. [PM2 프로세스 오류](#pm2-프로세스-오류)
4. [환경 변수 오류](#환경-변수-오류)
5. [카카오톡 웹훅 오류](#카카오톡-웹훅-오류)
6. [포트 충돌](#포트-충돌)
7. [빌드 오류](#빌드-오류)
8. [Windows 서비스 오류](#windows-서비스-오류)

---

## 네이버 API 오류

### 401 Unauthorized

**증상**: 네이버 API 호출 시 401 오류 발생

**원인**:
- API 키 또는 시크릿 키가 잘못됨
- 환경 변수가 올바르게 설정되지 않음

**해결 방법**:

1. `.env.local` 파일 확인:
   ```powershell
   Get-Content .env.local
   ```

2. API 키 검증:
   - 네이버 검색광고 센터 접속
   - 도구 > API 사용관리에서 키 확인
   - 키가 만료되지 않았는지 확인

3. 환경 변수 재설정:
   ```bash
   # .env.local 파일 수정
   NAVER_AD_API_KEY=<올바른 API 키>
   NAVER_AD_SECRET_KEY=<올바른 시크릿 키>
   NAVER_AD_CUSTOMER_ID=<올바른 Customer ID>
   ```

4. 서버 재시작:
   ```powershell
   npm run pm2:restart
   ```

### 403 Forbidden

**증상**: 네이버 API 호출 시 403 오류 발생

**원인**:
- API 사용 권한이 없음
- Customer ID가 잘못됨

**해결 방법**:

1. Customer ID 확인:
   - 네이버 검색광고 센터 우측 상단에서 확인
   - 숫자만 입력되어야 함 (공백, 하이픈 제거)

2. API 권한 확인:
   - 네이버 검색광고 센터 > 도구 > API 사용관리
   - API 사용이 활성화되어 있는지 확인

### 429 Too Many Requests

**증상**: 네이버 API 호출 시 429 오류 발생

**원인**:
- API 호출 횟수 제한 초과 (일일 또는 시간당 한도)

**해결 방법**:

1. API 할당량 확인:
   - 네이버 검색광고 센터 > 도구 > API 사용관리
   - 현재 사용량 및 한도 확인

2. 호출 빈도 조절:
   - 캐싱 구현 고려
   - 불필요한 API 호출 제거

3. 네이버에 한도 증가 요청:
   - 고객센터를 통해 API 할당량 증가 요청

### 500 Internal Server Error

**증상**: 네이버 API 호출 시 500 오류 발생

**원인**:
- 네이버 서버 오류 (일시적)
- API 요청 형식이 잘못됨

**해결 방법**:

1. 잠시 후 재시도

2. 로그 확인:
   ```powershell
   npm run pm2:logs
   ```

3. 요청 형식 확인:
   - `src/lib/naver/keywordTool.ts` 파일 확인
   - 네이버 API 문서와 비교

---

## 크롤링 서버 오류

### 네이버 로그인 실패

**증상**: 크롤링 서버가 네이버에 로그인하지 못함

**원인**:
- 네이버 계정 정보가 잘못됨
- 네이버 보안 정책에 의한 차단
- Puppeteer 설정 오류

**해결 방법**:

1. 계정 정보 확인:
   ```powershell
   Get-Content crawling-server\.env
   ```

2. 네이버 계정 상태 확인:
   - 브라우저에서 수동 로그인 시도
   - 보안 인증이 필요한지 확인

3. 크롤링 서버 로그 확인:
   ```powershell
   Get-Content logs\crawler-error.log
   ```

4. 네이버 보안 설정:
   - 네이버 계정 > 보안설정
   - 2단계 인증 해제 (크롤링 계정)
   - 로그인 알림 확인

5. Puppeteer Headless 모드 변경:
   - `crawling-server/src/crawler.js` 수정
   - `headless: false`로 변경하여 브라우저 동작 확인

### 크롤링 타임아웃

**증상**: 크롤링 작업이 완료되지 않고 타임아웃 발생

**원인**:
- 네트워크 속도 느림
- 네이버 페이지 로딩 지연
- 선택자(selector) 변경

**해결 방법**:

1. 타임아웃 시간 증가:
   - `crawling-server/src/crawler.js` 수정
   - `waitForSelector` 타임아웃 증가

2. 네이버 페이지 확인:
   - 수동으로 검색광고 페이지 접속
   - 페이지 구조 변경 여부 확인

3. 선택자 업데이트:
   - 크롬 개발자 도구로 현재 선택자 확인
   - `crawler.js`의 선택자 업데이트

### Puppeteer 메모리 부족

**증상**: 크롤링 서버가 메모리 부족으로 종료됨

**원인**:
- Chromium 프로세스가 메모리를 과도하게 사용
- 브라우저 인스턴스가 제대로 종료되지 않음

**해결 방법**:

1. PM2 메모리 제한 조정:
   - `pm2.config.cjs` 파일 수정:
     ```javascript
     max_memory_restart: '2G'  // 1G에서 2G로 증가
     ```

2. 브라우저 인스턴스 관리:
   - 크롤링 완료 후 `browser.close()` 확인
   - 사용하지 않는 페이지 닫기

3. PM2 재시작:
   ```powershell
   pm2 delete all
   pm2 start pm2.config.cjs
   pm2 save
   ```

---

## PM2 프로세스 오류

### PM2 프로세스가 자동으로 재시작되지 않음

**증상**: 서버 크래시 후 PM2가 프로세스를 재시작하지 않음

**원인**:
- 최대 재시작 횟수 초과 (`max_restarts: 10`)
- PM2 데몬이 실행되지 않음

**해결 방법**:

1. PM2 프로세스 상태 확인:
   ```powershell
   npm run pm2:list
   ```

2. 재시작 횟수 초과 확인:
   - `Restart` 컬럼에서 10 이상인지 확인
   - 근본 원인 해결 후 프로세스 재시작:
     ```powershell
     pm2 delete all
     pm2 start pm2.config.cjs
     ```

3. PM2 데몬 재시작:
   ```powershell
   pm2 kill
   pm2 start pm2.config.cjs
   pm2 save
   ```

### PM2 로그가 기록되지 않음

**증상**: `logs/` 디렉토리에 로그 파일이 생성되지 않음

**원인**:
- `logs/` 디렉토리가 없음
- PM2 설정 파일의 로그 경로가 잘못됨

**해결 방법**:

1. 로그 디렉토리 생성:
   ```powershell
   mkdir logs
   ```

2. PM2 재시작:
   ```powershell
   pm2 delete all
   pm2 start pm2.config.cjs
   pm2 save
   ```

3. 로그 파일 확인:
   ```powershell
   ls logs\
   ```

### PM2 프로세스가 중복 실행됨

**증상**: 같은 프로세스가 여러 번 실행됨

**원인**:
- `pm2 start`를 여러 번 실행함
- PM2 상태가 올바르게 저장되지 않음

**해결 방법**:

1. 모든 프로세스 중지 및 삭제:
   ```powershell
   pm2 delete all
   ```

2. PM2 재시작:
   ```powershell
   pm2 start pm2.config.cjs
   pm2 save
   ```

3. 프로세스 목록 확인:
   ```powershell
   npm run pm2:list
   ```

---

## 환경 변수 오류

### 환경 변수가 인식되지 않음

**증상**: 서버가 환경 변수를 읽지 못함

**원인**:
- `.env.local` 또는 `crawling-server/.env` 파일이 없음
- 파일 이름이 잘못됨 (예: `.env` 대신 `.env.local.txt`)
- 환경 변수 로딩 코드 오류

**해결 방법**:

1. 파일 존재 확인:
   ```powershell
   Test-Path .env.local
   Test-Path crawling-server\.env
   ```

2. 파일 이름 확인:
   - `.env.local` (숨김 파일, 확장자 없음)
   - Windows 탐색기에서 "파일 확장명" 표시 활성화

3. 파일 내용 확인:
   ```powershell
   Get-Content .env.local
   Get-Content crawling-server\.env
   ```

4. 서버 재시작:
   ```powershell
   npm run pm2:restart
   ```

### .env 파일이 Git에 커밋됨

**증상**: `.env.local` 파일이 Git에 추적됨

**원인**:
- `.gitignore`에 `.env*` 패턴이 없음
- 파일을 이미 Git에 추가함

**해결 방법**:

1. Git 캐시에서 제거:
   ```powershell
   git rm --cached .env.local
   git rm --cached crawling-server\.env
   ```

2. `.gitignore` 확인:
   ```
   .env*
   ```

3. 커밋 및 푸시:
   ```powershell
   git add .gitignore
   git commit -m "Remove .env files from Git"
   git push
   ```

---

## 카카오톡 웹훅 오류

### 카카오톡에서 응답이 없음

**증상**: 카카오톡 챗봇에 메시지를 보내도 응답이 없음

**원인**:
- 서버가 실행되지 않음
- 웹훅 URL이 잘못됨
- 로컬 환경에서 외부 접근 불가

**해결 방법**:

1. 서버 상태 확인:
   ```powershell
   npm run pm2:list
   ```

2. 웹훅 엔드포인트 테스트:
   ```powershell
   Invoke-WebRequest -Uri "http://localhost:3000/api/kakao/webhook" -Method GET
   ```

3. 카카오 i 오픈빌더 설정 확인:
   - 스킬 > 서버 URL이 올바른지 확인
   - 로컬 테스트: ngrok 등 터널링 도구 사용

4. 로그 확인:
   ```powershell
   npm run pm2:logs
   ```

### 카카오톡 응답 형식 오류

**증상**: 카카오톡에서 "오류가 발생했습니다" 메시지 표시

**원인**:
- 응답 JSON 형식이 카카오 API 스펙과 맞지 않음
- 서버 에러로 인한 500 응답

**해결 방법**:

1. 로그에서 에러 확인:
   ```powershell
   Get-Content logs\main-error.log
   ```

2. 응답 형식 검증:
   - `src/lib/kakao/response.ts` 파일 확인
   - 카카오 i 오픈빌더 문서와 비교

3. 테스트 요청 보내기:
   ```powershell
   $body = '{"userRequest": {"utterance": "검색량"}}'
   Invoke-WebRequest -Uri "http://localhost:3000/api/kakao/webhook" -Method POST -Body $body -ContentType "application/json"
   ```

---

## 포트 충돌

### 포트 3000이 이미 사용 중

**증상**: 메인 서버 시작 시 "Port 3000 is already in use" 오류

**해결 방법**:

1. 포트 사용 프로세스 확인:
   ```powershell
   Get-NetTCPConnection -LocalPort 3000 | Select-Object -Property OwningProcess
   ```

2. 프로세스 종료:
   ```powershell
   # PID 확인 후
   Stop-Process -Id <PID> -Force
   ```

3. 또는 포트 변경:
   - `pm2.config.cjs` 수정:
     ```javascript
     env: {
       PORT: 3002  // 3000에서 3002로 변경
     }
     ```

### 포트 3001이 이미 사용 중

**증상**: 크롤링 서버 시작 시 "Port 3001 is already in use" 오류

**해결 방법**:

1. 포트 사용 프로세스 확인:
   ```powershell
   Get-NetTCPConnection -LocalPort 3001 | Select-Object -Property OwningProcess
   ```

2. 프로세스 종료:
   ```powershell
   Stop-Process -Id <PID> -Force
   ```

3. 또는 포트 변경:
   - `crawling-server/.env` 수정:
     ```bash
     PORT=3002
     ```
   - `pm2.config.cjs` 수정:
     ```javascript
     env: {
       PORT: 3002
     }
     ```
   - `.env.local` 수정:
     ```bash
     CRAWLING_SERVER_URL=http://localhost:3002
     ```

---

## 빌드 오류

### Next.js 빌드 실패

**증상**: `npm run build` 실행 시 오류 발생

**원인**:
- TypeScript 타입 오류
- 환경 변수 누락
- 의존성 설치 오류

**해결 방법**:

1. 타입 오류 확인:
   ```powershell
   npm run lint
   ```

2. 환경 변수 확인:
   - `.env.local` 파일이 존재하고 모든 변수가 설정되어 있는지 확인

3. 의존성 재설치:
   ```powershell
   rm -r node_modules
   rm package-lock.json
   npm install
   npm run build
   ```

### 빌드 후에도 변경사항이 반영되지 않음

**증상**: 코드 수정 후 빌드했지만 변경사항이 적용되지 않음

**해결 방법**:

1. `.next` 디렉토리 삭제:
   ```powershell
   rm -r .next
   npm run build
   ```

2. PM2 프로세스 재시작:
   ```powershell
   npm run pm2:restart
   ```

3. 브라우저 캐시 삭제:
   - Ctrl + Shift + R (하드 리로드)

---

## Windows 서비스 오류

### PM2 서비스가 시작되지 않음

**증상**: Windows 서비스 관리자에서 PM2 서비스가 시작되지 않음

**원인**:
- PM2 경로 오류
- 권한 문제
- 서비스 설정 오류

**해결 방법**:

1. 서비스 상태 확인:
   ```powershell
   Get-Service PM2
   ```

2. 이벤트 로그 확인:
   ```powershell
   Get-EventLog -LogName System -Source "Service Control Manager" -Newest 10
   ```

3. 서비스 재설치:
   ```powershell
   # 관리자 권한 PowerShell
   pm2-service-uninstall
   pm2-service-install
   ```

4. PM2 재설정:
   ```powershell
   pm2 kill
   pm2 start pm2.config.cjs
   pm2 save
   Start-Service PM2
   ```

### PC 재부팅 후 서버가 자동 시작되지 않음

**증상**: PC 재부팅 후 서버가 실행되지 않음

**원인**:
- Windows 서비스가 등록되지 않음
- 서비스 시작 유형이 "수동"으로 설정됨
- PM2 상태가 저장되지 않음

**해결 방법**:

1. 서비스 시작 유형 확인:
   ```powershell
   Get-Service PM2 | Select-Object -Property StartType
   ```

2. 자동 시작으로 변경:
   ```powershell
   Set-Service PM2 -StartupType Automatic
   ```

3. PM2 상태 저장:
   ```powershell
   pm2 save
   ```

4. PC 재부팅 후 테스트

---

## 추가 도움말

### 로그 확인 방법

**PM2 로그 실시간 확인**:
```powershell
npm run pm2:logs
```

**특정 로그 파일 확인**:
```powershell
Get-Content logs\main-error.log -Tail 50
Get-Content logs\crawler-error.log -Tail 50
```

**Windows 이벤트 로그**:
```powershell
Get-EventLog -LogName Application -Newest 20
```

### 완전 초기화

모든 설정을 초기 상태로 되돌리기:

```powershell
# PM2 프로세스 모두 삭제
pm2 delete all
pm2 kill

# Windows 서비스 제거
pm2-service-uninstall

# 빌드 파일 삭제
rm -r .next
rm -r node_modules
rm -r crawling-server\node_modules

# 재설치
.\setup-windows.ps1
```

### 문의하기

위의 해결 방법으로 문제가 해결되지 않는다면:

1. GitHub 이슈에 다음 정보와 함께 등록:
   - 오류 메시지
   - 로그 파일 내용
   - 환경 정보 (Node.js 버전, Windows 버전 등)
   - 재현 방법

2. 로그 수집 명령어:
   ```powershell
   # 시스템 정보
   node -v
   npm -v
   pm2 -v

   # PM2 상태
   npm run pm2:list

   # 최근 로그
   Get-Content logs\main-error.log -Tail 100
   Get-Content logs\crawler-error.log -Tail 100
   ```

---

**도움이 필요하신가요?** 프로젝트 GitHub 이슈 또는 [SETUP_GUIDE.md](../SETUP_GUIDE.md)를 참고하세요.
