import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getTossInsight } from '../../api/tossApi'
import type { TossInsightCurrency, TossInsightMonth, TossInsightSymbol } from '../../types/toss'

const num = (v?: string) => Number(v ?? 0) || 0
const fmt = (v: number, currency: string) => currency === 'USD' ? `$${v.toLocaleString()}` : `${v.toLocaleString()}원`
const sign = (v: number) => v >= 0 ? '+' : ''
const colorOf = (v: number) => v >= 0 ? '#FF8C00' : '#FF4B4B'
const CURRENCY_LABEL: Record<string, string> = { KRW: '국장', USD: '미장' }

export default function TossInsightView() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['toss-insight'],
    queryFn: getTossInsight,
    staleTime: 60_000,
  })
  const [activeCurrency, setActiveCurrency] = useState<string | null>(null)

  if (isLoading) return <Dim>거래 인사이트 불러오는 중...</Dim>
  if (isError) return <div style={errorStyle}>{(error as Error)?.message ?? '인사이트를 불러오지 못했습니다'}</div>

  const currencies = Object.entries(data ?? {}).filter(([, c]) => c.totalTrades > 0 || c.bySymbol.length > 0)

  if (currencies.length === 0) {
    return <Dim>아직 체결된 거래가 없습니다</Dim>
  }

  // 탭으로 국장(KRW)/미장(USD) 중 하나만 보여줌 — 둘 다 한 화면에 쌓아두면 너무 길어짐
  const activeTab = currencies.some(([cur]) => cur === activeCurrency) ? activeCurrency! : currencies[0][0]
  const [, activeData] = currencies.find(([cur]) => cur === activeTab)!

  return (
    <div>
      {currencies.length > 1 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {currencies.map(([cur]) => (
            <Tab key={cur} label={CURRENCY_LABEL[cur] ?? cur} active={cur === activeTab}
                 onClick={() => setActiveCurrency(cur)} />
          ))}
        </div>
      )}
      <CurrencySection currency={activeTab} data={activeData} />
    </div>
  )
}

function Tab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      fontSize: 11, fontWeight: 600, padding: '5px 12px', borderRadius: 6,
      border: active ? '1px solid rgba(255,140,0,0.4)' : '1px solid rgba(255,255,255,0.07)',
      background: active ? 'rgba(255,140,0,0.08)' : 'transparent',
      color: active ? '#FF8C00' : '#8892A8',
      cursor: 'pointer',
    }}>{label}</button>
  )
}

function CurrencySection({ currency, data }: { currency: string; data: TossInsightCurrency }) {
  const totalPnl = num(data.totalPnl)

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
        <SummaryCard label="총 손익" value={sign(totalPnl) + fmt(Math.abs(totalPnl), currency)} color={colorOf(totalPnl)} />
        <SummaryCard label="총 매수금액" value={fmt(num(data.totalBuyAmount), currency)} color="#3D8EFF" />
        <SummaryCard label="총 매도금액" value={fmt(num(data.totalSellAmount), currency)} color="#8892A8" />
        <SummaryCard label="체결 건수" value={`${data.totalTrades}건`} color="#8892A8" />
      </div>

      {data.monthly.length > 0 && <MonthlyChart monthly={data.monthly} currency={currency} />}

      <SymbolTable symbols={data.bySymbol} currency={currency} />
    </div>
  )
}

