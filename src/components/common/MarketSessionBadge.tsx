import { useQuery } from '@tanstack/react-query'
import { getMarketSession } from '../../api/stockApi'
import type { MarketSessionState } from '../../types/stock'

const LABEL: Record<MarketSessionState, string> = {
  PRE_MARKET:   '프리장',
  REGULAR:      '정규장',
  AFTER_MARKET: '애프터마켓',
  CLOSED:       '휴장',
}

const COLOR: Record<MarketSessionState, string> = {
  PRE_MARKET:   '#3D8EFF',
  REGULAR:      '#FF8C00',
  AFTER_MARKET: '#3D8EFF',
  CLOSED:       '#4B5675',
}

export default function MarketSessionBadge() {
  const { data } = useQuery({
    queryKey: ['market-session'],
    queryFn:  getMarketSession,
    staleTime: 30_000,
    refetchInterval: 60_000,
  })

  if (!data) return null

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
      <SessionChip label="국장" state={data.kr} />
      <SessionChip label="미장" state={data.us} />
    </div>
  )
}

function SessionChip({ label, state }: { label: string; state: MarketSessionState }) {
  const color = COLOR[state]
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }} title={`${label} ${LABEL[state]}`}>
      <div style={{
        width: 6, height: 6, borderRadius: '50%',
        background: color,
        boxShadow: state === 'CLOSED' ? 'none' : `0 0 5px ${color}`,
      }} />
      <span style={{ fontSize: 11, color: '#8892A8' }}>{label}</span>
      <span style={{ fontSize: 11, color, fontWeight: 600 }}>{LABEL[state]}</span>
    </div>
  )
}
