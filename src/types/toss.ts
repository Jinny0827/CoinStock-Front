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

export interface TossWarning {
  warningType: string  // LIQUIDATION_TRADING | OVERHEATED | INVESTMENT_WARNING 등
  exchange: string
  startDate: string
  endDate: string
}

export interface TossPriceLimits {
  timestamp: string
  upperLimitPrice: string | number | null
  lowerLimitPrice: string | number | null
  currency: string
}

export interface TossOrderExecution {
  filledQuantity?: string
  averageFilledPrice?: string
  filledAmount?: string
  commission?: string
  tax?: string
  filledAt?: string | null
  settlementDate?: string | null
}

export interface TossOrder {
  orderId: string
  symbol: string
  side: 'BUY' | 'SELL'
  orderType: string
  timeInForce: string
  status: string
  price: string | null
  quantity: string
  orderAmount: string
  currency: string
  orderedAt: string
  canceledAt: string | null
  execution?: TossOrderExecution
}

export interface TossOrdersPage {
  orders: TossOrder[]
  nextCursor: string | null
  hasNext: boolean
}

export interface TossBuyingPower {
  currency: string
  cashBuyingPower: string
}

export interface TossCommission {
  marketCountry: string
  commissionRate: string
  startDate: string | null
  endDate: string | null
}

export interface PlaceOrderRequest {
  symbol: string
  side: 'BUY' | 'SELL'
  orderType: 'MARKET' | 'LIMIT'
  quantity: string
  price?: string
}

export interface TossOrderbookLevel {
  price: string
  volume: string
}

export interface TossOrderbook {
  timestamp: string
  currency: string
  asks: TossOrderbookLevel[]
  bids: TossOrderbookLevel[]
}

export interface TossInsightSymbol {
  symbol: string
  name: string
  totalBuyAmount: string
  totalSellAmount: string
  currentValue: string
  currentQty: string
  pnl: string
}

export interface TossInsightMonth {
  month: string  // "yyyy-MM"
  buyAmount: string
  sellAmount: string
}

export interface TossInsightCurrency {
  totalBuyAmount: string
  totalSellAmount: string
  currentValue: string
  totalPnl: string
  totalTrades: number
  bySymbol: TossInsightSymbol[]
  monthly: TossInsightMonth[]
}

// key: "KRW" | "USD"
export type TossInsight = Record<string, TossInsightCurrency>
