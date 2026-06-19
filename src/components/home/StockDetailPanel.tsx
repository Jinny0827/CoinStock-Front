import { useState, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useStockStore } from '../../store/stockStore'
import { getFinancial, getOhlcv, getPredict, getPredictHistory, getStockNews } from '../../api/stockApi'
import type { OhlcvBar, StockQuote, DisclosureItem, NewsItem, Prediction, PredictionHistoryItem } from '../../types/stock'

interface Props {
  isPenny?: boolean
  symbol?:  string
  stock?:   StockQuote | null
}

function IndicatorBadge({ label, tip }: { label: string; tip: string }) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)

  const handleMouseEnter = (e: React.MouseEvent<HTMLSpanElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    setPos({ x: r.left + r.width / 2, y: r.top })
  }

  return (
    <span style={{ display: 'inline-block' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setPos(null)}
    >
      <span style={{
        fontSize: 10, color: '#4B5675',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.06)',
        padding: '2px 7px', borderRadius: 4,
        cursor: 'default',
      }}>{label}</span>
      {pos && (
        <div style={{
          position: 'fixed',
          left: pos.x, top: pos.y - 8,
          transform: 'translate(-50%, -100%)',
          zIndex: 9999,
          background: '#1E2540',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 6, padding: '7px 10px',
          fontSize: 11, color: '#C8D0E0',
          whiteSpace: 'pre', lineHeight: 1.6,
          boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
          pointerEvents: 'none',
        }}>
          {tip}
          <div style={{
            position: 'absolute', top: '100%', left: '50%',
            transform: 'translateX(-50%)',
            width: 0, height: 0,
            borderLeft: '5px solid transparent',
            borderRight: '5px solid transparent',
            borderTop: '5px solid #1E2540',
          }} />
        </div>
      )}
    </span>
  )
}

