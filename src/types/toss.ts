export interface TossAccountStatus {
  code: string
  connected: boolean
}

// 토스 API는 모든 금액/수량/비율을 문자열로 내려준다 (정밀도 보존 목적)
export interface TossCurrencyAmount {
  krw?: string
  usd?: string
}

export interface TossHoldingItem {
  symbol: string
  name: string
  marketCountry: string
  currency: string
  quantity: string
  lastPrice: string
  averagePurchasePrice: string
  marketValue?: {
    purchaseAmount?: string
    amount?: string
    amountAfterCost?: string
  }
  profitLoss?: {
    amount?: string
    amountAfterCost?: string
    rate?: string
    rateAfterCost?: string
  }
  cost?: {
    commission?: string
    tax?: string
  }
}

export interface TossHoldings {
  totalPurchaseAmount?: TossCurrencyAmount
  marketValue?: {
    amount?: TossCurrencyAmount
    amountAfterCost?: TossCurrencyAmount
  }
  profitLoss?: {
    amount?: TossCurrencyAmount
    amountAfterCost?: TossCurrencyAmount
    rate?: string
    rateAfterCost?: string
  }
  dailyProfitLoss?: {
    amount?: TossCurrencyAmount
    rate?: string
  }
  items?: TossHoldingItem[]
}

// 백엔드가 토스 원본 응답을 그대로 중계 — { code, data: { result: {...} } }
export interface TossHoldingsEnvelope {
  result: TossHoldings
}
