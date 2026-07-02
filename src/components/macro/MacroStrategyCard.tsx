import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { activateMacro, deactivateMacro, deleteMacro } from '../../api/macroApi'
import { MACRO_TYPE_LABEL } from '../../types/macro'
import type { MacroStrategy } from '../../types/macro'

interface Props {
  strategy: MacroStrategy
}

const SIDE_COLOR: Record<string, string> = {
  BUY:  '#22C55E',
  SELL: '#EF4444',
}

function formatDate(iso: string | null) {
  if (!iso) return '없음'
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function formatQty(mode: string, value: number) {
  if (mode === 'FIXED')            return `${value}주 고정`
  if (mode === 'BUYING_POWER_PCT') return `매수여력 ${(value * 100).toFixed(0)}%`
  if (mode === 'ATR')              return `ATR × ${value}`
  return `${value}`
}

export default function MacroStrategyCard({ strategy }: Props) {
  const qc = useQueryClient()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [otpMsg, setOtpMsg] = useState<string | null>(null)

  const activate = useMutation({
    mutationFn: () => activateMacro(strategy.id),
    onSuccess: (res) => {
      if (res.code === '4104') {
        setOtpMsg('OTP 보호장치를 먼저 설정해야 합니다. (마이페이지 > OTP 설정)')
      } else if (res.code === '4105') {
        setOtpMsg('OTP 재인증이 필요합니다. 주문 실행 등으로 OTP 인증 후 다시 시도하세요.')
      } else {
        setOtpMsg(null)
        qc.invalidateQueries({ queryKey: ['macros'] })
      }
    },
  })

  const deactivate = useMutation({
    mutationFn: () => deactivateMacro(strategy.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['macros'] }),
  })

  const remove = useMutation({
    mutationFn: () => deleteMacro(strategy.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['macros'] }),
  })

  return (
    <div style={{
      background: '#111827',
      border: `1px solid ${strategy.active ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.07)'}`,
      borderRadius: 10,
      padding: '14px 16px',
    }}>
      {/* 상단: 이름 + 뱃지 + 버튼 */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#E2E8F0' }}>{strategy.name}</span>
            <span style={{
              fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4,
              background: 'rgba(255,140,0,0.12)', color: '#FF8C00',
            }}>{MACRO_TYPE_LABEL[strategy.type] ?? strategy.type}</span>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
              background: strategy.side === 'BUY' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
              color: SIDE_COLOR[strategy.side],
            }}>{strategy.side}</span>
          </div>
          <div style={{ fontSize: 12, color: '#8892A8', marginTop: 4 }}>
            {strategy.symbol}
            <span style={{ margin: '0 6px', opacity: 0.4 }}>·</span>
            {formatQty(strategy.quantityMode, strategy.quantityValue)}
            <span style={{ margin: '0 6px', opacity: 0.4 }}>·</span>
            오늘 {strategy.executionsToday}/{strategy.maxExecutions}회
          </div>
          <div style={{ fontSize: 11, color: '#4B5675', marginTop: 2 }}>
            마지막 실행: {formatDate(strategy.lastTriggeredAt)}
          </div>
        </div>

        {/* 우측 버튼 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {/* 활성화 토글 */}
          <button
            onClick={() => strategy.active ? deactivate.mutate() : activate.mutate()}
            disabled={activate.isPending || deactivate.isPending}
            style={{
              fontSize: 11, fontWeight: 600,
              padding: '4px 10px', borderRadius: 5, border: 'none',
              cursor: 'pointer',
              background: strategy.active ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.06)',
              color: strategy.active ? '#22C55E' : '#8892A8',
            }}
          >
            {strategy.active ? '활성' : '비활성'}
          </button>

          {/* 삭제 버튼 */}
          {confirmDelete ? (
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                onClick={() => remove.mutate()}
                disabled={remove.isPending}
                style={{
                  fontSize: 11, padding: '4px 8px', borderRadius: 5,
                  border: 'none', background: '#EF4444', color: '#fff', cursor: 'pointer',
                }}
              >확인</button>
              <button
                onClick={() => setConfirmDelete(false)}
                style={{
                  fontSize: 11, padding: '4px 8px', borderRadius: 5,
                  border: '1px solid rgba(255,255,255,0.1)', background: 'transparent',
                  color: '#8892A8', cursor: 'pointer',
                }}
              >취소</button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              style={{
                fontSize: 11, padding: '4px 8px', borderRadius: 5,
                border: '1px solid rgba(239,68,68,0.3)', background: 'transparent',
                color: '#EF4444', cursor: 'pointer',
              }}
            >삭제</button>
          )}
        </div>
      </div>

      {/* OTP 오류 메시지 */}
      {otpMsg && (
        <div style={{
          marginTop: 8, padding: '7px 10px', borderRadius: 6,
          background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)',
          fontSize: 11, color: '#FCA5A5', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span>{otpMsg}</span>
          <button
            onClick={() => setOtpMsg(null)}
            style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 0, marginLeft: 8 }}
          >✕</button>
        </div>
      )}
    </div>
  )
}
