import { NextRequest, NextResponse } from 'next/server'
import type { KakaoSkillPayload } from '@/lib/kakao/types'
import {
  createErrorResponse,
  createSearchVolumeResponse,
  createNotFoundResponse,
  createHelpResponse,
} from '@/lib/kakao/response'
import { getKeywordSearchVolume } from '@/lib/naver/keywordTool'

/**
 * 카카오톡 챗봇 스킬 웹훅 엔드포인트
 *
 * 사용자가 카카오톡 채널에 메시지를 보내면 이 엔드포인트가 호출됩니다.
 * 키워드를 받아서 네이버 검색량을 조회하고 결과를 반환합니다.
 */
export async function POST(request: NextRequest) {
  try {
    // 카카오에서 보낸 요청 데이터 파싱
    const payload: KakaoSkillPayload = await request.json()

    // 사용자가 입력한 메시지 (키워드)
    const utterance = payload.userRequest.utterance.trim()

    console.log(`[카카오 웹훅] 사용자 입력: "${utterance}"`)

    // 도움말 명령어 처리
    if (utterance === '도움말' || utterance === '사용법' || utterance === '?') {
      return NextResponse.json(createHelpResponse())
    }

    // 빈 입력 처리
    if (!utterance) {
      return NextResponse.json(
        createErrorResponse('키워드를 입력해 주세요.')
      )
    }

    // 키워드가 너무 긴 경우 처리
    if (utterance.length > 50) {
      return NextResponse.json(
        createErrorResponse('키워드가 너무 깁니다. 50자 이내로 입력해 주세요.')
      )
    }

    // 네이버 검색량 조회
    const result = await getKeywordSearchVolume(utterance)

    // 결과가 없는 경우
    if (!result) {
      return NextResponse.json(createNotFoundResponse(utterance))
    }

    // 검색량 결과 반환
    console.log(`[카카오 웹훅] 검색량 조회 성공: ${result.keyword} - ${result.totalVolume}건`)
    return NextResponse.json(createSearchVolumeResponse(result))
  } catch (error) {
    // 에러 로깅
    console.error('[카카오 웹훅] 오류 발생:', error)

    // 에러 메시지 생성
    const errorMessage =
      error instanceof Error
        ? error.message
        : '알 수 없는 오류가 발생했습니다.'

    return NextResponse.json(createErrorResponse(errorMessage))
  }
}

/**
 * GET 요청 처리 (헬스 체크용)
 * 스킬 URL이 제대로 동작하는지 확인할 때 사용합니다.
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: '카카오톡 검색량 조회 봇이 정상 작동 중입니다.',
    timestamp: new Date().toISOString(),
  })
}
