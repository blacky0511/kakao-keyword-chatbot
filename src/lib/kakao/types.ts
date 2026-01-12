// 카카오톡 챗봇 스킬 요청/응답 타입 정의

/**
 * 카카오 스킬 요청 페이로드 (SkillPayload)
 * 사용자가 메시지를 보내면 카카오에서 이 형식으로 데이터를 보내줍니다
 */
export interface KakaoSkillPayload {
  intent: {
    id: string
    name: string
  }
  userRequest: {
    timezone: string
    params: Record<string, unknown>
    block: {
      id: string
      name: string
    }
    utterance: string // 사용자가 입력한 메시지
    lang: string
    user: {
      id: string
      type: string
      properties: {
        plusfriendUserKey?: string
        appUserId?: string
        isFriend?: boolean
      }
    }
  }
  bot: {
    id: string
    name: string
  }
  action: {
    name: string
    clientExtra: unknown
    params: Record<string, string> // 엔티티에서 추출된 파라미터
    id: string
    detailParams: Record<
      string,
      {
        origin: string
        value: string
        groupName?: string
      }
    >
  }
}

/**
 * 카카오 스킬 응답 (SkillResponse)
 * 이 형식으로 응답을 보내야 카카오톡에 메시지가 표시됩니다
 */
export interface KakaoSkillResponse {
  version: '2.0'
  template: {
    outputs: KakaoOutput[]
    quickReplies?: KakaoQuickReply[]
  }
}

// 출력 타입들
export type KakaoOutput =
  | { simpleText: { text: string } }
  | { simpleImage: { imageUrl: string; altText: string } }
  | { basicCard: KakaoBasicCard }
  | { textCard: KakaoTextCard }

// 기본 카드 타입
export interface KakaoBasicCard {
  title?: string
  description?: string
  thumbnail?: {
    imageUrl: string
    link?: { web: string }
    fixedRatio?: boolean
    width?: number
    height?: number
  }
  buttons?: KakaoButton[]
}

// 텍스트 카드 타입
export interface KakaoTextCard {
  title: string
  description?: string
  buttons?: KakaoButton[]
}

// 버튼 타입
export interface KakaoButton {
  label: string
  action: 'webLink' | 'message' | 'phone' | 'block' | 'share'
  webLinkUrl?: string
  messageText?: string
  phoneNumber?: string
  blockId?: string
}

// 빠른 응답 타입
export interface KakaoQuickReply {
  label: string
  action: 'message' | 'block'
  messageText?: string
  blockId?: string
}
