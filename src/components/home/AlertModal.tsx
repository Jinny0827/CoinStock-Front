import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createAlert } from '../../api/notificationApi'

type AlertType = 'PRICE_TARGET' | 'PCT_CHANGE' | 'PNL_THRESHOLD'
type Direction = 'ABOVE' | 'BELOW'

interface Props {
  symbol: string
  name: string
  currentPrice: number
  onClose: () => void
}

const TYPE_OPTIONS: { value: AlertType; label: string; desc: string }[] = [
  { value: 'PRICE_TARGET',  label: '목표가',    desc: '지정 가격 도달 시 1회 알림' },
  { value: 'PCT_CHANGE',    label: '등락률',    desc: '당일 등락률 임계치 도달 시 알림' },
  { value: 'PNL_THRESHOLD', label: '보유 손익', desc: '토스 보유 종목 손익률 도달 시 알림' },
]

export default function AlertModal({ symbol, name, currentPrice, onClose }: Props) {
  const [type,      setType]      = useState<AlertType>('PRICE_TARGET')
  const [direction, setDirection] = useState<Direction>('ABOVE')
  const [value,     setValue]     = useState('')
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => createAlert({
      symbol,
      type,
      targetValue: parseFloat(value),
      direction,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
      onClose()
    },
  })

  const unit = type === 'PRICE_TARGET' ? '원' : '%'
  const placeholder = type === 'PRICE_TARGET'
    ? currentPrice > 0 ? currentPrice.toLocaleString() : '목표 가격 입력'
    : type === 'PCT_CHANGE' ? '예: 5' : '예: -10'

  const isValid = value.trim() !== '' && !isNaN(parseFloat(value))

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#0E1525', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 10, padding: 24, width: 'min(360px, calc(100vw - 24px))',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#E2E8F0' }}>알림 설정</div>
          <div style={{ fontSize: 12, color: '#4B5675', marginTop: 4 }}>
            {name} ({symbol})
          </div>
        </div>

        {/* 알림 유형 */}
        <div style={{ marginBottom: 16 }}>
          <div style={labelStyle}>알림 유형</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {TYPE_OPTIONS.map(opt => (
              <div
                key={opt.value}
                onClick={() => setType(opt.value)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 12px', borderRadius: 7, cursor: 'pointer',
                  border: `1px solid ${type === opt.value ? 'rgba(255,140,0,0.5)' : 'rgba(255,255,255,0.07)'}`,
                  background: type === opt.value ? 'rgba(255,140,0,0.08)' : 'transparent',
                  transition: 'all 0.1s',
                }}
              >
                <div style={{
                  width: 14, height: 14, borderRadius: '50%', flexShrink: 0,
                  border: `2px solid ${type === opt.value ? '#FF8C00' : '#4B5675'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {type === opt.value && (
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF8C00' }} />
                  )}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#E2E8F0' }}>{opt.label}</div>
                  <div style={{ fontSize: 10, color: '#4B5675', marginTop: 1 }}>{opt.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 조건 */}
        <div style={{ marginBottom: 16 }}>
          <div style={labelStyle}>조건</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['ABOVE', 'BELOW'] as Direction[]).map(d => (
              <button
                key={d}
                onClick={() => setDirection(d)}
                style={{
                  flex: 1, padding: '7px 0', borderRadius: 6, cursor: 'pointer',
                  border: `1px solid ${direction === d ? 'rgba(255,140,0,0.5)' : 'rgba(255,255,255,0.07)'}`,
                  background: direction === d ? 'rgba(255,140,0,0.08)' : 'transparent',
                  color: direction === d ? '#FF8C00' : '#8892A8',
                  fontSize: 12, fontWeight: direction === d ? 600 : 400,
                  transition: 'all 0.1s',
                }}
              >
                {d === 'ABOVE' ? '이상 (▲)' : '이하 (▼)'}
              </button>
            ))}
          </div>
        </div>

        {/* 기준값 */}
        <div style={{ marginBottom: 24 }}>
          <div style={labelStyle}>기준값</div>
          <div style={{ position: 'relative' }}>
            <input
              type="number"
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder={placeholder}
              autoFocus
              style={{
                ...inputStyle,
                paddingRight: 36,
              }}
            />
            <span style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              fontSize: 12, color: '#4B5675', pointerEvents: 'none',
            }}>{unit}</span>
          </div>
        </div>

        {/* 버튼 */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{ ...btnStyle, background: 'transparent', flex: 1 }}>
            취소
          </button>
          <button
            onClick={() => { if (isValid) mutation.mutate() }}
            disabled={!isValid || mutation.isPending}
            style={{ ...btnStyle, flex: 2, opacity: (!isValid || mutation.isPending) ? 0.5 : 1 }}
          >
            {mutation.isPending ? '추가 중...' : '알림 추가'}
          </button>
        </div>

        {mutation.isError && (
          <div style={{ marginTop: 10, fontSize: 11, color: '#FF4B4B', textAlign: 'center' }}>
            알림 추가에 실패했습니다. 다시 시도해주세요.
          </div>
        )}
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  fontSize: 11, color: '#8892A8', marginBottom: 7, fontWeight: 500,
}

const inputStyle: React.CSSProperties = {
  width: '100%', height: 38, background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6,
  color: '#E2E8F0', fontSize: 13, padding: '0 12px',
  outline: 'none', boxSizing: 'border-box',
}

const btnStyle: React.CSSProperties = {
  padding: '9px 16px', borderRadius: 6, cursor: 'pointer',
  border: '1px solid rgba(255,140,0,0.4)',
  background: 'rgba(255,140,0,0.12)', color: '#FF8C00',
  fontSize: 13, fontWeight: 600,
}
