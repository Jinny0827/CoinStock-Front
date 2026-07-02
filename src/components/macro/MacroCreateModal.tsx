import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createMacro } from '../../api/macroApi'
import StockSearchInput from '../common/StockSearchInput'
import {
  MACRO_TYPE_LABEL, MACRO_TYPE_DETAIL, MACRO_PARAMS,
} from '../../types/macro'
import type { MacroType, QuantityMode } from '../../types/macro'

interface Props {
  onClose: () => void
}

const ALL_TYPES = Object.keys(MACRO_TYPE_LABEL) as MacroType[]

const QTY_MODE_LABEL: Record<QuantityMode, string> = {
  FIXED:            '고정 수량 (주)',
  BUYING_POWER_PCT: '매수여력 비율 (%)',
  ATR:              'ATR 기반 (배수)',
}

const QTY_MODE_HINT: Record<QuantityMode, string> = {
  FIXED:            '항상 이 수량만큼 주문합니다',
  BUYING_POWER_PCT: '예: 10 → 현재 매수여력의 10%만큼 주문',
  ATR:              '일평균 변동폭 기준으로 리스크를 자동 계산합니다',
}

// 현재 설정을 사람이 읽을 수 있는 문장으로 변환
function buildSummary(params: {
  type: MacroType
  symbol: string
  stockName: string
  side: 'BUY' | 'SELL'
  quantityMode: QuantityMode
  quantityValue: number
  maxExecutions: number
  paramValues: Record<string, number>
}): string {
  const { type, symbol, stockName, side, quantityMode, quantityValue, maxExecutions, paramValues } = params

  if (!symbol) return ''

  const displayName = stockName || symbol
  const tickerPart  = symbol.replace(/\.(KS|KQ)$/, '')
  const sideKr  = side === 'BUY' ? '매수' : '매도'
  const qtyStr =
    quantityMode === 'FIXED'            ? `${quantityValue}주를`
    : quantityMode === 'BUYING_POWER_PCT' ? `매수여력의 ${quantityValue}%를`
    : `ATR × ${quantityValue} 수량을`

  const p = (key: string, def: number) => paramValues[key] ?? def

  const conditionMap: Record<MacroType, string> = {
    GOLDEN_CROSS:      '5일 이동평균이 20일 이동평균을 위로 돌파하는 순간',
    DEATH_CROSS:       '5일 이동평균이 20일 이동평균을 아래로 이탈하는 순간',
    RSI_OVERSOLD:      `RSI가 ${p('oversold', 30)} 이하로 떨어지는 순간`,
    RSI_OVERBOUGHT:    `RSI가 ${p('overbought', 70)} 이상으로 올라가는 순간`,
    BOLLINGER_LOWER:   '가격이 볼린저 하단선에 닿는 순간',
    BOLLINGER_UPPER:   '가격이 볼린저 상단선에 닿는 순간',
    WILLIAMS_BREAKOUT: `오늘 시가 대비 전날 변동폭 × ${p('k', 0.5)} 이상 상승하는 순간`,
    Z_SCORE_REVERSION: `가격이 ${p('period', 20)}일 평균 대비 ${p('zThreshold', 2.0)}σ 이상 이탈하는 순간`,
    MOMENTUM_FACTOR:   `최근 ${p('period', 20)}일 수익률이 ${p('threshold', 5)}% 이상인 순간`,
    ORDERBOOK_WALL:    `매수 호가벽이 평균의 ${p('wallMultiple', 3.0)}배 이상 감지되는 순간`,
    FORCE_FOLLOW:      `세력 점수가 ${p('minScore', 80)}점 이상이 되는 순간`,
    TRAILING_STOP:     `고점 대비 ATR × ${p('atrMultiple', 2.0)} 이상 하락하는 순간`,
  }

  const condition = conditionMap[type]
  const execStr   = maxExecutions === 1 ? '오늘 최대 1번 자동 실행됩니다.' : `오늘 최대 ${maxExecutions}번 자동 실행됩니다.`

  return `${displayName}(${tickerPart})의 ${condition},\n시장가로 ${qtyStr} ${sideKr}합니다.\n${execStr}`
}

