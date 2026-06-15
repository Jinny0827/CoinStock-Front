import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useLocation } from 'react-router-dom'
import {
  getKrPennyStocks, getUsPennyStocks,
  getKrMainStocks, getUsMainStocks,
} from '../api/stockApi'
import { useIsDesktop } from '../hooks/useIsDesktop'
import StockDetailPanel from '../components/home/StockDetailPanel'
import type { StockQuote } from '../types/stock'

// ── 탭 ──────────────────────────────────────────────────────
type TabKey = 'kr-main' | 'us-main' | 'kr-penny' | 'us-penny'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'kr-main',   label: 'KR 주요' },
  { key: 'us-main',   label: 'US 주요' },
  { key: 'kr-penny',  label: '국장 동전주' },
  { key: 'us-penny',  label: '미장 동전주' },
]

// 주요 탭 정렬
type MainSortKey   = 'marketCap' | 'changePercent' | 'volume'
// 동전주 탭 정렬
type PennySortKey  = 'score' | 'changePercent' | 'volume' | 'price'

const MAIN_SORT_OPTIONS: { key: MainSortKey; label: string }[] = [
  { key: 'marketCap',      label: '시총' },
  { key: 'changePercent',  label: '등락률' },
  { key: 'volume',         label: '거래량' },
]

const PENNY_SORT_OPTIONS: { key: PennySortKey; label: string }[] = [
  { key: 'score',          label: '점수순' },
  { key: 'changePercent',  label: '등락률' },
  { key: 'volume',         label: '거래량' },
  { key: 'price',          label: '가격순' },
]

const PENNY_LIMIT = 100   // 검색 없을 때 최대 표시 수

