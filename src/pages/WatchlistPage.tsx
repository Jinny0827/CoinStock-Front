import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getWatchlist, addWatchlist, deleteWatchlist } from '../api/stockApi'
import { useStockStore } from '../store/stockStore'

export default function WatchlistPage() {
    const [showModal, setShowModal] = useState(false)
    const qc = useQueryClient()
    const navigate = useNavigate()
    const setSelectedSymbol = useStockStore(s => s.setSelectedSymbol)

    const { data: list = [] } = useQuery({
        queryKey: ['watchlist'],
        queryFn: getWatchlist,
    })

    const addMut = useMutation({
        mutationFn: ({ symbol, name }: { symbol: string; name: string }) =>
            addWatchlist(symbol, name),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['watchlist'] })
            setShowModal(false)
        },
    })

    const delMut = useMutation({
        mutationFn: deleteWatchlist,
        onSuccess: () => qc.invalidateQueries({ queryKey: ['watchlist'] }),
    })


    const handleClick = (symbol: string) => {
        setSelectedSymbol(symbol)
        navigate('/')
    }

    return (
        <div style={{ padding: '24px 32px', maxWidth: 700, margin: '0 auto' }}>

            {/* 헤더 */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>관심 종목</h2>
                <button onClick={() => setShowModal(true)} style={{ ...btnStyle, marginLeft: 'auto' }}>
                    + 종목 추가
                </button>
            </div>

            {/* 목록 */}
            <div style={{
                background: '#0E1525',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 8, overflow: 'hidden',
            }}>
                {list.length === 0 ? (
                    <div style={{
                        padding: '60px 0', textAlign: 'center',
                        color: '#4B5675', fontSize: 13,
                    }}>
                        <div style={{ fontSize: 28, marginBottom: 10 }}>★</div>
                        관심 종목이 없습니다
                    </div>
                ) : (
                    list.map((item, i) => (
                        <div key={item.symbol} style={{
                            display: 'flex', alignItems: 'center', gap: 16,
                            padding: '14px 20px',
                            borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.04)',
                            cursor: 'pointer',
                            transition: 'background 0.1s',
                        }}
                             onClick={() => handleClick(item.symbol)}
                             onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                             onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                            {/* 순번 */}
                            <div style={{ fontSize: 12, color: '#4B5675', width: 20, textAlign: 'center' }}>
                                {i + 1}
                            </div>

                            {/* 종목 정보 */}
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 3 }}>
                                    {item.name}
                                </div>
                                <div style={{ fontSize: 11, color: '#4B5675' }}>{item.symbol}</div>
                            </div>

                            {/* 추가일 */}
                            <div style={{ fontSize: 11, color: '#4B5675' }}>
                                {item.addedAt?.slice(0, 10)}
                            </div>

                            {/* 삭제 버튼 */}
                            <button
                                onClick={e => { e.stopPropagation(); delMut.mutate(item.symbol) }}
                                style={{
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    color: '#4B5675', fontSize: 18, padding: '0 4px',
                                    lineHeight: 1, transition: 'color 0.1s',
                                }}
                                onMouseEnter={e => (e.currentTarget.style.color = '#FF4B4B')}
                                onMouseLeave={e => (e.currentTarget.style.color = '#4B5675')}
                            >×</button>
                        </div>
                    ))
                )}
            </div>

            {/* 추가 모달 */}
            {showModal && (
                <AddModal
                    onClose={() => setShowModal(false)}
                    onSubmit={(symbol, name) => addMut.mutate({ symbol, name })}
                    loading={addMut.isPending}
                />
            )}
        </div>
    )
}

// ── 종목 추가 모달 ─────────────────────────────────────────
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
                borderRadius: 10, padding: 24, width: 360,
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
                    <button onClick={onClose} style={{ ...btnStyle, background: 'transparent', flex: 1 }}>
                        취소
                    </button>
                    <button
                        onClick={() => { if (symbol && name) onSubmit(symbol.trim(), name.trim()) }}
                        disabled={loading || !symbol || !name}
                        style={{ ...btnStyle, flex: 2, opacity: (!symbol || !name) ? 0.5 : 1 }}
                    >
                        {loading ? '추가 중...' : '추가'}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ── 스타일 상수 ────────────────────────────────────────────
const btnStyle: React.CSSProperties = {
    padding: '8px 16px', borderRadius: 6,
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(0,200,150,0.1)', color: '#00C896',
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
