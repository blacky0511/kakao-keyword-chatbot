'use client'

import { useState } from 'react'
import type { SearchVolumeResult } from '@/lib/naver/keywordTool'

export default function Home() {
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SearchVolumeResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async () => {
    if (!keyword.trim()) {
      setError('키워드를 입력해 주세요.')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch(
        `/api/search?keyword=${encodeURIComponent(keyword.trim())}`
      )

      if (!response.ok) {
        const errorData = await response.json()
        setError(errorData.error || '검색량 조회에 실패했습니다.')
        return
      }

      const searchResult: SearchVolumeResult = await response.json()
      setResult(searchResult)
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const formatNumber = (num: number): string => {
    return num.toLocaleString('ko-KR')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-2xl flex-col gap-8 px-6 py-12 sm:px-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-black dark:text-zinc-50 mb-2">
            카카오톡 검색량 조회 챗봇
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            네이버 키워드 검색량을 조회할 수 있습니다
          </p>
        </div>

        <div className="flex flex-col gap-4 bg-white dark:bg-zinc-900 p-6 rounded-lg shadow-sm">
          <div className="flex gap-2">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="키워드를 입력하세요 (예: 아산피부관리)"
              className="flex-1 px-4 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg 
                       bg-white dark:bg-zinc-800 text-black dark:text-zinc-50
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <button
              onClick={handleSearch}
              disabled={loading || !keyword.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium
                       hover:bg-blue-700 disabled:bg-zinc-400 disabled:cursor-not-allowed
                       transition-colors"
            >
              {loading ? '조회 중...' : '조회'}
            </button>
          </div>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {result && (
            <div className="p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <h2 className="text-xl font-bold text-black dark:text-zinc-50 mb-4">
                검색량 조회 결과
              </h2>
              <div className="space-y-3 text-black dark:text-zinc-50">
                <div>
                  <span className="font-semibold">키워드:</span>{' '}
                  <span className="text-blue-600 dark:text-blue-400 font-bold">
                    [{result.keyword}]
                  </span>
                </div>
                <div>
                  <span className="font-semibold">총 검색량:</span>{' '}
                  <span className="text-lg">{formatNumber(result.totalVolume)}건</span>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <span className="font-semibold">PC:</span>{' '}
                    {formatNumber(result.pcVolume)} ({result.pcRatio}%)
                  </div>
                  <div>
                    <span className="font-semibold">MOBILE:</span>{' '}
                    {formatNumber(result.mobileVolume)} ({result.mobileRatio}%)
                  </div>
                </div>
                <div className="pt-3 border-t border-blue-300 dark:border-blue-700">
                  <span className="font-semibold">통계 기간:</span>{' '}
                  {result.period.start} ~ {result.period.end}
                </div>
                {result.competition && (
                  <div>
                    <span className="font-semibold">경쟁도:</span> {result.competition}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          <p>카카오톡 챗봇 API 엔드포인트: /api/kakao/webhook</p>
          <p className="mt-1">
            GET 요청으로 헬스 체크 가능 | POST 요청으로 키워드 조회 가능
          </p>
        </div>
      </main>
    </div>
  )
}
