import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getNotifications, markRead, markAllRead } from '../api/notificationApi'
import { useStockStore } from '../store/stockStore'
import type { Notification } from '../types/notification'

export default function NotificationsPage() {
  const navigate    = useNavigate()
  const queryClient = useQueryClient()
  const { setSelectedSymbol } = useStockStore()

  const { data, isLoading } = useQuery({
    queryKey: ['notifications-all'],
    queryFn: () => getNotifications(100),
  })

  const items  = data?.items ?? []
  const unread = data?.unread ?? 0

  const readMutation = useMutation({
    mutationFn: markRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-all'] })
    },
  })

  const readAllMutation = useMutation({
    mutationFn: markAllRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-all'] })
    },
  })

  function handleClick(id: number, symbol: string | null, readAt: string | null) {
    if (!readAt) readMutation.mutate(id)
    if (symbol) {
      setSelectedSymbol(symbol)
      navigate('/')
    }
  }

  // 날짜별 그룹핑
  const grouped = groupByDate(items)

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '20px 16px', maxWidth: 600, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: 'none', border: 'none', color: '#8892A8',
              cursor: 'pointer', padding: '4px 0', fontSize: 20, lineHeight: 1,
            }}
          >←</button>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>알림</h2>
          {unread > 0 && (
            <span style={{
              fontSize: 11, fontWeight: 700, color: '#FF8C00',
              background: 'rgba(255,140,0,0.1)', padding: '2px 8px', borderRadius: 10,
            }}>{unread}개 미확인</span>
          )}
        </div>
        {unread > 0 && (
          <button
            onClick={() => readAllMutation.mutate()}
            disabled={readAllMutation.isPending}
            style={{
              fontSize: 12, color: '#8892A8', background: 'none',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6,
              padding: '5px 12px', cursor: 'pointer',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#E2E8F0')}
            onMouseLeave={e => (e.currentTarget.style.color = '#8892A8')}
          >전체 읽음</button>
        )}
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', color: '#4B5675', fontSize: 13, padding: 40 }}>불러오는 중...</div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#4B5675', fontSize: 13, padding: 40 }}>알림이 없습니다</div>
      ) : (
        grouped.map(({ label, list }) => (
          <div key={label} style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, color: '#4B5675', fontWeight: 600, marginBottom: 8, letterSpacing: '0.5px' }}>
              {label}
            </div>
            <div style={{
              background: '#111827', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 10, overflow: 'hidden',
            }}>
              {list.map((n, i) => {
                const isBroadcast = n.userId === null
                const isUnread    = !n.readAt && !isBroadcast
                return (
                  <div
                    key={n.id}
                    onClick={() => handleClick(n.id, n.symbol, n.readAt)}
                    style={{
                      display: 'flex', gap: 12, padding: '12px 16px',
                      borderBottom: i < list.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                      background: isUnread ? 'rgba(255,140,0,0.04)' : 'transparent',
                      cursor: n.symbol ? 'pointer' : 'default',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => { if (n.symbol) (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.04)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = isUnread ? 'rgba(255,140,0,0.04)' : 'transparent' }}
                  >
                    {/* 미읽음 점 */}
                    <div style={{ width: 8, flexShrink: 0, display: 'flex', justifyContent: 'center', paddingTop: 5 }}>
                      {isUnread && (
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF8C00', display: 'block' }} />
                      )}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#E2E8F0' }}>{n.title}</span>
                        {isBroadcast && (
                          <span style={{
                            fontSize: 9, fontWeight: 600, color: '#4B5675',
                            background: 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: 3,
                          }}>공지</span>
                        )}
                      </div>
                      {n.body && <div style={{ fontSize: 12, color: '#8892A8', lineHeight: 1.4 }}>{n.body}</div>}
                      <div style={{ fontSize: 10, color: '#4B5675', marginTop: 5 }}>
                        {formatTime(n.createdAt)}
                        {n.symbol && <span style={{ marginLeft: 8, color: '#4B5675' }}>{n.symbol}</span>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

function groupByDate(items: Notification[]) {
  const today     = new Date(); today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)

  const groups: Record<string, Notification[]> = {}
  for (const item of items) {
    const d = new Date(item.createdAt); d.setHours(0, 0, 0, 0)
    const label = d >= today ? '오늘' : d >= yesterday ? '어제'
      : `${d.getMonth() + 1}월 ${d.getDate()}일`
    ;(groups[label] ??= []).push(item)
  }

  const order = ['오늘', '어제']
  const keys = [...order.filter(k => groups[k]), ...Object.keys(groups).filter(k => !order.includes(k))]
  return keys.map(label => ({ label, list: groups[label] }))
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString('ko-KR', {
    month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}
