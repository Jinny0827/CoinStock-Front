export type MacroType =
  | 'GOLDEN_CROSS' | 'DEATH_CROSS'
  | 'RSI_OVERSOLD' | 'RSI_OVERBOUGHT'
  | 'BOLLINGER_LOWER' | 'BOLLINGER_UPPER'
  | 'WILLIAMS_BREAKOUT' | 'Z_SCORE_REVERSION'
  | 'MOMENTUM_FACTOR' | 'ORDERBOOK_WALL'
  | 'FORCE_FOLLOW' | 'TRAILING_STOP'

export type QuantityMode = 'FIXED' | 'BUYING_POWER_PCT' | 'ATR'

export interface MacroStrategy {
  id: number
  userId: number
  name: string
  type: MacroType
  symbol: string
  side: 'BUY' | 'SELL'
  orderType: 'MARKET' | 'LIMIT'
  params: Record<string, unknown>
  quantityMode: QuantityMode
  quantityValue: number
  maxExecutions: number
  executionsToday: number
  active: boolean
  createdAt: string
  lastTriggeredAt: string | null
}

export const MACRO_TYPE_LABEL: Record<MacroType, string> = {
  GOLDEN_CROSS:      '골든크로스',
  DEATH_CROSS:       '데드크로스',
  RSI_OVERSOLD:      'RSI 과매도',
  RSI_OVERBOUGHT:    'RSI 과매수',
  BOLLINGER_LOWER:   '볼린저 하단',
  BOLLINGER_UPPER:   '볼린저 상단',
  WILLIAMS_BREAKOUT: '윌리엄스 돌파',
  Z_SCORE_REVERSION: 'Z-score 평균회귀',
  MOMENTUM_FACTOR:   '모멘텀 팩터',
  ORDERBOOK_WALL:    '대량 매수벽',
  FORCE_FOLLOW:      '세력 추종',
  TRAILING_STOP:     '트레일링 스탑',
}

export const MACRO_TYPE_DESC: Record<MacroType, string> = {
  GOLDEN_CROSS:      '단기 MA가 장기 MA를 상향 돌파 시 매수',
  DEATH_CROSS:       '단기 MA가 장기 MA를 하향 돌파 시 매도',
  RSI_OVERSOLD:      'RSI ≤ 임계값 (기본 30) 과매도 구간 진입 시 매수',
  RSI_OVERBOUGHT:    'RSI ≥ 임계값 (기본 70) 과매수 구간 진입 시 매도',
  BOLLINGER_LOWER:   '가격이 볼린저 하단(-2σ) 터치 시 반등 매수',
  BOLLINGER_UPPER:   '가격이 볼린저 상단(+2σ) 터치 시 매도',
  WILLIAMS_BREAKOUT: '전일 변동폭 × k 만큼 상승 돌파 시 당일 매수',
  Z_SCORE_REVERSION: '가격 Z-score가 임계치 이탈 시 평균회귀 방향으로 매매',
  MOMENTUM_FACTOR:   '최근 N일 수익률이 임계치 이상이면 추세 추종 매매',
  ORDERBOOK_WALL:    '호가창 대량 매수벽(평균 대비 N배) 감지 시 매수',
  FORCE_FOLLOW:      '세력 점수 N점 이상인 종목 추종 매수',
  TRAILING_STOP:     '고점 대비 ATR × N 이상 하락 시 손실 최소화 매도',
}

export interface MacroTypeDetail {
  what: string
  example: string
}

