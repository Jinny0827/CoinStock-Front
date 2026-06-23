import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { connectTossAccount, disconnectTossAccount, getTossAccountStatus, getTossHoldings } from '../../api/tossApi'
import type { TossHoldings } from '../../types/toss'

// 토스 API는 모든 수치를 문자열로 내려준다 — 안전하게 숫자로 변환
const num = (v?: string) => Number(v ?? 0) || 0

const fmtKrw = (v: number) => `${v.toLocaleString()}원`
const fmtUsd = (v: number) => `$${v.toLocaleString()}`
const sign   = (v: number) => v > 0 ? '+' : ''
const colorOf = (v: number) => v >= 0 ? '#FF8C00' : '#FF4B4B'

interface StatLine { text: string; color?: string }

// 국장→평가 같은 "전/후" 비교용 — KRW/USD 둘 다 있으면 통화별로 한 줄씩
function rangeLines(fromKrw: number, toKrw: number, fromUsd: number, toUsd: number): StatLine[] {
  const lines: StatLine[] = []
  if (fromKrw !== 0 || toKrw !== 0) lines.push({ text: `${fmtKrw(fromKrw)} → ${fmtKrw(toKrw)}` })
  if (fromUsd !== 0 || toUsd !== 0) lines.push({ text: `${fmtUsd(fromUsd)} → ${fmtUsd(toUsd)}` })
  return lines.length > 0 ? lines : [{ text: fmtKrw(0) }]
}

// 손익 같은 단일 부호값용 — KRW/USD 둘 다 있으면 통화별로 한 줄씩, 각자 부호/색 독립
function pnlLines(krw: number, usd: number): StatLine[] {
  const lines: StatLine[] = []
  if (krw !== 0) lines.push({ text: `${sign(krw)}${fmtKrw(krw)}`, color: colorOf(krw) })
  if (usd !== 0) lines.push({ text: `${sign(usd)}${fmtUsd(usd)}`, color: colorOf(usd) })
  return lines.length > 0 ? lines : [{ text: fmtKrw(0), color: colorOf(0) }]
}

export default function TossAccountSection() {
  const queryClient = useQueryClient()

  const { data: status, isLoading: statusLoading } = useQuery({
    queryKey: ['toss-status'],
    queryFn: getTossAccountStatus,
  })

  const connected = status?.connected ?? false

  const { data: holdings, isLoading: holdingsLoading, isError: holdingsError, error: holdingsErrorObj, refetch: refetchHoldings } = useQuery({
    queryKey: ['toss-holdings'],
    queryFn: getTossHoldings,
    enabled: connected,
    retry: false,
  })

  async function handleDisconnect() {
    if (!confirm('토스 계좌 연동을 해제하시겠습니까?')) return
    await disconnectTossAccount()
    queryClient.invalidateQueries({ queryKey: ['toss-status'] })
    queryClient.invalidateQueries({ queryKey: ['toss-holdings'] })
  }

  return (
    <div style={cardStyle}>
      <div style={headerStyle}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#8892A8' }}>토스증권 계좌 연동</span>
        {connected && (
          <button onClick={handleDisconnect} style={disconnectBtnStyle}>연동 해제</button>
        )}
      </div>

      <div style={{ padding: '16px 20px' }}>
        {statusLoading ? (
          <Dim>연동 상태 확인 중...</Dim>
        ) : connected ? (
          <HoldingsView
            loading={holdingsLoading}
            holdings={holdings}
            error={holdingsError ? (holdingsErrorObj as Error)?.message : undefined}
            onRetry={() => refetchHoldings()}
          />
        ) : (
          <ConnectForm onConnected={() => {
            queryClient.invalidateQueries({ queryKey: ['toss-status'] })
          }} />
        )}
      </div>
    </div>
  )
}

function ConnectForm({ onConnected }: { onConnected: () => void }) {
  const [clientId,     setClientId]     = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [error,        setError]        = useState('')
  const [loading,       setLoading]     = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await connectTossAccount(clientId, clientSecret)
      onConnected()
    } catch (err: any) {
      setError(err.message ?? '토스 연동에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ fontSize: 12, color: '#4B5675', marginBottom: 12 }}>
        토스증권 OpenAPI에서 발급받은 키를 입력하면 보유종목/평가손익을 조회할 수 있습니다.
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <input
          placeholder="Client ID" value={clientId} required
          onChange={e => setClientId(e.target.value)}
          style={{ ...inputStyle, flex: '1 1 160px' }}
        />
        <input
          placeholder="Client Secret" value={clientSecret} required type="password"
          onChange={e => setClientSecret(e.target.value)}
          style={{ ...inputStyle, flex: '1 1 200px' }}
        />
        <button type="submit" disabled={loading} style={connectBtnStyle}>
          {loading ? '연동 중...' : '연동하기'}
        </button>
      </div>
      {error && <div style={errorStyle}>{error}</div>}
    </form>
  )
}

