import type { KakaoSkillResponse } from './types'
import type { SearchVolumeResult } from '../naver/keywordTool'

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
    '키워드 검색량 조회',
    '',
    `[${result.keyword}]`,
    `총 검색량: ${formatNumber(result.totalVolume)}건`,
    `PC: ${formatNumber(result.pcVolume)} (${result.pcRatio}%)`,
    `MOBILE: ${formatNumber(result.mobileVolume)} (${result.mobileRatio}%)`,
    '',
    `통계 기간: ${result.period.start} ~ ${result.period.end}`,
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
