import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getPortfolioSummary } from '../api/stockApi'
import { useStockStore } from '../store/stockStore'
import TossAccountSection from '../components/mypage/TossAccountSection'

export default function MyPage() {
    const navigate = useNavigate()
    const setSelectedSymbol = useStockStore(s => s.setSelectedSymbol)

    const { data: summary, isLoading } = useQuery({
        queryKey: ['portfolio'],
        queryFn: getPortfolioSummary,
    })

    return (
        <div style={{ padding: '16px', maxWidth: 800, margin: '0 auto' }}>
            <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700 }}>마이페이지</h2>

            <TossAccountSection />

            {isLoading ? <Loading /> : !summary || summary.totalTrades === 0 ? <Empty /> : (
                <PortfolioSummaryView summary={summary} navigate={navigate} setSelectedSymbol={setSelectedSymbol} />
            )}
        </div>
    )
}

function PortfolioSummaryView({ summary, navigate, setSelectedSymbol }: {
    summary: NonNullable<ReturnType<typeof useQuery<Awaited<ReturnType<typeof getPortfolioSummary>>>>['data']>
    navigate: ReturnType<typeof useNavigate>
    setSelectedSymbol: (symbol: string) => void
}) {
    const pnlColor = (v: number) => v >= 0 ? '#FF8C00' : '#FF4B4B'
    const pnlSign  = (v: number) => v >= 0 ? '+' : ''

    return (
        <>
            {/* 요약 카드 4개 — 2열 고정 (모바일/데스크탑 모두) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 20 }}>
                <StatCard
                    label="총 손익"
                    value={pnlSign(summary.totalPnl) + summary.totalPnl.toLocaleString()}
                    unit="원"
                    color={pnlColor(summary.totalPnl)}
                />
                <StatCard
                    label="승률"
                    value={summary.winRate.toFixed(1)}
                    unit="%"
                    color={summary.winRate >= 50 ? '#FF8C00' : '#FF4B4B'}
                />
                <StatCard
                    label="총 거래"
                    value={summary.totalTrades.toString()}
                    unit="건"
                    color="#8892A8"
                />
                <StatCard
                    label="보유 종목"
                    value={summary.totalSymbols.toString()}
                    unit="종목"
                    color="#3D8EFF"
                />
            </div>

            {/* 종목별 현황 */}
            {summary.bySymbol.length > 0 && (
                <div style={{ overflowX: 'auto', borderRadius: 8 }}>
                <div style={{
                    background: '#0E1525',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 8, overflow: 'hidden',
                    minWidth: 520,
                }}>
                    <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#8892A8' }}>종목별 현황</span>
                    </div>

                    {/* 테이블 헤더 */}
                    <div style={{ ...rowStyle, background: 'rgba(255,255,255,0.03)', color: '#4B5675', fontSize: 11 }}>
                        <span>종목</span>
                        <span style={{ textAlign: 'right' }}>보유수량</span>
                        <span style={{ textAlign: 'right' }}>평균단가</span>
                        <span style={{ textAlign: 'right' }}>실현손익</span>
                        <span style={{ textAlign: 'right' }}>미실현손익</span>
                        <span style={{ textAlign: 'right' }}>합계손익</span>
                    </div>

                    {summary.bySymbol.map((s, i) => (
                        <div key={s.symbol}
                             style={{
                                 ...rowStyle,
                                 borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.04)',
                                 fontSize: 13, cursor: 'pointer', transition: 'background 0.1s',
                             }}
                             onClick={() => { setSelectedSymbol(s.symbol); navigate('/') }}
                             onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                             onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                            <div>
                                <div style={{ fontWeight: 600 }}>{s.name}</div>
                                <div style={{ fontSize: 10, color: '#4B5675', marginTop: 2 }}>{s.symbol}</div>
                            </div>
                            <span style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                {s.netQty.toLocaleString()}주
              </span>
                            <span style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                {s.avgBuyPrice.toLocaleString()}
              </span>
                            <span style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: pnlColor(s.realizedPnl) }}>
                {pnlSign(s.realizedPnl)}{s.realizedPnl.toLocaleString()}
              </span>
                            <span style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: pnlColor(s.unrealizedPnl) }}>
                {pnlSign(s.unrealizedPnl)}{s.unrealizedPnl.toLocaleString()}
              </span>
                            <span style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 700, color: pnlColor(s.totalPnl) }}>
                {pnlSign(s.totalPnl)}{s.totalPnl.toLocaleString()}
              </span>
                        </div>
                    ))}
                </div>
                </div>
            )}
        </>
    )
}

// ── 공통 UI ────────────────────────────────────────────────
function StatCard({ label, value, unit, color }: {
    label: string; value: string; unit: string; color: string
}) {
    return (
        <div style={{
            background: '#0E1525', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 8, padding: '14px 16px',
        }}>
            <div style={{ fontSize: 10, color: '#4B5675', marginBottom: 8 }}>{label}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color, fontVariantNumeric: 'tabular-nums' }}>
                {value}
                <span style={{ fontSize: 11, color: '#4B5675', marginLeft: 3, fontWeight: 400 }}>{unit}</span>
            </div>
        </div>
    )
}

function Loading() {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
            <div style={{ color: '#4B5675', fontSize: 13 }}>로딩 중...</div>
        </div>
    )
}

function Empty() {
    return (
        <div style={{
            background: '#0E1525', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 8, padding: '60px 0', textAlign: 'center',
        }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>📊</div>
            <div style={{ fontSize: 13, color: '#4B5675' }}>거래 기록이 없습니다</div>
        </div>
    )
}

// ── 스타일 상수 ────────────────────────────────────────────
const rowStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '2fr 80px 90px 100px 100px 100px',
    alignItems: 'center', gap: 8, padding: '12px 20px',
}