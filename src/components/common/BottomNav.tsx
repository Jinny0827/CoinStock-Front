import { useNavigate, useLocation } from 'react-router-dom'

const NAV_ITEMS = [
    { label: '홈',      path: '/',          icon: '⊞' },
    { label: '종목분석', path: '/analysis',  icon: '▦' },
    { label: '거래기록', path: '/history',   icon: '₩' },
    { label: '관심종목', path: '/watchlist', icon: '★' },
    { label: '마이',    path: '/mypage',    icon: '◉' },
]

export default function BottomNav() {
    const navigate = useNavigate()
    const {pathname} = useLocation()

    return (
        <nav style={{
            position: 'fixed', bottom: 0, left: 0, right: 0,
            height: 60,
            background: '#0E1525',
            borderTop: '1px solid rgba(255,255,255,0.07)',
            display: 'flex',
            zIndex: 100,
            paddingBottom: 'env(safe-area-inset-bottom)',
        }}>
            {NAV_ITEMS.map(item => {
                const active = pathname === item.path
                return (
                    <button key={item.path} onClick={() => navigate(item.path)} style={{
                        flex: 1, display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        gap: 3, background: 'none', border: 'none', cursor: 'pointer',
                        color: active ? '#FF8C00' : '#4B5675',
                        transition: 'color 0.1s',
                    }}>
                        <span style={{fontSize: 18, lineHeight: 1}}>{item.icon}</span>
                        <span style={{fontSize: 10, fontWeight: active ? 600 : 400}}>{item.label}</span>
                    </button>
                )
            })}
        </nav>
    )
}