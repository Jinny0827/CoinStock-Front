import client from './client'
import { unwrap } from './apiUtils'
import type {
  TossAccountStatus, TossHoldings, TossHoldingsEnvelope, TossWarning, TossPriceLimits,
  TossOrdersPage, TossBuyingPower, TossCommission, PlaceOrderRequest, TossOrderbook, TossInsight,
} from '../types/toss'

export const connectTossAccount = (clientId: string, clientSecret: string) =>
  client.post<{ code: string; message: string }>('/api/toss/account/connect', { clientId, clientSecret })
    .then(r => unwrap(r.data))

export const getTossAccountStatus = () =>
  client.get<TossAccountStatus>('/api/toss/account/status').then(r => r.data)

export const disconnectTossAccount = () =>
  client.delete<{ code: string; message: string }>('/api/toss/account').then(r => unwrap(r.data))

export const getTossHoldings = (): Promise<TossHoldings> =>
  client.get<{ code: string; message?: string; data?: TossHoldingsEnvelope }>('/api/toss/account/holdings')
    .then(r => {
      if (r.data.code !== '0000' || !r.data.data?.result) {
        throw new Error(r.data.message ?? '보유종목 조회에 실패했습니다 (응답 형식 오류)')
      }
      return r.data.data.result
    })

export const getTossWarnings = (symbol: string): Promise<TossWarning[]> =>
  client.get<{ code: string; data?: { result?: TossWarning[] } }>(`/api/toss/warnings/${symbol}`)
    .then(r => r.data.data?.result ?? [])
    .catch(() => [])  // 미지원 종목 등은 조용히 빈 배열 처리 — 배지는 있으면 보여주는 보조 정보일 뿐

export const getTossPriceLimits = (symbol: string): Promise<TossPriceLimits | null> =>
  client.get<{ code: string; data?: { result?: TossPriceLimits } }>(`/api/toss/price-limits/${symbol}`)
    .then(r => r.data.data?.result ?? null)
    .catch(() => null)

export const getTossOrderbook = (symbol: string): Promise<TossOrderbook | null> =>
  client.get<{ code: string; data?: { result?: TossOrderbook } }>(`/api/toss/orderbook/${symbol}`)
    .then(r => r.data.data?.result ?? null)
    .catch(() => null)

export const getTossBuyingPower = (currency: 'KRW' | 'USD'): Promise<TossBuyingPower> =>
  client.get<{ code: string; message?: string; data?: { result?: TossBuyingPower } }>(
    '/api/toss/account/buying-power', { params: { currency } },
  ).then(r => {
    if (r.data.code !== '0000' || !r.data.data?.result) {
      throw new Error(r.data.message ?? '매수가능금액 조회에 실패했습니다')
    }
    return r.data.data.result
  })

export const getTossCommissions = (): Promise<TossCommission[]> =>
  client.get<{ code: string; data?: { result?: TossCommission[] } }>('/api/toss/account/commissions')
    .then(r => r.data.data?.result ?? [])

export const getTossSellableQuantity = (symbol: string): Promise<number> =>
  client.get<{ code: string; data?: { result?: { sellableQuantity?: string } } }>(
    `/api/toss/account/sellable-quantity/${symbol}`,
  ).then(r => Number(r.data.data?.result?.sellableQuantity ?? 0))

export const getTossOrders = (status: 'OPEN' | 'CLOSED', cursor?: string): Promise<TossOrdersPage> =>
  client.get<{ code: string; message?: string; data?: { result?: TossOrdersPage } }>(
    '/api/toss/account/orders', { params: { status, cursor } },
  ).then(r => {
    if (r.data.code !== '0000' || !r.data.data?.result) {
      throw new Error(r.data.message ?? '주문 내역 조회에 실패했습니다')
    }
    return r.data.data.result
  })

export const placeTossOrder = (body: PlaceOrderRequest) =>
  client.post<{ code: string; message?: string }>('/api/toss/account/orders', body)
    .then(r => unwrap(r.data))

export const cancelTossOrder = (orderId: string) =>
  client.post<{ code: string; message?: string }>(`/api/toss/account/orders/${orderId}/cancel`)
    .then(r => unwrap(r.data))

export const getTossInsight = (): Promise<TossInsight> =>
  client.get<{ code: string; message?: string; data?: TossInsight }>('/api/toss/account/insight', { timeout: 60_000 })
    .then(r => {
      if (r.data.code !== '0000' || !r.data.data) {
        throw new Error(r.data.message ?? '거래 인사이트 조회에 실패했습니다')
      }
      return r.data.data
    })