export const MACRO_TYPE_DETAIL: Record<MacroType, MacroTypeDetail> = {
  GOLDEN_CROSS: {
    what: '단기(5일) 이동평균이 장기(20일) 이동평균을 아래서 위로 뚫고 올라가는 시점입니다. 하락하던 주가가 상승으로 전환되는 초기를 포착하는 가장 대중적인 매수 신호입니다.',
    example: '예: 조정을 받던 삼성전자가 반등하면서 5일선이 20일선을 위로 돌파 → 매수 주문 실행',
  },
  DEATH_CROSS: {
    what: '단기(5일) 이동평균이 장기(20일) 이동평균을 위에서 아래로 뚫고 내려가는 시점입니다. 상승하던 주가가 하락 전환되는 초기 신호로, 미리 매도해 손실을 줄입니다.',
    example: '예: 상승하던 종목이 꺾이면서 5일선이 20일선 아래로 이탈 → 매도 주문 실행',
  },
  RSI_OVERSOLD: {
    what: 'RSI는 최근 14일간 "오른 날의 힘" vs "내린 날의 힘"을 0~100으로 표현한 지수입니다. 30 이하 = 너무 많이 팔린 상태로, 곧 반등할 가능성이 높다고 판단합니다.',
    example: '예: 연속 급락 후 RSI가 28까지 내려옴 → "과하게 팔렸다, 반등 임박" 판단 → 자동 매수',
  },
  RSI_OVERBOUGHT: {
    what: 'RSI 70 이상 = 너무 많이 오른 과열 상태입니다. 단기 급등 후 조정이 올 가능성이 높다고 판단해 선제 매도합니다.',
    example: '예: 연속 급등 후 RSI가 78까지 올라옴 → "과하게 올랐다, 조정 임박" 판단 → 자동 매도',
  },
  BOLLINGER_LOWER: {
    what: '최근 20일 평균가격 ±2 표준편차(σ) 범위를 벗어나면 통계적으로 "비정상"입니다. 가격이 하단선을 터치했다 = 이례적으로 많이 내려간 상태 → 반등 기대 매수.',
    example: '예: 평소 65,000~75,000원 사이에서 움직이던 종목이 62,000원(하단선)까지 내려옴 → 매수',
  },
  BOLLINGER_UPPER: {
    what: '가격이 볼린저 상단선(평균 +2σ)을 터치했다 = 이례적으로 많이 올라간 상태입니다. 과열 구간에서 선제 매도해 수익을 실현합니다.',
    example: '예: 평소 구간보다 훨씬 높은 78,000원(상단선)까지 급등 → 조정 가능성 → 매도',
  },
  WILLIAMS_BREAKOUT: {
    what: '전날 주가 변동폭(고가-저가) × k만큼 오늘 시가 대비 상승하면 "강한 상승 돌파"로 판단합니다. 장중 강한 매수세를 이용하는 단타 전략입니다.',
    example: '예: 전날 변동폭 2,000원 × k=0.5 → 오늘 시가 대비 1,000원 이상 오르면 바로 매수',
  },
  Z_SCORE_REVERSION: {
    what: '현재 가격이 최근 N일 평균에서 표준편차 몇 배나 벗어났는지를 봅니다. ±2 이상 = "너무 멀리 갔다 → 평균으로 돌아올 것"이라는 평균회귀 전략입니다.',
    example: '예: 평균 60,000원인 종목이 현재 54,000원(Z=-2.1) → "과하게 떨어졌다, 곧 회복" 판단 → 매수',
  },
  MOMENTUM_FACTOR: {
    what: '"오르는 것은 계속 오른다"는 추세 추종 전략입니다. 최근 N일간 수익률이 임계치를 넘으면 상승 추세가 확인됐다고 보고 올라탑니다.',
    example: '예: 최근 20일 수익률 +8% (임계치 5% 초과) → 상승 추세 확인 → 추세 추종 매수',
  },
  ORDERBOOK_WALL: {
    what: '호가창에 평균보다 N배 이상의 대량 매수 주문이 쌓여 있으면 "큰손이 이 가격을 지지하고 있다"고 판단합니다. 지지선 근처에서 안전하게 매수합니다.',
    example: '예: 60,000원에 평균의 3배 물량의 매수 주문 감지 → 지지선 확인 → 매수',
  },
  FORCE_FOLLOW: {
    what: '이 앱의 세력 점수(거래량·가격 이상 동향 종합 지수)가 설정 점수 이상이면 "누군가 대량으로 사모으고 있다"고 판단해 따라 삽니다.',
    example: '예: 세력 점수 82점 감지 → 급등 초기 단계로 판단 → 선제 매수',
  },
  TRAILING_STOP: {
    what: '고점 대비 ATR(평균 일변동폭) × 배수 이상 하락하면 자동 손절합니다. 수익은 끝까지 따라가다가, 추세가 꺾이는 순간 빠져나오는 전략입니다.',
    example: '예: ATR 2,000원 × 배수 2 → 고점 70,000원에서 4,000원 내린 66,000원 도달 시 자동 매도',
  },
}

export interface MacroParamDef {
  key: string
  label: string
  defaultValue: number
  min?: number
  max?: number
  step?: number
}

export const MACRO_PARAMS: Partial<Record<MacroType, MacroParamDef[]>> = {
  RSI_OVERSOLD:      [{ key: 'oversold',     label: 'RSI 과매도 기준',  defaultValue: 30, min: 10, max: 45, step: 1 }],
  RSI_OVERBOUGHT:    [{ key: 'overbought',   label: 'RSI 과매수 기준',  defaultValue: 70, min: 55, max: 90, step: 1 }],
  WILLIAMS_BREAKOUT: [{ key: 'k',            label: '돌파 계수 (k)',    defaultValue: 0.5, min: 0.1, max: 1.0, step: 0.05 }],
  Z_SCORE_REVERSION: [
    { key: 'period',     label: '기간 (일)',       defaultValue: 20, min: 5,  max: 60,  step: 1 },
    { key: 'zThreshold', label: 'Z-score 임계치', defaultValue: 2.0, min: 1.0, max: 3.5, step: 0.1 },
  ],
  MOMENTUM_FACTOR:   [
    { key: 'period',    label: '모멘텀 기간 (일)',  defaultValue: 20, min: 5,   max: 60,  step: 1 },
    { key: 'threshold', label: '수익률 임계치 (%)', defaultValue: 5,  min: 1,   max: 20,  step: 0.5 },
  ],
  ORDERBOOK_WALL:    [{ key: 'wallMultiple', label: '벽 배수 (평균 대비)', defaultValue: 3.0, min: 1.5, max: 10, step: 0.5 }],
  FORCE_FOLLOW:      [{ key: 'minScore',    label: '최소 세력 점수',    defaultValue: 80,  min: 50,  max: 100, step: 5 }],
  TRAILING_STOP:     [{ key: 'atrMultiple', label: 'ATR 배수',          defaultValue: 2.0, min: 0.5, max: 5.0, step: 0.25 }],
}
