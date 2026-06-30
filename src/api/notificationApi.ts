import client from './client'
import type { AlertRule, Notification } from '../types/notification'

export const getAlerts = () =>
  client.get<{ code: string; data: AlertRule[] }>('/api/alerts')
    .then(r => r.data.data ?? [])

export const createAlert = (payload: {
  symbol: string
  type: string
  targetValue: number
  direction: string
}) => client.post('/api/alerts', payload).then(r => r.data)

export const deleteAlert = (id: number) =>
  client.delete(`/api/alerts/${id}`).then(r => r.data)

export const getNotifications = (limit = 30) =>
  client.get<{ code: string; data: Notification[]; unread: number }>(
    '/api/notifications', { params: { limit } }
  ).then(r => ({ items: r.data.data ?? [], unread: r.data.unread ?? 0 }))

export const markRead = (id: number) =>
  client.post(`/api/notifications/${id}/read`).then(r => r.data)

export const markAllRead = () =>
  client.post('/api/notifications/read-all').then(r => r.data)
