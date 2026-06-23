import {BrowserRouter, Route, Routes} from 'react-router-dom'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import AppHeader from './components/common/AppHeader'
import SideNav from './components/common/SideNav'
import BottomNav from './components/common/BottomNav'
import RequireAuth from './components/common/RequireAuth'
import {useIsDesktop} from './hooks/useIsDesktop'
import HomePage from './pages/HomePage'
import StockAnalysisPage from './pages/StockAnalysisPage'
import HistoryPage from './pages/HistoryPage'
import WatchlistPage from './pages/WatchlistPage.tsx'
import MyPage from './pages/MyPage'
import EconomicPhasePage from './pages/EconomicPhasePage'
import ScreenerPage from './pages/ScreenerPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'

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
                    <Route path="/watchlist"  element={<RequireAuth><WatchlistPage /></RequireAuth>} />
                    <Route path="/mypage"     element={<RequireAuth><MyPage /></RequireAuth>} />
                    <Route path="/economic"   element={<EconomicPhasePage />} />
                    <Route path="/screener"   element={<ScreenerPage />} />
                </Routes>
            </div>
            {!isDesktop && <BottomNav />}
        </div>
    )
}