/**
 * 네이버 검색광고 키워드 도구 크롤러
 * 순위별 입찰가를 크롤링합니다
 */

const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const fs = require('fs')
const path = require('path')

// Stealth 플러그인 사용 (봇 탐지 우회)
puppeteer.use(StealthPlugin())

// 쿠키 저장 경로
const COOKIES_PATH = path.join(__dirname, '../cookies.json')

class NaverAdCrawler {
  constructor() {
    this.browser = null
    this.page = null
    this.isLoggedIn = false
  }

  /**
   * 브라우저 초기화
   */
  async init() {
    console.log('[크롤러] 브라우저 시작 중...')

    this.browser = await puppeteer.launch({
      headless: false, // 처음에는 false로 해서 로그인 과정 확인
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920,1080',
      ],
      defaultViewport: {
        width: 1920,
        height: 1080,
      },
    })

    this.page = await this.browser.newPage()

    // User-Agent 설정
    await this.page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    )

    // 저장된 쿠키 로드 시도
    await this.loadCookies()

    console.log('[크롤러] 브라우저 초기화 완료')
  }

  /**
   * 저장된 쿠키 로드
   */
  async loadCookies() {
    try {
      if (fs.existsSync(COOKIES_PATH)) {
        const cookies = JSON.parse(fs.readFileSync(COOKIES_PATH, 'utf8'))
        await this.page.setCookie(...cookies)
        console.log('[크롤러] 저장된 쿠키 로드 완료')
        return true
      }
    } catch (error) {
      console.log('[크롤러] 쿠키 로드 실패:', error.message)
    }
    return false
  }

  /**
   * 쿠키 저장
   */
  async saveCookies() {
    try {
      const cookies = await this.page.cookies()
      fs.writeFileSync(COOKIES_PATH, JSON.stringify(cookies, null, 2))
      console.log('[크롤러] 쿠키 저장 완료')
    } catch (error) {
      console.error('[크롤러] 쿠키 저장 실패:', error.message)
    }
  }

  /**
   * 네이버 로그인
   */
  async login(naverId, naverPassword) {
    console.log('[크롤러] 네이버 로그인 시도...')

    try {
      // 네이버 로그인 페이지로 직접 이동 (한국어 설정 + 로그인 후 광고 페이지로 리다이렉트)
      console.log('[크롤러] 네이버 로그인 페이지로 이동...')
      await this.page.goto('https://nid.naver.com/nidlogin.login?locale=ko_KR&url=https%3A%2F%2Fads.naver.com%2F%3FfromLogin%3Dtrue', {
        waitUntil: 'networkidle2',
        timeout: 60000,
      })

      // 페이지 로드 대기
      console.log('[크롤러] 페이지 로드 대기...')
      await this.delay(3000)

      // 아이디 입력 (name 속성으로 선택)
      console.log('[크롤러] 아이디 입력 중...')
      await this.page.waitForSelector('input[name="id"]', { visible: true, timeout: 15000 })
      await this.page.click('input[name="id"]')
      await this.delay(500)
      await this.page.type('input[name="id"]', naverId, { delay: 100 })
      console.log('[크롤러] 아이디 입력 완료')

      // 대기
      await this.delay(1000)

      // 비밀번호 입력 (name 속성으로 선택)
      console.log('[크롤러] 비밀번호 입력 중...')
      await this.page.waitForSelector('input[name="pw"]', { visible: true, timeout: 15000 })
      await this.page.click('input[name="pw"]')
      await this.delay(500)
      await this.page.type('input[name="pw"]', naverPassword, { delay: 100 })
      console.log('[크롤러] 비밀번호 입력 완료')

      // 대기 (인간처럼 보이게)
      await this.delay(1000)

      // 로그인 버튼 클릭 (class로 선택)
      console.log('[크롤러] 로그인 버튼 클릭...')
      await this.page.click('button.btn_login')

      // 로그인 결과 대기 (URL 변경 또는 타임아웃)
      console.log('[크롤러] 로그인 결과 대기...')
      try {
        await this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 })
      } catch (navError) {
        console.log('[크롤러] 네비게이션 타임아웃 - 현재 페이지 확인')
      }

      // 페이지 로드 대기
      await this.delay(5000)

      // 현재 URL 확인
      let currentUrl = this.page.url()
      console.log('[크롤러] 현재 URL:', currentUrl)

      // 2단계 인증이나 캡차가 있는지 확인
      if (currentUrl.includes('nid.naver.com')) {
        console.log('[크롤러] 추가 인증이 필요합니다. 브라우저에서 직접 완료해주세요.')
        console.log('[크롤러] 인증 완료 후 60초 대기합니다...')
        await this.delay(60000)
      }

      // 광고 관리 페이지로 직접 이동 (계정 선택 우회)
      console.log('[크롤러] 광고 관리 페이지로 이동...')
      await this.page.goto('https://manage.searchad.naver.com/customers/1392622/campaigns', {
        waitUntil: 'networkidle2',
        timeout: 60000,
      })
      await this.delay(3000)
      currentUrl = this.page.url()
      console.log('[크롤러] 이동 후 URL:', currentUrl)

      // 로그인 상태 확인
      this.isLoggedIn = await this.checkLoginStatus()

      if (this.isLoggedIn) {
        console.log('[크롤러] 로그인 성공!')
        await this.saveCookies()
      } else {
        console.log('[크롤러] 로그인 실패')
      }

      return this.isLoggedIn
    } catch (error) {
      console.error('[크롤러] 로그인 오류:', error.message)
      return false
    }
  }

  /**
   * 로그인 상태 확인
   */
  async checkLoginStatus() {
    try {
      await this.page.goto('https://manage.searchad.naver.com/', {
        waitUntil: 'networkidle2',
        timeout: 30000,
      })

      // 광고 관리 시스템 페이지가 로드되면 로그인된 것
      const url = this.page.url()
      return url.includes('manage.searchad.naver.com') && !url.includes('nid.naver.com')
    } catch (error) {
      return false
    }
  }

  /**
   * 키워드 도구 페이지로 이동
   */
  async goToKeywordTool() {
    console.log('[크롤러] 키워드 도구로 이동...')

    try {
      // 키워드 도구 URL로 직접 이동
      await this.page.goto('https://manage.searchad.naver.com/customers/self-serve/tool/keyword-planner', {
        waitUntil: 'networkidle2',
        timeout: 30000,
      })

      // 페이지 로드 대기
      await this.delay(2000)

      console.log('[크롤러] 키워드 도구 페이지 로드 완료')
      return true
    } catch (error) {
      console.error('[크롤러] 키워드 도구 이동 실패:', error.message)
      return false
    }
  }

  /**
   * 키워드 검색 및 입찰가 조회
   */
  async getKeywordBidPrice(keyword) {
    console.log(`[크롤러] 키워드 "${keyword}" 입찰가 조회 중...`)

    try {
      // 키워드 도구 페이지로 이동
      await this.goToKeywordTool()

      // 키워드 입력 필드 찾기
      const inputSelector = 'input[placeholder*="키워드"], input[type="text"]'
      await this.page.waitForSelector(inputSelector, { timeout: 10000 })

      // 기존 입력값 삭제 후 새 키워드 입력
      await this.page.click(inputSelector, { clickCount: 3 })
      await this.page.type(inputSelector, keyword)

      // 검색 버튼 클릭 또는 엔터
      await this.page.keyboard.press('Enter')

      // 결과 로딩 대기
      await this.delay(3000)

      // 결과 테이블에서 데이터 추출
      const result = await this.page.evaluate((searchKeyword) => {
        // 테이블 행 찾기
        const rows = document.querySelectorAll('table tbody tr')

        for (const row of rows) {
          const cells = row.querySelectorAll('td')
          if (cells.length > 0) {
            const keywordCell = cells[0]?.textContent?.trim()

            if (keywordCell?.toLowerCase() === searchKeyword.toLowerCase()) {
              // 경쟁정도, 월간검색량, 클릭률, 평균클릭비용 등 추출
              return {
                keyword: keywordCell,
                monthlyPcQcCnt: cells[1]?.textContent?.trim() || '0',
                monthlyMobileQcCnt: cells[2]?.textContent?.trim() || '0',
                monthlyAvePcClkCnt: cells[3]?.textContent?.trim() || '0',
                monthlyAveMobileClkCnt: cells[4]?.textContent?.trim() || '0',
                competition: cells[5]?.textContent?.trim() || '-',
                avgBid: cells[6]?.textContent?.trim() || '0',
              }
            }
          }
        }

        return null
      }, keyword)

      if (result) {
        console.log(`[크롤러] "${keyword}" 조회 성공:`, result)
        return result
      }

      // 월간 예상 실적 보기 버튼 찾기 및 클릭
      console.log('[크롤러] 월간 예상 실적 보기 시도...')

      const estimateButton = await this.page.$('button:has-text("월간 예상 실적")')
      if (estimateButton) {
        await estimateButton.click()
        await this.delay(2000)

        // 순위별 입찰가 데이터 추출
        const bidData = await this.extractBidPrices()
        return {
          keyword,
          ...bidData,
        }
      }

      console.log(`[크롤러] "${keyword}" 데이터를 찾을 수 없습니다`)
      return null
    } catch (error) {
      console.error('[크롤러] 입찰가 조회 오류:', error.message)
      return null
    }
  }

  /**
   * 순위별 입찰가 추출
   */
  async extractBidPrices() {
    try {
      const bidPrices = await this.page.evaluate(() => {
        const result = {
          pc: {},
          mobile: {},
        }

        // PC 순위별 입찰가
        const pcRows = document.querySelectorAll('[data-type="pc"] tr, .pc-bid-table tr')
        pcRows.forEach((row, index) => {
          const rank = index + 1
          const bidCell = row.querySelector('td:last-child')
          if (bidCell) {
            result.pc[`rank${rank}`] = bidCell.textContent?.trim().replace(/[^0-9]/g, '') || '0'
          }
        })

        // 모바일 순위별 입찰가
        const mobileRows = document.querySelectorAll('[data-type="mobile"] tr, .mobile-bid-table tr')
        mobileRows.forEach((row, index) => {
          const rank = index + 1
          const bidCell = row.querySelector('td:last-child')
          if (bidCell) {
            result.mobile[`rank${rank}`] = bidCell.textContent?.trim().replace(/[^0-9]/g, '') || '0'
          }
        })

        return result
      })

      return bidPrices
    } catch (error) {
      console.error('[크롤러] 입찰가 추출 오류:', error.message)
      return { pc: {}, mobile: {} }
    }
  }

  /**
   * 지연 함수
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * 브라우저 종료
   */
  async close() {
    if (this.browser) {
      await this.browser.close()
      console.log('[크롤러] 브라우저 종료')
    }
  }
}

module.exports = NaverAdCrawler
