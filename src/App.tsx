import {BrowserRouter, Route, Routes} from 'react-router-dom'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import AppHeader from './components/common/AppHeader'
import SideNav from './components/common/SideNav'
import BottomNav from './components/common/BottomNav'
import {useIsDesktop} from './hooks/useIsDesktop'
import HomePage from './pages/HomePage'
import StockAnalysisPage from './pages/StockAnalysisPage'
import HistoryPage from './pages/HistoryPage'
import WatchlistPage from './pages/WatchlistPage.tsx'
import MyPage from './pages/MyPage'
import EconomicPhasePage from './pages/EconomicPhasePage'
import ScreenerPage from './pages/ScreenerPage'

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
                <AppHeader />
                <Layout />
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
                    <Route path="/history"    element={<HistoryPage />} />
                    <Route path="/watchlist"  element={<WatchlistPage />} />
                    <Route path="/mypage"     element={<MyPage />} />
                    <Route path="/economic"   element={<EconomicPhasePage />} />
                    <Route path="/screener"   element={<ScreenerPage />} />
                </Routes>
            </div>
            {!isDesktop && <BottomNav />}
        </div>
    )
}