export default function MacroCreateModal({ onClose }: Props) {
  const qc = useQueryClient()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const [name, setName]               = useState('')
  const [type, setType]               = useState<MacroType>('GOLDEN_CROSS')
  const [symbol, setSymbol]           = useState('')
  const [stockName, setStockName]     = useState('')
  const [side, setSide]               = useState<'BUY' | 'SELL'>('BUY')
  const [quantityMode, setQuantityMode] = useState<QuantityMode>('FIXED')
  const [quantityValue, setQuantityValue] = useState(10)
  const [maxExecutions, setMaxExecutions] = useState(1)
  const [paramValues, setParamValues] = useState<Record<string, number>>({})
  const [errorMsg, setErrorMsg]       = useState<string | null>(null)

  const paramDefs = MACRO_PARAMS[type] ?? []
  const detail    = MACRO_TYPE_DETAIL[type]

  function getParamValue(key: string, defaultValue: number) {
    return paramValues[key] ?? defaultValue
  }

  const summary = buildSummary({ type, symbol, stockName, side, quantityMode, quantityValue, maxExecutions, paramValues })

  const mutation = useMutation({
    mutationFn: () => {
      const params: Record<string, number> = {}
      for (const def of paramDefs) {
        const raw = getParamValue(def.key, def.defaultValue)
        // MOMENTUM_FACTOR의 threshold는 % 입력이므로 0~1로 변환
        params[def.key] = def.key === 'threshold' ? raw / 100 : raw
      }
      return createMacro({
        name: name.trim(),
        type,
        symbol: symbol.trim().toUpperCase(),
        side,
        orderType: 'MARKET',
        params,
        quantityMode,
        quantityValue: quantityMode === 'BUYING_POWER_PCT' ? quantityValue / 100 : quantityValue,
        maxExecutions,
      })
    },
    onSuccess: (res) => {
      if (res.code !== '0000') { setErrorMsg(res.message ?? '오류가 발생했습니다'); return }
      qc.invalidateQueries({ queryKey: ['macros'] })
      onClose()
    },
    onError: () => setErrorMsg('서버 오류가 발생했습니다'),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg(null)
    if (!name.trim())        { setErrorMsg('전략 이름을 입력하세요'); return }
    if (!symbol.trim())      { setErrorMsg('종목을 선택하세요'); return }
    if (quantityValue <= 0)  { setErrorMsg('수량/비율은 0보다 커야 합니다'); return }
    mutation.mutate()
  }

  return (
    <div
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.65)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#111827', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12, padding: '20px 20px 24px',
          width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#E2E8F0' }}>자동매매 전략 추가</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#4B5675', cursor: 'pointer', fontSize: 18, padding: 0 }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* 전략 이름 */}
          <Field label="전략 이름">
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="예: 삼성전자 RSI 저점 매수"
              style={inputStyle}
            />
          </Field>

          {/* 전략 유형 */}
          <Field label="전략 유형">
            <select
              value={type}
              onChange={e => { setType(e.target.value as MacroType); setParamValues({}) }}
              style={inputStyle}
            >
              {ALL_TYPES.map(t => (
                <option key={t} value={t}>{MACRO_TYPE_LABEL[t]}</option>
              ))}
            </select>
          </Field>

          {/* 전략 설명 박스 — 유형 선택 시 업데이트 */}
          <div style={{
            padding: '12px 14px',
            background: 'rgba(255,140,0,0.05)',
            border: '1px solid rgba(255,140,0,0.15)',
            borderRadius: 8,
          }}>
            <div style={{ fontSize: 13, color: '#E2E8F0', lineHeight: 1.65, marginBottom: 8 }}>
              {detail.what}
            </div>
            <div style={{
              fontSize: 12, color: '#FF8C00',
              background: 'rgba(255,140,0,0.08)', borderRadius: 5,
              padding: '6px 10px', lineHeight: 1.6,
            }}>
              {detail.example}
            </div>
          </div>

          {/* 종목 + 매수/매도 */}
          <div style={{ display: 'flex', gap: 10 }}>
            <Field label="종목" style={{ flex: 1 }}>
              <StockSearchInput
                onSelect={(sym, nm) => { setSymbol(sym); setStockName(nm) }}
                selectedSymbol={symbol || undefined}
                selectedName={stockName || undefined}
              />
            </Field>
            <Field label="매수 / 매도">
              <div style={{ display: 'flex', gap: 6 }}>
                {(['BUY', 'SELL'] as const).map(s => (
                  <button
                    key={s} type="button"
                    onClick={() => setSide(s)}
                    style={{
                      flex: 1, padding: '8px 0', borderRadius: 6, border: 'none', cursor: 'pointer',
                      fontWeight: 600, fontSize: 12,
                      background: side === s ? (s === 'BUY' ? '#22C55E' : '#EF4444') : 'rgba(255,255,255,0.06)',
                      color: side === s ? '#fff' : '#8892A8',
                    }}
                  >{s === 'BUY' ? '매수' : '매도'}</button>
                ))}
              </div>
            </Field>
          </div>

          {/* 전략 파라미터 (유형마다 다름) */}
          {paramDefs.length > 0 && (
            <div style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#4B5675', letterSpacing: '0.06em' }}>세부 조건 조정</div>
              {paramDefs.map(def => (
                <Field key={def.key} label={def.label}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="number"
                      value={getParamValue(def.key, def.defaultValue)}
                      onChange={e => setParamValues(p => ({ ...p, [def.key]: Number(e.target.value) }))}
                      min={def.min} max={def.max} step={def.step}
                      style={{ ...inputStyle, flex: 1 }}
                    />
                    <span style={{ fontSize: 11, color: '#4B5675', whiteSpace: 'nowrap' }}>
                      기본값: {def.defaultValue}
                    </span>
                  </div>
                </Field>
              ))}
            </div>
          )}

          {/* 수량 설정 */}
          <div style={{ display: 'flex', gap: 10 }}>
            <Field label="수량 방식" style={{ flex: 1 }}>
              <select value={quantityMode} onChange={e => setQuantityMode(e.target.value as QuantityMode)} style={inputStyle}>
                {(Object.keys(QTY_MODE_LABEL) as QuantityMode[]).map(m => (
                  <option key={m} value={m}>{QTY_MODE_LABEL[m]}</option>
                ))}
              </select>
              <div style={{ fontSize: 11, color: '#4B5675', marginTop: 4 }}>{QTY_MODE_HINT[quantityMode]}</div>
            </Field>
            <Field label={quantityMode === 'BUYING_POWER_PCT' ? '비율 (%)' : quantityMode === 'ATR' ? 'ATR 배수' : '수량 (주)'}>
              <input
                type="number"
                value={quantityValue}
                onChange={e => setQuantityValue(Number(e.target.value))}
                min={0.01}
                step={quantityMode === 'FIXED' ? 1 : 0.01}
                style={{ ...inputStyle, width: 90 }}
              />
            </Field>
          </div>

          {/* 일일 실행 횟수 */}
          <Field label="하루 최대 몇 번 실행할까요?">
            <div style={{ display: 'flex', gap: 8 }}>
              {[1, 2, 3, 5].map(n => (
                <button
                  key={n} type="button"
                  onClick={() => setMaxExecutions(n)}
                  style={{
                    flex: 1, padding: '8px 0', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12,
                    background: maxExecutions === n ? 'rgba(255,140,0,0.15)' : 'rgba(255,255,255,0.06)',
                    color: maxExecutions === n ? '#FF8C00' : '#8892A8',
                    fontWeight: maxExecutions === n ? 700 : 400,
                  }}
                >{n}번</button>
              ))}
            </div>
          </Field>

          {/* 실시간 전략 요약 */}
          {summary ? (
            <div style={{
              padding: '14px 16px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#4B5675', letterSpacing: '0.08em', marginBottom: 8 }}>
                📋 지금 설정대로라면
              </div>
              {summary.split('\n').map((line, i) => (
                <div key={i} style={{
                  fontSize: i === 0 ? 13 : 12,
                  color: i === 0 ? '#E2E8F0' : '#8892A8',
                  lineHeight: 1.7,
                  fontWeight: i === 0 ? 500 : 400,
                }}>{line}</div>
              ))}
            </div>
          ) : (
            <div style={{
              padding: '14px 16px',
              background: 'rgba(255,255,255,0.02)',
              border: '1px dashed rgba(255,255,255,0.07)',
              borderRadius: 8,
              fontSize: 12, color: '#4B5675', textAlign: 'center',
            }}>
              종목을 선택하면 여기에 전략 요약이 표시됩니다
            </div>
          )}

          {errorMsg && (
            <div style={{ fontSize: 12, color: '#FCA5A5', padding: '8px 10px', background: 'rgba(239,68,68,0.08)', borderRadius: 6 }}>
              {errorMsg}
            </div>
          )}

          <div style={{ fontSize: 11, color: '#4B5675' }}>
            생성 후 OTP 인증 완료 상태에서 활성화 버튼을 눌러야 자동 주문이 실행됩니다.
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            style={{
              width: '100%', padding: '12px 0', borderRadius: 8, border: 'none',
              background: mutation.isPending ? 'rgba(255,140,0,0.4)' : '#FF8C00',
              color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}
          >
            {mutation.isPending ? '생성 중...' : '전략 생성'}
          </button>
        </form>
      </div>
    </div>
  )
}

function Field({ label, children, style }: { label: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={style}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#8892A8', marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px', borderRadius: 6, boxSizing: 'border-box',
  background: '#1A2438', border: '1px solid rgba(255,255,255,0.1)',
  color: '#E2E8F0', fontSize: 13, outline: 'none',
  colorScheme: 'dark',
}
