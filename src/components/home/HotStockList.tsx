import { useState, useEffect, useRef, useCallback } from 'react'
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'
import {addWatchlist, deleteWatchlist, getForceStocks, getKrPennyStocks, getUsPennyStocks, getWatchlist, isWatched} from '../../api/stockApi'
import { useStockStore } from '../../store/stockStore'
import { useAuthStore } from '../../store/authStore'
import type { StockQuote, WatchlistItem } from '../../types/stock'

type TabType = '세력감지' | '국장' | '미장' | '관심종목'
type RowStock = Pick<StockQuote, 'symbol' | 'name' | 'price' | 'changePercent' | 'volume' | 'score'>

const TABS: TabType[] = ['세력감지', '국장', '미장', '관심종목']

const dedup = <T extends { symbol: string }>(data: T[]): T[] =>
  [...new Map(data.map(s => [s.symbol, s])).values()]

const toRowStock = (w: WatchlistItem): RowStock => ({
  symbol: w.symbol,
  name: w.name,
  price: w.price ?? 0,
  changePercent: w.changePercent ?? 0,
  volume: w.volume ?? 0,
  score: w.score,
})

export default function HotStockList() {
  const [tab,       setTab]       = useState<TabType>('세력감지')
  const [dirFilter, setDirFilter] = useState<'all' | 'up' | 'down'>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const { selectedSymbol, setSelectedSymbol, setSelectedStock } = useStockStore()
  const token = useAuthStore(s => s.token)
  const qc = useQueryClient()

  const handleTabChange = useCallback((newTab: TabType) => {
    if (newTab !== '국장') qc.removeQueries({ queryKey: ['penny-kr'] })
    if (newTab !== '미장') qc.removeQueries({ queryKey: ['penny-us'] })
    setTab(newTab)
    setDirFilter('all')
  }, [qc])

  const { data: forceData = [] } = useQuery({
    queryKey: ['force'],
    queryFn: getForceStocks,
    refetchInterval: 10_000,
    select: dedup,
  })

  const { data: krData = [], isLoading: krLoading } = useQuery({
    queryKey: ['penny-kr'],
    queryFn: getKrPennyStocks,
    enabled: tab === '국장',
    refetchInterval: 30_000,
    select: dedup,
  })

  const { data: usData = [], isLoading: usLoading } = useQuery({
    queryKey: ['penny-us'],
    queryFn: getUsPennyStocks,
    enabled: tab === '미장',
    refetchInterval: 30_000,
    select: dedup,
  })

  const { data: watchlistData = [], isLoading: watchlistLoading } = useQuery({
    queryKey: ['watchlist'],
    queryFn: getWatchlist,
    enabled: tab === '관심종목' && !!token,
  })

  const addMut = useMutation({
    mutationFn: ({ symbol, name }: { symbol: string; name: string }) => addWatchlist(symbol, name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['watchlist'] })
      setShowAddModal(false)
    },
  })

  const listMap: Record<TabType, RowStock[]> = {
    '세력감지': forceData,
    '국장':     krData,
    '미장':     usData,
    '관심종목': watchlistData.map(toRowStock),
  }

  // 세력감지: 등락률 절댓값 내림차순 / 그 외: 서버 score 순(또는 추가일 순) 유지
  const list = (() => {
    const base = (tab === '세력감지'
      ? listMap['세력감지'].slice().sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
      : listMap[tab].slice()
    )
    const dir = dirFilter === 'up'   ? base.filter(s => s.changePercent > 0)
              : dirFilter === 'down' ? base.filter(s => s.changePercent < 0)
              : base
    return dir.slice(0, 100)
  })()

  const maxVol = Math.max(...list.map(s => s.volume), 1)

  // 홈 진입 시 세력감지 첫 번째 종목 자동 선택 — 1회만 실행
  const autoSelectedRef = useRef(false)
  useEffect(() => {
    if (!autoSelectedRef.current && forceData.length > 0) {
      const sorted = forceData.slice().sort(
        (a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent)
      )
      setSelectedSymbol(sorted[0].symbol)
      setSelectedStock(sorted[0])
      autoSelectedRef.current = true
    }
  }, [forceData]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* 섹션 헤더 */}
      <div style={{
        padding: '14px 20px 10px',
        display: 'flex', alignItems: 'center', gap: 8,
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        flexShrink: 0,
      }}>
        <LiveDot />
        <span style={{ fontSize: 13, fontWeight: 600 }}>동전주 도파민 · 세력 감지</span>
        <span style={{ fontSize: 11, color: '#4B5675', marginLeft: 'auto' }}>
          실시간 · KST
        </span>
      </div>

      {/* 탭 */}
      <div style={{
        display: 'flex', padding: '0 20px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        flexShrink: 0,
      }}>
        {TABS.map(t => (
          <div key={t} onClick={() => handleTabChange(t)} style={{
            padding: '9px 14px', fontSize: 12, fontWeight: 500,
            cursor: 'pointer',
            color: tab === t ? '#FF8C00' : '#4B5675',
            borderBottom: `2px solid ${tab === t ? '#FF8C00' : 'transparent'}`,
            transition: 'all 0.12s',
          }}>{t}</div>
        ))}
      </div>

      {/* 전체/상승/하락 필터 (+ 관심종목 탭에서는 종목 추가 버튼) */}
      <div style={{
        display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 4,
        padding: '6px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        flexShrink: 0,
      }}>
        {tab === '관심종목' && token && (
          <button onClick={() => setShowAddModal(true)} style={{
            fontSize: 10, padding: '2px 9px', borderRadius: 4, cursor: 'pointer',
            border: '1px solid rgba(255,140,0,0.4)', background: 'rgba(255,140,0,0.08)',
            color: '#FF8C00', marginRight: 'auto',
          }}>+ 종목 추가</button>
        )}
        {(['all', 'up', 'down'] as const).map(d => (
          <button
            key={d}
            onClick={() => setDirFilter(d)}
            style={{
              fontSize: 10, padding: '2px 9px', borderRadius: 4, cursor: 'pointer',
              border: `1px solid ${dirFilter === d ? (d === 'up' ? 'rgba(255,140,0,0.4)' : d === 'down' ? 'rgba(100,160,255,0.4)' : 'rgba(255,255,255,0.15)') : 'rgba(255,255,255,0.07)'}`,
              background: dirFilter === d ? (d === 'up' ? 'rgba(255,140,0,0.08)' : d === 'down' ? 'rgba(100,160,255,0.08)' : 'rgba(255,255,255,0.05)') : 'transparent',
              color: dirFilter === d ? (d === 'up' ? '#FF8C00' : d === 'down' ? '#64A0FF' : '#A0AEC0') : '#4B5675',
            }}
          >{d === 'all' ? '전체' : d === 'up' ? '상승' : '하락'}</button>
        ))}
      </div>

      {/* 리스트 */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {tab === '관심종목' && !token ? (
          <EmptyState tab={tab} loginRequired />
        ) : list.length === 0 ? (
          <EmptyState
            tab={tab}
            loading={(tab === '국장' && krLoading) || (tab === '미장' && usLoading) || (tab === '관심종목' && watchlistLoading)}
          />
        ) : (
          list.map((stock, i) => (
            <StockRow
              key={stock.symbol}
              rank={i + 1}
              stock={stock}
              maxVol={maxVol}
              selected={selectedSymbol === stock.symbol}
              // StockDetailPanel은 selectedStock에서 price/name만 읽고 나머진 symbol로 직접 재조회하므로 RowStock으로도 안전
              onClick={() => { setSelectedSymbol(stock.symbol); setSelectedStock(stock as StockQuote) }}
            />
          ))
        )}
      </div>

      {showAddModal && (
        <AddModal
          onClose={() => setShowAddModal(false)}
          onSubmit={(symbol, name) => addMut.mutate({ symbol, name })}
          loading={addMut.isPending}
        />
      )}
    </div>
  )
}