export default function StockDetailPanel({ isPenny = false, symbol: propSymbol, stock: propStock }: Props) {
  const storeSymbol = useStockStore(s => s.selectedSymbol)
  const storeStock  = useStockStore(s => s.selectedStock)
  const symbol        = propSymbol ?? storeSymbol
  const selectedStock = propStock !== undefined ? propStock : storeStock
  const [detailOpen, setDetailOpen] = useState(false)

  // 가격 기반 동전주 자동 판별 — isPenny prop 없이도 세력감지 탭 등에서 동작
  const isKrSymbol    = symbol.endsWith('.KS') || symbol.endsWith('.KQ')
  const isPennyByPrice = selectedStock != null
    ? (isKrSymbol
        ? selectedStock.price > 0 && selectedStock.price < 10_000
        : selectedStock.price > 0 && selectedStock.price < 5)
    : false
  const showPennyPanel = isPenny || isPennyByPrice

  const { data: financial } = useQuery({
    queryKey: ['financial', symbol],
    queryFn:  () => getFinancial(symbol),
    staleTime: 5 * 60_000,
    enabled: !!symbol,
  })

  const { data: bars = [] } = useQuery({
    queryKey: ['ohlcv', symbol, '1d', '1mo'],
    queryFn:  () => getOhlcv(symbol, '1d', '1mo'),
    staleTime: 5 * 60_000,
    enabled: !!symbol,
  })

  const { data: prediction } = useQuery({
    queryKey: ['predict', symbol],
    queryFn:  () => getPredict(symbol),
    staleTime: 24 * 60 * 60_000,
    enabled: !!symbol,
  })

  const { data: predictHistory = [] } = useQuery({
    queryKey: ['predict-history', symbol],
    queryFn:  () => getPredictHistory(symbol),
    staleTime: 60 * 60_000,
    enabled: !!symbol,
  })

  const { data: stockNews } = useQuery({
    queryKey: ['news', symbol],
    queryFn:  () => getStockNews(symbol),
    staleTime: 15 * 60_000,
    enabled: !!symbol,
  })

  const latestBar    = bars[bars.length - 1]
  const prevBar      = bars[bars.length - 2]
  const currentPrice = latestBar?.close ?? 0
  const changeRate   = (latestBar && prevBar && prevBar.close)
    ? (latestBar.close - prevBar.close) / prevBar.close * 100
    : 0
  const up = changeRate >= 0

  // ── 이름: selectedStock.name → financial.corpName → symbol 순으로 fallback
  const displayName = selectedStock?.name || financial?.corpName || symbol

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '16px 20px' }}>

      {/* 종목 헤더 */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>
          {displayName}
        </div>
        <div style={{ fontSize: 11, color: '#4B5675', marginBottom: 12 }}>{symbol}</div>

        {latestBar && (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <div style={{
              fontSize: 28, fontWeight: 800,
              color: '#FF8C00', letterSpacing: '-1px',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {currentPrice.toLocaleString()}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: up ? '#FF8C00' : '#FF4B4B' }}>
              {up ? '▲' : '▼'} {up ? '+' : ''}{changeRate.toFixed(2)}%
            </div>
          </div>
        )}
      </div>

      {/* 회사 소개 */}
      {prediction?.companyDescription && (
        <div style={{
          marginBottom: 14,
          background: 'linear-gradient(135deg, rgba(61,142,255,0.06) 0%, rgba(255,140,0,0.04) 100%)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderLeft: '3px solid #3D8EFF',
          borderRadius: 8, padding: '10px 14px',
          display: 'flex', gap: 10, alignItems: 'flex-start',
        }}>
          <span style={{ fontSize: 16, lineHeight: 1, flexShrink: 0, marginTop: 1 }}>🏢</span>
          <div>
            <div style={{ fontSize: 10, color: '#3D8EFF', fontWeight: 700, marginBottom: 4, letterSpacing: 0.5 }}>
              회사 소개
            </div>
            <div style={{ fontSize: 12, color: '#C9D1E0', lineHeight: 1.7 }}>
              {prediction.companyDescription}
            </div>
          </div>
        </div>
      )}

      {/* 스파크라인 차트 + 예측 밴드 + 과거 예측 마커 */}
      {bars.length > 1 && <SparkChart bars={bars} prediction={prediction} history={predictHistory} />}

      {/* ── 동전주: 급등 가능성 점수 분석 (가격 기반 자동 판별 포함) ── */}
      {showPennyPanel && selectedStock ? (
        <PennyScorePanel stock={selectedStock} />
      ) : (
        /* ── 주요 종목: EPS/PER/PBR/매출성장 ── */
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: 6, marginTop: 14,
        }}>
          {[
            { label: 'EPS',      value: financial?.eps?.toFixed(0) ?? '-',   unit: '원' },
            { label: 'PER',      value: financial?.per?.toFixed(1) ?? '-',   unit: 'x'  },
            { label: 'PBR',      value: financial?.pbr?.toFixed(2) ?? '-',   unit: 'x'  },
            { label: '매출성장', value: financial?.revenueGrowth != null
                ? (financial.revenueGrowth > 0 ? '+' : '') + financial.revenueGrowth.toFixed(1)
                : '-',                                                         unit: '%' },
          ].map(stat => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>
      )}

      {/* AI 예측 */}
      {prediction && (
        <div style={{
          marginTop: 16,
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 8, padding: 14,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <span style={{
              fontSize: 9, fontWeight: 700,
              background: 'rgba(240,180,41,0.12)', color: '#F0B429',
              padding: '2px 6px', borderRadius: 3, letterSpacing: '0.05em',
            }}>AI 예측</span>
            <span style={{ fontSize: 12, fontWeight: 600 }}>방향성 분석</span>
            <span style={{
              marginLeft: 'auto', fontSize: 11, fontWeight: 700,
              color: prediction.direction === 'up'   ? '#FF8C00'
                   : prediction.direction === 'down' ? '#FF4B4B' : '#8892A8',
            }}>
              {prediction.direction === 'up' ? '▲ 상승'
               : prediction.direction === 'down' ? '▼ 하락' : '— 중립'}
            </span>
          </div>

          <div style={{ fontSize: 12, lineHeight: 1.7, color: '#C9D1E0', marginBottom: 10 }}>
            {prediction.reason}
            {prediction.detail && (
              <span
                onClick={() => setDetailOpen(true)}
                style={{
                  marginLeft: 8, fontSize: 10, color: '#3D8EFF',
                  cursor: 'pointer', textDecoration: 'underline', whiteSpace: 'nowrap',
                }}
              >자세히 보기</span>
            )}
          </div>

          {/* 상세 분석 모달 */}
          {detailOpen && prediction.detail && (
            <div
              onClick={() => setDetailOpen(false)}
              style={{
                position: 'fixed', inset: 0,
                background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 2000,
              }}
            >
              <div
                onClick={e => e.stopPropagation()}
                style={{
                  background: '#111827',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12, padding: 24,
                  width: 'min(480px, calc(100vw - 32px))',
                  boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <span style={{
                    fontSize: 9, fontWeight: 700,
                    background: 'rgba(240,180,41,0.12)', color: '#F0B429',
                    padding: '2px 6px', borderRadius: 3,
                  }}>AI 예측</span>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>상세 분석</span>
                  <button
                    onClick={() => setDetailOpen(false)}
                    style={{
                      marginLeft: 'auto', background: 'none', border: 'none',
                      color: '#4B5675', fontSize: 18, cursor: 'pointer', lineHeight: 1,
                    }}
                  >×</button>
                </div>
                <p style={{
                  fontSize: 13, lineHeight: 1.8, color: '#C9D1E0',
                  margin: 0,
                }}>
                  {prediction.detail}
                </p>
              </div>
            </div>
          )}

          {/* 신뢰도 바 */}
          <div style={{ fontSize: 10, color: '#4B5675', display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span>신뢰도</span>
            <span style={{ color: '#F0B429', fontWeight: 700 }}>{prediction.confidence}%</span>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 4, height: 4 }}>
            <div style={{
              height: '100%', borderRadius: 4,
              width: `${prediction.confidence}%`,
              background: 'linear-gradient(90deg,#FF8C00,#00E5B0)',
              transition: 'width 0.5s',
            }} />
          </div>

          {/* 목표가 */}
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            marginTop: 8, fontSize: 11, color: '#4B5675',
          }}>
            <span>하단 {prediction.targetLow.toLocaleString()}</span>
            <span>상단 {prediction.targetHigh.toLocaleString()}</span>
          </div>

          {/* 지표 뱃지 */}
          <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
            {prediction.indicators && [
              {
                label: `MA5 ${prediction.indicators.ma5.toLocaleString()}`,
                tip: '5일 이동평균선 — 최근 5일 종가 평균.\n현재가가 MA5 위에 있으면 단기 강세 신호.',
              },
              {
                label: `MA20 ${prediction.indicators.ma20.toLocaleString()}`,
                tip: '20일 이동평균선 — 최근 20일 종가 평균.\nMA5가 MA20을 상향 돌파하면 골든크로스(매수 신호).',
              },
              {
                label: `RSI ${prediction.indicators.rsi}`,
                tip: '상대강도지수 (0~100)\n70 이상 → 과매수 (조정 가능성)\n30 이하 → 과매도 (반등 가능성)',
              },
            ].map(({ label, tip }) => (
              <IndicatorBadge key={label} label={label} tip={tip} />
            ))}
          </div>
        </div>
      )}

      {/* 공시 + 뉴스 */}
      {stockNews && (
        <NewsSection
          disclosures={stockNews.disclosures}
          news={stockNews.news}
        />
      )}
    </div>
  )
}

// ── 동전주 급등 가능성 점수 패널 ──────────────────────────────
// Java PennyStockEvaluator와 동일한 로직으로 각 항목 점수를 계산해 시각화
function PennyScorePanel({ stock }: { stock: StockQuote }) {
  const isKr = stock.symbol.endsWith('.KS') || stock.symbol.endsWith('.KQ')

  // 1. 거래량 폭발 (max 40)
  const avg10 = stock.avgVolume10Day
  let volScore = 0
  let volRatio = 0
  let volLabel = '-'
  if (avg10 > 0) {
    volRatio = stock.volume / avg10
    volLabel = `${volRatio.toFixed(1)}x`
    if      (volRatio >= 10) volScore = 400
    else if (volRatio >=  5) volScore = 30
    else if (volRatio >=  3) volScore = 20
    else if (volRatio >=  2) volScore = 12
    else if (volRatio >=  1.5) volScore = 6
  } else if (stock.volume > 0) {
    const thr = isKr ? 50_000 : 100_000
    if      (stock.volume >= thr * 10) { volScore = 15; volLabel = '대량' }
    else if (stock.volume >= thr * 3)  { volScore = 8;  volLabel = '중량' }
    else if (stock.volume >= thr)      { volScore = 3;  volLabel = '소량' }
  }

  // 2. 가격 모멘텀 (max 25)
  const chg = stock.changePercent
  let momScore = 0
  if      (chg >= 10) momScore = 25
  else if (chg >=  7) momScore = 20
  else if (chg >=  5) momScore = 15
  else if (chg >=  3) momScore =  8
  else if (chg >=  1) momScore =  3

  // 3. 저점 반등 (max 20)
  const low52 = stock.low52Week
  let lowScore = 0
  let fromLowPct = 0
  if (low52 > 0 && stock.price > 0) {
    const fromLow = stock.price / low52
    fromLowPct = (fromLow - 1) * 100
    if      (fromLow <= 1.05) lowScore = 20
    else if (fromLow <= 1.10) lowScore = 15
    else if (fromLow <= 1.20) lowScore = 10
    else if (fromLow <= 1.35) lowScore =  5
  }

  // 4. 거래대금 (max 15)
  const tvRaw = stock.price * stock.volume
  let tvScore = 0
  let tvLabel = '-'
  if (isKr) {
    if      (tvRaw >= 500_000_000) { tvScore = 15; tvLabel = (tvRaw / 100_000_000).toFixed(0) + '억' }
    else if (tvRaw >= 100_000_000) { tvScore = 10; tvLabel = (tvRaw / 100_000_000).toFixed(1) + '억' }
    else if (tvRaw >=  50_000_000) { tvScore =  5; tvLabel = (tvRaw / 100_000_000).toFixed(1) + '억' }
    else                           {               tvLabel = (tvRaw / 100_000_000).toFixed(2) + '억' }
  } else {
    if      (tvRaw >= 1_000_000) { tvScore = 15; tvLabel = '$' + (tvRaw / 1_000_000).toFixed(1) + 'M' }
    else if (tvRaw >=   500_000) { tvScore = 10; tvLabel = '$' + (tvRaw / 1_000_000).toFixed(2) + 'M' }
    else if (tvRaw >=   100_000) { tvScore =  5; tvLabel = '$' + (tvRaw / 1_000).toFixed(0) + 'K'    }
    else                         {               tvLabel = '$' + (tvRaw / 1_000).toFixed(0) + 'K'    }
  }

  const totalScore = Math.min(volScore + momScore + lowScore + tvScore, 100)

  const items = [
    { label: '거래량 폭발',  score: volScore,  max: 40, sub: avg10 > 0 ? volLabel : volLabel, color: '#FF8C00' },
    { label: '가격 모멘텀',  score: momScore,  max: 25, sub: `${chg >= 0 ? '+' : ''}${chg.toFixed(1)}%`, color: '#3D8EFF' },
    { label: '저점 반등',    score: lowScore,  max: 20, sub: low52 > 0 ? `+${fromLowPct.toFixed(1)}%` : '-', color: '#F0B429' },
    { label: '거래대금',     score: tvScore,   max: 15, sub: tvLabel,  color: '#FF6B6B' },
  ]

  return (
    <div style={{ marginTop: 14 }}>
      {/* 총점 헤더 */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 10,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 8, padding: '8px 12px',
      }}>
        <span style={{ fontSize: 11, color: '#8892A8', fontWeight: 600 }}>급등 가능성 점수</span>
        <span style={{
          fontSize: 20, fontWeight: 800,
          color: totalScore >= 70 ? '#FF8C00' : totalScore >= 40 ? '#F0B429' : '#FF6B6B',
          fontVariantNumeric: 'tabular-nums',
        }}>{totalScore}<span style={{ fontSize: 11, color: '#4B5675', marginLeft: 2 }}>점</span></span>
      </div>

      {/* 항목별 점수 바 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map(item => (
          <ScoreBar key={item.label} {...item} />
        ))}
      </div>

      {/* 수급 요약 */}
      <div style={{
        marginTop: 10, padding: '8px 12px',
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 6, fontSize: 10, color: '#4B5675',
        display: 'flex', justifyContent: 'space-between',
      }}>
        <span>거래량 {stock.volume >= 1_000_000
          ? (stock.volume / 1_000_000).toFixed(1) + 'M'
          : stock.volume >= 1_000
          ? (stock.volume / 1_000).toFixed(0) + 'K'
          : stock.volume}</span>
        <span>52W 저 {isKr ? stock.low52Week.toLocaleString() + '원' : '$' + stock.low52Week.toFixed(2)}</span>
        <span>52W 고 {isKr ? stock.high52Week.toLocaleString() + '원' : '$' + stock.high52Week.toFixed(2)}</span>
      </div>
    </div>
  )
}

