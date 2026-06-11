import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getTrades, addTrade, deleteTrade } from '../api/stockApi'
import type { Trade } from '../types/stock'


const today = () => new Date().toISOString().slice(0, 10);
const monthAgo = () => {
    const d = new Date(); d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
}

export default function HistoryPage() {
    const [from, setFrom] = useState(monthAgo());
    const [to, setTo] = useState(today());
    const [showModal, setShowModal] = useState(false);
    const qc = useQueryClient();

    const { data: trades = [] } = useQuery({
        queryKey : ['trades', from, to],
        queryFn: () => getTrades(from, to),
    })

    const addMut = useMutation({
        mutationFn : addTrade,
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['trades']}); setShowModal(false) },
    })

    const delMut = useMutation({
        mutationFn: deleteTrade,
        onSuccess: () => qc.invalidateQueries({ queryKey: ['trades'] }),
    })

    // 통계
    const totalBuy  = trades.filter(t => t.side === 'buy').reduce((s, t) => s + t.price * t.qty, 0)
    const totalSell = trades.filter(t => t.side === 'sell').reduce((s, t) => s + t.price * t.qty, 0)
    const realized  = totalSell - totalBuy

    return (
        <div style={{ padding: '16px', maxWidth: 900, margin: '0 auto' }}>

            {/* 헤더 */}
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>거래 기록</h2>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <input type="date" value={from} onChange={e => setFrom(e.target.value)}
                           style={dateInputStyle} />
                    <span style={{ color: '#4B5675', fontSize: 12 }}>~</span>
                    <input type="date" value={to} onChange={e => setTo(e.target.value)}
                           style={dateInputStyle} />
                    <button onClick={() => setShowModal(true)} style={btnStyle}>
                        + 거래 추가
                    </button>
                </div>
            </div>

            {/* 요약 카드 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
                <SummaryCard label="총 매수금액" value={totalBuy.toLocaleString()} unit="원" color="#3D8EFF" />
                <SummaryCard label="총 매도금액" value={totalSell.toLocaleString()} unit="원" color="#8892A8" />
                <SummaryCard label="실현 손익" value={(realized >= 0 ? '+' : '') + realized.toLocaleString()} unit="원"
                             color={realized >= 0 ? '#00C896' : '#FF4B4B'} />
            </div>

            {/* 거래 목록 */}
            <div style={{ overflowX: 'auto', borderRadius: 8 }}>
            <div style={{
                background: '#0E1525',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 8, overflow: 'hidden',
                minWidth: 640,
            }}>
                {/* 테이블 헤더 */}
                <div style={{ ...rowStyle, background: 'rgba(255,255,255,0.03)', color: '#4B5675', fontSize: 11 }}>
                    <span>종목</span><span>구분</span><span style={{ textAlign: 'right' }}>단가</span>
                    <span style={{ textAlign: 'right' }}>수량</span><span style={{ textAlign: 'right' }}>금액</span>
                    <span style={{ textAlign: 'right' }}>수수료</span><span>날짜</span><span></span>
                </div>

                {trades.length === 0 ? (
                    <div style={{ padding: '40px 0', textAlign: 'center', color: '#4B5675', fontSize: 13 }}>
                        거래 내역이 없습니다
                    </div>
                ) : (
                    trades.map(t => (
                        <div key={t.id} style={{
                            ...rowStyle,
                            borderTop: '1px solid rgba(255,255,255,0.04)',
                            fontSize: 13,
                        }}>
                            <div>
                                <div style={{ fontWeight: 600 }}>{t.name}</div>
                                <div style={{ fontSize: 10, color: '#4B5675', marginTop: 2 }}>{t.symbol}</div>
                            </div>
                            <span style={{
                                fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 3,
                                background: t.side === 'buy' ? 'rgba(0,200,150,0.1)' : 'rgba(255,75,75,0.1)',
                                color: t.side === 'buy' ? '#00C896' : '#FF4B4B',
                            }}>{t.side === 'buy' ? '매수' : '매도'}</span>
                            <span style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{t.price.toLocaleString()}</span>
                            <span style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{t.qty.toLocaleString()}</span>
                            <span style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                {(t.price * t.qty).toLocaleString()}
              </span>
                            <span style={{ textAlign: 'right', color: '#4B5675', fontVariantNumeric: 'tabular-nums' }}>
                {(t.fee ?? 0).toLocaleString()}
              </span>
                            <span style={{ color: '#4B5675', fontSize: 11 }}>{t.tradedAt?.slice(0, 10)}</span>
                            <button onClick={() => delMut.mutate(t.id)} style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: '#4B5675', fontSize: 16, padding: '0 4px',
                                transition: 'color 0.1s',
                            }}
                                    onMouseEnter={e => (e.currentTarget.style.color = '#FF4B4B')}
                                    onMouseLeave={e => (e.currentTarget.style.color = '#4B5675')}
                            >×</button>
                        </div>
                    ))
                )}
            </div>
            </div>

            {/* 거래 추가 모달 */}
            {showModal && (
                <TradeModal
                    onClose={() => setShowModal(false)}
                    onSubmit={data => addMut.mutate(data)}
                    loading={addMut.isPending}
                />
            )}
        </div>
    )
}