function HoldingsView({ loading, holdings, error, onRetry }: {
  loading: boolean; holdings?: TossHoldings; error?: string; onRetry: () => void
}) {
  if (loading) return <Dim>보유종목 조회 중...</Dim>

  if (error) {
    return (
      <div>
        <div style={errorStyle}>{error}</div>
        <button onClick={onRetry} style={{ ...connectBtnStyle, marginTop: 10 }}>다시 시도</button>
      </div>
    )
  }

  const items = holdings?.items ?? []
  const dailyKrw  = num(holdings?.dailyProfitLoss?.amount?.krw)
  const dailyUsd  = num(holdings?.dailyProfitLoss?.amount?.usd)
  const dailyRate = num(holdings?.dailyProfitLoss?.rate)
  const purchaseKrw = num(holdings?.totalPurchaseAmount?.krw)
  const purchaseUsd = num(holdings?.totalPurchaseAmount?.usd)
  const marketKrw    = num(holdings?.marketValue?.amount?.krw)
  const marketUsd    = num(holdings?.marketValue?.amount?.usd)
  const pnlKrw  = num(holdings?.profitLoss?.amount?.krw)
  const pnlUsd  = num(holdings?.profitLoss?.amount?.usd)
  const pnlRate = num(holdings?.profitLoss?.rate)

  if (items.length === 0) return <Dim>보유 중인 종목이 없습니다</Dim>

  const pnlSign = sign

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 14 }}>
        <MiniStat label="매입 → 평가" lines={rangeLines(purchaseKrw, marketKrw, purchaseUsd, marketUsd)} />
        <MiniStat
          label="총 평가손익"
          lines={pnlLines(pnlKrw, pnlUsd)}
          sub={`(${pnlSign(pnlRate)}${pnlRate.toFixed(2)}%)`}
        />
      </div>

      <div style={{ fontSize: 12, color: '#8892A8', marginBottom: 12 }}>
        일일 손익{' '}
        {pnlLines(dailyKrw, dailyUsd).map((line, i) => (
          <span key={i} style={{ color: line.color, fontWeight: 700, marginRight: 6 }}>{line.text}</span>
        ))}
        ({pnlSign(dailyRate)}{dailyRate.toFixed(2)}%)
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.map((item, i) => {
          const quantity  = num(item.quantity)
          const lastPrice = num(item.lastPrice)
          const avgPrice  = num(item.averagePurchasePrice)
          const rate      = num(item.profitLoss?.rate)
          return (
            <div key={item.symbol ?? i} style={holdingRowStyle}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{item.name ?? item.symbol}</div>
                <div style={{ fontSize: 10, color: '#4B5675', marginTop: 2 }}>
                  {quantity.toLocaleString()}주 · 평단 {avgPrice.toLocaleString()}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{lastPrice.toLocaleString()}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: colorOf(rate) }}>
                  {pnlSign(rate)}{rate.toFixed(2)}%
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Dim({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 12, color: '#4B5675' }}>{children}</div>
}

function MiniStat({ label, lines, sub }: { label: string; lines: StatLine[]; sub?: string }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 6, padding: '8px 10px',
    }}>
      <div style={{ fontSize: 10, color: '#4B5675', marginBottom: 4 }}>{label}</div>
      {lines.map((line, i) => (
        <div key={i} style={{ fontSize: 13, fontWeight: 700, color: line.color ?? '#E2E8F0' }}>
          {line.text}
          {sub && i === lines.length - 1 && (
            <span style={{ fontSize: 10, fontWeight: 400, color: '#4B5675', marginLeft: 4 }}>{sub}</span>
          )}
        </div>
      ))}
    </div>
  )
}

const cardStyle: React.CSSProperties = {
  background: '#0E1525', border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 8, marginBottom: 20, overflow: 'hidden',
}

const headerStyle: React.CSSProperties = {
  padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)',
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
}

const inputStyle: React.CSSProperties = {
  height: 34, boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 6, padding: '0 10px',
  color: '#E2E8F0', fontSize: 12, outline: 'none',
}

const connectBtnStyle: React.CSSProperties = {
  height: 34, padding: '0 16px',
  background: '#FF8C00', border: 'none', borderRadius: 6,
  color: '#0A0F1C', fontSize: 12, fontWeight: 700, cursor: 'pointer',
}

const disconnectBtnStyle: React.CSSProperties = {
  height: 26, padding: '0 10px',
  background: 'transparent', border: '1px solid rgba(255,75,75,0.4)',
  borderRadius: 6, color: '#FF4B4B', fontSize: 11, cursor: 'pointer',
}

const errorStyle: React.CSSProperties = {
  fontSize: 12, color: '#FF4B4B', marginTop: 10,
  background: 'rgba(255,75,75,0.08)', borderRadius: 6, padding: '8px 10px',
}

const holdingRowStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
}
