// ── jigeum 백엔드 응답 타입 ──────────────────────────────

/** /api/stocks/current, /api/market/kr|us 공통 */
export interface StockQuote {
  symbol:          string
  name:            string
  price:           number
  change:          number
  changePercent:   number
  volume:          number
  marketCap:       number
  high52Week:      number
  low52Week:       number
  market:          string
  avgVolume10Day:  number
  eps:             number
  per:             number
  pbr:             number
  score?:          number   // PennyStockEvaluator 100점 평가 점수 (동전주 탭 전용)
}

/** /api/financial/{symbol} */
export interface FinancialData {
  symbol:           string
  corpName:         string
  bsnsYear:         string
  eps:              number
  per:              number
  pbr:              number
  revenueGrowth:    number
  operatingMargin:  number
}

/** /api/chart/{symbol} — 봉 하나 */
export interface OhlcvBar {
  timestamp:  number   // Unix 초
  open:       number
  high:       number
  low:        number
  close:      number
  volume:     number
}

/** /api/predict/{symbol} */
export interface Prediction {
  symbol:       string
  name:         string
  currentPrice: number
  direction:    'up' | 'down' | 'neutral'
  targetLow:    number
  targetHigh:   number
  confidence:   number
  reason:             string
  detail?:            string
  companyDescription?: string
  indicators: {
    ma5:      number
    ma20:     number
    rsi:      number
    bbLower:  number
    bbUpper:  number
  }
}

/** /api/market/feargreed */
export interface FearGreed {
  score:  number
  label:  '극단 공포' | '공포' | '중립' | '탐욕' | '극단 탐욕'
  components: {
    vix:       number
    breadth:   number
    momentum:  number
    force:     number
  }
}

/** /api/market/fx */
export interface FxRate {
  usdKrw:    number
  jpyKrw:    number
  updatedAt: number
}

/** /api/economy/phase */
export interface EconomicPhase {
  phase:        'EXPANSION' | 'PEAK' | 'CONTRACTION' | 'RECOVERY'
  label:        string
  description:  string
  interestRate: number
  vix:          number
  wtiOil:       number
  gold:         number
  updatedAt:    number
}

/** /api/screener/value */
export interface ValueStock {
  symbol:          string
  name:            string
  eps:             number
  per:             number
  pbr:             number
  revenueGrowth:   number
  operatingMargin: number
}

/** /api/market/macro */
export interface MacroData {
  interestRate: number
  vix:          number
  wtiOil:       number
  gold:         number
  updatedAt:    number
}

/** /api/force */
export type ForceStock = StockQuote

/** /api/trades */
export interface Trade {
  id:        number
  symbol:    string
  name:      string
  side:      'buy' | 'sell'
  price:     number
  qty:       number
  fee:       number
  memo:      string
  tradedAt:  string
}

/** /api/portfolio/summary */
export interface PortfolioSummary {
  totalPnl:     number
  winRate:      number
  totalTrades:  number
  totalSymbols: number
  bySymbol:     SymbolSummary[]
}

export interface SymbolSummary {
  symbol:        string
  name:          string
  netQty:        number
  avgBuyPrice:   number
  currentPrice:  number
  realizedPnl:   number
  unrealizedPnl: number
  totalPnl:      number
}

/** /api/watchlist */
export interface WatchlistItem {
  symbol:   string
  name:     string
  addedAt:  string
}

/** /api/news/{symbol} — 공시 항목 (DART) */
export interface DisclosureItem {
    rcept_no:    string   // 접수번호 — DART 뷰어 링크 키
    report_name: string   // 보고서명 (예: 분기보고서, 주요사항보고서)
    rcept_date:  string   // 접수일 yyyyMMdd
    corp_name:   string   // 공시 법인명
    link:        string   // DART 뷰어 URL
}

/** /api/news/{symbol} — 뉴스 항목 */
export interface NewsItem {
    title:        string  // 기사 제목
    link:         string  // 기사 URL
    source:       string  // 언론사명
    published_at: string  // 발행일시 (KR: RFC 형식, US: yyyy-MM-dd HH:mm)
}

/** /api/news/{symbol} */
export interface StockNews {
    symbol:      string
    disclosures: DisclosureItem[]  // KR: DART 공시, US: 빈 배열
    news:        NewsItem[]        // KR: Google RSS, US: Yahoo Finance
}