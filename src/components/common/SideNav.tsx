import { useNavigate, useLocation } from 'react-router-dom'

const NAV_ITEMS = [
  {
    label: '홈', path: '/',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
  },
  {
    label: '종목 분석', path: '/analysis',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  },
  {
    label: '거래 기록', path: '/history',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  },
  {
    label: '관심 종목', path: '/watchlist',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  },
  {
    label: '마이페이지', path: '/mypage',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  },
]

const AI_ITEMS = [
  {
    label: '경제 국면', path: '/economic',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M4.93 19.07l1.41-1.41M19.07 19.07l-1.41-1.41M12 2v2M12 20v2M2 12h2M20 12h2"/></svg>,
  },
  {
    label: '가치주 스크리너', path: '/screener',
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>,
  },
]

export default function SideNav() {
  const navigate  = useNavigate()
  const { pathname } = useLocation()

  return (
    <nav style={{
      height: '100%',
      background: '#0E1525',
      borderRight: '1px solid rgba(255,255,255,0.07)',
      display: 'flex', flexDirection: 'column',
      padding: '16px 0', gap: 2,
      overflowY: 'auto',
    }}>
      <Section label="메뉴">
        {NAV_ITEMS.map(item => (
          <NavItem
            key={item.path}
            label={item.label}
            icon={item.icon}
            active={pathname === item.path}
            onClick={() => navigate(item.path)}
          />
        ))}
      </Section>

      <div style={{ marginTop: 'auto' }}>
        <Section label="AI">
          {AI_ITEMS.map(item => (
            <NavItem
              key={item.path}
              label={item.label}
              icon={item.icon}
              active={pathname === item.path}
              onClick={() => navigate(item.path)}
            />
          ))}
        </Section>
      </div>
    </nav>
  )
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: '0 12px', marginBottom: 4 }}>
      <div style={{
        fontSize: 10, fontWeight: 600, color: '#4B5675',
        letterSpacing: '0.08em', textTransform: 'uppercase',
        padding: '0 8px', marginBottom: 4,
      }}>{label}</div>
      {children}
    </div>
  )
}

function NavItem({
  label, icon, active, onClick,
}: {
  label: string
  icon: React.ReactNode
  active: boolean
  onClick: () => void
}) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 10px', borderRadius: 6,
        fontSize: 13, cursor: 'pointer',
        color: active ? '#00C896' : '#8892A8',
        background: active ? 'rgba(0,200,150,0.08)' : 'transparent',
        position: 'relative',
        transition: 'all 0.12s',
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
    >
      {active && (
        <div style={{
          position: 'absolute', left: 0, top: '50%',
          transform: 'translateY(-50%)',
          width: 3, height: 16,
          background: '#00C896', borderRadius: '0 2px 2px 0',
        }} />
      )}
      {icon}
      {label}
    </div>
  )
}
