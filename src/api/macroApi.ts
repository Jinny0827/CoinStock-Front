import client from './client'
import type { MacroStrategy } from '../types/macro'

export const getMacros = () =>
  client.get<{ code: string; data: MacroStrategy[] }>('/api/macro')
    .then(r => r.data.data)

export const createMacro = (body: {
  name: string
  type: string
  symbol: string
  side: string
  orderType?: string
  params?: Record<string, number>
  quantityMode: string
  quantityValue: number
  maxExecutions?: number
}) => client.post<{ code: string; id: number; message: string }>('/api/macro', body).then(r => r.data)

export const deleteMacro = (id: number) =>
  client.delete<{ code: string; message: string }>(`/api/macro/${id}`).then(r => r.data)

export const activateMacro = (id: number) =>
  client.post<{ code: string; message: string }>(`/api/macro/${id}/activate`).then(r => r.data)

export const deactivateMacro = (id: number) =>
  client.post<{ code: string; message: string }>(`/api/macro/${id}/deactivate`).then(r => r.data)