// ── 종목 행 ────────────────────────────────────────────────
function StockRow({
                      rank, stock, maxVol, selected, onClick,
                  }: {
    rank: number
    stock: RowStock
    maxVol: number
    selected: boolean
    onClick: () => void
}) {
    const up = stock.changePercent >= 0
    const volRatio = Math.round(stock.volume / maxVol * 100)
    const qc = useQueryClient()

    const { data: watched = false } = useQuery({
        queryKey: ['watched', stock.symbol],
        queryFn: () => isWatched(stock.symbol),
        staleTime: 30_000,
    })

    const toggleMut = useMutation({
        mutationFn: () => watched
            ? deleteWatchlist(stock.symbol)
            : addWatchlist(stock.symbol, stock.name),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['watched', stock.symbol] })
            qc.invalidateQueries({ queryKey: ['watchlist'] })
        },
    })

    return (
        <div>
            <div onClick={onClick} style={{
                display: 'grid',
                gridTemplateColumns: '28px 1fr auto 24px',  // 마지막 컬럼 추가
                alignItems: 'center',
                gap: 12, padding: '10px 20px',
                cursor: 'pointer',
                background: selected ? 'rgba(255,140,0,0.05)' : 'transparent',
                transition: 'background 0.1s',
            }}
                 onMouseEnter={e => { if (!selected) e.currentTarget.style.background = 'rgba(255,255,255,0.025)' }}
                 onMouseLeave={e => { if (!selected) e.currentTarget.style.background = 'transparent' }}
            >
                {/* 순위 */}
                <div style={{
                    fontSize: 11, fontWeight: 700, textAlign: 'center',
                    color: rank <= 3 ? '#F0B429' : '#4B5675',
                }}>{rank}</div>

                {/* 종목 정보 */}
                <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#E2E8F0', marginBottom: 2 }}>
                        {stock.name || stock.symbol}
                    </div>
                    <div style={{ fontSize: 10, color: '#4B5675', display: 'flex', alignItems: 'center', gap: 5 }}>
                        {stock.symbol}
                        {stock.score != null && stock.score > 0 && (
                            <span style={{
                                background: stock.score >= 70
                                    ? 'rgba(255,140,0,0.15)' : 'rgba(61,142,255,0.12)',
                                color: stock.score >= 70 ? '#FF8C00' : '#3D8EFF',
                                fontSize: 9, padding: '1px 5px', borderRadius: 3, fontWeight: 700,
                            }}>{stock.score}점</span>
                        )}
                    </div>
                </div>

                {/* 가격 */}
                <div style={{ textAlign: 'right' }}>
                    <div style={{
                        fontSize: 13, fontWeight: 700,
                        color: '#E2E8F0', fontVariantNumeric: 'tabular-nums', marginBottom: 3,
                    }}>
                        {stock.price.toLocaleString()}
                    </div>
                    <span style={{
                        fontSize: 10, fontWeight: 700,
                        padding: '2px 6px', borderRadius: 3,
                        fontVariantNumeric: 'tabular-nums',
                        background: up ? 'rgba(255,140,0,0.12)' : 'rgba(255,75,75,0.1)',
                        color: up ? '#FF8C00' : '#FF4B4B',
                    }}>
            {up ? '▲' : '▼'} {Math.abs(stock.changePercent).toFixed(1)}%
          </span>
                </div>

                {/* ★ 버튼 */}
                <button
                    onClick={e => { e.stopPropagation(); toggleMut.mutate() }}
                    style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: 14, lineHeight: 1, padding: 0,
                        color: watched ? '#F0B429' : '#4B5675',
                        transition: 'color 0.15s, transform 0.15s',
                        transform: toggleMut.isPending ? 'scale(0.85)' : 'scale(1)',
                    }}
                >★</button>
            </div>

            {/* 거래량 바 */}
            <div style={{ padding: '0 20px', marginTop: -4, marginBottom: 2 }}>
                <div style={{ height: 2, background: 'rgba(255,255,255,0.04)', borderRadius: 1, overflow: 'hidden' }}>
                    <div style={{
                        height: '100%', borderRadius: 1,
                        width: `${volRatio}%`,
                        background: up
                            ? 'linear-gradient(90deg,rgba(255,140,0,0.5),rgba(255,140,0,0.15))'
                            : 'linear-gradient(90deg,rgba(255,75,75,0.5),rgba(255,75,75,0.15))',
                        transition: 'width 0.3s',
                    }} />
                </div>
            </div>
        </div>
    )
}

