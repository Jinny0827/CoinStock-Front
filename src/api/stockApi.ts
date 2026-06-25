import client from './client'
import type {
    StockQuote, FinancialData, OhlcvBar,
    Prediction, PredictionHistoryItem, FearGreed, FxRate, MacroData,
    EconomicPhase, ValueStock,
    ForceStock, Trade, WatchlistItem, StockNews, MarketSession,
} from '../types/stock'

// ── 시세 ──────────────────────────────────────────────────
export const getForceStocks   = () =>
  client.get<{ code:string; data: ForceStock[] }>('/api/force').then(r => r.data.data)

export const getPennyStocks   = () =>
  client.get<{ code:string; data: StockQuote[] }>('/api/penny').then(r => r.data.data)

export const getKrPennyStocks = () =>
  client.get<{ code:string; data: StockQuote[] }>('/api/penny/kr').then(r => r.data.data)

export const getUsPennyStocks = () =>
  client.get<{ code:string; data: StockQuote[] }>('/api/penny/us').then(r => r.data.data)


/** 종목분석 전용: 국장 주요 10종목 (삼성전자 등) */
export const getKrMainStocks  = () =>
  client.get<{ code:string; data: StockQuote[] }>('/api/market/main/kr').then(r => r.data.data)

/** 종목분석 전용: 미장 주요 10종목 (AAPL, MSFT 등) */
export const getUsMainStocks  = () =>
  client.get<{ code:string; data: StockQuote[] }>('/api/market/main/us').then(r => r.data.data)

export const getAllStocks      = () =>
  client.get<{ code:string; data: StockQuote[]; total:number }>('/api/stocks/current')
    .then(r => r.data.data)

export const getIndices       = () =>
  client.get<{ code:string; data: StockQuote[] }>('/api/market/index').then(r => r.data.data)

export const getFxRate        = () =>
  client.get<FxRate & { code:string }>('/api/market/fx').then(r => r.data)

export const getMacroData     = () =>
  client.get<MacroData & { code:string }>('/api/market/macro').then(r => r.data)

export const getEconomicPhase = () =>
  client.get<EconomicPhase & { code:string }>('/api/economy/phase').then(r => r.data)

export const getMarketSession = () =>
  client.get<MarketSession & { code:string }>('/api/market/session').then(r => r.data)

export const getValueScreener = () =>
  client.get<{ code:string; data: ValueStock[]; total: number }>('/api/screener/value').then(r => r.data)

export const refreshFinancials = () =>
  client.post<{ code:string; message: string }>('/api/admin/financials/refresh').then(r => r.data)

// ── 종목 상세 ──────────────────────────────────────────────
export const getFinancial     = (symbol: string) =>
  client.get<FinancialData & { code:string }>(`/api/financial/${symbol}`).then(r => r.data)

export const getOhlcv         = (symbol: string, interval = '1d', range = '1mo') =>
  client.get<{ code:string; bars: OhlcvBar[] }>(`/api/chart/${symbol}`, {
    params: { interval, range },
  }).then(r => r.data.bars)

export const getPredict        = (symbol: string) =>
  client.get<{ code:string; data: Prediction }>(`/api/predict/${symbol}`).then(r => r.data.data)

export const getPredictHistory = (symbol: string) =>
  client.get<{ code:string; data: PredictionHistoryItem[] }>(`/api/predict/history/${symbol}`).then(r => r.data.data)

export const getStockNews     = (symbol: string) =>
    client.get<{ code:string } & StockNews>(`/api/news/${symbol}`).then(r => r.data)

// ── AI ────────────────────────────────────────────────────
export const getFearGreed     = () =>
  client.get<{ code:string; data: FearGreed }>('/api/market/feargreed').then(r => r.data.data)

export const getEconomicInsight = () =>
  client.get<{ code:string; insight: string }>('/api/insight/economic').then(r => r.data.insight)

export const getTermInsight   = (term: string, value: number) =>
  client.get<{ code:string; insight: string }>('/api/insight/term', {
    params: { term, value },
  }).then(r => r.data.insight)

export const getThemes        = () =>
  client.get<{ code:string; themes: string[] }>('/api/themes').then(r => r.data.themes)

// ── 거래 기록 ──────────────────────────────────────────────
export const getTrades        = (from?: string, to?: string) =>
  client.get<{ code:string; data: Trade[] }>('/api/trades', {
    params: { from, to },
  }).then(r => r.data.data)

export const addTrade         = (body: Omit<Trade, 'id'>) =>
  client.post<{ code:string; id: number }>('/api/trades', body).then(r => r.data)

export const deleteTrade      = (id: number) =>
  client.delete<{ code:string }>(`/api/trades/${id}`).then(r => r.data)

// ── 관심 종목 ──────────────────────────────────────────────
export const getWatchlist     = () =>
  client.get<{ code:string; data: WatchlistItem[] }>('/api/watchlist').then(r => r.data.data)

export const addWatchlist     = (symbol: string, name: string) =>
  client.post<{ code:string; added: boolean }>(`/api/watchlist/${symbol}`, { name }).then(r => r.data)

export const deleteWatchlist  = (symbol: string) =>
  client.delete<{ code:string }>(`/api/watchlist/${symbol}`).then(r => r.data)

export const isWatched        = (symbol: string) =>
  client.get<{ code:string; watched: boolean }>(`/api/watchlist/${symbol}`).then(r => r.data.watched)
