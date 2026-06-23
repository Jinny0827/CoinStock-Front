import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signup } from '../api/authApi'
import { useAuthStore } from '../store/authStore'

export default function SignupPage() {
  const navigate = useNavigate()
  const setAuth  = useAuthStore(s => s.setAuth)

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('비밀번호는 8자 이상이어야 합니다')
      return
    }
    setLoading(true)
    try {
      const res = await signup({ email, password, nickname })
      setAuth(res.token, {
        userId: res.userId,
        email,
        role: 'USER',
        nickname,
      })
      navigate('/')
    } catch (err: any) {
      setError(err.message ?? '회원가입에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={wrapStyle}>
      <form onSubmit={handleSubmit} style={cardStyle}>
        <Logo />
        <h2 style={{ margin: '0 0 24px', fontSize: 18, fontWeight: 700, textAlign: 'center' }}>회원가입</h2>

        <Field label="이메일">
          <input
            type="email" value={email} required
            onChange={e => setEmail(e.target.value)}
            style={inputStyle}
          />
        </Field>

        <Field label="비밀번호 (8자 이상)">
          <input
            type="password" value={password} required minLength={8}
            onChange={e => setPassword(e.target.value)}
            style={inputStyle}
          />
        </Field>

        <Field label="닉네임 (선택)">
          <input
            type="text" value={nickname}
            onChange={e => setNickname(e.target.value)}
            style={inputStyle}
          />
        </Field>

        {error && <div style={errorStyle}>{error}</div>}

        <button type="submit" disabled={loading} style={submitStyle}>
          {loading ? '가입 중...' : '회원가입'}
        </button>

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: '#4B5675' }}>
          이미 계정이 있으신가요? <Link to="/login" style={{ color: '#FF8C00' }}>로그인</Link>
        </div>
      </form>
    </div>
  )
}

function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, marginBottom: 24 }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FF8C00', boxShadow: '0 0 6px #FF8C00' }} />
      <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.5px' }}>동전주 도파민</span>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 12, color: '#8892A8', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  )
}

const wrapStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  height: '100vh', background: '#0A0F1C',
}

const cardStyle: React.CSSProperties = {
  width: 'min(360px, calc(100vw - 32px))',
  background: '#0E1525',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 10, padding: '32px 28px',
}

const inputStyle: React.CSSProperties = {
  width: '100%', height: 38, boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 6, padding: '0 12px',
  color: '#E2E8F0', fontSize: 13, outline: 'none',
}

const submitStyle: React.CSSProperties = {
  width: '100%', height: 40, marginTop: 6,
  background: '#FF8C00', border: 'none', borderRadius: 6,
  color: '#0A0F1C', fontSize: 13, fontWeight: 700, cursor: 'pointer',
}

const errorStyle: React.CSSProperties = {
  fontSize: 12, color: '#FF4B4B', marginBottom: 12,
  background: 'rgba(255,75,75,0.08)', borderRadius: 6, padding: '8px 10px',
}
