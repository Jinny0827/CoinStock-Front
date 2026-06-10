import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getAllStocks } from '../../api/stockApi'
import { useStockStore } from '../../store/stockStore'
import type { StockQuote } from '../../types/stock'

export default function AppHeader() {
  const [searchOpen, setSearchOpen]   = useState(false)
  const [query,      setQuery]        = useState('')
  const inputRef                      = useRef<HTMLInputElement>(null)
  const navigate                      = useNavigate()
  const { setSelectedSymbol }         = useStockStore()

  // 검색창 열릴 때만 전체 종목 로드
  const { data: allStocks = [] } = useQuery({
    queryKey: ['stocks-all'],
    queryFn:  getAllStocks,
    staleTime: 30_000,
    enabled:  searchOpen,
  })

  // 입력값으로 필터 (이름 or 심볼 포함)
  const filtered: StockQuote[] = query.trim().length === 0
    ? allStocks.slice(0, 6)                       // 빈 쿼리 → 최근 6개
    : allStocks
        .filter(s =>
          s.name  ?.toLowerCase().includes(query.toLowerCase()) ||
          s.symbol?.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, 8)

  function select(symbol: string) {
    setSelectedSymbol(symbol)
    setSearchOpen(false)
    setQuery('')
    navigate('/')
  }

  function close() {
    setSearchOpen(false)
    setQuery('')
  }

  // ⌘K / Ctrl+K 단축키
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true) }
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    if (searchOpen) setTimeout(() => inputRef.current?.focus(), 50)
  }, [searchOpen])

  return (
    <>
      <header style={{
        height: 52, background: '#0E1525',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', alignItems: 'center',
        padding: '0 20px', gap: 16, flexShrink: 0,
      }}>
        {/* 로고 */}
        <div
          onClick={() => navigate('/')}
          style={{ display:'flex', alignItems:'center', gap:7, cursor:'pointer' }}
        >
          <div style={{
            width:7, height:7, borderRadius:'50%',
            background:'#00C896', boxShadow:'0 0 6px #00C896',
          }} />
          <span style={{ fontSize:15, fontWeight:700, letterSpacing:'-0.5px' }}>지금</span>
        </div>

        {/* 검색바 */}
        <div style={{ flex:1, display:'flex', justifyContent:'center' }}>
          <div
            onClick={() => setSearchOpen(true)}
            style={{
              width:340, height:32,
              background:'rgba(255,255,255,0.04)',
              border:'1px solid rgba(255,255,255,0.07)',
              borderRadius:6, display:'flex', alignItems:'center',
              padding:'0 12px', gap:8, cursor:'pointer',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4B5675" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <span style={{ fontSize:12, color:'#4B5675', flex:1 }}>종목, 테마, 키워드 검색</span>
            <span style={{
              fontSize:10, color:'#4B5675',
              background:'rgba(255,255,255,0.05)',
              padding:'2px 6px', borderRadius:4,
            }}>⌘K</span>
          </div>
        </div>

        {/* 우측 버튼 */}
        <div style={{ display:'flex', alignItems:'center', gap:12, marginLeft:'auto' }}>
          <button style={{
            width:32, height:32, borderRadius:6,
            border:'1px solid rgba(255,255,255,0.07)',
            background:'transparent', color:'#8892A8',
            display:'flex', alignItems:'center', justifyContent:'center',
            cursor:'pointer',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </button>
          <div style={{
            width:28, height:28, borderRadius:'50%',
            background:'linear-gradient(135deg,#3D8EFF,#00C896)',
            fontSize:11, fontWeight:700,
            display:'flex', alignItems:'center', justifyContent:'center',
            color:'#fff', cursor:'pointer',
          }}>K</div>
        </div>
      </header>

      {/* 검색 모달 */}
      {searchOpen && (
        <div
          onClick={close}
          style={{
            position:'fixed', inset:0,
            background:'rgba(0,0,0,0.6)',
            backdropFilter:'blur(4px)',
            zIndex:1000,
            display:'flex', alignItems:'flex-start',
            justifyContent:'center', paddingTop:80,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width:480, background:'#111827',
              border:'1px solid rgba(255,255,255,0.1)',
              borderRadius:10, overflow:'hidden',
            }}
          >
            {/* 입력창 */}
            <div style={{
              display:'flex', alignItems:'center',
              padding:'0 16px',
              borderBottom:'1px solid rgba(255,255,255,0.07)',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4B5675" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="종목명, 코드 검색..."
                style={{
                  flex:1, height:48, background:'transparent',
                  border:'none', outline:'none',
                  color:'#E2E8F0', fontSize:14,
                  padding:'0 12px',
                }}
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  style={{
                    background:'none', border:'none', cursor:'pointer',
                    color:'#4B5675', fontSize:16, padding:'0 4px',
                  }}
                >✕</button>
              )}
              <span style={{ fontSize:11, color:'#4B5675', marginLeft:8 }}>ESC</span>
            </div>

            {/* 결과 목록 */}
            <div style={{ padding:'4px 0', maxHeight:360, overflowY:'auto' }}>
              {filtered.length === 0 ? (
                <div style={{
                  padding:'24px 16px', textAlign:'center',
                  fontSize:12, color:'#4B5675',
                }}>
                  {query ? `"${query}" 검색 결과 없음` : '종목 데이터 로딩 중...'}
                </div>
              ) : (
                filtered.map(stock => (
                  <SearchRow
                    key={stock.symbol}
                    stock={stock}
                    query={query}
                    onSelect={() => select(stock.symbol)}
                  />
                ))
              )}
            </div>

            {/* 하단 안내 */}
            <div style={{
              borderTop:'1px solid rgba(255,255,255,0.05)',
              padding:'8px 16px',
              display:'flex', gap:16,
              fontSize:11, color:'#4B5675',
            }}>
              <span>↵ 선택</span>
              <span>ESC 닫기</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ── 검색 결과 행 ──────────────────────────────────────────────
function SearchRow({
  stock, query, onSelect,
}: {
  stock: StockQuote
  query: string
  onSelect: () => void
}) {
  const up     = stock.changePercent >= 0
  const market = stock.symbol.endsWith('.KS') || stock.symbol.endsWith('.KQ')
    ? '국장' : '미장'

  return (
    <div
      onClick={onSelect}
      style={{
        display:'flex', alignItems:'center', gap:12,
        padding:'10px 16px', cursor:'pointer',
        transition:'background 0.1s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      {/* 종목 정보 */}
      <div style={{ flex:1 }}>
        <div style={{ fontSize:13, fontWeight:600, color:'#E2E8F0' }}>
          <Highlight text={stock.name ?? ''} query={query} />
        </div>
        <div style={{ fontSize:11, color:'#4B5675', marginTop:2, display:'flex', gap:6 }}>
          <Highlight text={stock.symbol} query={query} />
          <span style={{
            background:'rgba(255,255,255,0.06)',
            padding:'1px 5px', borderRadius:3, fontSize:10,
          }}>{market}</span>
        </div>
      </div>

      {/* 가격 / 등락률 */}
      <div style={{ textAlign:'right', flexShrink:0 }}>
        <div style={{ fontSize:13, fontWeight:600, color:'#E2E8F0' }}>
          {stock.price > 0 ? stock.price.toLocaleString() : '-'}
        </div>
        <div style={{
          fontSize:11, fontWeight:700,
          color: up ? '#00C896' : '#FF4B4B',
        }}>
          {up ? '▲' : '▼'} {Math.abs(stock.changePercent).toFixed(1)}%
        </div>
      </div>
    </div>
  )
}

// 검색어 하이라이트
function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <span>{text}</span>

  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return <span>{text}</span>

  return (
    <span>
      {text.slice(0, idx)}
      <span style={{ color:'#00C896', fontWeight:700 }}>
        {text.slice(idx, idx + query.length)}
      </span>
      {text.slice(idx + query.length)}
    </span>
  )
}
