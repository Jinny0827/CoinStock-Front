import { useQuery } from '@tanstack/react-query'
import { getTossWarnings, getTossPriceLimits } from '../../api/tossApi'

const WARNING_LABEL: Record<string, string> = {
  LIQUIDATION_TRADING: '정리매매',
  OVERHEATED:           '단기과열',
  INVESTMENT_WARNING:   '투자경고',
  INVESTMENT_CAUTION:   '투자주의',
}

interface Props {
  symbol: string
  currentPrice: number
}

export default function TradingStatusBadges({ symbol, currentPrice }: Props) {
  const { data: warnings = [] } = useQuery({
    queryKey: ['toss-warnings', symbol],
    queryFn:  () => getTossWarnings(symbol),
    staleTime: 5 * 60_000,
    enabled:  !!symbol,
    retry:    false,
  })

  const { data: priceLimits } = useQuery({
    queryKey: ['toss-price-limits', symbol],
    queryFn:  () => getTossPriceLimits(symbol),
    staleTime: 60_000,
    enabled:  !!symbol && currentPrice > 0,
    retry:    false,
  })

  const now = Date.now()
  const activeWarnings = warnings.filter(w => !w.endDate || new Date(w.endDate).getTime() >= now)

  const upperLimit = priceLimits?.upperLimitPrice != null ? Number(priceLimits.upperLimitPrice) : null
  const lowerLimit = priceLimits?.lowerLimitPrice != null ? Number(priceLimits.lowerLimitPrice) : null
  const atUpperLimit = upperLimit != null && upperLimit > 0 && currentPrice >= upperLimit
  const atLowerLimit = lowerLimit != null && lowerLimit > 0 && currentPrice <= lowerLimit

  if (activeWarnings.length === 0 && !atUpperLimit && !atLowerLimit) return null

  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
      {activeWarnings.map((w, i) => (
        <Badge key={`w${i}`} text={WARNING_LABEL[w.warningType] ?? w.warningType} color="#FF4B4B" />
      ))}
      {atUpperLimit && <Badge text="상한가" color="#FF8C00" />}
      {atLowerLimit && <Badge text="하한가" color="#3D8EFF" />}
    </div>
  )
}

function Badge({ text, color }: { text: string; color: string }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, color,
      background: `${color}1F`,
      border: `1px solid ${color}66`,
      padding: '3px 8px', borderRadius: 4,
    }}>{text}</span>
  )
}
