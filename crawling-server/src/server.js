/**
 * 크롤링 API 서버
 * 카카오 챗봇에서 호출하여 순위별 입찰가를 조회합니다
 */

require('dotenv').config()
const express = require('express')
const cors = require('cors')
const NaverAdCrawler = require('./crawler')

const app = express()
const PORT = process.env.PORT || 3001

// 미들웨어
app.use(cors())
app.use(express.json())

// 크롤러 인스턴스
let crawler = null
let isInitializing = false

/**
 * 크롤러 초기화
 */
async function initCrawler() {
  if (crawler && crawler.isLoggedIn) {
    return crawler
  }

  if (isInitializing) {
    // 이미 초기화 중이면 대기
    while (isInitializing) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
    return crawler
  }

  isInitializing = true

  try {
    crawler = new NaverAdCrawler()
    await crawler.init()

    // 환경 변수에서 로그인 정보 가져오기
    const naverId = process.env.NAVER_ID
    const naverPassword = process.env.NAVER_PASSWORD

    if (!naverId || !naverPassword) {
      console.error('[서버] NAVER_ID와 NAVER_PASSWORD 환경 변수를 설정해주세요')
      throw new Error('로그인 정보가 없습니다')
    }

    // 로그인 시도
    const loginSuccess = await crawler.login(naverId, naverPassword)

    if (!loginSuccess) {
      throw new Error('로그인 실패')
    }

    console.log('[서버] 크롤러 초기화 완료')
    return crawler
  } catch (error) {
    console.error('[서버] 크롤러 초기화 실패:', error.message)
    crawler = null
    throw error
  } finally {
    isInitializing = false
  }
}

/**
 * 헬스 체크 엔드포인트
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    crawlerReady: crawler?.isLoggedIn || false,
    timestamp: new Date().toISOString(),
  })
})

/**
 * 크롤러 초기화 엔드포인트
 */
app.post('/init', async (req, res) => {
  try {
    await initCrawler()
    res.json({
      success: true,
      message: '크롤러 초기화 완료',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
})

/**
 * 키워드 입찰가 조회 엔드포인트
 */
app.get('/bid-price/:keyword', async (req, res) => {
  const { keyword } = req.params

  if (!keyword) {
    return res.status(400).json({
      success: false,
      error: '키워드를 입력해주세요',
    })
  }

  try {
    // 크롤러가 준비되지 않았으면 초기화
    if (!crawler?.isLoggedIn) {
      await initCrawler()
    }

    // 입찰가 조회
    const result = await crawler.getKeywordBidPrice(decodeURIComponent(keyword))

    if (result) {
      res.json({
        success: true,
        data: result,
      })
    } else {
      res.status(404).json({
        success: false,
        error: '키워드 정보를 찾을 수 없습니다',
      })
    }
  } catch (error) {
    console.error('[서버] 입찰가 조회 오류:', error.message)
    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
})

/**
 * 크롤러 상태 확인 엔드포인트
 */
app.get('/status', (req, res) => {
  res.json({
    crawlerInitialized: !!crawler,
    isLoggedIn: crawler?.isLoggedIn || false,
    isInitializing,
  })
})

/**
 * 서버 시작
 */
app.listen(PORT, () => {
  console.log(`[서버] 크롤링 서버가 포트 ${PORT}에서 실행 중입니다`)
  console.log(`[서버] 헬스 체크: http://localhost:${PORT}/health`)
  console.log(`[서버] 입찰가 조회: http://localhost:${PORT}/bid-price/{키워드}`)
  console.log('')
  console.log('[서버] 크롤러를 초기화하려면:')
  console.log(`  POST http://localhost:${PORT}/init`)
  console.log('')
  console.log('[서버] 또는 첫 번째 요청 시 자동으로 초기화됩니다')
})

// 종료 시 브라우저 정리
process.on('SIGINT', async () => {
  console.log('\n[서버] 서버 종료 중...')
  if (crawler) {
    await crawler.close()
  }
  process.exit(0)
})

process.on('SIGTERM', async () => {
  if (crawler) {
    await crawler.close()
  }
  process.exit(0)
})
