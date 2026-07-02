import { useState, useEffect } from 'react'
import {BrowserRouter, Route, Routes} from 'react-router-dom'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import AppHeader from './components/common/AppHeader'
import SideNav from './components/common/SideNav'
import BottomNav from './components/common/BottomNav'
import RequireAuth from './components/common/RequireAuth'
import {useIsDesktop} from './hooks/useIsDesktop'
import { useNotificationSocket } from './hooks/useNotificationSocket'
import HomePage from './pages/HomePage'
import StockAnalysisPage from './pages/StockAnalysisPage'
import HistoryPage from './pages/HistoryPage'
import MyPage from './pages/MyPage'
import EconomicPhasePage from './pages/EconomicPhasePage'
import ScreenerPage from './pages/ScreenerPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import NotificationsPage from './pages/NotificationsPage'
import MacroPage from './pages/MacroPage'

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            staleTime: 30_000,
            refetchOnWindowFocus: false,
        },
    },
})

export default function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <NotificationBridge />
                <NotificationToast />
                <Routes>
                    <Route path="/login"  element={<LoginPage />} />
                    <Route path="/signup" element={<SignupPage />} />
                    <Route path="/*" element={
                        <>
                            <AppHeader />
                            <Layout />
                        </>
                    } />
                </Routes>
            </BrowserRouter>
        </QueryClientProvider>
    )
}

function NotificationBridge() {
    useNotificationSocket()
    return null
}

function NotificationToast() {
    const [toast, setToast] = useState<{ title: string; body: string | null } | null>(null)

    useEffect(() => {
        const handler = (e: Event) => {
            const detail = (e as CustomEvent).detail as { title?: string; body?: string }
            setToast({ title: detail.title ?? '알림', body: detail.body ?? null })
            setTimeout(() => setToast(null), 5000)
        }
        window.addEventListener('jigeum:notification', handler)
        return () => window.removeEventListener('jigeum:notification', handler)
    }, [])

    if (!toast) return null

    return (
        <div style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
            background: '#1A2438', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 10, padding: '12px 14px',
            width: 280, boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            display: 'flex', gap: 10, alignItems: 'flex-start',
        }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF8C00" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#E2E8F0' }}>{toast.title}</div>
                {toast.body && <div style={{ fontSize: 12, color: '#8892A8', marginTop: 3 }}>{toast.body}</div>}
            </div>
            <button
                onClick={() => setToast(null)}
                style={{ background: 'none', border: 'none', color: '#4B5675', cursor: 'pointer', padding: 0, flexShrink: 0 }}
            >✕</button>
        </div>
    )
}

function Layout() {
    const isDesktop = useIsDesktop()

    return (
        <div style={{ display: 'flex', height: 'calc(100vh - 52px)' }}>
            {isDesktop && <SideNav />}
            <div style={{
                flex: 1, overflow: 'hidden',
                paddingBottom: isDesktop ? 0 : 60,
            }}>
                <Routes>
                    <Route path="/"           element={<HomePage />} />
                    <Route path="/analysis"   element={<StockAnalysisPage />} />
                    <Route path="/history"    element={<RequireAuth><HistoryPage /></RequireAuth>} />
                    <Route path="/mypage"     element={<RequireAuth><MyPage /></RequireAuth>} />
                    <Route path="/economic"   element={<EconomicPhasePage />} />
                    <Route path="/screener"   element={<ScreenerPage />} />
                    <Route path="/notifications" element={<RequireAuth><NotificationsPage /></RequireAuth>} />
                    <Route path="/macro"          element={<RequireAuth><MacroPage /></RequireAuth>} />
                </Routes>
            </div>
            {!isDesktop && <BottomNav />}
        </div>
    )
}