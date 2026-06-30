import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAlerts, deleteAlert } from '../../api/notificationApi'
import { getAllStocks } from '../../api/stockApi'
import type { AlertRule } from '../../types/notification'

const TYPE_LABEL: Record<AlertRule['type'], string> = {
  PRICE_TARGET:  '목표가',
  PCT_CHANGE:    '등락률',
  PNL_THRESHOLD: '보유 손익',
}

const DIR_LABEL: Record<AlertRule['direction'], string> = {
  ABOVE: '이상',
  BELOW: '이하',
}

export default function NotificationSection() {
  const queryClient = useQueryClient()

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: getAlerts,
  })

  const { data: allStocks = [] } = useQuery({
    queryKey: ['stocks-all'],
    queryFn: getAllStocks,
    staleTime: 60_000,
  })
  const nameMap = Object.fromEntries(allStocks.map(s => [s.symbol, s.name ?? s.symbol]))

  const deleteMutation = useMutation({
    mutationFn: deleteAlert,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alerts'] }),
  })

  return (
    <div style={{
      marginTop: 20,
      background: '#111827',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 10,
      padding: '16px 20px',
    }}>
      <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 600, color: '#E2E8F0' }}>
        내 알림 설정
      </h3>

      {isLoading ? (
        <div style={{ fontSize: 12, color: '#4B5675', padding: '8px 0' }}>불러오는 중...</div>
      ) : rules.length === 0 ? (
        <div style={{ fontSize: 12, color: '#4B5675', padding: '8px 0' }}>
          설정된 알림 규칙이 없습니다. 종목 상세에서 알림을 추가해보세요.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rules.map(rule => (
            <div
              key={rule.id}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 12px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 7,
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#E2E8F0' }}>{nameMap[rule.symbol] ?? rule.symbol}</span>
                  <span style={{
                    fontSize: 10, fontWeight: 600,
                    background: 'rgba(255,140,0,0.12)', color: '#FF8C00',
                    padding: '2px 6px', borderRadius: 4,
                  }}>{TYPE_LABEL[rule.type]}</span>
                  {!rule.active && (
                    <span style={{
                      fontSize: 10,
                      background: 'rgba(255,255,255,0.06)', color: '#4B5675',
                      padding: '2px 6px', borderRadius: 4,
                    }}>완료</span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: '#8892A8', marginTop: 3 }}>
                  {rule.type === 'PRICE_TARGET'
                    ? `${rule.targetValue.toLocaleString()}원 ${DIR_LABEL[rule.direction]}`
                    : `${rule.targetValue}% ${DIR_LABEL[rule.direction]}`
                  }
                </div>
              </div>
              <button
                onClick={() => deleteMutation.mutate(rule.id)}
                disabled={deleteMutation.isPending}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255,75,75,0.3)',
                  borderRadius: 5, color: '#FF4B4B',
                  fontSize: 11, padding: '4px 10px',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,75,75,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >삭제</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
