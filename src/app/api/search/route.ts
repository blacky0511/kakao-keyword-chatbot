import { NextRequest, NextResponse } from 'next/server'
import { getKeywordSearchVolume } from '@/lib/naver/keywordTool'

/**
 * 웹에서 키워드 검색량을 조회하는 API 엔드포인트
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const keyword = searchParams.get('keyword')

  if (!keyword || !keyword.trim()) {
    return NextResponse.json(
      { error: '키워드를 입력해 주세요.' },
      { status: 400 }
    )
  }

  if (keyword.length > 50) {
    return NextResponse.json(
      { error: '키워드가 너무 깁니다. 50자 이내로 입력해 주세요.' },
      { status: 400 }
    )
  }

  try {
    const result = await getKeywordSearchVolume(keyword.trim())

    if (!result) {
      return NextResponse.json(
        { error: `'${keyword.trim()}' 키워드의 검색량을 찾을 수 없습니다.` },
        { status: 404 }
      )
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('[검색량 조회 API] 오류 발생:', error)

    const errorMessage =
      error instanceof Error
        ? error.message
        : '알 수 없는 오류가 발생했습니다.'

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
