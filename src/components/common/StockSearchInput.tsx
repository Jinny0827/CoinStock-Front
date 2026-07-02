import { useState, useRef, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { searchStocks } from '../../api/stockApi'

interface Props {
  onSelect: (symbol: string, name: string) => void
  selectedSymbol?: string
  selectedName?: string
  placeholder?: string
  style?: React.CSSProperties
}

type SearchResult = { symbol: string; name: string; market: string }

export default function StockSearchInput({ onSelect, selectedSymbol, selectedName, placeholder = '종목 검색…', style }: Props) {
  const [query, setQuery]       = useState('')
  const [open,  setOpen]        = useState(false)
  const [debouncedQ, setDebQ]   = useState('')
  const containerRef            = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebQ(query.trim()), 300)
    return () => clearTimeout(t)
  }, [query])

  const { data: results = [], isFetching } = useQuery({
    queryKey: ['stock-search', debouncedQ],
    queryFn:  () => searchStocks(debouncedQ),
    enabled:  debouncedQ.length >= 1,
    staleTime: 60_000,
  })

  function handleSelect(r: SearchResult) {
    const sym = r.market === 'KR' ? r.symbol + '.KS' : r.symbol
    onSelect(sym, r.name)
    setQuery('')
    setOpen(false)
  }

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const displayVal = open ? query : (selectedName ?? selectedSymbol ?? '')
  const q = query.trim()

  return (
    <div ref={containerRef} style={{ position: 'relative', ...style }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '0 10px', borderRadius: 6,
        background: 'rgba(255,255,255,0.05)',
        border: `1px solid ${open ? 'rgba(255,140,0,0.4)' : 'rgba(255,255,255,0.1)'}`,
        transition: 'border-color 0.15s',
      }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4B5675" strokeWidth="2.5" style={{ flexShrink: 0 }}>
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          value={displayVal}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder={selectedSymbol ? '' : placeholder}
          style={{
            flex: 1, height: 36, background: 'transparent',
            border: 'none', outline: 'none',
            color: '#E2E8F0', fontSize: 13,
          }}
        />
        {selectedSymbol && !open && (
          <span style={{
            fontSize: 10, padding: '2px 5px', borderRadius: 3,
            background: 'rgba(255,140,0,0.12)', color: '#FF8C00',
            flexShrink: 0,
          }}>{selectedSymbol.replace(/\.(KS|KQ)$/, '')}</span>
        )}
        {(selectedSymbol || query) && (
          <button
            type="button"
            onClick={() => { onSelect('', ''); setQuery(''); setOpen(false) }}
            style={{ background: 'none', border: 'none', color: '#4B5675', cursor: 'pointer', padding: 0, fontSize: 14, flexShrink: 0 }}
          >✕</button>
        )}
      </div>

      {/* 드롭다운 */}
      {open && q.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: '#111827', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8, overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          zIndex: 500, maxHeight: 260, overflowY: 'auto',
        }}>
          {isFetching ? (
            <div style={{ padding: '12px 14px', fontSize: 12, color: '#4B5675' }}>검색 중...</div>
          ) : results.length === 0 ? (
            <div style={{ padding: '12px 14px', fontSize: 12, color: '#4B5675' }}>
              {`"${query}" 검색 결과 없음`}
            </div>
          ) : (
            results.map(r => (
              <div
                key={r.symbol}
                onMouseDown={e => { e.preventDefault(); handleSelect(r) }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '9px 14px', cursor: 'pointer',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#E2E8F0' }}>{r.name}</div>
                  <div style={{ fontSize: 11, color: '#4B5675', marginTop: 1, display: 'flex', gap: 5, alignItems: 'center' }}>
                    <span>{r.symbol}</span>
                    <span style={{
                      fontSize: 9, padding: '1px 4px', borderRadius: 3,
                      background: 'rgba(255,255,255,0.06)', color: '#8892A8',
                    }}>{r.market === 'KR' ? '국장' : '미장'}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
