import { useState, useEffect, useRef } from 'react'
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query'
import {addWatchlist, deleteWatchlist, getForceStocks, getKrPennyStocks, getUsPennyStocks, isWatched} from '../../api/stockApi'
import { useStockStore } from '../../store/stockStore'
import type { StockQuote } from '../../types/stock'

type TabType = '세력감지' | '국장' | '미장'

const TABS: TabType[] = ['세력감지', '국장', '미장']

const THEME_MAP: Record<string, string> = {
  '005930.KS': '반도체', '000660.KS': '반도체', '035420.KS': 'IT',
  '035720.KS': 'IT',     '051910.KS': '2차전지', '006400.KS': '2차전지',
  'AAPL': '빅테크', 'MSFT': '빅테크', 'NVDA': 'AI반도체',
}

export default function HotStockList() {
  const [tab, setTab] = useState<TabType>('세력감지')
  const { selectedSymbol, setSelectedSymbol, setSelectedStock } = useStockStore()

  const { data: forceData = [] } = useQuery({
    queryKey: ['force'],
    queryFn: getForceStocks,
    refetchInterval: 10_000,
  })

  const { data: krData = [], isLoading: krLoading } = useQuery({
    queryKey: ['penny-kr'],
    queryFn: getKrPennyStocks,
    enabled: tab === '국장',
    refetchInterval: 30_000,
  })

  const { data: usData = [], isLoading: usLoading } = useQuery({
    queryKey: ['penny-us'],
    queryFn: getUsPennyStocks,
    enabled: tab === '미장',
    refetchInterval: 30_000,
  })

  const listMap: Record<TabType, StockQuote[]> = {
    '세력감지': forceData,
    '국장':     krData,
    '미장':     usData,
  }

  // 세력감지: 등락률 절댓값 내림차순 / 국장·미장: 서버 score 순 유지
  const list = (tab === '세력감지'
    ? listMap['세력감지'].slice().sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
    : listMap[tab].slice()
  ).slice(0, 100)

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
        <span style={{ fontSize: 13, fontWeight: 600 }}>동전주 · 세력 감지</span>
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
          <div key={t} onClick={() => setTab(t)} style={{
            padding: '9px 14px', fontSize: 12, fontWeight: 500,
            cursor: 'pointer',
            color: tab === t ? '#00C896' : '#4B5675',
            borderBottom: `2px solid ${tab === t ? '#00C896' : 'transparent'}`,
            transition: 'all 0.12s',
          }}>{t}</div>
        ))}
      </div>

      {/* 리스트 */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {list.length === 0 ? (
          <EmptyState
            tab={tab}
            loading={(tab === '국장' && krLoading) || (tab === '미장' && usLoading)}
          />
        ) : (
          list.map((stock, i) => (
            <StockRow
              key={stock.symbol}
              rank={i + 1}
              stock={stock}
              theme={THEME_MAP[stock.symbol]}
              maxVol={maxVol}
              selected={selectedSymbol === stock.symbol}
              onClick={() => { setSelectedSymbol(stock.symbol); setSelectedStock(stock) }}
              showScore={tab === '국장' || tab === '미장'}
            />
          ))
        )}
      </div>
    </div>
  )
}

// ── 종목 행 ────────────────────────────────────────────────
function StockRow({
                      rank, stock, theme, maxVol, selected, onClick, showScore,
                  }: {
    rank: number
    stock: StockQuote
    theme?: string
    maxVol: number
    selected: boolean
    onClick: () => void
    showScore?: boolean
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
                background: selected ? 'rgba(0,200,150,0.05)' : 'transparent',
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
                        {showScore && stock.score != null && stock.score > 0 && (
                            <span style={{
                                background: stock.score >= 70
                                    ? 'rgba(0,200,150,0.15)' : 'rgba(61,142,255,0.12)',
                                color: stock.score >= 70 ? '#00C896' : '#3D8EFF',
                                fontSize: 9, padding: '1px 5px', borderRadius: 3, fontWeight: 700,
                            }}>{stock.score}점</span>
                        )}
                        {!showScore && theme && (
                            <span style={{
                                background: 'rgba(61,142,255,0.12)', color: '#3D8EFF',
                                fontSize: 9, padding: '1px 5px', borderRadius: 3, fontWeight: 600,
                            }}>{theme}</span>
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
                        background: up ? 'rgba(0,200,150,0.12)' : 'rgba(255,75,75,0.1)',
                        color: up ? '#00C896' : '#FF4B4B',
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
                            ? 'linear-gradient(90deg,rgba(0,200,150,0.5),rgba(0,200,150,0.15))'
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
      background: '#00C896', boxShadow: '0 0 5px #00C896',
      animation: 'none',
      flexShrink: 0,
    }} />
  )
}

function EmptyState({ tab, loading }: { tab: TabType; loading?: boolean }) {
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
          borderTopColor: '#00C896',
          animation: 'spin 0.7s linear infinite',
        }} />
        <div style={{ fontSize: 11, color: '#4B5675' }}>불러오는 중…</div>
      </div>
    )
  }

  const icon    = tab === '세력감지' ? '🔍' : '💰'
  const message = tab === '세력감지'
    ? '감지된 세력 종목 없음'
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