function LiveDot() {
  return (
    <div style={{
      width: 6, height: 6, borderRadius: '50%',
      background: '#FF8C00', boxShadow: '0 0 5px #FF8C00',
      animation: 'none',
      flexShrink: 0,
    }} />
  )
}

function EmptyState({ tab, loading, loginRequired }: { tab: TabType; loading?: boolean; loginRequired?: boolean }) {
  if (loginRequired) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        height: 200, gap: 8,
      }}>
        <div style={{ fontSize: 22 }}>★</div>
        <div style={{ fontSize: 12, color: '#4B5675' }}>로그인 후 이용할 수 있습니다</div>
      </div>
    )
  }

  // 탭 전환 직후 API 응답 대기 중 — "수집 중" 메시지 대신 스피너
  if (loading) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        height: 200, gap: 8,
      }}>
        <div style={{
          width: 18, height: 18, borderRadius: '50%',
          border: '2px solid rgba(255,255,255,0.08)',
          borderTopColor: '#FF8C00',
          animation: 'spin 0.7s linear infinite',
        }} />
        <div style={{ fontSize: 11, color: '#4B5675' }}>불러오는 중…</div>
      </div>
    )
  }

  const icon    = tab === '세력감지' ? '🔍' : tab === '관심종목' ? '★' : '💰'
  const message = tab === '세력감지'
    ? '감지된 세력 종목 없음'
    : tab === '관심종목'
      ? '관심 종목이 없습니다'
      : tab === '국장'
        ? '국장 동전주 수집 중… (DB 없을 시 첫 실행 약 20분)'
        : '미장 동전주 수집 중… (DB 없을 시 첫 실행 약 30초)'
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      height: 200, gap: 8,
    }}>
      <div style={{ fontSize: 22 }}>{icon}</div>
      <div style={{ fontSize: 12, color: '#4B5675' }}>{message}</div>
    </div>
  )
}

