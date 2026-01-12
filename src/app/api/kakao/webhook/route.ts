import { NextRequest, NextResponse } from 'next/server'
import type { KakaoSkillPayload } from '@/lib/kakao/types'
import {
  createErrorResponse,
  createNotFoundResponse,
  createMultipleSearchVolumeResponse,
  createRelatedKeywordsResponse,
  createPowerLinkResponse,
  createMarketingResponse,
  createModeSelectResponse,
  createResponseWithQuickReplies,
} from '@/lib/kakao/response'
import {
  getMultipleKeywordSearchVolume,
  getRelatedKeywords,
  getPowerLinkInfo,
} from '@/lib/naver/keywordTool'

// 사용자별 현재 모드 저장 (메모리 기반 - 서버 재시작 시 초기화됨)
const userModes: Map<string, string> = new Map()

/**
 * 카카오톡 챗봇 스킬 웹훅 엔드포인트
 */
export async function POST(request: NextRequest) {
  try {
    const payload: KakaoSkillPayload = await request.json()
    const utterance = payload.userRequest.utterance.trim()
    const userId = payload.userRequest.user.id

    console.log(`[카카오 웹훅] 사용자(${userId}) 입력: "${utterance}"`)

    // 빈 입력 처리
    if (!utterance) {
      return NextResponse.json(
        createResponseWithQuickReplies('조회할 키워드를 입력해 주세요.')
      )
    }

    // 메뉴 버튼 클릭 처리
    if (utterance === '검색량') {
      userModes.set(userId, '검색량')
      return NextResponse.json(createModeSelectResponse('검색량'))
    }

    if (utterance === '연관검색어') {
      userModes.set(userId, '연관검색어')
      return NextResponse.json(createModeSelectResponse('연관검색어'))
    }

    if (utterance === '파워링크') {
      userModes.set(userId, '파워링크')
      return NextResponse.json(createModeSelectResponse('파워링크'))
    }

    if (utterance === '마케팅문의') {
      return NextResponse.json(createMarketingResponse())
    }

    // 현재 모드 확인 (기본값: 검색량)
    const currentMode = userModes.get(userId) || '검색량'

    // 모드별 처리
    if (currentMode === '연관검색어') {
      // 연관검색어 조회
      const result = await getRelatedKeywords(utterance)
      if (!result) {
        return NextResponse.json(createNotFoundResponse(utterance))
      }
      return NextResponse.json(createRelatedKeywordsResponse(result))
    }

    if (currentMode === '파워링크') {
      // 파워링크 단가 조회
      const result = await getPowerLinkInfo(utterance)
      if (!result) {
        return NextResponse.json(createNotFoundResponse(utterance))
      }
      return NextResponse.json(createPowerLinkResponse(result))
    }

    // 기본 모드: 검색량 조회
    // 콤마로 구분된 여러 키워드 처리
    const keywords = utterance.split(',').map((k) => k.trim()).filter((k) => k.length > 0)

    if (keywords.length === 0) {
      return NextResponse.json(
        createResponseWithQuickReplies('조회할 키워드를 입력해 주세요.')
      )
    }

    // 최대 10개 제한
    if (keywords.length > 10) {
      return NextResponse.json(
        createResponseWithQuickReplies('키워드는 최대 10개까지 조회 가능합니다.')
      )
    }

    // 검색량 조회
    const results = await getMultipleKeywordSearchVolume(keywords)

    if (results.length === 0) {
      return NextResponse.json(createNotFoundResponse(utterance))
    }

    console.log(`[카카오 웹훅] 검색량 조회 성공: ${results.length}개 키워드`)
    return NextResponse.json(createMultipleSearchVolumeResponse(results))
  } catch (error) {
    console.error('[카카오 웹훅] 오류 발생:', error)

    const errorMessage =
      error instanceof Error
        ? error.message
        : '알 수 없는 오류가 발생했습니다.'

    return NextResponse.json(createErrorResponse(errorMessage))
  }
}

/**
 * GET 요청 처리 (헬스 체크용)
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: '카카오톡 검색량 조회 봇이 정상 작동 중입니다.',
    timestamp: new Date().toISOString(),
  })
}
