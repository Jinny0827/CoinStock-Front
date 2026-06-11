import { useQuery } from '@tanstack/react-query'
import { useStockStore } from '../../store/stockStore'
import { getFinancial, getOhlcv, getPredict, getStockNews } from '../../api/stockApi'
import type { OhlcvBar, StockQuote, DisclosureItem, NewsItem, Prediction } from '../../types/stock'

interface Props {
  isPenny?: boolean
}

export default function StockDetailPanel({ isPenny = false }: Props) {
  const symbol        = useStockStore(s => s.selectedSymbol)
  const selectedStock = useStockStore(s => s.selectedStock)

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
    staleTime: 10 * 60_000,
    enabled: !!symbol,
  })

  const { data: stockNews } = useQuery({
    queryKey: ['news', symbol],
    queryFn:  () => getStockNews(symbol),
    staleTime: 15 * 60_000,   // 15분 — NewsCache TTL과 동일
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
              color: '#00C896', letterSpacing: '-1px',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {currentPrice.toLocaleString()}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: up ? '#00C896' : '#FF4B4B' }}>
              {up ? '▲' : '▼'} {up ? '+' : ''}{changeRate.toFixed(2)}%
            </div>
          </div>
        )}
      </div>

      {/* 스파크라인 차트 + 예측 밴드 */}
      {bars.length > 1 && <SparkChart bars={bars} prediction={prediction} />}

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
              color: prediction.direction === 'up'   ? '#00C896'
                   : prediction.direction === 'down' ? '#FF4B4B' : '#8892A8',
            }}>
              {prediction.direction === 'up' ? '▲ 상승'
               : prediction.direction === 'down' ? '▼ 하락' : '— 중립'}
            </span>
          </div>

          <div style={{ fontSize: 11.5, lineHeight: 1.65, color: '#8892A8', marginBottom: 10 }}>
            {prediction.reason}
          </div>

          {/* 신뢰도 바 */}
          <div style={{ fontSize: 10, color: '#4B5675', display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span>신뢰도</span>
            <span style={{ color: '#F0B429', fontWeight: 700 }}>{prediction.confidence}%</span>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 4, height: 4 }}>
            <div style={{
              height: '100%', borderRadius: 4,
              width: `${prediction.confidence}%`,
              background: 'linear-gradient(90deg,#00C896,#00E5B0)',
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
              `MA5 ${prediction.indicators.ma5.toLocaleString()}`,
              `MA20 ${prediction.indicators.ma20.toLocaleString()}`,
              `RSI ${prediction.indicators.rsi}`,
            ].map(badge => (
              <span key={badge} style={{
                fontSize: 10, color: '#4B5675',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.06)',
                padding: '2px 7px', borderRadius: 4,
              }}>{badge}</span>
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
    { label: '거래량 폭발',  score: volScore,  max: 40, sub: avg10 > 0 ? volLabel : volLabel, color: '#00C896' },
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
          color: totalScore >= 70 ? '#00C896' : totalScore >= 40 ? '#F0B429' : '#FF6B6B',
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

// ── 스파크라인 + 미래 예측 밴드 차트 ─────────────────────────────
function SparkChart({ bars, prediction }: { bars: OhlcvBar[], prediction?: Prediction }) {
  const closes   = bars.map(b => b.close)
  const lastClose = closes[closes.length - 1]

  // 스케일 계산: 예측값까지 포함해 Y축 범위 결정
  const allValues = [...closes]
  if (prediction) allValues.push(prediction.targetLow, prediction.targetHigh)
  const minVal = Math.min(...allValues)
  const maxVal = Math.max(...allValues)
  const rangeVal = maxVal - minVal || 1

  const W       = 400
  const H       = 72
  const SPLIT_X = 310   // 실제 구간 끝 / 예측 구간 시작

  const toY = (v: number) => H - ((v - minVal) / rangeVal) * H * 0.85 - H * 0.075

  // 실제 가격 경로
  const pts = closes.map((c, i) => ({
    x: (i / (closes.length - 1)) * SPLIT_X,
    y: toY(c),
  }))
  let d = `M ${pts[0].x} ${pts[0].y}`
  for (let i = 1; i < pts.length; i++) {
    const mx = (pts[i - 1].x + pts[i].x) / 2
    d += ` C ${mx} ${pts[i - 1].y}, ${mx} ${pts[i].y}, ${pts[i].x} ${pts[i].y}`
  }
  const areaD = d + ` L ${SPLIT_X} ${H} L ${pts[0].x} ${H} Z`
  const up    = lastClose >= closes[0]
  const color = up ? '#00C896' : '#FF4B4B'

  // 예측 좌표
  const lastY        = toY(lastClose)
  const predColor    = prediction?.direction === 'up'   ? '#00C896'
                     : prediction?.direction === 'down' ? '#FF4B4B' : '#8892A8'
  const highY        = prediction ? toY(prediction.targetHigh) : lastY
  const lowY         = prediction ? toY(prediction.targetLow)  : lastY
  const midY         = (highY + lowY) / 2

  return (
    <div style={{ margin: '0 -4px' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 72 }} preserveAspectRatio="none">
        <defs>
          <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
          <clipPath id="spark-actual">
            <rect x="0" y="0" width={SPLIT_X} height={H} />
          </clipPath>
        </defs>

        {/* 실제 가격 영역 + 선 */}
        <g clipPath="url(#spark-actual)">
          <path d={areaD} fill="url(#sparkGrad)" />
          <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
        </g>

        {/* 예측 구간 */}
        {prediction && (
          <>
            {/* 신뢰 밴드 */}
            <path
              d={`M ${SPLIT_X} ${highY} L ${W} ${highY - 3} L ${W} ${lowY + 3} L ${SPLIT_X} ${lowY} Z`}
              fill={`${predColor}1A`}
            />
            {/* 상단 점선 */}
            <line x1={SPLIT_X} y1={highY} x2={W} y2={highY - 3}
              stroke={predColor} strokeWidth="0.8" strokeDasharray="3,2" opacity="0.45" />
            {/* 하단 점선 */}
            <line x1={SPLIT_X} y1={lowY} x2={W} y2={lowY + 3}
              stroke={predColor} strokeWidth="0.8" strokeDasharray="3,2" opacity="0.45" />
            {/* 중심 예측선 */}
            <line x1={SPLIT_X} y1={lastY} x2={W} y2={midY}
              stroke={predColor} strokeWidth="1.5" strokeDasharray="5,3" />
          </>
        )}

        {/* 실제/예측 분기 수직선 */}
        {prediction && (
          <line x1={SPLIT_X} y1="4" x2={SPLIT_X} y2={H}
            stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" strokeDasharray="3,3" />
        )}

        {/* 현재가 기준점 */}
        <circle cx={SPLIT_X} cy={lastY} r="2.5" fill={color} />
      </svg>

      {/* 하단 레이블 */}
      {prediction && (
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontSize: 9, color: '#4B5675', padding: '2px 4px 0',
        }}>
          <span style={{ color: '#2A3148' }}>← 1개월 실제</span>
          <span style={{ color: predColor, fontWeight: 600 }}>
            {prediction.targetLow.toLocaleString()} ~ {prediction.targetHigh.toLocaleString()}
          </span>
        </div>
      )}
    </div>
  )
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
