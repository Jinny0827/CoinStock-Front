import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getTossAccountStatus, getTossOrderbook, getTossBuyingPower, getTossSellableQuantity, placeTossOrder,
} from '../../api/tossApi'
import { verifyTotp } from '../../api/totpApi'
import type { ApiError } from '../../api/apiUtils'
import type { TossOrderbook, TossOrderbookLevel } from '../../types/toss'

const TOTP_NOT_SET_UP_CODE  = '4104' // OTP 미설정 — 마이페이지에서 등록부터 해야 함
const TOTP_REVERIFY_CODE    = '4105' // OTP 등록은 돼있는데 5분 grace 만료 — 코드만 다시 입력하면 됨

interface Props { symbol: string; name: string; currentPrice: number }

export default function StockOrderEntry({ symbol, name, currentPrice }: Props) {
  const [openSide, setOpenSide] = useState<'BUY' | 'SELL' | null>(null)

  const { data: status } = useQuery({ queryKey: ['toss-status'], queryFn: getTossAccountStatus })
  if (!status?.connected) return null

  return (
    <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
      <button onClick={() => setOpenSide('BUY')} style={buyBtnStyle}>매수</button>
      <button onClick={() => setOpenSide('SELL')} style={sellBtnStyle}>매도</button>

      {openSide && (
        <OrderPanel symbol={symbol} name={name} side={openSide} currentPrice={currentPrice} onClose={() => setOpenSide(null)} />
      )}
    </div>
  )
}