// ── 메인 ─────────────────────────────────────────────────────
export default function StockAnalysisPage() {
  const [tab,       setTab]       = useState<TabKey>('kr-main')
  const [mainSort,  setMainSort]  = useState<MainSortKey>('marketCap')
  const [pennySort, setPennySort] = useState<PennySortKey>('score')
  const [search,    setSearch]    = useState('')

  const isDesktop = useIsDesktop()
  const location  = useLocation()
  const [analysisSymbol, setAnalysisSymbol] = useState<string>(
    (location.state as { symbol?: string } | null)?.symbol ?? '005930.KS'
  )
  const [analysisStock, setAnalysisStock] = useState<StockQuote | null>(null)
  const [mobileShowDetail, setMobileShowDetail] = useState(false)

  // ── 데이터 쿼리 ────────────────────────────────────────────
  const { data: krMain  = [], isFetching: krMainFetching,  refetch: krMainRefetch  } = useQuery({
    queryKey: ['kr-main'],
    queryFn:  getKrMainStocks,
    staleTime: 60_000,
    enabled: tab === 'kr-main',
  })
  const { data: usMain  = [], isFetching: usMainFetching,  refetch: usMainRefetch  } = useQuery({
    queryKey: ['us-main'],
    queryFn:  getUsMainStocks,
    staleTime: 60_000,
    enabled: tab === 'us-main',
  })
  const { data: krPenny = [], isFetching: krPennyFetching, refetch: krPennyRefetch } = useQuery({
    queryKey: ['analysis-kr'],
    queryFn:  getKrPennyStocks,
    staleTime: 15 * 60_000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  })
  const { data: usPenny = [], isFetching: usPennyFetching, refetch: usPennyRefetch } = useQuery({
    queryKey: ['analysis-us'],
    queryFn:  getUsPennyStocks,
    staleTime: 15 * 60_000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  })

  // ── 현재 탭 메타 ───────────────────────────────────────────
  const isPenny = tab === 'kr-penny' || tab === 'us-penny'
  const isKr    = tab === 'kr-main'  || tab === 'kr-penny'

  const tabMeta = {
    'kr-main':  { data: krMain,  fetching: krMainFetching,  refetch: krMainRefetch  },
    'us-main':  { data: usMain,  fetching: usMainFetching,  refetch: usMainRefetch  },
    'kr-penny': { data: krPenny, fetching: krPennyFetching, refetch: krPennyRefetch },
    'us-penny': { data: usPenny, fetching: usPennyFetching, refetch: usPennyRefetch },
  }
  const { data: rawData, fetching, refetch } = tabMeta[tab]

  // ── 검색 + 정렬 + 100개 제한 ───────────────────────────────
  const displayList = useMemo(() => {
    const q = search.trim().toLowerCase()

    // 1. 검색 필터
    const filtered = q
      ? rawData.filter(s =>
          s.symbol.toLowerCase().includes(q) ||
          (s.name || '').toLowerCase().includes(q)
        )
      : rawData

    // 2. 정렬
    const sorted = [...filtered].sort((a, b) => {
      if (isPenny) {
        if (pennySort === 'score')         return (b.score ?? 0) - (a.score ?? 0)
        if (pennySort === 'changePercent') return Math.abs(b.changePercent) - Math.abs(a.changePercent)
        if (pennySort === 'volume')        return b.volume - a.volume
        if (pennySort === 'price')         return b.price - a.price
      } else {
        if (mainSort === 'marketCap')      return b.marketCap - a.marketCap
        if (mainSort === 'changePercent')  return Math.abs(b.changePercent) - Math.abs(a.changePercent)
        if (mainSort === 'volume')         return b.volume - a.volume
      }
      return 0
    })

    // 3. 100개 제한 (검색 없을 때만)
    return q ? sorted : sorted.slice(0, PENNY_LIMIT)
  }, [rawData, search, isPenny, mainSort, pennySort])

  const handleSelect = (stock: StockQuote) => {
    setAnalysisSymbol(stock.symbol)
    setAnalysisStock(stock)
    if (!isDesktop) setMobileShowDetail(true)
  }

  const handleTabChange = (t: TabKey) => {
    setTab(t)
    setSearch('')   // 탭 전환 시 검색 초기화
  }

  // ── 모바일: 상세 화면 ──────────────────────────────────────
  if (!isDesktop && mobileShowDetail && analysisSymbol) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#080C17' }}>
        <div style={{
          padding: '12px 16px', flexShrink: 0,
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <button onClick={() => setMobileShowDetail(false)} style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#8892A8', fontSize: 13, cursor: 'pointer',
            borderRadius: 5, padding: '3px 10px',
          }}>← 목록</button>
          <span style={{ fontSize: 13, fontWeight: 600 }}>종목 상세</span>
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <StockDetailPanel isPenny={isPenny} />
        </div>
      </div>
    )
  }

  // ── 목록 패널 ──────────────────────────────────────────────
  const listPanel = (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#080C17' }}>

      {/* 헤더 */}
      <div style={{
        padding: '12px 16px 8px', flexShrink: 0,
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}>
        {/* 제목 + 카운트 + 새로고침 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 14, fontWeight: 700 }}>종목 분석</span>
          <span style={{
            fontSize: 10, color: '#4B5675',
            background: 'rgba(255,255,255,0.04)', padding: '2px 7px', borderRadius: 3,
          }}>
            {search ? `${displayList.length}개 검색 결과` : `${displayList.length}/${rawData.length}개`}
          </span>
          <span style={{ marginLeft: 'auto' }} />
          <button
            onClick={() => refetch()}
            disabled={fetching}
            style={{
              background: 'rgba(0,200,150,0.08)',
              border: `1px solid rgba(0,200,150,${fetching ? '0.1' : '0.25'})`,
              color: fetching ? '#4B5675' : '#00C896',
              borderRadius: 5, fontSize: 11, padding: '4px 10px',
              cursor: fetching ? 'default' : 'pointer',
            }}
          >{fetching ? '갱신 중…' : '새로고침'}</button>
        </div>

        {/* 탭 */}
        <div style={{ display: 'flex', gap: 0, overflowX: 'auto', marginBottom: 8 }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => handleTabChange(t.key)} style={{
              padding: '5px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer',
              border: 'none', whiteSpace: 'nowrap', background: 'transparent',
              borderBottom: `2px solid ${tab === t.key ? '#00C896' : 'transparent'}`,
              color: tab === t.key ? '#00C896' : '#4B5675', transition: 'color 0.12s',
            }}>
              {t.label}
              {(t.key === 'kr-penny' && krPenny.length > 0) && (
                <TabBadge count={krPenny.length} active={tab === 'kr-penny'} />
              )}
              {(t.key === 'us-penny' && usPenny.length > 0) && (
                <TabBadge count={usPenny.length} active={tab === 'us-penny'} />
              )}
            </button>
          ))}
        </div>

        {/* 검색창 */}
        <div style={{ position: 'relative', marginBottom: 8 }}>
          <span style={{
            position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)',
            fontSize: 12, color: '#4B5675', pointerEvents: 'none',
          }}>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={`${isPenny ? '종목명 / 심볼 검색…' : '종목명 / 심볼 검색…'}`}
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${search ? 'rgba(0,200,150,0.3)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 6, padding: '6px 10px 6px 30px',
              color: '#E2E8F0', fontSize: 12, outline: 'none',
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#4B5675', fontSize: 14, lineHeight: 1, padding: 0,
              }}
            >✕</button>
          )}
        </div>

        {/* 정렬 버튼 */}
        <div style={{ display: 'flex', gap: 5 }}>
          {(isPenny ? PENNY_SORT_OPTIONS : MAIN_SORT_OPTIONS).map(opt => {
            const isActive = isPenny
              ? pennySort === opt.key
              : mainSort === opt.key
            return (
              <button
                key={opt.key}
                onClick={() => isPenny
                  ? setPennySort(opt.key as PennySortKey)
                  : setMainSort(opt.key as MainSortKey)
                }
                style={{
                  fontSize: 10, padding: '2px 8px', borderRadius: 4, cursor: 'pointer',
                  border: `1px solid ${isActive ? 'rgba(0,200,150,0.4)' : 'rgba(255,255,255,0.07)'}`,
                  background: isActive ? 'rgba(0,200,150,0.08)' : 'transparent',
                  color: isActive ? '#00C896' : '#4B5675',
                }}
              >{opt.label}</button>
            )
          })}
        </div>
      </div>

      {/* 컬럼 헤더 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isPenny ? '28px 1fr 88px 60px 50px' : '28px 1fr 100px 65px',
        padding: '5px 16px', fontSize: 10, color: '#4B5675',
        borderBottom: '1px solid rgba(255,255,255,0.04)', flexShrink: 0,
      }}>
        <span>#</span>
        <span>종목</span>
        <span style={{ textAlign: 'right' }}>가격</span>
        <span style={{ textAlign: 'right' }}>등락</span>
        {isPenny && <span style={{ textAlign: 'right' }}>점수</span>}
      </div>

      {/* 목록 */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {fetching && displayList.length === 0 ? (
          <LoadingSpinner />
        ) : displayList.length === 0 ? (
          <EmptyState tab={tab} searching={!!search} />
        ) : (
          displayList.map((stock, i) => (
            <AnalysisRow
              key={stock.symbol}
              rank={i + 1}
              stock={stock}
              isKr={isKr}
              isPenny={isPenny}
              selected={analysisSymbol === stock.symbol}
              onClick={() => handleSelect(stock)}
            />
          ))
        )}
        {/* 동전주 탭: 100개 초과 시 안내 */}
        {!search && isPenny && rawData.length > PENNY_LIMIT && (
          <div style={{
            padding: '10px 16px', textAlign: 'center',
            fontSize: 11, color: '#4B5675',
            borderTop: '1px solid rgba(255,255,255,0.04)',
          }}>
            상위 100개 표시 중 · 검색으로 더 찾기
          </div>
        )}
      </div>
    </div>
  )

  // ── 데스크탑: split 레이아웃 ─────────────────────────────────
  if (isDesktop) {
    return (
      <div style={{ height: '100%', display: 'flex', overflow: 'hidden' }}>
        <div style={{
          width: 380, flexShrink: 0,
          borderRight: '1px solid rgba(255,255,255,0.07)',
          overflow: 'hidden',
        }}>
          {listPanel}
        </div>
        <div style={{ flex: 1, overflow: 'hidden', background: '#080C17' }}>
          {analysisSymbol ? (
            <StockDetailPanel isPenny={isPenny} symbol={analysisSymbol} stock={analysisStock} />
          ) : (
            <div style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              height: '100%', gap: 10,
            }}>
              <div style={{ fontSize: 28, opacity: 0.3 }}>📊</div>
              <div style={{ fontSize: 13, color: '#4B5675' }}>
                ← 목록에서 종목을 클릭하면 상세 정보가 표시됩니다
              </div>
              <div style={{ fontSize: 11, color: '#2A3148' }}>
                차트 · 재무지표 · AI 예측
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return listPanel
}

// ── 탭 배지 ──────────────────────────────────────────────────
function TabBadge({ count, active }: { count: number; active: boolean }) {
  return (
    <span style={{
      marginLeft: 4, fontSize: 9,
      background: active ? 'rgba(0,200,150,0.15)' : 'rgba(255,255,255,0.06)',
      color: active ? '#00C896' : '#4B5675',
      padding: '1px 4px', borderRadius: 3, fontWeight: 700,
    }}>{count}</span>
  )
}

// ── 종목 행 ──────────────────────────────────────────────────
function AnalysisRow({
  rank, stock, isKr, isPenny, selected, onClick,
}: {
  rank: number; stock: StockQuote; isKr: boolean
  isPenny: boolean; selected: boolean; onClick: () => void
}) {
  const up = stock.changePercent >= 0

  const priceStr = isKr
    ? stock.price.toLocaleString('ko-KR') + '원'
    : '$' + stock.price.toFixed(2)

  const subInfo = (() => {
    const v = stock.volume
    const volStr = v >= 1_000_000 ? (v / 1_000_000).toFixed(1) + 'M'
                 : v >= 1_000     ? (v / 1_000).toFixed(0) + 'K'
                 : v > 0          ? String(v)
                 : '-'

    if (isPenny) return volStr   // 동전주: 거래량

    // 주요: 시총 우선, 없으면 거래량 표시
    const mc = stock.marketCap
    if (mc && mc > 0) {
      if (isKr) {
        return mc >= 1_000_000_000_000 ? (mc / 1_000_000_000_000).toFixed(1) + '조'
             : mc >= 100_000_000      ? (mc / 100_000_000).toFixed(0) + '억'
             : mc.toLocaleString() + '원'
      } else {
        return mc >= 1_000_000_000_000 ? (mc / 1_000_000_000_000).toFixed(2) + 'T'
             : mc >= 1_000_000_000     ? (mc / 1_000_000_000).toFixed(1) + 'B'
             : (mc / 1_000_000).toFixed(0) + 'M'
      }
    }
    return volStr   // marketCap 없을 때 거래량으로 대체
  })()

  return (
    <div
      onClick={onClick}
      style={{
        display: 'grid',
        gridTemplateColumns: isPenny ? '28px 1fr 88px 60px 50px' : '28px 1fr 100px 65px',
        padding: '9px 16px', alignItems: 'center', cursor: 'pointer',
        background: selected ? 'rgba(0,200,150,0.06)' : 'transparent',
        borderBottom: '1px solid rgba(255,255,255,0.03)',
        borderLeft: selected ? '2px solid #00C896' : '2px solid transparent',
        transition: 'background 0.1s',
      }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.background = 'rgba(255,255,255,0.025)' }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.background = 'transparent' }}
    >
      {/* 순위 */}
      <span style={{
        fontSize: 11, fontWeight: 700, textAlign: 'center',
        color: rank <= 3 ? '#F0B429' : '#4B5675',
      }}>{rank}</span>

      {/* 종목명 + 심볼 + 시총/거래량 */}
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontSize: 12, fontWeight: 600, color: '#E2E8F0', marginBottom: 2,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {stock.name || stock.symbol}
        </div>
        <div style={{ fontSize: 10, color: '#4B5675', display: 'flex', gap: 6 }}>
          <span style={{ maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {stock.symbol}
          </span>
          <span style={{ color: isPenny ? '#4B5675' : '#3D6080' }}>{subInfo}</span>
        </div>
      </div>

      {/* 가격 */}
      <div style={{
        textAlign: 'right', fontSize: 12, fontWeight: 700,
        fontVariantNumeric: 'tabular-nums', color: '#E2E8F0',
      }}>{priceStr}</div>

      {/* 등락률 */}
      <div style={{
        textAlign: 'right', fontSize: 11, fontWeight: 700,
        color: up ? '#00C896' : '#FF4B4B',
        fontVariantNumeric: 'tabular-nums',
      }}>
        {up ? '▲' : '▼'} {Math.abs(stock.changePercent).toFixed(1)}%
      </div>

      {/* 점수 (동전주 탭의 별도 컬럼) */}
      {isPenny && (
        <div style={{ textAlign: 'right' }}>
          {stock.score != null && stock.score > 0 ? (
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 5px', borderRadius: 3,
              background: stock.score >= 70 ? 'rgba(0,200,150,0.15)' : 'rgba(61,142,255,0.1)',
              color: stock.score >= 70 ? '#00C896' : '#3D8EFF',
            }}>{stock.score}</span>
          ) : (
            <span style={{ fontSize: 10, color: '#2A3148' }}>-</span>
          )}
        </div>
      )}
    </div>
  )
}

