import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getValueScreener, refreshFinancials } from '../api/stockApi'

export default function ScreenerPage() {
  const navigate = useNavigate()
  const [refreshing, setRefreshing] = useState(false)
  const [refreshMsg, setRefreshMsg] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['valueScreener'],
    queryFn: getValueScreener,
    staleTime: 5 * 60_000,
  })

  const list = data?.data ?? []

  const handleClick = (symbol: string, name: string) => {
    navigate('/analysis', { state: { symbol, name } })
  }

  const handleRefreshFinancials = async () => {
    if (refreshing) return
    setRefreshing(true)
    setRefreshMsg(null)
    try {
      const res = await refreshFinancials()
      setRefreshMsg(res.message ?? '수집 시작')
    } catch {
      setRefreshMsg('요청 실패')
    } finally {
      setRefreshing(false)
      setTimeout(() => setRefreshMsg(null), 4000)
    }
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', boxSizing: 'border-box', padding: '16px', maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20, gap: 10 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>가치주 스크리너</h2>
        {data && (
          <span style={{
            fontSize: 11, color: '#4B5675', background: 'rgba(255,255,255,0.05)',
            padding: '2px 8px', borderRadius: 10,
          }}>총 {data.total}개</span>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          {refreshMsg && (
            <span style={{ fontSize: 11, color: '#4CAF50' }}>{refreshMsg}</span>
          )}
          <button
            onClick={handleRefreshFinancials}
            disabled={refreshing}
            style={{
              fontSize: 11, padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.12)',
              background: refreshing ? 'rgba(255,255,255,0.04)' : 'rgba(61,142,255,0.12)',
              color: refreshing ? '#4B5675' : '#5B9CF6',
              cursor: refreshing ? 'default' : 'pointer',
            }}
          >
            {refreshing ? '수집 중…' : 'EPS/PER/PBR 수집'}
          </button>
        </div>
      </div>

      {/* 기준 안내 */}
      <div style={{
        background: 'rgba(61,142,255,0.06)', border: '1px solid rgba(61,142,255,0.15)',
        borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#8892A8',
      }}>
        PER &lt; 15 · PBR &lt; 1.5 · EPS &gt; 0 · 매출성장률 &gt; 0% · 영업이익률 &gt; 0% 기업 필터링
      </div>

      {isLoading ? (
        <Loading />
      ) : list.length === 0 ? (
        <Empty />
      ) : (
        <div style={{ overflowX: 'auto', borderRadius: 8 }}>
          <div style={{
            background: '#0E1525', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 8, minWidth: 620,
          }}>
            {/* 테이블 헤더 — sticky */}
            <div style={{
              ...rowStyle, background: '#0E1525', color: '#4B5675', fontSize: 11,
              position: 'sticky', top: 0, zIndex: 1,
              borderBottom: '1px solid rgba(255,255,255,0.07)',
            }}>
              <span>종목</span>
              <span style={{ textAlign: 'right' }}>EPS</span>
              <span style={{ textAlign: 'right' }}>PER</span>
              <span style={{ textAlign: 'right' }}>PBR</span>
              <span style={{ textAlign: 'right' }}>매출성장</span>
              <span style={{ textAlign: 'right' }}>영업이익률</span>
            </div>

            {/* 스크롤 영역 */}
            <div style={{ maxHeight: 'calc(100vh - 260px)', overflowY: 'auto' }}>
              {list.map((s, i) => (
                <div
                  key={s.symbol}
                  style={{
                    ...rowStyle,
                    borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.04)',
                    fontSize: 13, cursor: 'pointer', transition: 'background 0.1s',
                  }}
                  onClick={() => handleClick(s.symbol, s.name)}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>{s.name}</div>
                    <div style={{ fontSize: 10, color: '#4B5675', marginTop: 2 }}>{s.symbol}</div>
                  </div>
                  <span style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: '#E2E8F0' }}>
                    {s.eps.toLocaleString()}
                  </span>
                  <span style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: s.per < 10 ? '#FF8C00' : '#E2E8F0' }}>
                    {s.per.toFixed(1)}
                  </span>
                  <span style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: s.pbr < 1 ? '#FF8C00' : '#E2E8F0' }}>
                    {s.pbr.toFixed(2)}
                  </span>
                  <span style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: s.revenueGrowth > 10 ? '#FF8C00' : '#E2E8F0' }}>
                    {s.revenueGrowth.toFixed(1)}%
                  </span>
                  <span style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: s.operatingMargin > 15 ? '#FF8C00' : '#E2E8F0' }}>
                    {s.operatingMargin.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Loading() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
      <div style={{ color: '#4B5675', fontSize: 13 }}>스크리닝 중...</div>
    </div>
  )
}

function Empty() {
  return (
    <div style={{
      background: '#0E1525', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 8, padding: '60px 0', textAlign: 'center',
    }}>
      <div style={{ fontSize: 28, marginBottom: 10 }}>🔍</div>
      <div style={{ fontSize: 13, color: '#4B5675' }}>조건에 맞는 종목이 없습니다</div>
    </div>
  )
}

const rowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '2fr 80px 60px 60px 80px 90px',
  alignItems: 'center', gap: 8, padding: '12px 20px',
}