function OrderPanel({ symbol, name, side, currentPrice, onClose }: {
  symbol: string; name: string; side: 'BUY' | 'SELL'; currentPrice: number; onClose: () => void
}) {
  const queryClient = useQueryClient()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const [price, setPrice] = useState(() => String(currentPrice))
  const [quantity, setQuantity] = useState('')
  const [step, setStep] = useState<'input' | 'confirm' | 'totp' | 'totp-missing'>('input')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [totpError, setTotpError] = useState('')

  const isKr = symbol.endsWith('.KS') || symbol.endsWith('.KQ')
  const currency: 'KRW' | 'USD' = isKr ? 'KRW' : 'USD'

  // 호가는 자주 바뀌지만 Rate Limit 때문에 5초 간격 polling으로만 — 실시간 HTS 수준은 기대 못함
  const { data: orderbook } = useQuery<TossOrderbook | null>({
    queryKey: ['toss-orderbook', symbol],
    queryFn:  () => getTossOrderbook(symbol),
    refetchInterval: 5000,
    staleTime: 4000,
  })

  const { data: buyingPower } = useQuery({
    queryKey: ['toss-buying-power', currency],
    queryFn:  () => getTossBuyingPower(currency),
    enabled:  side === 'BUY',
    staleTime: 30_000,
  })

  const { data: sellableQty } = useQuery({
    queryKey: ['toss-sellable-quantity', symbol],
    queryFn:  () => getTossSellableQuantity(symbol),
    enabled:  side === 'SELL',
    staleTime: 10_000,
  })

  const priceNum = Number(price) || 0
  const qtyNum = Number(quantity) || 0
  const availableCash = side === 'BUY' && buyingPower ? Number(buyingPower.cashBuyingPower) : null
  const estimatedCost = qtyNum * priceNum
  const exceedsBuyingPower = side === 'BUY' && availableCash != null && qtyNum > 0 && estimatedCost > availableCash
  const exceedsSellable    = side === 'SELL' && sellableQty != null && qtyNum > sellableQty

  const canReview = qtyNum > 0 && priceNum > 0 && !exceedsBuyingPower && !exceedsSellable

  async function handleConfirm() {
    setError('')
    setLoading(true)
    try {
      await placeTossOrder({ symbol, side, orderType: 'LIMIT', quantity, price })
      queryClient.invalidateQueries({ queryKey: ['toss-orders'] })
      queryClient.invalidateQueries({ queryKey: ['toss-buying-power'] })
      queryClient.invalidateQueries({ queryKey: ['toss-sellable-quantity'] })
      queryClient.invalidateQueries({ queryKey: ['toss-holdings'] })
      onClose()
    } catch (err: any) {
      const apiErr = err as ApiError
      if (apiErr.code === TOTP_NOT_SET_UP_CODE) {
        setStep('totp-missing')
      } else if (apiErr.code === TOTP_REVERIFY_CODE) {
        setStep('totp')
      } else {
        setError(apiErr.message ?? '주문 실행에 실패했습니다')
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyTotp() {
    setTotpError('')
    setLoading(true)
    try {
      await verifyTotp(totpCode)
      setTotpCode('')
      setStep('confirm')
      await handleConfirm()
    } catch (err: any) {
      setTotpError(err.message ?? '인증번호가 올바르지 않습니다')
    } finally {
      setLoading(false)
    }
  }

  const sideColor = side === 'BUY' ? '#FF8C00' : '#3D8EFF'
  const fmtAmount = (v: number) => currency === 'KRW' ? `${v.toLocaleString()}원` : `$${v.toLocaleString()}`

  return (
    <div onMouseDown={e => { if (e.target === e.currentTarget) onClose() }} style={overlayStyle}>
      <div onClick={e => e.stopPropagation()} style={panelStyle}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>
          <span style={{ color: sideColor, marginRight: 6 }}>{side === 'BUY' ? '매수' : '매도'}</span>
          {name}
        </div>
        <div style={{ fontSize: 10, color: '#4B5675', marginBottom: 10 }}>{symbol}</div>

        <div style={availBoxStyle}>
          <span style={{ color: '#8892A8' }}>{side === 'BUY' ? '매수가능' : '매도가능'}</span>
          <span style={{ color: sideColor, fontWeight: 800, fontSize: 15 }}>
            {side === 'BUY'
              ? (availableCash != null ? fmtAmount(availableCash) : '조회 중...')
              : (sellableQty != null ? `${sellableQty.toLocaleString()}주` : '조회 중...')}
          </span>
        </div>

        <Orderbook book={orderbook} currentPrice={currentPrice} onPickPrice={lvl => setPrice(lvl)} />

        {step === 'totp-missing' ? (
          <>
            <div style={{ ...warningStyle, marginTop: 12 }}>
              🔒 주문 보호장치(OTP)가 설정되지 않아 주문할 수 없습니다. 마이페이지에서 먼저 OTP를 등록해주세요.
            </div>
            <button onClick={onClose} style={{ ...confirmBtnStyle, width: '100%', marginTop: 12 }}>확인</button>
          </>
        ) : step === 'totp' ? (
          <>
            <div style={{ ...warningStyle, marginTop: 12 }}>
              🔒 주문 보호장치(OTP) 인증이 필요합니다. OTP 앱의 6자리 코드를 입력하세요.
            </div>
            <input
              placeholder="6자리 인증번호" value={totpCode} maxLength={6}
              onChange={e => setTotpCode(e.target.value.replace(/\D/g, ''))}
              style={{ ...inputStyle, width: '100%', marginTop: 12, boxSizing: 'border-box', textAlign: 'center', letterSpacing: 2 }}
            />
            {totpError && <div style={errorStyle}>{totpError}</div>}
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button onClick={() => setStep('confirm')} disabled={loading} style={{ ...secondaryBtnStyle, flex: 1 }}>이전</button>
              <button
                onClick={handleVerifyTotp}
                disabled={loading || totpCode.length !== 6}
                style={{ ...confirmBtnStyle, flex: 1, opacity: totpCode.length === 6 ? 1 : 0.5 }}
              >
                {loading ? '확인 중...' : '인증하고 주문'}
              </button>
            </div>
          </>
        ) : step === 'input' ? (
          <>
            <div style={{ fontSize: 11, color: '#8892A8', marginTop: 12, marginBottom: 4 }}>
              {side === 'BUY' ? '매수가' : '매도가'}
            </div>
            <input
              placeholder="가격" value={price} type="number" step="any" min="0"
              onChange={e => setPrice(e.target.value)}
              style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }}
            />
            <div style={{ fontSize: 11, color: '#8892A8', marginTop: 10, marginBottom: 4 }}>수량</div>
            <input
              placeholder="수량" value={quantity} type="number" step="any" min="0"
              onChange={e => setQuantity(e.target.value)}
              style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }}
            />
            <div style={{ fontSize: 11, color: '#4B5675', marginTop: 6 }}>
              한정가 주문입니다 — 입력한 가격에 도달해야 체결됩니다. 호가를 클릭하면 그 가격이 채워집니다.
            </div>
            {exceedsBuyingPower && (
              <div>
                <div style={errorStyle}>매수가능금액을 초과했습니다</div>
                <div style={{ fontSize: 11, color: '#8892A8', marginTop: 6, lineHeight: 1.5 }}>
                  💡 토스 앱 &gt; 증권 &gt; 입금에서 충전 후 다시 시도하세요
                </div>
              </div>
            )}
            {exceedsSellable && <div style={errorStyle}>매도가능수량을 초과했습니다 (보유: {sellableQty?.toLocaleString()}주)</div>}
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button onClick={onClose} style={{ ...secondaryBtnStyle, flex: 1 }}>닫기</button>
              <button
                onClick={() => canReview && setStep('confirm')}
                disabled={!canReview}
                style={{ ...confirmBtnStyle, flex: 1, opacity: canReview ? 1 : 0.5 }}
              >주문 검토</button>
            </div>
          </>
        ) : (
          <>
            <div style={{ ...warningStyle, marginTop: 12 }}>⚠️ 이 주문은 실제 계좌에서 즉시 체결됩니다.</div>
            <div style={{ fontSize: 13, lineHeight: 2, margin: '12px 0' }}>
              <Row label="종목"     value={`${name} (${symbol})`} />
              <Row label="구분"     value={side === 'BUY' ? '매수' : '매도'} />
              <Row label="주문가"   value={priceNum.toLocaleString()} />
              <Row label="수량"     value={quantity} />
              <Row label="주문유형" value="한정가" />
            </div>
            {error && <div style={errorStyle}>{error}</div>}
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button onClick={() => setStep('input')} disabled={loading} style={{ ...secondaryBtnStyle, flex: 1 }}>이전</button>
              <button onClick={handleConfirm} disabled={loading} style={{ ...confirmBtnStyle, flex: 1 }}>
                {loading ? '주문 중...' : '주문 실행'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function Orderbook({ book, currentPrice, onPickPrice }: {
  book?: TossOrderbook | null; currentPrice: number; onPickPrice: (price: string) => void
}) {
  if (!book) return <Dim>호가 조회 중...</Dim>

  const asks = [...(book.asks ?? [])].sort((a, b) => Number(b.price) - Number(a.price))
  const bids = [...(book.bids ?? [])].sort((a, b) => Number(b.price) - Number(a.price))

  if (asks.length === 0 && bids.length === 0) return <Dim>호가 정보가 없습니다</Dim>

  const maxVolume = Math.max(
    1,
    ...asks.map(a => Number(a.volume)),
    ...bids.map(b => Number(b.volume)),
  )

  return (
    <div style={{ marginTop: 8, border: '1px solid rgba(255,255,255,0.07)', borderRadius: 6, overflow: 'hidden' }}>
      {/* 매도호가(파란) — 현재가보다 위 */}
      {asks.map((lvl, i) => (
        <OrderbookRow key={`a${i}`} level={lvl} color="#3D8EFF" maxVolume={maxVolume} onClick={() => onPickPrice(lvl.price)} />
      ))}

      {/* 현재가 구분선 */}
      <div style={dividerStyle}>
        <span>현재가</span>
        <span style={{ fontWeight: 700 }}>{currentPrice.toLocaleString()}</span>
      </div>

      {/* 매수호가(주황) — 현재가보다 아래 */}
      {bids.map((lvl, i) => (
        <OrderbookRow key={`b${i}`} level={lvl} color="#FF8C00" maxVolume={maxVolume} onClick={() => onPickPrice(lvl.price)} />
      ))}
    </div>
  )
}

function OrderbookRow({ level, color, maxVolume, onClick }: {
  level: TossOrderbookLevel; color: string; maxVolume: number; onClick: () => void
}) {
  const volume   = Number(level.volume)
  const widthPct = Math.max(4, Math.min(100, (volume / maxVolume) * 100))

  return (
    <div
      onClick={onClick}
      style={rowStyle}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: `${widthPct}%`, background: `${color}22` }} />
      <span style={{ color, zIndex: 1 }}>{Number(level.price).toLocaleString()}</span>
      <span style={{ color: '#8892A8', zIndex: 1 }}>{volume.toLocaleString()}</span>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ color: '#4B5675' }}>{label}</span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </div>
  )
}

