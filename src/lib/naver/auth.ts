import crypto from 'crypto'

// 네이버 검색광고 API 인증에 필요한 헤더를 생성합니다
// HMAC-SHA256 방식으로 서명을 생성해야 합니다

/**
 * HMAC-SHA256 서명을 생성합니다
 * @param timestamp - 현재 시간 (밀리초)
 * @param method - HTTP 메서드 (GET, POST 등)
 * @param uri - API 경로 (예: /keywordstool)
 * @param secretKey - 네이버 API Secret Key
 * @returns Base64 인코딩된 서명
 */
export function generateSignature(
  timestamp: string,
  method: string,
  uri: string,
  secretKey: string
): string {
  // 서명 메시지 형식: timestamp.method.uri
  const message = `${timestamp}.${method}.${uri}`

  // HMAC-SHA256으로 서명 생성 후 Base64 인코딩
  const hmac = crypto.createHmac('sha256', secretKey)
  hmac.update(message)
  return hmac.digest('base64')
}

/**
 * 현재 시간을 밀리초 단위 문자열로 반환합니다
 */
export function getTimestamp(): string {
  return String(Date.now())
}

/**
 * 네이버 검색광고 API 호출에 필요한 인증 헤더를 생성합니다
 * @param method - HTTP 메서드
 * @param uri - API 경로
 * @returns 인증 헤더 객체
 */
export function createAuthHeaders(method: string, uri: string): Record<string, string> {
  const apiKey = process.env.NAVER_AD_API_KEY
  const secretKey = process.env.NAVER_AD_SECRET_KEY
  const customerId = process.env.NAVER_AD_CUSTOMER_ID

  // 환경 변수가 설정되어 있는지 확인
  if (!apiKey || !secretKey || !customerId) {
    throw new Error('네이버 API 환경 변수가 설정되지 않았습니다. .env.local 파일을 확인하세요.')
  }

  const timestamp = getTimestamp()
  const signature = generateSignature(timestamp, method, uri, secretKey)

  return {
    'X-Timestamp': timestamp,
    'X-API-KEY': apiKey,
    'X-Customer': customerId,
    'X-Signature': signature,
    'Content-Type': 'application/json',
  }
}
