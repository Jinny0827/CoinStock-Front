import client from './client'
import { unwrap } from './apiUtils'
import type { TotpStatus, TotpSetup } from '../types/totp'

export const getTotpStatus = () =>
  client.get<TotpStatus>('/api/auth/totp/status').then(r => r.data)

export const setupTotp = (): Promise<TotpSetup> =>
  client.post<{ code: string; message?: string } & TotpSetup>('/api/auth/totp/setup')
    .then(r => unwrap(r.data))

export const confirmTotp = (code: string) =>
  client.post<{ code: string; message?: string }>('/api/auth/totp/confirm', { code })
    .then(r => unwrap(r.data))

export const verifyTotp = (code: string) =>
  client.post<{ code: string; message?: string }>('/api/auth/totp/verify', { code })
    .then(r => unwrap(r.data))

export const disableTotp = () =>
  client.delete<{ code: string; message?: string }>('/api/auth/totp')
    .then(r => unwrap(r.data))