// ── 점수 바 ───────────────────────────────────────────────────
function ScoreBar({ label, score, max, sub, color }: {
  label: string; score: number; max: number; sub: string; color: string
}) {
  const pct = max > 0 ? (score / max) * 100 : 0
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3, fontSize: 10 }}>
        <span style={{ color: '#8892A8' }}>{label}</span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ color: '#4B5675' }}>{sub}</span>
          <span style={{ fontWeight: 700, color: score > 0 ? color : '#2A3148',
            fontVariantNumeric: 'tabular-nums', minWidth: 28, textAlign: 'right' }}>
            {score}<span style={{ fontSize: 9, color: '#4B5675' }}>/{max}</span>
          </span>
        </div>
      </div>
      <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 3, height: 5 }}>
        <div style={{
          height: '100%', borderRadius: 3,
          width: `${pct}%`,
          background: score > 0
            ? `linear-gradient(90deg, ${color}99, ${color})`
            : 'transparent',
          transition: 'width 0.4s ease',
        }} />
      </div>
    </div>
  )
}

// ── 고도화 차트: 가격 + 거래량 + MA + 예측밴드 + 호버 툴팁 ────────
function SparkChart({ bars, prediction, history = [] }: {
  bars: OhlcvBar[]
  prediction?: Prediction
  history?: PredictionHistoryItem[]
}) {
  const [hov,      setHov]      = useState<{ idx: number; px: number; py: number } | null>(null)
  const [predHov,  setPredHov]  = useState(false)
  const [histHov,  setHistHov]  = useState<{ item: PredictionHistoryItem; px: number; py: number } | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  // 날짜 → 바 인덱스 맵 (과거 예측 마커 매칭용)
  const barDateMap = new Map(
    bars.map((b, i) => [new Date(b.timestamp * 1000).toISOString().slice(0, 10), i])
  )
  const histMarkers = history
    .map(item => ({ item, barIdx: barDateMap.get(item.createdAt.slice(0, 10)) }))
    .filter((m): m is { item: PredictionHistoryItem; barIdx: number } => m.barIdx !== undefined)

  // ── 레이아웃 상수
  const W = 560, PAD_L = 6, PAD_R = 50, PAD_T = 8
  const HP = 150, HG = 4, HV = 34, HX = 16
  const H  = HP + HG + HV + HX
  const SP = PAD_L + (W - PAD_L - PAD_R) * 0.77   // actual | prediction 분기 X
  const PE = W - PAD_R                              // prediction end X

  const closes  = bars.map(b => b.close)
  const ma5arr  = computeMA(closes, 5)
  const ma20arr = computeMA(closes, 20)

  const allVals = [...closes]
  if (prediction) allVals.push(prediction.targetLow, prediction.targetHigh)
  const minV = Math.min(...allVals), maxV = Math.max(...allVals)
  const rngV = maxV - minV || 1

  const toX = (i: number) => PAD_L + (i / Math.max(bars.length - 1, 1)) * (SP - PAD_L)
  const toY = (v: number) => PAD_T + (HP - PAD_T - 4) * (1 - (v - minV) / rngV)

  const maxVol = Math.max(...bars.map(b => b.volume), 1)
  const volTop = HP + HG
  const barW   = Math.max(1, (SP - PAD_L) / bars.length * 0.7)

  const lastClose = closes[closes.length - 1]
  const lastY     = toY(lastClose)
  const priceUp   = lastClose >= closes[0]
  const priceCol  = priceUp ? '#FF8C00' : '#FF4B4B'
  const predCol   = prediction?.direction === 'up'   ? '#FF8C00'
                  : prediction?.direction === 'down' ? '#FF4B4B' : '#8892A8'

  // ── 가격 경로 (cubic bezier)
  const pts = closes.map((c, i) => ({ x: toX(i), y: toY(c) }))
  let pricePth = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`
  for (let i = 1; i < pts.length; i++) {
    const mx = (pts[i-1].x + pts[i].x) / 2
    pricePth += ` C ${mx.toFixed(1)} ${pts[i-1].y.toFixed(1)},${mx.toFixed(1)} ${pts[i].y.toFixed(1)},${pts[i].x.toFixed(1)} ${pts[i].y.toFixed(1)}`
  }
  const areaPth = pricePth + ` L ${SP.toFixed(1)} ${HP} L ${PAD_L} ${HP} Z`

  // ── MA 경로 빌더 (closures: toX, toY)
  const buildMA = (arr: (number | null)[]) => {
    let d = '', px = 0, py = 0
    for (let i = 0; i < arr.length; i++) {
      const v = arr[i]
      if (v === null) continue
      const x = toX(i), y = toY(v)
      if (!d) { d = `M ${x.toFixed(1)} ${y.toFixed(1)}` }
      else {
        const mx = (px + x) / 2
        d += ` C ${mx.toFixed(1)} ${py.toFixed(1)},${mx.toFixed(1)} ${y.toFixed(1)},${x.toFixed(1)} ${y.toFixed(1)}`
      }
      px = x; py = y
    }
    return d
  }
  const ma5Path  = buildMA(ma5arr)
  const ma20Path = buildMA(ma20arr)

  // ── Y축 눈금
  const fmtY = (v: number) => {
    if (v >= 1_000_000) return (v / 10_000).toFixed(0) + '만'
    if (v >= 10_000)    return (v / 1_000).toFixed(0) + 'K'
    if (v >= 1_000)     return (v / 1_000).toFixed(1) + 'K'
    if (v >= 100)       return v.toFixed(0)
    return v.toFixed(v < 10 ? 2 : 1)
  }
  const yTicks = [0, 0.33, 0.66, 1].map(r => ({ val: minV + rngV * r, y: toY(minV + rngV * r) }))

  // ── X축 눈금 (약 5개)
  const xStep  = Math.max(1, Math.floor(bars.length / 5))
  const xTicks = bars
    .map((b, i) => ({ i, b }))
    .filter((_, i) => i % xStep === 0)
    .map(({ i, b }) => {
      const dt = new Date(b.timestamp * 1000)
      return { i, label: `${dt.getMonth()+1}/${dt.getDate()}` }
    })

  // ── 예측 좌표
  const predHighY = prediction ? toY(prediction.targetHigh) : lastY
  const predLowY  = prediction ? toY(prediction.targetLow)  : lastY
  const predMidY  = (predHighY + predLowY) / 2

  // ── 마우스 핸들러
  const onMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const sr  = e.currentTarget.getBoundingClientRect()
    const wr  = wrapRef.current?.getBoundingClientRect()
    const svgX = ((e.clientX - sr.left) / sr.width) * W

    if (svgX > SP) {
      setPredHov(true); setHov(null); return
    }
    setPredHov(false)

    let best = 0, minD = Infinity
    for (let i = 0; i < bars.length; i++) {
      const dist = Math.abs(toX(i) - svgX)
      if (dist < minD) { minD = dist; best = i }
    }
    const px = wr ? e.clientX - wr.left : e.nativeEvent.offsetX
    const py = wr ? e.clientY - wr.top  : e.nativeEvent.offsetY
    setHov({ idx: best, px, py })
  }
  const onMouseLeave = () => { setHov(null); setPredHov(false) }

  const hBar  = hov ? bars[hov.idx] : null
  const wrapW = wrapRef.current?.offsetWidth ?? 300

  return (
    <div ref={wrapRef} style={{ position: 'relative', margin: '8px -4px 0', userSelect: 'none' }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', height: 185, display: 'block' }}
        preserveAspectRatio="none"
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
      >
        <defs>
          <linearGradient id="sg-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={priceCol} stopOpacity="0.2" />
            <stop offset="100%" stopColor={priceCol} stopOpacity="0"   />
          </linearGradient>
          <clipPath id="sg-clip">
            <rect x={PAD_L} y={0} width={SP - PAD_L} height={HP} />
          </clipPath>
        </defs>

        {/* Y축 그리드 + 레이블 */}
        {yTicks.map((t, i) => (
          <g key={i}>
            <line x1={PAD_L} y1={t.y} x2={PE} y2={t.y}
              stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
            <text x={PE + 3} y={t.y + 3.5} fontSize="8" fill="#3A4258" textAnchor="start">
              {fmtY(t.val)}
            </text>
          </g>
        ))}

        {/* 가격 영역 + 선 + MA */}
        <g clipPath="url(#sg-clip)">
          <path d={areaPth} fill="url(#sg-grad)" />
          <path d={pricePth} fill="none" stroke={priceCol} strokeWidth="1.5" />
          {ma5Path  && <path d={ma5Path}  fill="none" stroke="#F0B429" strokeWidth="0.9" opacity="0.75" />}
          {ma20Path && <path d={ma20Path} fill="none" stroke="#3D8EFF" strokeWidth="0.9" opacity="0.75" />}
        </g>

        {/* 예측 밴드 */}
        {prediction && (
          <g>
            <path
              d={`M ${SP} ${predHighY} L ${PE} ${predHighY-3} L ${PE} ${predLowY+3} L ${SP} ${predLowY} Z`}
              fill={`${predCol}18`}
            />
            <line x1={SP} y1={predHighY} x2={PE} y2={predHighY-3}
              stroke={predCol} strokeWidth="0.8" strokeDasharray="3,2" opacity="0.5" />
            <line x1={SP} y1={predLowY}  x2={PE} y2={predLowY+3}
              stroke={predCol} strokeWidth="0.8" strokeDasharray="3,2" opacity="0.5" />
            <line x1={SP} y1={lastY} x2={PE} y2={predMidY}
              stroke={predCol} strokeWidth="1.5" strokeDasharray="5,3" />
            <line x1={SP} y1={PAD_T/2} x2={SP} y2={HP}
              stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" strokeDasharray="3,3" />
          </g>
        )}

        {/* 거래량 막대 */}
        {bars.map((b, i) => {
          const bH   = (b.volume / maxVol) * HV
          const bCol = i > 0 && b.close >= bars[i-1].close ? '#FF8C00' : '#FF4B4B'
          return (
            <rect key={i}
              x={toX(i) - barW / 2} y={volTop + HV - bH}
              width={barW} height={bH}
              fill={bCol} opacity={hov?.idx === i ? 0.85 : 0.25}
            />
          )
        })}

        {/* X축 레이블 */}
        {xTicks.map(({ i, label }) => (
          <text key={i} x={toX(i)} y={H - 1}
            fontSize="8.5" fill="#3A4258" textAnchor="middle">
            {label}
          </text>
        ))}

        {/* 과거 예측 마커 */}
        {histMarkers.map(({ item, barIdx }) => {
          const mx  = toX(barIdx)
          const my  = toY(bars[barIdx].close)
          const col = item.direction === 'up' ? '#FF8C00' : item.direction === 'down' ? '#FF4B4B' : '#8892A8'
          return (
            <g key={item.id}
              onMouseMove={e => {
                e.stopPropagation()
                const wr = wrapRef.current?.getBoundingClientRect()
                setHistHov({ item, px: wr ? e.clientX - wr.left : 0, py: wr ? e.clientY - wr.top : 0 })
                setHov(null); setPredHov(false)
              }}
              onMouseLeave={() => setHistHov(null)}
              style={{ cursor: 'pointer' }}
            >
              <circle cx={mx} cy={my} r={5} fill={col} opacity={0.15} />
              <circle cx={mx} cy={my} r={3} fill={col} stroke="#080C17" strokeWidth={1} opacity={0.9} />
              <text x={mx} y={my + 0.6} textAnchor="middle" dominantBaseline="middle"
                fontSize={5} fill="#080C17" fontWeight="bold">
                {item.direction === 'up' ? '▲' : item.direction === 'down' ? '▼' : '—'}
              </text>
            </g>
          )
        })}

        {/* 현재가 점 */}
        <circle cx={SP} cy={lastY} r="2.5" fill={priceCol} />

        {/* 호버 수직선 + 점 */}
        {hov && hBar && (
          <g>
            <line x1={toX(hov.idx)} y1={PAD_T/2} x2={toX(hov.idx)} y2={HP}
              stroke="rgba(255,255,255,0.18)" strokeWidth="0.8" />
            <circle cx={toX(hov.idx)} cy={toY(hBar.close)} r="3"
              fill={priceCol} stroke="rgba(0,0,0,0.6)" strokeWidth="1.2" />
          </g>
        )}
      </svg>

      {/* 가격 툴팁 (구름 효과) */}
      {hov && hBar && (
        <div style={{
          position:       'absolute',
          top:            Math.max(4, hov.py - 110),
          ...(hov.px < wrapW * 0.6
            ? { left: hov.px + 12 }
            : { right: wrapW - hov.px + 12 }),
          background:     'rgba(10,16,30,0.92)',
          border:         '1px solid rgba(255,255,255,0.1)',
          borderRadius:   9,
          padding:        '8px 11px',
          fontSize:       10.5,
          color:          '#C8D0E0',
          pointerEvents:  'none',
          zIndex:         20,
          backdropFilter: 'blur(10px)',
          boxShadow:      '0 4px 28px rgba(0,0,0,0.6)',
          minWidth:       115,
          lineHeight:     1.9,
        }}>
          <div style={{ fontSize: 9, color: '#4B5675', marginBottom: 3 }}>
            {new Date(hBar.timestamp * 1000).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
          </div>
          {([
            { label: '시', val: hBar.open,  col: '#C8D0E0' },
            { label: '고', val: hBar.high,  col: '#FF8C00' },
            { label: '저', val: hBar.low,   col: '#FF4B4B' },
            { label: '종', val: hBar.close, col: priceCol  },
          ] as { label: string; val: number; col: string }[]).map(({ label, val, col }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 14 }}>
              <span style={{ color: '#4B5675' }}>{label}</span>
              <span style={{ color: col, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                {val.toLocaleString()}
              </span>
            </div>
          ))}
          <div style={{
            borderTop:  '1px solid rgba(255,255,255,0.06)',
            marginTop:  4, paddingTop: 4,
            color: '#4B5675', fontSize: 9,
          }}>
            거래량 {
              hBar.volume >= 1_000_000 ? (hBar.volume/1_000_000).toFixed(1) + 'M' :
              hBar.volume >= 1_000     ? (hBar.volume/1_000).toFixed(0) + 'K'     :
              hBar.volume.toString()
            }
          </div>
        </div>
      )}

      {/* 예측 툴팁 (구름 효과) */}
      {predHov && prediction && (
        <div style={{
          position:       'absolute',
          top:            4,
          right:          4,
          background:     'rgba(10,16,30,0.92)',
          border:         `1px solid ${predCol}30`,
          borderRadius:   9,
          padding:        '8px 11px',
          fontSize:       10.5,
          color:          '#C8D0E0',
          pointerEvents:  'none',
          zIndex:         20,
          backdropFilter: 'blur(10px)',
          boxShadow:      `0 4px 28px rgba(0,0,0,0.6), 0 0 18px ${predCol}12`,
          maxWidth:       158,
          lineHeight:     1.85,
        }}>
          <div style={{ color: predCol, fontWeight: 700, fontSize: 11, marginBottom: 5 }}>
            {prediction.direction === 'up'   ? '▲ 상승' :
             prediction.direction === 'down' ? '▼ 하락' : '— 중립'} 예측
          </div>
          {([
            { label: '상단 목표', val: prediction.targetHigh },
            { label: '하단 목표', val: prediction.targetLow  },
          ] as { label: string; val: number }[]).map(({ label, val }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
              <span style={{ color: '#4B5675' }}>{label}</span>
              <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{val.toLocaleString()}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
            <span style={{ color: '#4B5675' }}>신뢰도</span>
            <span style={{ color: '#F0B429', fontWeight: 700 }}>{prediction.confidence}%</span>
          </div>
          <div style={{
            borderTop:  '1px solid rgba(255,255,255,0.06)',
            marginTop:  5, paddingTop: 5,
            fontSize:   9, color: '#5A6478', lineHeight: 1.6,
          }}>
            {prediction.reason.slice(0, 90)}{prediction.reason.length > 90 ? '…' : ''}
          </div>
        </div>
      )}

      {/* 과거 예측 호버 툴팁 */}
      {histHov && (
        <div style={{
          position:       'absolute',
          top:            Math.max(4, histHov.py - 130),
          ...(histHov.px < wrapW * 0.6 ? { left: histHov.px + 12 } : { right: wrapW - histHov.px + 12 }),
          background:     'rgba(10,16,30,0.95)',
          border:         `1px solid ${histHov.item.direction === 'up' ? '#FF8C00' : histHov.item.direction === 'down' ? '#FF4B4B' : '#8892A8'}40`,
          borderRadius:   9, padding: '8px 11px',
          fontSize:       10.5, color: '#C8D0E0',
          pointerEvents:  'none', zIndex: 30,
          backdropFilter: 'blur(10px)',
          boxShadow:      '0 4px 28px rgba(0,0,0,0.6)',
          minWidth:       140, lineHeight: 1.9,
        }}>
          <div style={{ fontSize: 9, color: '#4B5675', marginBottom: 3 }}>
            {new Date(histHov.item.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })} 예측
          </div>
          <div style={{
            fontWeight: 700, fontSize: 11, marginBottom: 5,
            color: histHov.item.direction === 'up' ? '#FF8C00' : histHov.item.direction === 'down' ? '#FF4B4B' : '#8892A8',
          }}>
            {histHov.item.direction === 'up' ? '▲ 상승' : histHov.item.direction === 'down' ? '▼ 하락' : '— 중립'} 예측
          </div>
          {([
            { label: '기준가',  val: histHov.item.basePrice   },
            { label: '상단 목표', val: histHov.item.targetHigh },
            { label: '하단 목표', val: histHov.item.targetLow  },
          ] as { label: string; val: number }[]).map(({ label, val }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <span style={{ color: '#4B5675' }}>{label}</span>
              <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{val.toLocaleString()}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <span style={{ color: '#4B5675' }}>신뢰도</span>
            <span style={{ color: '#F0B429', fontWeight: 700 }}>{histHov.item.confidence}%</span>
          </div>
        </div>
      )}

      {/* 범례 */}
      <div style={{
        display: 'flex', gap: 10, padding: '3px 4px 0',
        fontSize: 9, color: '#3A4258',
      }}>
        <span style={{ color: priceCol }}>● 종가</span>
        <span style={{ color: '#F0B429' }}>— MA5</span>
        <span style={{ color: '#3D8EFF' }}>— MA20</span>
        {prediction && <span style={{ color: predCol }}>┄ AI 예측</span>}
        {histMarkers.length > 0 && <span style={{ color: '#8892A8' }}>● 과거 예측</span>}
      </div>
    </div>
  )
}

function computeMA(closes: number[], period: number): (number | null)[] {
  return closes.map((_, i) => {
    if (i < period - 1) return null
    const slice = closes.slice(i - period + 1, i + 1)
    return slice.reduce((a, b) => a + b, 0) / period
  })
}

// ── 공시 + 뉴스 섹션 ─────────────────────────────────────────
function NewsSection({
  disclosures, news,
}: {
  disclosures: DisclosureItem[]
  news:        NewsItem[]
}) {
  const hasDisclosures = disclosures.length > 0
  const hasNews        = news.length > 0
  if (!hasDisclosures && !hasNews) return null

  return (
    <div style={{ marginTop: 16 }}>

      {/* 공시 */}
      {hasDisclosures && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#8892A8', marginBottom: 6 }}>
            📋 최근 공시
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {disclosures.slice(0, 5).map(d => (
              <NewsRow
                key={d.rcept_no}
                title={d.report_name}
                sub={formatDisclosureDate(d.rcept_date) + ' · ' + d.corp_name}
                link={d.link}
                badge="DART"
                badgeColor="#3D8EFF"
              />
            ))}
          </div>
        </div>
      )}

      {/* 뉴스 */}
      {hasNews && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#8892A8', marginBottom: 6 }}>
            📰 관련 뉴스
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {news.slice(0, 5).map((n, i) => (
              <NewsRow
                key={i}
                title={n.title}
                sub={formatNewsDate(n.published_at) + (n.source ? ' · ' + n.source : '')}
                link={n.link}
                badge={n.source || 'NEWS'}
                badgeColor="#4B5675"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── 뉴스/공시 행 ─────────────────────────────────────────────
function NewsRow({ title, sub, link, badge, badgeColor }: {
  title: string; sub: string; link: string
  badge: string; badgeColor: string
}) {
  return (
    <a href={link} target="_blank" rel="noopener noreferrer"
      style={{ textDecoration: 'none' }}>
      <div style={{
        padding: '7px 10px',
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 6, cursor: 'pointer',
        transition: 'background 0.1s',
      }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
      >
        {/* 제목 */}
        <div style={{
          fontSize: 11.5, color: '#C8D0E0', fontWeight: 500,
          lineHeight: 1.45, marginBottom: 4,
          overflow: 'hidden', display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const,
        }}>
          {title}
        </div>
        {/* 날짜 + 출처 배지 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: '#4B5675' }}>{sub}</span>
          <span style={{ marginLeft: 'auto' }}>
            <span style={{
              fontSize: 9, padding: '1px 5px', borderRadius: 3,
              background: `${badgeColor}22`, color: badgeColor, fontWeight: 700,
            }}>{badge}</span>
          </span>
        </div>
      </div>
    </a>
  )
}

// ── 날짜 포맷 헬퍼 ────────────────────────────────────────────
/** DART rcept_date "20260610" → "2026.06.10" */
function formatDisclosureDate(raw: string): string {
  if (!raw || raw.length < 8) return raw
  return `${raw.slice(0, 4)}.${raw.slice(4, 6)}.${raw.slice(6, 8)}`
}

/** Google RSS "Wed, 10 Jun 2026 08:00:00 GMT" or Yahoo "2026-06-10 08:30" → "06.10" */
function formatNewsDate(raw: string): string {
  if (!raw) return ''
  try {
    const d = new Date(raw)
    if (!isNaN(d.getTime())) {
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const dd = String(d.getDate()).padStart(2, '0')
      return `${mm}.${dd}`
    }
  } catch { /* noop */ }
  return raw.slice(0, 10)
}

// ── 스탯 카드 (주요 종목 재무) ────────────────────────────────
function StatCard({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 6, padding: '8px 10px',
    }}>
      <div style={{ fontSize: 10, color: '#4B5675', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
        {value}<span style={{ fontSize: 10, color: '#4B5675', marginLeft: 2 }}>{unit}</span>
      </div>
    </div>
  )
}