function Dim({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 12, color: '#4B5675', padding: '8px 0' }}>{children}</div>
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0,
  background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 2000,
}

const panelStyle: React.CSSProperties = {
  background: '#111827', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 12, padding: 24,
  width: 'min(380px, calc(100vw - 32px))',
  boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
}

const buyBtnStyle: React.CSSProperties = {
  flex: 1, height: 36,
  background: '#FF8C00', border: 'none', borderRadius: 6,
  color: '#0A0F1C', fontSize: 13, fontWeight: 700, cursor: 'pointer',
}

const sellBtnStyle: React.CSSProperties = {
  flex: 1, height: 36,
  background: '#3D8EFF', border: 'none', borderRadius: 6,
  color: '#0A0F1C', fontSize: 13, fontWeight: 700, cursor: 'pointer',
}

const confirmBtnStyle: React.CSSProperties = {
  height: 34, padding: '0 16px',
  background: '#FF8C00', border: 'none', borderRadius: 6,
  color: '#0A0F1C', fontSize: 12, fontWeight: 700, cursor: 'pointer',
}

const secondaryBtnStyle: React.CSSProperties = {
  height: 34, padding: '0 16px',
  background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6,
  color: '#C9D1E0', fontSize: 12, fontWeight: 600, cursor: 'pointer',
}