// ── 관심 종목 수동 추가 모달 ──────────────────────────────────
function AddModal({ onClose, onSubmit, loading }: {
    onClose: () => void
    onSubmit: (symbol: string, name: string) => void
    loading: boolean
}) {
    const [symbol, setSymbol] = useState('')
    const [name,   setName]   = useState('')

    return (
        <div style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000,
        }} onClick={onClose}>
            <div style={{
                background: '#0E1525', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10, padding: 24, width: 'min(360px, calc(100vw - 24px))',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            }} onClick={e => e.stopPropagation()}>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>관심 종목 추가</div>

                <div style={{ marginBottom: 12 }}>
                    <label style={labelStyle}>종목코드</label>
                    <input
                        value={symbol} onChange={e => setSymbol(e.target.value)}
                        placeholder="005930.KS"
                        style={inputStyle}
                        autoFocus
                    />
                </div>
                <div style={{ marginBottom: 20 }}>
                    <label style={labelStyle}>종목명</label>
                    <input
                        value={name} onChange={e => setName(e.target.value)}
                        placeholder="삼성전자"
                        style={inputStyle}
                    />
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={onClose} style={{ ...modalBtnStyle, background: 'transparent', flex: 1 }}>
                        취소
                    </button>
                    <button
                        onClick={() => { if (symbol && name) onSubmit(symbol.trim(), name.trim()) }}
                        disabled={loading || !symbol || !name}
                        style={{ ...modalBtnStyle, flex: 2, opacity: (!symbol || !name) ? 0.5 : 1 }}
                    >
                        {loading ? '추가 중...' : '추가'}
                    </button>
                </div>
            </div>
        </div>
    )
}

const modalBtnStyle: React.CSSProperties = {
    padding: '8px 16px', borderRadius: 6,
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,140,0,0.1)', color: '#FF8C00',
    fontSize: 12, fontWeight: 600, cursor: 'pointer',
}
const labelStyle: React.CSSProperties = {
    fontSize: 10, color: '#4B5675', display: 'block', marginBottom: 4,
}
const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 10px', borderRadius: 6, fontSize: 13,
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
    color: '#E2E8F0', outline: 'none', boxSizing: 'border-box',
}