// ── 빈 상태 ──────────────────────────────────────────────────
function EmptyState({ tab, searching }: { tab: TabKey; searching: boolean }) {
  if (searching) return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      height: 200, gap: 8,
    }}>
      <div style={{ fontSize: 22 }}>🔍</div>
      <div style={{ fontSize: 12, color: '#4B5675' }}>검색 결과가 없습니다</div>
    </div>
  )

  const msgs: Record<TabKey, string> = {
    'kr-main':   'KR 주요 데이터 로딩 중…',
    'us-main':   'US 주요 데이터 로딩 중…',
    'kr-penny':  '국장 동전주 수집 중… (첫 실행 시 약 20분)',
    'us-penny':  '미장 동전주 수집 중… (첫 실행 시 약 30초)',
  }
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      height: 200, gap: 8,
    }}>
      <div style={{ fontSize: 22 }}>
        {tab.includes('main') ? '📈' : '💰'}
      </div>
      <div style={{ fontSize: 12, color: '#4B5675', textAlign: 'center', padding: '0 20px' }}>
        {msgs[tab]}
      </div>
    </div>
  )
}

// ── 로딩 스피너 ───────────────────────────────────────────────
function LoadingSpinner() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      height: 200, gap: 10,
    }}>
      <div style={{
        width: 20, height: 20, borderRadius: '50%',
        border: '2px solid rgba(255,255,255,0.06)',
        borderTopColor: '#00C896',
        animation: 'spin 0.7s linear infinite',
      }} />
      <div style={{ fontSize: 11, color: '#4B5675' }}>불러오는 중…</div>
    </div>
  )
}