function MonthlyChart({ monthly, currency }: { monthly: TossInsightMonth[]; currency: string }) {
  const max = Math.max(1, ...monthly.flatMap(m => [num(m.buyAmount), num(m.sellAmount)]))
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null)

  // 가로 스크롤 박스 안에서는 overflow-y를 visible로 둬도 브라우저가 강제로 auto로 바꿔버려서
  // 카드 경계에서 항상 잘림 — position:fixed로 뷰포트 좌표에 직접 그려서 어떤 부모의 overflow와도 무관하게 함
  const showTooltip = (e: React.MouseEvent<HTMLDivElement>, text: string) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setTooltip({ x: rect.left + rect.width / 2, y: rect.top, text })
  }
  const hideTooltip = () => setTooltip(null)

  return (
    <div style={{ ...cardStyle, marginBottom: 16 }}>
      <div style={{ fontSize: 11, color: '#4B5675', marginBottom: 12 }}>월별 매수/매도</div>
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-end', overflowX: 'auto', paddingBottom: 4 }}>
        {monthly.map(m => (
          <div key={m.month} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 40 }}>
            <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 90 }}>
              <div
                onMouseEnter={e => showTooltip(e, `매수 ${fmt(num(m.buyAmount), currency)}`)}
                onMouseLeave={hideTooltip}
                style={{ width: 14, background: '#3D8EFF', borderRadius: '3px 3px 0 0', height: `${num(m.buyAmount) / max * 90}px` }} />
              <div
                onMouseEnter={e => showTooltip(e, `매도 ${fmt(num(m.sellAmount), currency)}`)}
                onMouseLeave={hideTooltip}
                style={{ width: 14, background: '#FF8C00', borderRadius: '3px 3px 0 0', height: `${num(m.sellAmount) / max * 90}px` }} />
            </div>
            <div style={{ fontSize: 9, color: '#4B5675' }}>{m.month.slice(5)}월</div>
          </div>
        ))}
      </div>
      {tooltip && <FixedTooltip x={tooltip.x} y={tooltip.y} text={tooltip.text} />}
    </div>
  )
}

function FixedTooltip({ x, y, text }: { x: number; y: number; text: string }) {
  return (
    <div style={{
      position: 'fixed', left: x, top: y, transform: 'translate(-50%, calc(-100% - 6px))',
      padding: '4px 8px', borderRadius: 5, whiteSpace: 'nowrap',
      background: '#1A2236', border: '1px solid rgba(255,255,255,0.1)',
      color: '#E2E8F0', fontSize: 11, fontWeight: 600,
      boxShadow: '0 4px 12px rgba(0,0,0,0.4)', pointerEvents: 'none', zIndex: 1000,
    }}>{text}</div>
  )
}

function SymbolTable({ symbols, currency }: { symbols: TossInsightSymbol[]; currency: string }) {
  if (symbols.length === 0) return null

  return (
    <div style={{ overflowX: 'auto', borderRadius: 8 }}>
      <div style={{ ...cardStyle, padding: 0, minWidth: 560 }}>
        <div style={{ ...rowStyle, background: 'rgba(255,255,255,0.03)', color: '#4B5675', fontSize: 11, padding: '10px 16px' }}>
          <span>종목</span>
          <span style={{ textAlign: 'right' }}>보유수량</span>
          <span style={{ textAlign: 'right' }}>매수합</span>
          <span style={{ textAlign: 'right' }}>매도합</span>
          <span style={{ textAlign: 'right' }}>평가금액</span>
          <span style={{ textAlign: 'right' }}>손익</span>
        </div>
        {symbols.map(s => {
          const pnl = num(s.pnl)
          return (
            <div key={s.symbol} style={{ ...rowStyle, borderTop: '1px solid rgba(255,255,255,0.04)', fontSize: 13, padding: '10px 16px' }}>
              <div>
                <div style={{ fontWeight: 600 }}>{s.name}</div>
                <div style={{ fontSize: 10, color: '#4B5675', marginTop: 2 }}>{s.symbol}</div>
              </div>
              <span style={{ textAlign: 'right' }}>{num(s.currentQty).toLocaleString()}주</span>
              <span style={{ textAlign: 'right' }}>{fmt(num(s.totalBuyAmount), currency)}</span>
              <span style={{ textAlign: 'right' }}>{fmt(num(s.totalSellAmount), currency)}</span>
              <span style={{ textAlign: 'right' }}>{fmt(num(s.currentValue), currency)}</span>
              <span style={{ textAlign: 'right', fontWeight: 700, color: colorOf(pnl) }}>
                {sign(pnl)}{fmt(Math.abs(pnl), currency)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SummaryCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={cardStyle}>
      <div style={{ fontSize: 10, color: '#4B5675', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    </div>
  )
}

function Dim({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 12, color: '#4B5675', padding: '40px 0', textAlign: 'center' }}>{children}</div>
}

const cardStyle: React.CSSProperties = {
  background: '#0E1525', border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 8, padding: '12px 16px', overflow: 'hidden',
}

const rowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '2fr 80px 100px 100px 100px 100px',
  alignItems: 'center', gap: 8,
}

const errorStyle: React.CSSProperties = {
  fontSize: 12, color: '#FF4B4B',
  background: 'rgba(255,75,75,0.08)', borderRadius: 6, padding: '10px 12px',
}
