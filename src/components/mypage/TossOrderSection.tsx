import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getTossAccountStatus, getTossOrders, cancelTossOrder } from '../../api/tossApi'
import { getAllStocks } from '../../api/stockApi'
import type { TossOrder } from '../../types/toss'

export default function TossOrderSection() {
  const queryClient = useQueryClient()
  const [statusTab, setStatusTab] = useState<'OPEN' | 'CLOSED'>('OPEN')

  const { data: status } = useQuery({ queryKey: ['toss-status'], queryFn: getTossAccountStatus, refetchOnMount: 'always' })
  const connected = status?.connected ?? false

  // 토스 주문 응답엔 symbol(코드)만 있고 name이 없어서, 전체 종목 목록에서 이름을 따로 매핑
  const { data: allStocks = [] } = useQuery({ queryKey: ['stocks-all'], queryFn: getAllStocks, staleTime: 30_000 })
  const nameOf = (symbol: string) =>
    allStocks.find(s => s.symbol.replace(/\.(KS|KQ)$/, '') === symbol)?.name ?? symbol

  const {
    data: ordersPage, isLoading: ordersLoading,
    isError: ordersError, error: ordersErrorObj, refetch: refetchOrders,
  } = useQuery({
    queryKey: ['toss-orders', statusTab],
    queryFn:  () => getTossOrders(statusTab),
    enabled:  connected,
    refetchOnMount: 'always',
  })

  async function handleCancel(orderId: string) {
    if (!confirm('이 주문을 취소하시겠습니까?')) return
    try {
      await cancelTossOrder(orderId)
      queryClient.invalidateQueries({ queryKey: ['toss-orders'] })
      queryClient.invalidateQueries({ queryKey: ['toss-buying-power'] })
      queryClient.invalidateQueries({ queryKey: ['toss-holdings'] })
    } catch (err: any) {
      alert(err.message ?? '주문 취소에 실패했습니다')
    }
  }

  if (!connected) return null

  return (
    <div style={cardStyle}>
      <div style={headerStyle}>
        <span style={titleStyle}>토스증권 주문 내역</span>
      </div>

      <div style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <Tab label="진행중" active={statusTab === 'OPEN'} onClick={() => setStatusTab('OPEN')} />
          <Tab label="완료/취소" active={statusTab === 'CLOSED'} onClick={() => setStatusTab('CLOSED')} />
        </div>

        {ordersLoading ? (
          <Dim>주문 내역 조회 중...</Dim>
        ) : ordersError ? (
          <div>
            <div style={errorStyle}>{(ordersErrorObj as Error)?.message}</div>
            <button onClick={() => refetchOrders()} style={{ ...retryBtnStyle, marginTop: 10 }}>다시 시도</button>
          </div>
        ) : (ordersPage?.orders.length ?? 0) === 0 ? (
          <Dim>주문 내역이 없습니다</Dim>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {ordersPage!.orders.map(o => (
              <OrderRow key={o.orderId} order={o} name={nameOf(o.symbol)} cancellable={statusTab === 'OPEN'} onCancel={() => handleCancel(o.orderId)} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function OrderRow({ order, name, cancellable, onCancel }: {
  order: TossOrder; name: string; cancellable: boolean; onCancel: () => void
}) {
  const sideColor    = order.side === 'BUY' ? '#FF8C00' : '#3D8EFF'
  const qty          = Number(order.quantity)
  const filledPrice  = order.execution?.averageFilledPrice != null ? Number(order.execution.averageFilledPrice) : null

  return (
    <div style={orderRowStyle}>
      <div>
        <div style={{ fontWeight: 600, fontSize: 13 }}>
          <span style={{ color: sideColor, fontWeight: 700, marginRight: 6 }}>
            {order.side === 'BUY' ? '매수' : '매도'}
          </span>
          {name}
        </div>
        <div style={{ fontSize: 10, color: '#4B5675', marginTop: 2 }}>
          {qty.toLocaleString()}주 · {order.status} · {new Date(order.orderedAt).toLocaleString('ko-KR')}
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        {filledPrice != null && (
          <div style={{ fontSize: 13, fontWeight: 600 }}>{filledPrice.toLocaleString()}</div>
        )}
        {cancellable && (
          <button onClick={onCancel} style={cancelBtnStyle}>취소</button>
        )}
      </div>
    </div>
  )
}

function Tab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontSize: 11, fontWeight: 600, padding: '5px 12px', borderRadius: 6,
        border: active ? '1px solid rgba(255,140,0,0.4)' : '1px solid rgba(255,255,255,0.07)',
        background: active ? 'rgba(255,140,0,0.08)' : 'transparent',
        color: active ? '#FF8C00' : '#8892A8',
        cursor: 'pointer',
      }}
    >{label}</button>
  )
}

function Dim({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 12, color: '#4B5675' }}>{children}</div>
}

const cardStyle: React.CSSProperties = {
  background: '#0E1525', border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 8, marginBottom: 20, overflow: 'hidden',
}

const headerStyle: React.CSSProperties = {
  padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)',
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
}

const titleStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: '#8892A8' }

const retryBtnStyle: React.CSSProperties = {
  height: 34, padding: '0 16px',
  background: '#FF8C00', border: 'none', borderRadius: 6,
  color: '#0A0F1C', fontSize: 12, fontWeight: 700, cursor: 'pointer',
}

const cancelBtnStyle: React.CSSProperties = {
  height: 24, padding: '0 8px', marginTop: 4,
  background: 'transparent', border: '1px solid rgba(255,75,75,0.4)', borderRadius: 5,
  color: '#FF4B4B', fontSize: 10, cursor: 'pointer',
}

const errorStyle: React.CSSProperties = {
  fontSize: 12, color: '#FF4B4B', marginTop: 10,
  background: 'rgba(255,75,75,0.08)', borderRadius: 6, padding: '8px 10px',
}

const orderRowStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
}
