import type { KakaoSkillResponse, KakaoQuickReply } from './types'
import type { SearchVolumeResult, RelatedKeywordResult, PowerLinkResult } from '../naver/keywordTool'

// 마케팅 문의 URL
const MARKETING_URL = 'https://andgivemarketing.com/'

/**
 * 간단한 텍스트 응답을 생성합니다
 * @param text - 응답할 텍스트
 * @returns 카카오 스킬 응답 객체
 */
export function createSimpleTextResponse(text: string): KakaoSkillResponse {
  return {
    version: '2.0',
    template: {
      outputs: [
        {
          simpleText: {
            text,
          },
        },
      ],
    },
  }
}

/**
 * 에러 응답을 생성합니다
 * @param message - 에러 메시지
 * @returns 카카오 스킬 응답 객체
 */
export function createErrorResponse(message: string): KakaoSkillResponse {
  return createSimpleTextResponse(`오류가 발생했습니다.\n${message}`)
}

/**
 * 숫자에 천 단위 콤마를 추가합니다
 */
function formatNumber(num: number): string {
  return num.toLocaleString('ko-KR')
}

/**
 * 검색량 결과를 카카오톡 메시지 형식으로 포맷합니다
 * 사용자가 보낸 사진 예시와 동일한 형식으로 생성합니다
 */
export function formatSearchVolumeMessage(result: SearchVolumeResult): string {
  const lines = [
    '네이버 검색량 조회',
    '',
    `🔍 [${result.keyword}]`,
    '',
    `PC: ${formatNumber(result.pcVolume)}`,
    `모바일: ${formatNumber(result.mobileVolume)}`,
    `총 검색량: ${formatNumber(result.totalVolume)}`,
    '',
    '통계기간: 최근 30일',
  ]

  return lines.join('\n')
}

/**
 * 검색량 결과로 카카오 응답을 생성합니다
 */
export function createSearchVolumeResponse(result: SearchVolumeResult): KakaoSkillResponse {
  const message = formatSearchVolumeMessage(result)
  return createSimpleTextResponse(message)
}

/**
 * 키워드를 찾을 수 없을 때 응답을 생성합니다
 */
export function createNotFoundResponse(keyword: string): KakaoSkillResponse {
  return createSimpleTextResponse(
    `'${keyword}' 키워드의 검색량을 찾을 수 없습니다.\n다른 키워드로 시도해 주세요.`
  )
}

/**
 * 도움말 응답을 생성합니다
 */
export function createHelpResponse(): KakaoSkillResponse {
  return createSimpleTextResponse(
    '검색량 조회 봇 사용법\n\n' +
      '조회하고 싶은 키워드를 입력해 주세요.\n\n' +
      '예시: 아산피부관리\n\n' +
      '네이버 월간 검색량(PC/모바일)을 알려드립니다.'
  )
}

/**
 * 여러 키워드의 검색량 결과를 포맷합니다
 */
export function formatMultipleSearchVolumeMessage(results: SearchVolumeResult[]): string {
  const lines = ['네이버 검색량 조회', '']

  for (const result of results) {
    lines.push(`🔍 [${result.keyword}]`)
    lines.push(`총 검색량: ${formatNumber(result.totalVolume)}건`)
    lines.push(`PC: ${formatNumber(result.pcVolume)} (${result.pcRatio}%)`)
    lines.push(`MOBILE: ${formatNumber(result.mobileVolume)} (${result.mobileRatio}%)`)
    lines.push('')
  }

  lines.push('─────────────────')
  lines.push('통계기간: 최근 30일')

  return lines.join('\n')
}

/**
 * 여러 키워드 검색량 결과 응답 생성
 */
export function createMultipleSearchVolumeResponse(results: SearchVolumeResult[]): KakaoSkillResponse {
  const message = formatMultipleSearchVolumeMessage(results)
  return createResponseWithQuickReplies(message)
}

/**
 * 연관 검색어 결과를 포맷합니다
 */
export function formatRelatedKeywordsMessage(result: RelatedKeywordResult): string {
  const lines = [
    '연관검색어 조회',
    '',
    `🔗 [${result.keyword}]`,
    '',
  ]

  if (result.relatedKeywords.length === 0) {
    lines.push('연관 검색어가 없습니다.')
  } else {
    result.relatedKeywords.forEach((kw, index) => {
      lines.push(`${index + 1}. ${kw}`)
    })
  }

  return lines.join('\n')
}

/**
 * 연관 검색어 결과 응답 생성
 */
export function createRelatedKeywordsResponse(result: RelatedKeywordResult): KakaoSkillResponse {
  const message = formatRelatedKeywordsMessage(result)
  return createResponseWithQuickReplies(message)
}

/**
 * 파워링크 단가 결과를 포맷합니다
 */
export function formatPowerLinkMessage(result: PowerLinkResult): string {
  const lines = [
    '파워링크 단가 조회',
    '',
    `💰 [${result.keyword}]`,
    '',
    `경쟁정도: ${result.competition}`,
    `평균 노출 광고수: ${result.plAvgDepth}개`,
    `예상 클릭단가: 약 ${formatNumber(result.avgBid)}원`,
    '',
    '※ 실제 단가는 입찰 상황에 따라 달라질 수 있습니다.',
  ]

  return lines.join('\n')
}

/**
 * 파워링크 단가 결과 응답 생성
 */
export function createPowerLinkResponse(result: PowerLinkResult): KakaoSkillResponse {
  const message = formatPowerLinkMessage(result)
  return createResponseWithQuickReplies(message)
}

/**
 * 메뉴 버튼(QuickReplies)을 포함한 응답을 생성합니다
 */
export function createResponseWithQuickReplies(text: string): KakaoSkillResponse {
  const quickReplies: KakaoQuickReply[] = [
    {
      label: '검색량 조회',
      action: 'message',
      messageText: '검색량',
    },
    {
      label: '연관검색어',
      action: 'message',
      messageText: '연관검색어',
    },
    {
      label: '파워링크 단가',
      action: 'message',
      messageText: '파워링크',
    },
    {
      label: '마케팅 문의',
      action: 'message',
      messageText: '마케팅문의',
    },
  ]

  return {
    version: '2.0',
    template: {
      outputs: [
        {
          simpleText: {
            text,
          },
        },
      ],
      quickReplies,
    },
  }
}

/**
 * 마케팅 문의 응답 생성 (링크 포함)
 */
export function createMarketingResponse(): KakaoSkillResponse {
  const message = `📞 마케팅 문의\n\n아래 링크를 클릭하여 문의해주세요!\n\n${MARKETING_URL}`
  return createResponseWithQuickReplies(message)
}

/**
 * 모드 선택 안내 메시지 생성
 */
export function createModeSelectResponse(mode: string): KakaoSkillResponse {
  let message = ''

  if (mode === '검색량') {
    message = '🔍 검색량 조회 모드\n\n조회할 키워드를 입력해주세요.\n\n예시: 아산피부관리\n여러 개: 아산피부관리, 동탄피부관리'
  } else if (mode === '연관검색어') {
    message = '🔗 연관검색어 조회 모드\n\n조회할 키워드를 입력해주세요.\n\n예시: 피부관리'
  } else if (mode === '파워링크') {
    message = '💰 파워링크 단가 조회 모드\n\n조회할 키워드를 입력해주세요.\n\n예시: 아산피부관리'
  }

  return createResponseWithQuickReplies(message)
}
