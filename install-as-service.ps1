# 카카오톡 검색량 조회 챗봇 - Windows 서비스 등록 스크립트
# PM2를 Windows 서비스로 등록하여 PC 부팅 시 자동으로 서버가 시작되도록 설정합니다.

# 관리자 권한 확인
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
  Write-Host "========================================" -ForegroundColor Red
  Write-Host "❌ 관리자 권한이 필요합니다" -ForegroundColor Red
  Write-Host "========================================" -ForegroundColor Red
  Write-Host ""
  Write-Host "PowerShell을 관리자 권한으로 실행한 후 다시 시도하세요:" -ForegroundColor Yellow
  Write-Host "1. PowerShell을 우클릭" -ForegroundColor White
  Write-Host "2. '관리자 권한으로 실행' 선택" -ForegroundColor White
  Write-Host "3. 이 스크립트를 다시 실행" -ForegroundColor White
  Write-Host ""
  exit 1
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Windows 서비스 등록 시작" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. PM2 설치 확인
Write-Host "[1/7] PM2 설치 확인 중..." -ForegroundColor Yellow
$pm2Version = pm2 -v 2>$null
if (-not $pm2Version) {
  Write-Host "❌ PM2가 설치되어 있지 않습니다" -ForegroundColor Red
  Write-Host "먼저 PM2를 전역으로 설치하세요: npm install -g pm2" -ForegroundColor Yellow
  exit 1
}
Write-Host "✅ PM2 $pm2Version 확인됨" -ForegroundColor Green
Write-Host ""

# 2. 빌드 확인
Write-Host "[2/7] 프로젝트 빌드 확인 중..." -ForegroundColor Yellow
if (-not (Test-Path ".next")) {
  Write-Host "⚠️  빌드 파일이 없습니다. 빌드를 먼저 수행합니다..." -ForegroundColor Yellow
  npm run build
  if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 빌드 실패" -ForegroundColor Red
    exit 1
  }
}
Write-Host "✅ 빌드 파일 확인됨" -ForegroundColor Green
Write-Host ""

# 3. 환경 변수 파일 확인
Write-Host "[3/7] 환경 변수 파일 확인 중..." -ForegroundColor Yellow
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
  Write-Host "먼저 'npm run setup'을 실행하여 환경을 설정하세요." -ForegroundColor Yellow
  exit 1
}
Write-Host "✅ 환경 변수 파일 확인 완료" -ForegroundColor Green
Write-Host ""

# 4. 기존 PM2 프로세스 중지
Write-Host "[4/7] 기존 PM2 프로세스 정리 중..." -ForegroundColor Yellow
pm2 delete all 2>$null
pm2 kill 2>$null
Write-Host "✅ 기존 프로세스 정리 완료" -ForegroundColor Green
Write-Host ""

# 5. PM2 프로세스 등록
Write-Host "[5/7] PM2 프로세스 등록 중..." -ForegroundColor Yellow
pm2 start pm2.config.cjs
if ($LASTEXITCODE -ne 0) {
  Write-Host "❌ PM2 프로세스 등록 실패" -ForegroundColor Red
  exit 1
}

# 현재 상태 저장
pm2 save --force
if ($LASTEXITCODE -ne 0) {
  Write-Host "❌ PM2 상태 저장 실패" -ForegroundColor Red
  exit 1
}
Write-Host "✅ PM2 프로세스 등록 완료" -ForegroundColor Green
Write-Host ""

# 6. pm2-windows-service 설치 확인
Write-Host "[6/7] pm2-windows-service 확인 중..." -ForegroundColor Yellow
$pm2ServiceVersion = npm list -g pm2-windows-service 2>$null
if ($LASTEXITCODE -ne 0) {
  Write-Host "pm2-windows-service가 설치되어 있지 않습니다. 설치 중..." -ForegroundColor Yellow
  npm install -g pm2-windows-service
  if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ pm2-windows-service 설치 실패" -ForegroundColor Red
    exit 1
  }
}
Write-Host "✅ pm2-windows-service 확인됨" -ForegroundColor Green
Write-Host ""

# 7. Windows 서비스 등록
Write-Host "[7/7] Windows 서비스 등록 중..." -ForegroundColor Yellow
Write-Host ""
Write-Host "다음 질문에 대답하세요 (기본값 사용 권장):" -ForegroundColor Yellow
Write-Host "  - Service name: PM2" -ForegroundColor Gray
Write-Host "  - PM2 runtime: pm2" -ForegroundColor Gray
Write-Host ""

pm2-service-install -n PM2

if ($LASTEXITCODE -ne 0) {
  Write-Host "❌ Windows 서비스 등록 실패" -ForegroundColor Red
  exit 1
}

Write-Host ""
Write-Host "✅ Windows 서비스 등록 완료" -ForegroundColor Green
Write-Host ""

# 서비스 시작
Write-Host "서비스 시작 중..." -ForegroundColor Yellow
Start-Service PM2

# 서비스 상태 확인
$serviceStatus = Get-Service PM2 -ErrorAction SilentlyContinue
if ($serviceStatus -and $serviceStatus.Status -eq "Running") {
  Write-Host "✅ PM2 서비스가 실행 중입니다" -ForegroundColor Green
} else {
  Write-Host "⚠️  PM2 서비스 시작 실패 (수동으로 시작하세요: Start-Service PM2)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Windows 서비스 등록 완료!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "설정된 내용:" -ForegroundColor Yellow
Write-Host "  - 서비스 이름: PM2" -ForegroundColor White
Write-Host "  - 시작 유형: 자동" -ForegroundColor White
Write-Host "  - PC 부팅 시 자동 시작: 활성화" -ForegroundColor White
Write-Host ""
Write-Host "서비스 관리 명령어:" -ForegroundColor Yellow
Write-Host "  - 서비스 시작: Start-Service PM2" -ForegroundColor White
Write-Host "  - 서비스 중지: Stop-Service PM2" -ForegroundColor White
Write-Host "  - 서비스 재시작: Restart-Service PM2" -ForegroundColor White
Write-Host "  - 서비스 상태: Get-Service PM2" -ForegroundColor White
Write-Host ""
Write-Host "PM2 프로세스 관리:" -ForegroundColor Yellow
Write-Host "  - 프로세스 목록: npm run pm2:list" -ForegroundColor White
Write-Host "  - 로그 확인: npm run pm2:logs" -ForegroundColor White
Write-Host "  - 프로세스 재시작: npm run pm2:restart" -ForegroundColor White
Write-Host ""
Write-Host "💡 이제 PC를 재부팅하면 서버가 자동으로 시작됩니다!" -ForegroundColor Blue
Write-Host ""
