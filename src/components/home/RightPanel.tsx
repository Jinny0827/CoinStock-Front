import { useQuery } from '@tanstack/react-query'
import { getIndices, getFxRate, getFearGreed, getThemes, getMacroData } from '../../api/stockApi'

export default function RightPanel() {
  const { data: indices = [] } = useQuery({
    queryKey: ['indices'],
    queryFn: getIndices,
    refetchInterval: 10_000,
  })

  const { data: fx } = useQuery({
    queryKey: ['fx'],
    queryFn: getFxRate,
    staleTime: 60_000,
  })

  const { data: fearGreed } = useQuery({
    queryKey: ['feargreed'],
    queryFn: getFearGreed,
    staleTime: 60_000,
  })

  const { data: themes = [] } = useQuery({
    queryKey: ['themes'],
    queryFn: getThemes,
    staleTime: 60_000,
  })

  const { data: macro } = useQuery({
    queryKey: ['macro'],
    queryFn: getMacroData,
    staleTime: 10 * 60_000,
  })

  const SYMBOL_LABEL: Record<string, string> = {
    '^KS11': 'KOSPI', '^KQ11': 'KOSDAQ',
    '^GSPC': 'S&P 500', '^IXIC': 'NASDAQ',
  }

  return (
    <div style={{
      height: '100%', overflowY: 'auto',
      borderLeft: '1px solid rgba(255,255,255,0.07)',
    }}>

      {/* 공포·탐욕 */}
      {fearGreed && (
        <div style={{ padding: '16px 16px 12px' }}>
          <SectionLabel>공포 · 탐욕 지수</SectionLabel>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <FearGauge score={fearGreed.score} />
            <div>
              <div style={{
                fontSize: 14, fontWeight: 700, marginBottom: 3,
                color: gaugeColor(fearGreed.score),
              }}>{fearGreed.label}</div>
              <div style={{ fontSize: 10, color: '#4B5675', lineHeight: 1.5 }}>
                지수 {fearGreed.score}점
              </div>
            </div>
          </div>
          {/* 그라디언트 바 */}
          <div style={{
            height: 3, borderRadius: 2,
            background: 'linear-gradient(90deg,#FF4B4B,#FF8C42,#F0B429,#6BCB77,#FF8C00)',
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute', top: -4,
              left: `calc(${fearGreed.score}% - 5px)`,
              width: 10, height: 10,
              background: '#fff', borderRadius: '50%',
              border: '2px solid #080C17',
            }} />
          </div>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            marginTop: 4, fontSize: 9, color: '#4B5675',
          }}>
            <span>극단공포</span><span>중립</span><span>극단탐욕</span>
          </div>
        </div>
      )}

      <Divider />

      {/* 시장 지수 */}
      <div style={{ padding: '12px 16px' }}>
        <SectionLabel>시장 지수</SectionLabel>
        {indices.map(idx => (
          <MarketRow
            key={idx.symbol}
            label={SYMBOL_LABEL[idx.symbol] ?? idx.symbol}
            value={idx.price.toLocaleString()}
            change={idx.changePercent}
          />
        ))}

        {/* 환율 */}
        {fx && (
          <>
            <MarketRow label="USD/KRW" value={fx.usdKrw.toLocaleString()} change={0} />
            <MarketRow
              label="JPY/KRW"
              value={(fx.jpyKrw * 100).toFixed(2)}
              change={0}
              unit="원/100엔"
            />
          </>
        )}
      </div>

      <Divider />

      {/* 원자재 · 금리 */}
      {macro && (
        <div style={{ padding: '12px 16px' }}>
          <SectionLabel>원자재 · 금리</SectionLabel>
          {macro.updatedAt === 0 ? (
            <div style={{ fontSize: 11, color: '#4B5675', padding: '8px 0' }}>
              수집 중… (서버 시작 후 최대 10초)
            </div>
          ) : (
            <>
              <MacroRow
                label="기준금리"
                value={macro.interestRate.toFixed(2)}
                unit="%"
                dot={macro.interestRate >= 4 ? '#FF8C42' : '#FF8C00'}
              />
              <MacroRow
                label="VIX"
                value={macro.vix.toFixed(1)}
                unit=""
                dot={macro.vix >= 30 ? '#FF4B4B' : macro.vix >= 20 ? '#FF8C42' : '#FF8C00'}
              />
              <MacroRow
                label="WTI"
                value={'$' + macro.wtiOil.toFixed(1)}
                unit="/배럴"
                dot="#8892A8"
              />
              <MacroRow
                label="금"
                value={'$' + macro.gold.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                unit="/oz"
                dot="#F0B429"
              />
            </>
          )}
        </div>
      )}

      <Divider />

      {/* 오늘의 테마 */}
      {themes.length > 0 && (
        <div style={{ padding: '12px 16px' }}>
          <SectionLabel>오늘의 테마</SectionLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            {themes.map(theme => (
              <span key={theme} style={{
                fontSize: 11, fontWeight: 600,
                background: 'rgba(61,142,255,0.1)',
                color: '#3D8EFF',
                padding: '4px 9px', borderRadius: 4,
                border: '1px solid rgba(61,142,255,0.15)',
                cursor: 'pointer',
              }}>{theme}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── 공포탐욕 게이지 ────────────────────────────────────────
function FearGauge({ score }: { score: number }) {
  const color = gaugeColor(score)
  const dash  = score * 1.634
  return (
    <svg viewBox="0 0 64 64" width="52" height="52" style={{ flexShrink: 0 }}>
      <circle cx="32" cy="32" r="26" fill="none" stroke="#1E2540" strokeWidth="8" />
      <circle cx="32" cy="32" r="26" fill="none"
        stroke={color} strokeWidth="8"
        strokeDasharray={`${dash} 163.4`}
        strokeLinecap="round"
        transform="rotate(-90 32 32)"
      />
      <text x="32" y="37" textAnchor="middle"
        fontSize="13" fontWeight="800"
        fill={color}
        fontFamily="Pretendard,sans-serif"
      >{score}</text>
    </svg>
  )
}

function gaugeColor(score: number) {
  if (score < 20) return '#FF4B4B'
  if (score < 40) return '#FF8C42'
  if (score < 60) return '#8892A8'
  if (score < 80) return '#6BCB77'
  return '#FF8C00'
}

// ── 공통 UI ────────────────────────────────────────────────
function MarketRow({
  label, value, change, unit,
}: {
  label: string; value: string; change: number; unit?: string
}) {
  const up = change > 0
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '6px 0',
      borderBottom: '1px solid rgba(255,255,255,0.03)',
    }}>
      <span style={{ fontSize: 11, color: '#8892A8' }}>{label}</span>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 12, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
          {value}
          {unit && <span style={{ fontSize: 9, color: '#4B5675', marginLeft: 3 }}>{unit}</span>}
        </div>
        {change !== 0 && (
          <div style={{
            fontSize: 10, fontWeight: 600,
            color: up ? '#FF8C00' : '#FF4B4B',
          }}>
            {up ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
          </div>
        )}
      </div>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 600, color: '#4B5675',
      letterSpacing: '0.08em', textTransform: 'uppercase',
      marginBottom: 8,
    }}>{children}</div>
  )
}

function Divider() {
  return <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }} />
}

function MacroRow({ label, value, unit, dot }: {
  label: string; value: string; unit: string; dot: string
}) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '6px 0',
      borderBottom: '1px solid rgba(255,255,255,0.03)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{
          width: 5, height: 5, borderRadius: '50%',
          background: dot, flexShrink: 0,
          boxShadow: `0 0 4px ${dot}`,
        }} />
        <span style={{ fontSize: 11, color: '#8892A8' }}>{label}</span>
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
        {value}
        {unit && <span style={{ fontSize: 9, color: '#4B5675', marginLeft: 2 }}>{unit}</span>}
      </div>
    </div>
  )
}
