export interface AlertRule {
  id: number
  userId: number
  symbol: string
  type: 'PRICE_TARGET' | 'PCT_CHANGE' | 'PNL_THRESHOLD'
  targetValue: number
  direction: 'ABOVE' | 'BELOW'
  active: boolean
  createdAt: string
  lastTriggeredAt: string | null
}

export interface Notification {
  id: number
  userId: number | null
  title: string
  body: string | null
  symbol: string | null
  readAt: string | null
  createdAt: string
}
