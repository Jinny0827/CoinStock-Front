import { useQuery } from '@tanstack/react-query'
import { getEconomicPhase } from '../api/stockApi'
import type { EconomicPhase } from '../types/stock'

const PHASE_COLOR: Record<EconomicPhase['phase'], string> = {
  EXPANSION:   '#FF8C00',
  PEAK:        '#F0B429',
  CONTRACTION: '#FF4B4B',
  RECOVERY:    '#3D8EFF',
}

const PHASE_BG: Record<EconomicPhase['phase'], string> = {
  EXPANSION:   'rgba(255,140,0,0.08)',
  PEAK:        'rgba(240,180,41,0.08)',
  CONTRACTION: 'rgba(255,75,75,0.08)',
  RECOVERY:    'rgba(61,142,255,0.08)',
}

const PHASE_STRATEGY: Record<EconomicPhase['phase'], string[]> = {
  EXPANSION:   ['성장주·기술주 비중 확대', '소형 성장 ETF 관심', '채권 비중 축소'],
  PEAK:        ['방어주·배당주로 이동', '헬스케어·유틸리티 관심', '성장주 익절 고려'],
  CONTRACTION: ['현금·단기채 비중 확대', '금·달러 등 안전자산 보유', '신규 진입 최소화'],
  RECOVERY:    ['가치주·경기민감주 매수', '금융·소재·산업재 관심', '채권에서 주식으로 이동'],
}

export default function EconomicPhasePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['economicPhase'],
    queryFn: getEconomicPhase,
    staleTime: 10 * 60_000,
  })

  if (isLoading) return <Loading />

  if (!data) return (
    <div style={{ padding: 16, color: '#4B5675', fontSize: 13 }}>데이터를 불러올 수 없습니다.</div>
  )

  const color = PHASE_COLOR[data.phase]
  const bg    = PHASE_BG[data.phase]
  const tips  = PHASE_STRATEGY[data.phase]

  return (
    <div style={{ height: '100%', overflowY: 'auto', boxSizing: 'border-box', padding: '16px', maxWidth: 600, margin: '0 auto' }}>
      <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700 }}>경제 국면 분석</h2>

      {/* 국면 배지 */}
      <div style={{
        background: bg, border: `1px solid ${color}33`,
        borderRadius: 12, padding: '24px 20px', marginBottom: 16,
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            background: color, color: '#000',
            fontSize: 11, fontWeight: 800, letterSpacing: 1,
            padding: '3px 10px', borderRadius: 20,
          }}>{data.label}</span>
          {data.updatedAt === 0 && (
            <span style={{ fontSize: 11, color: '#4B5675' }}>수집 중…</span>
          )}
        </div>
        <div style={{ fontSize: 14, color: '#C9D1E0', lineHeight: 1.6 }}>
          {data.description}
        </div>
      </div>

      {/* 지표 카드 */}
      <div style={{
        background: '#0E1525', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 10, overflow: 'hidden', marginBottom: 16,
      }}>
        <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#4B5675', letterSpacing: 0.5 }}>
            현재 지표
          </span>
        </div>
        {data.updatedAt === 0 ? (
          <div style={{ padding: '20px', color: '#4B5675', fontSize: 13 }}>수집 중…</div>
        ) : (
          <>
            <IndicatorRow label="기준금리" value={`${data.interestRate.toFixed(2)}%`} color="#F0B429" />
            <IndicatorRow label="VIX (공포지수)" value={data.vix.toFixed(1)} color={data.vix >= 30 ? '#FF4B4B' : data.vix >= 20 ? '#F0B429' : '#FF8C00'} />
            <IndicatorRow label="WTI 원유" value={`$${data.wtiOil.toFixed(1)}`} color="#8892A8" />
            <IndicatorRow label="금 (Gold)" value={`$${Math.round(data.gold).toLocaleString()}`} color="#F0B429" />
          </>
        )}
      </div>

      {/* 전략 */}
      <div style={{
        background: '#0E1525', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 10, overflow: 'hidden',
      }}>
        <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#4B5675', letterSpacing: 0.5 }}>
            투자 전략
          </span>
        </div>
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {tips.map((tip, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: color, marginTop: 5, flexShrink: 0,
              }} />
              <span style={{ fontSize: 13, color: '#C9D1E0', lineHeight: 1.5 }}>{tip}</span>
            </div>
          ))}
        </div>
      </div>

      {data.updatedAt > 0 && (
        <div style={{ marginTop: 10, fontSize: 10, color: '#4B5675', textAlign: 'right' }}>
          업데이트: {new Date(data.updatedAt).toLocaleString('ko-KR')}
        </div>
      )}
    </div>
  )
}

function IndicatorRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)',
    }}>
      <span style={{ fontSize: 13, color: '#8892A8' }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </span>
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
