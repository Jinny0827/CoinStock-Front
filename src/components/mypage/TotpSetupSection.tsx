import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import QRCode from 'qrcode'
import { getTossAccountStatus } from '../../api/tossApi'
import { getTotpStatus, setupTotp, confirmTotp, disableTotp } from '../../api/totpApi'
import type { TotpSetup } from '../../types/totp'

export default function TotpSetupSection() {
  const queryClient = useQueryClient()

  const { data: status } = useQuery({ queryKey: ['toss-status'], queryFn: getTossAccountStatus })
  const connected = status?.connected ?? false

  const { data: totpStatus, isLoading } = useQuery({
    queryKey: ['totp-status'],
    queryFn:  getTotpStatus,
    enabled:  connected,
    refetchOnMount: 'always',
  })

  const [setup, setSetup] = useState<TotpSetup | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!setup) { setQrDataUrl(''); return }
    QRCode.toDataURL(setup.otpauthUri).then(setQrDataUrl).catch(() => setQrDataUrl(''))
  }, [setup])

  if (!connected || isLoading) return null

  const enabled = totpStatus?.enabled ?? false

  async function handleStartSetup() {
    setError('')
    setLoading(true)
    try {
      const result = await setupTotp()
      setSetup(result)
    } catch (err: any) {
      setError(err.message ?? 'OTP 설정 시작에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirm() {
    setError('')
    setLoading(true)
    try {
      await confirmTotp(code)
      setSetup(null)
      setCode('')
      queryClient.invalidateQueries({ queryKey: ['totp-status'] })
    } catch (err: any) {
      setError(err.message ?? '인증번호가 올바르지 않습니다')
    } finally {
      setLoading(false)
    }
  }

  async function handleDisable() {
    if (!confirm('OTP 보호장치를 해제하시겠습니까? 해제하면 토스 주문을 실행할 수 없습니다.')) return
    await disableTotp()
    queryClient.invalidateQueries({ queryKey: ['totp-status'] })
  }

  return (
    <div style={cardStyle}>
      <div style={headerStyle}>
        <span style={titleStyle}>주문 보호장치 (OTP)</span>
        {enabled && (
          <button onClick={handleDisable} style={disableBtnStyle}>해제</button>
        )}
      </div>

      <div style={{ padding: '16px 20px' }}>
        {enabled ? (
          <div style={enabledBadgeStyle}>✓ OTP 보호장치가 활성화되어 있습니다</div>
        ) : setup ? (
          <div>
            <div style={warnStyle}>
              구글 OTP(Google Authenticator) 등 OTP 앱으로 아래 QR코드를 스캔하거나, 코드를 직접 입력해서 등록하세요.
            </div>
            {qrDataUrl && (
              <img src={qrDataUrl} alt="OTP QR코드" style={{ display: 'block', margin: '14px auto', width: 180, height: 180, borderRadius: 8 }} />
            )}
            <div style={secretBoxStyle}>{setup.secret}</div>
            <input
              placeholder="OTP 앱에 뜨는 6자리 숫자" value={code} maxLength={6}
              onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
              style={{ ...inputStyle, width: '100%', marginTop: 12, boxSizing: 'border-box' }}
            />
            {error && <div style={errorStyle}>{error}</div>}
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button onClick={() => { setSetup(null); setCode(''); setError('') }} style={{ ...secondaryBtnStyle, flex: 1 }}>취소</button>
              <button onClick={handleConfirm} disabled={loading || code.length !== 6} style={{ ...confirmBtnStyle, flex: 1, opacity: code.length === 6 ? 1 : 0.5 }}>
                {loading ? '확인 중...' : '등록 완료'}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div style={warnStyle}>
              ⚠️ 토스 계좌가 연동되어 있지만 OTP 보호장치가 설정되지 않았습니다. 설정 전까지는 주문(매수/매도)을 실행할 수 없습니다.
            </div>
            {error && <div style={errorStyle}>{error}</div>}
            <button onClick={handleStartSetup} disabled={loading} style={{ ...confirmBtnStyle, marginTop: 12 }}>
              {loading ? '준비 중...' : 'OTP 설정하기'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
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

const confirmBtnStyle: React.CSSProperties = {
  height: 34, padding: '0 16px',
  background: '#FF8C00', border: 'none', borderRadius: 6,
  color: '#0A0F1C', fontSize: 12, fontWeight: 700, cursor: 'pointer',
}

const secondaryBtnStyle: React.CSSProperties = {
  height: 34, padding: '0 16px',
  background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6,
  color: '#C9D1E0', fontSize: 12, fontWeight: 600, cursor: 'pointer',
}

const disableBtnStyle: React.CSSProperties = {
  height: 26, padding: '0 10px',
  background: 'transparent', border: '1px solid rgba(255,75,75,0.4)',
  borderRadius: 6, color: '#FF4B4B', fontSize: 11, cursor: 'pointer',
}

const inputStyle: React.CSSProperties = {
  height: 34,
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 6, padding: '0 10px',
  color: '#E2E8F0', fontSize: 14, outline: 'none', letterSpacing: 2,
  textAlign: 'center',
}

const warnStyle: React.CSSProperties = {
  fontSize: 12, color: '#FF8C8C', lineHeight: 1.6,
  background: 'rgba(255,75,75,0.08)', border: '1px solid rgba(255,75,75,0.25)',
  borderRadius: 8, padding: '10px 12px',
}

const enabledBadgeStyle: React.CSSProperties = {
  fontSize: 12, color: '#FF8C00', fontWeight: 600,
}

const secretBoxStyle: React.CSSProperties = {
  fontSize: 12, color: '#C9D1E0', fontFamily: 'monospace',
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 6, padding: '8px 10px', textAlign: 'center', letterSpacing: 1,
  wordBreak: 'break-all',
}

const errorStyle: React.CSSProperties = {
  fontSize: 12, color: '#FF4B4B', marginTop: 10,
  background: 'rgba(255,75,75,0.08)', borderRadius: 6, padding: '8px 10px',
}