// ── 거래 추가 모달 ─────────────────────────────────────────
function TradeModal({ onClose, onSubmit, loading }: {
    onClose: () => void
    onSubmit: (data: Omit<Trade, 'id'>) => void
    loading: boolean
}) {
    const [form, setForm] = useState({
        symbol: '', name: '', side: 'buy' as 'buy' | 'sell',
        price: '', qty: '', fee: '0', memo: '', tradedAt: today(),
    })
    const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setForm(f => ({ ...f, [k]: e.target.value }))

    const handleSubmit = () => {
        if (!form.symbol || !form.price || !form.qty) return
        onSubmit({
            symbol: form.symbol, name: form.name, side: form.side,
            price: Number(form.price), qty: Number(form.qty),
            fee: Number(form.fee), memo: form.memo,
            tradedAt: form.tradedAt + 'T00:00:00',
        })
    }

    return (
        <div style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000,
        }} onClick={onClose}>
            <div style={{
                background: '#0E1525', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10, padding: 24, width: 'min(400px, calc(100vw - 24px))',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            }} onClick={e => e.stopPropagation()}>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>거래 추가</div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <Field label="종목코드" value={form.symbol} onChange={set('symbol')} placeholder="005930.KS" />
                    <Field label="종목명" value={form.name} onChange={set('name')} placeholder="삼성전자" />
                </div>

                <div style={{ margin: '10px 0' }}>
                    <label style={labelStyle}>구분</label>
                    <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                        {(['buy', 'sell'] as const).map(s => (
                            <button key={s} onClick={() => setForm(f => ({ ...f, side: s }))} style={{
                                flex: 1, padding: '8px 0', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                                border: '1px solid',
                                borderColor: form.side === s ? (s === 'buy' ? '#00C896' : '#FF4B4B') : 'rgba(255,255,255,0.1)',
                                background: form.side === s
                                    ? (s === 'buy' ? 'rgba(0,200,150,0.1)' : 'rgba(255,75,75,0.1)')
                                    : 'transparent',
                                color: form.side === s ? (s === 'buy' ? '#00C896' : '#FF4B4B') : '#4B5675',
                            }}>
                                {s === 'buy' ? '매수' : '매도'}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <Field label="단가" value={form.price} onChange={set('price')} placeholder="60000" type="number" />
                    <Field label="수량" value={form.qty} onChange={set('qty')} placeholder="10" type="number" />
                    <Field label="수수료" value={form.fee} onChange={set('fee')} placeholder="0" type="number" />
                    <Field label="거래일" value={form.tradedAt} onChange={set('tradedAt')} type="date" />
                </div>

                <Field label="메모" value={form.memo} onChange={set('memo')} placeholder="선택 입력" />

                <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
                    <button onClick={onClose} style={{ ...btnStyle, background: 'transparent', flex: 1 }}>취소</button>
                    <button onClick={handleSubmit} disabled={loading} style={{ ...btnStyle, flex: 2 }}>
                        {loading ? '저장 중...' : '저장'}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ── 공통 UI ────────────────────────────────────────────────
function Field({ label, value, onChange, placeholder, type = 'text' }: {
    label: string; value: string
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    placeholder?: string; type?: string
}) {
    return (
        <div style={{ marginBottom: 4 }}>
            <label style={labelStyle}>{label}</label>
            <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={inputStyle} />
        </div>
    )
}

function SummaryCard({ label, value, unit, color }: {
    label: string; value: string; unit: string; color: string
}) {
    return (
        <div style={{
            background: '#0E1525', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 8, padding: '12px 16px',
        }}>
            <div style={{ fontSize: 10, color: '#4B5675', marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>
                {value}<span style={{ fontSize: 11, color: '#4B5675', marginLeft: 3 }}>{unit}</span>
            </div>
        </div>
    )
}

// ── 스타일 상수 ────────────────────────────────────────────
const rowStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '2fr 60px 90px 60px 100px 70px 90px 30px',
    alignItems: 'center', gap: 8, padding: '10px 16px',
}
const labelStyle: React.CSSProperties = {
    fontSize: 10, color: '#4B5675', display: 'block', marginBottom: 4,
}
const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 10px', borderRadius: 6, fontSize: 13,
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
    color: '#E2E8F0', outline: 'none', boxSizing: 'border-box',
}
const btnStyle: React.CSSProperties = {
    padding: '8px 16px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(0,200,150,0.1)', color: '#00C896',
    fontSize: 12, fontWeight: 600, cursor: 'pointer',
}
const dateInputStyle: React.CSSProperties = {
    padding: '6px 10px', borderRadius: 6, fontSize: 12,
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
    color: '#E2E8F0', outline: 'none',
}