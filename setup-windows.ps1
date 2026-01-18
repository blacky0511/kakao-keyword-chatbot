# 카카오톡 검색량 조회 챗봇 - 자동 설치 스크립트 (Windows)
# 이 스크립트는 프로젝트의 초기 설정을 자동으로 수행합니다.

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "카카오톡 검색량 조회 챗봇 설치 시작" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Node.js 버전 확인
Write-Host "[1/8] Node.js 버전 확인 중..." -ForegroundColor Yellow
$nodeVersion = node -v 2>$null
if (-not $nodeVersion) {
  Write-Host "❌ Node.js가 설치되어 있지 않습니다." -ForegroundColor Red
  Write-Host "Node.js 20 이상을 설치한 후 다시 실행해주세요." -ForegroundColor Red
  Write-Host "다운로드: https://nodejs.org/" -ForegroundColor Yellow
  exit 1
}

$versionNumber = $nodeVersion -replace 'v', ''
$majorVersion = [int]($versionNumber.Split('.')[0])
if ($majorVersion -lt 20) {
  Write-Host "❌ Node.js 버전이 너무 낮습니다. (현재: $nodeVersion)" -ForegroundColor Red
  Write-Host "Node.js 20 이상이 필요합니다." -ForegroundColor Red
  exit 1
}
Write-Host "✅ Node.js $nodeVersion 확인됨" -ForegroundColor Green
Write-Host ""

# 2. 메인 프로젝트 의존성 설치
Write-Host "[2/8] 메인 프로젝트 의존성 설치 중..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
  Write-Host "❌ 메인 프로젝트 의존성 설치 실패" -ForegroundColor Red
  exit 1
}
Write-Host "✅ 메인 프로젝트 의존성 설치 완료" -ForegroundColor Green
Write-Host ""

# 3. 크롤링 서버 의존성 설치
Write-Host "[3/8] 크롤링 서버 의존성 설치 중..." -ForegroundColor Yellow
Push-Location crawling-server
npm install
$crawlerInstallResult = $LASTEXITCODE
Pop-Location

if ($crawlerInstallResult -ne 0) {
  Write-Host "❌ 크롤링 서버 의존성 설치 실패" -ForegroundColor Red
  exit 1
}
Write-Host "✅ 크롤링 서버 의존성 설치 완료" -ForegroundColor Green
Write-Host ""

# 4. 환경 변수 파일 생성
Write-Host "[4/8] 환경 변수 파일 설정 중..." -ForegroundColor Yellow

# 메인 프로젝트 .env.local 파일 생성
if (-not (Test-Path ".env.local")) {
  Copy-Item ".env.example" ".env.local"
  Write-Host "✅ .env.local 파일 생성됨" -ForegroundColor Green
} else {
  Write-Host "ℹ️  .env.local 파일이 이미 존재합니다" -ForegroundColor Blue
}

# 크롤링 서버 .env 파일 생성
if (-not (Test-Path "crawling-server\.env")) {
  Copy-Item "crawling-server\.env.example" "crawling-server\.env"
  Write-Host "✅ crawling-server\.env 파일 생성됨" -ForegroundColor Green
} else {
  Write-Host "ℹ️  crawling-server\.env 파일이 이미 존재합니다" -ForegroundColor Blue
}
Write-Host ""

# 5. 환경 변수 입력 안내
Write-Host "[5/8] 환경 변수 설정 안내" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "다음 파일들을 직접 편집하여 환경 변수를 설정하세요:" -ForegroundColor White
Write-Host ""
Write-Host "1. .env.local (메인 서버)" -ForegroundColor Yellow
Write-Host "   - NAVER_AD_API_KEY: 네이버 검색광고 API 키" -ForegroundColor Gray
Write-Host "   - NAVER_AD_SECRET_KEY: 네이버 검색광고 시크릿 키" -ForegroundColor Gray
Write-Host "   - NAVER_AD_CUSTOMER_ID: 광고주 ID" -ForegroundColor Gray
Write-Host ""
Write-Host "2. crawling-server\.env (크롤링 서버)" -ForegroundColor Yellow
Write-Host "   - NAVER_ID: 네이버 계정" -ForegroundColor Gray
Write-Host "   - NAVER_PASSWORD: 네이버 비밀번호" -ForegroundColor Gray
Write-Host ""
Write-Host "자세한 발급 방법은 SETUP_GUIDE.md를 참고하세요." -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 6. PM2 설치 확인
Write-Host "[6/8] PM2 설치 확인 중..." -ForegroundColor Yellow
$pm2Version = pm2 -v 2>$null
if (-not $pm2Version) {
  Write-Host "ℹ️  PM2가 설치되어 있지 않습니다." -ForegroundColor Blue
  $installPM2 = Read-Host "PM2를 전역으로 설치하시겠습니까? (프로덕션 환경에서 서버 자동 관리에 필요) [Y/n]"
  if ($installPM2 -eq "" -or $installPM2 -eq "Y" -or $installPM2 -eq "y") {
    Write-Host "PM2 설치 중..." -ForegroundColor Yellow
    npm install -g pm2
    if ($LASTEXITCODE -eq 0) {
      Write-Host "✅ PM2 설치 완료" -ForegroundColor Green
    } else {
      Write-Host "⚠️  PM2 설치 실패 (나중에 수동으로 설치할 수 있습니다)" -ForegroundColor Yellow
    }
  } else {
    Write-Host "ℹ️  PM2 설치를 건너뜁니다" -ForegroundColor Blue
  }
} else {
  Write-Host "✅ PM2 $pm2Version 확인됨" -ForegroundColor Green
}
Write-Host ""

# 7. 로그 디렉토리 생성
Write-Host "[7/8] 로그 디렉토리 생성 중..." -ForegroundColor Yellow
if (-not (Test-Path "logs")) {
  New-Item -ItemType Directory -Path "logs" | Out-Null
  Write-Host "✅ logs 디렉토리 생성됨" -ForegroundColor Green
} else {
  Write-Host "ℹ️  logs 디렉토리가 이미 존재합니다" -ForegroundColor Blue
}
Write-Host ""

# 8. 빌드 수행
Write-Host "[8/8] 프로젝트 빌드 중..." -ForegroundColor Yellow
Write-Host "ℹ️  이 작업은 몇 분 정도 소요될 수 있습니다..." -ForegroundColor Blue
npm run build
if ($LASTEXITCODE -ne 0) {
  Write-Host "⚠️  빌드 실패 (환경 변수를 설정한 후 'npm run build'를 다시 실행하세요)" -ForegroundColor Yellow
} else {
  Write-Host "✅ 빌드 완료" -ForegroundColor Green
}
Write-Host ""

# 설치 완료
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ 설치가 완료되었습니다!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "다음 단계:" -ForegroundColor Yellow
Write-Host "1. .env.local 및 crawling-server\.env 파일에 환경 변수 입력" -ForegroundColor White
Write-Host "2. 개발 서버 실행: npm run dev:both" -ForegroundColor White
Write-Host "3. 프로덕션 서버 실행: npm run pm2:start" -ForegroundColor White
Write-Host ""
Write-Host "자세한 내용은 README.md 및 SETUP_GUIDE.md를 참고하세요." -ForegroundColor Gray
Write-Host ""
