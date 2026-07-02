import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getMacros } from '../api/macroApi'
import MacroStrategyCard from '../components/macro/MacroStrategyCard'
import MacroCreateModal from '../components/macro/MacroCreateModal'

export default function MacroPage() {
  const [showCreate, setShowCreate] = useState(false)

  const { data: strategies = [], isLoading } = useQuery({
    queryKey: ['macros'],
    queryFn: getMacros,
  })

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '20px 16px', maxWidth: 700, margin: '0 auto' }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#E2E8F0' }}>자동매매 전략</h2>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#4B5675' }}>
            조건 충족 시 토스 주문을 자동 실행합니다 · 60초 간격 평가
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          style={{
            padding: '8px 14px', borderRadius: 8, border: 'none',
            background: '#FF8C00', color: '#fff',
            fontSize: 13, fontWeight: 600, cursor: 'pointer', flexShrink: 0,
          }}
        >
          + 전략 추가
        </button>
      </div>

      {/* 안내 배너 */}
      <div style={{
        padding: '10px 12px', borderRadius: 8, marginBottom: 20,
        background: 'rgba(255,140,0,0.06)', border: '1px solid rgba(255,140,0,0.15)',
        fontSize: 12, color: '#A0AEC0', lineHeight: 1.6,
      }}>
        전략은 생성 후 <strong style={{ color: '#FF8C00' }}>비활성</strong> 상태입니다.
        OTP 인증 완료 후 활성화 버튼으로 켜야 자동 주문이 실행됩니다.
      </div>

      {/* 전략 목록 */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#4B5675', fontSize: 13 }}>불러오는 중...</div>
      ) : strategies.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 20px',
          background: '#111827', border: '1px dashed rgba(255,255,255,0.07)',
          borderRadius: 12,
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚡</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#E2E8F0', marginBottom: 6 }}>등록된 전략이 없습니다</div>
          <div style={{ fontSize: 12, color: '#4B5675', marginBottom: 20 }}>
            골든크로스, RSI, 볼린저밴드 등 12가지 알고리즘으로 자동매매를 설정하세요
          </div>
          <button
            onClick={() => setShowCreate(true)}
            style={{
              padding: '9px 20px', borderRadius: 8, border: 'none',
              background: '#FF8C00', color: '#fff',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >첫 번째 전략 추가</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {strategies.map(s => (
            <MacroStrategyCard key={s.id} strategy={s} />
          ))}
        </div>
      )}

      {showCreate && <MacroCreateModal onClose={() => setShowCreate(false)} />}
    </div>
  )
}
