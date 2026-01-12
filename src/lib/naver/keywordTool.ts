import { createAuthHeaders } from './auth'

// 네이버 검색광고 API 기본 URL
const NAVER_AD_API_BASE_URL = 'https://api.searchad.naver.com'

// 키워드 검색량 조회 결과 타입
export interface KeywordResult {
  relKeyword: string // 키워드
  monthlyPcQcCnt: number | '<10' // 월간 PC 검색량 (10 미만이면 '<10' 문자열)
  monthlyMobileQcCnt: number | '<10' // 월간 모바일 검색량
  monthlyAvePcClkCnt: number // 월간 평균 PC 클릭수
  monthlyAveMobileClkCnt: number // 월간 평균 모바일 클릭수
  monthlyAvePcCtr: number // 월간 평균 PC 클릭률
  monthlyAveMobileCtr: number // 월간 평균 모바일 클릭률
  plAvgDepth: number // 월간 평균 노출 광고수
  compIdx: string // 경쟁 정도 (낮음/중간/높음)
}

// API 응답 타입
interface KeywordToolResponse {
  keywordList: KeywordResult[]
}

// 검색량 조회 결과를 가공한 타입
export interface SearchVolumeResult {
  keyword: string
  totalVolume: number
  pcVolume: number
  mobileVolume: number
  pcRatio: number
  mobileRatio: number
  competition: string
  period: {
    start: string
    end: string
  }
}

/**
 * 검색량 숫자를 파싱합니다 (10 미만은 0으로 처리)
 */
function parseVolume(value: number | '<10'): number {
  if (value === '<10') {
    return 0
  }
  return value
}

/**
 * 통계 기간을 계산합니다 (지난 30일)
 */
function getStatsPeriod(): { start: string; end: string } {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 30)

  const formatDate = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  return {
    start: formatDate(start),
    end: formatDate(end),
  }
}

/**
 * 네이버 검색광고 API를 통해 키워드 검색량을 조회합니다
 * @param keyword - 조회할 키워드
 * @returns 검색량 결과
 */
export async function getKeywordSearchVolume(keyword: string): Promise<SearchVolumeResult | null> {
  const uri = '/keywordstool'
  const method = 'GET'

  try {
    // 인증 헤더 생성
    const headers = createAuthHeaders(method, uri)

    // API 호출 (showDetail=1로 상세 정보 포함)
    const url = `${NAVER_AD_API_BASE_URL}${uri}?hintKeywords=${encodeURIComponent(keyword)}&showDetail=1`

    const response = await fetch(url, {
      method,
      headers,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('네이버 API 오류:', response.status, errorText)
      throw new Error(`네이버 API 호출 실패: ${response.status}`)
    }

    const data: KeywordToolResponse = await response.json()

    // 정확히 일치하는 키워드 찾기
    const exactMatch = data.keywordList.find(
      (item) => item.relKeyword.toLowerCase() === keyword.toLowerCase()
    )

    if (!exactMatch) {
      // 정확히 일치하는 키워드가 없으면 첫 번째 결과 사용
      if (data.keywordList.length === 0) {
        return null
      }
    }

    const result = exactMatch || data.keywordList[0]
    const pcVolume = parseVolume(result.monthlyPcQcCnt)
    const mobileVolume = parseVolume(result.monthlyMobileQcCnt)
    const totalVolume = pcVolume + mobileVolume

    // 비율 계산 (0으로 나누기 방지)
    const pcRatio = totalVolume > 0 ? (pcVolume / totalVolume) * 100 : 0
    const mobileRatio = totalVolume > 0 ? (mobileVolume / totalVolume) * 100 : 0

    return {
      keyword: result.relKeyword,
      totalVolume,
      pcVolume,
      mobileVolume,
      pcRatio: Math.round(pcRatio * 10) / 10, // 소수점 첫째 자리까지
      mobileRatio: Math.round(mobileRatio * 10) / 10,
      competition: result.compIdx,
      period: getStatsPeriod(),
    }
  } catch (error) {
    console.error('키워드 검색량 조회 오류:', error)
    throw error
  }
}