const inputStyle: React.CSSProperties = {
  height: 34,
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 6, padding: '0 10px',
  color: '#E2E8F0', fontSize: 12, outline: 'none',
}

const warningStyle: React.CSSProperties = {
  background: 'rgba(255,75,75,0.08)', border: '1px solid rgba(255,75,75,0.3)',
  borderRadius: 8, padding: '10px 12px',
  fontSize: 12, color: '#FF8C8C',
}

const errorStyle: React.CSSProperties = {
  fontSize: 12, color: '#FF4B4B', marginTop: 10,
  background: 'rgba(255,75,75,0.08)', borderRadius: 6, padding: '8px 10px',
}

const availBoxStyle: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 6, padding: '8px 12px', marginBottom: 10,
  fontSize: 12,
}

const rowStyle: React.CSSProperties = {
  position: 'relative', display: 'flex', justifyContent: 'space-between',
  padding: '4px 10px', fontSize: 11, fontVariantNumeric: 'tabular-nums',
  cursor: 'pointer', overflow: 'hidden',
}

const dividerStyle: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between',
  padding: '5px 10px', fontSize: 11,
  background: 'rgba(255,255,255,0.06)',
  color: '#C9D1E0',
  borderTop: '1px solid rgba(255,255,255,0.1)',
  borderBottom: '1px solid rgba(255,255,255,0.1)',
}
