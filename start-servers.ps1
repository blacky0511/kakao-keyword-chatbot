# 카카오톡 검색량 조회 챗봇 - 서버 시작 스크립트 (Windows)
# 개발 또는 프로덕션 모드로 양쪽 서버(메인 + 크롤링)를 시작합니다.

param(
  [Parameter(Mandatory=$false)]
  [ValidateSet('dev', 'prod')]
  [string]$Mode = 'dev'
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "카카오톡 검색량 조회 챗봇 서버 시작" -ForegroundColor Cyan
Write-Host "모드: $Mode" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. 환경 변수 파일 존재 확인
Write-Host "[1/4] 환경 변수 파일 확인 중..." -ForegroundColor Yellow

$envFilesExist = $true
if (-not (Test-Path ".env.local")) {
  Write-Host "❌ .env.local 파일이 없습니다" -ForegroundColor Red
  $envFilesExist = $false
}

if (-not (Test-Path "crawling-server\.env")) {
  Write-Host "❌ crawling-server\.env 파일이 없습니다" -ForegroundColor Red
  $envFilesExist = $false
}

if (-not $envFilesExist) {
  Write-Host ""
  Write-Host "먼저 'npm run setup' 스크립트를 실행하여 환경을 설정하세요." -ForegroundColor Yellow
  exit 1
}

Write-Host "✅ 환경 변수 파일 확인 완료" -ForegroundColor Green
Write-Host ""

# 2. 포트 사용 확인 (선택적)
Write-Host "[2/4] 포트 사용 확인 중..." -ForegroundColor Yellow

$port3000 = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
$port3001 = Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue

if ($port3000) {
  Write-Host "⚠️  포트 3000이 이미 사용 중입니다" -ForegroundColor Yellow
}

if ($port3001) {
  Write-Host "⚠️  포트 3001이 이미 사용 중입니다" -ForegroundColor Yellow
}

if (-not $port3000 -and -not $port3001) {
  Write-Host "✅ 포트 3000, 3001 사용 가능" -ForegroundColor Green
}
Write-Host ""

# 3. 서버 시작
Write-Host "[3/4] 서버 시작 중..." -ForegroundColor Yellow
Write-Host ""

if ($Mode -eq 'dev') {
  # 개발 모드
  Write-Host "📝 개발 모드로 시작합니다" -ForegroundColor Blue
  Write-Host ""
  Write-Host "크롤링 서버는 별도 터미널에서 실행하세요:" -ForegroundColor Yellow
  Write-Host "  cd crawling-server" -ForegroundColor Gray
  Write-Host "  npm run dev" -ForegroundColor Gray
  Write-Host ""
  Write-Host "메인 서버를 시작합니다..." -ForegroundColor Yellow
  Write-Host ""

  # 메인 서버 개발 모드 실행
  npm run dev

} else {
  # 프로덕션 모드
  Write-Host "🚀 프로덕션 모드로 시작합니다" -ForegroundColor Blue
  Write-Host ""

  # 빌드 확인
  if (-not (Test-Path ".next")) {
    Write-Host "⚠️  빌드 파일이 없습니다. 빌드를 먼저 수행합니다..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -ne 0) {
      Write-Host "❌ 빌드 실패" -ForegroundColor Red
      exit 1
    }
  }

  Write-Host "크롤링 서버 시작 중..." -ForegroundColor Yellow
  Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\crawling-server'; npm run start"

  Start-Sleep -Seconds 2

  Write-Host "메인 서버 시작 중..." -ForegroundColor Yellow
  npm run start
}

# 4. 헬스 체크
Write-Host ""
Write-Host "[4/4] 서버 상태 확인" -ForegroundColor Yellow

Start-Sleep -Seconds 3

try {
  $mainServer = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 5 -ErrorAction SilentlyContinue
  if ($mainServer.StatusCode -eq 200 -or $mainServer.StatusCode -eq 404) {
    Write-Host "✅ 메인 서버 (포트 3000) 실행 중" -ForegroundColor Green
  }
} catch {
  Write-Host "⚠️  메인 서버 (포트 3000) 상태 확인 실패" -ForegroundColor Yellow
}

try {
  $crawlerServer = Invoke-WebRequest -Uri "http://localhost:3001" -UseBasicParsing -TimeoutSec 5 -ErrorAction SilentlyContinue
  if ($crawlerServer.StatusCode -eq 200 -or $crawlerServer.StatusCode -eq 404) {
    Write-Host "✅ 크롤링 서버 (포트 3001) 실행 중" -ForegroundColor Green
  }
} catch {
  Write-Host "⚠️  크롤링 서버 (포트 3001) 상태 확인 실패" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "서버 URL:" -ForegroundColor Yellow
Write-Host "  메인 서버: http://localhost:3000" -ForegroundColor White
Write-Host "  크롤링 서버: http://localhost:3001" -ForegroundColor White
Write-Host "  카카오톡 웹훅: http://localhost:3000/api/kakao/webhook" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($Mode -eq 'prod') {
  Write-Host "💡 프로덕션 서버를 PM2로 관리하려면 'npm run pm2:start'를 사용하세요" -ForegroundColor Blue
}

Write-Host ""
