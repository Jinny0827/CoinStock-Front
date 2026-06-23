import client from './client'
import { unwrap } from './apiUtils'
import type { TossAccountStatus, TossHoldings, TossHoldingsEnvelope } from '../types/toss'

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
