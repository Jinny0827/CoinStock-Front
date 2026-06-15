import {useIsDesktop} from '../hooks/useIsDesktop'
import HotStockList from '../components/home/HotStockList'
import StockDetailPanel from '../components/home/StockDetailPanel'
import RightPanel from '../components/home/RightPanel'
import { useStockStore } from '../store/stockStore'

export default function HomePage() {
  const isDesktop = useIsDesktop()
  return isDesktop ? <DesktopHome /> : <MobileHome />
}

// ── 데스크탑 ──────────────────────────────────────────────
function DesktopHome() {
  const selectedStock = useStockStore(s => s.selectedStock)
  return (
    <div style={{
      display: 'grid',
        gridTemplateColumns: '300px 1fr 260px',
        height: 'calc(100vh - 52px)',
      overflow: 'hidden',
      background: '#080C17',
    }}>
      {/* 동전주 급등 리스트 */}
      <div style={{ borderRight: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <HotStockList />
      </div>

      {/* 종목 상세 */}
      <div style={{ overflow: 'hidden' }}>
        {selectedStock ? (
          <StockDetailPanel />
        ) : (
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            height: '100%', gap: 10,
          }}>
            <div style={{ fontSize: 28, opacity: 0.3 }}>📊</div>
            <div style={{ fontSize: 13, color: '#4B5675' }}>종목을 선택해주세요</div>
          </div>
        )}
      </div>

      {/* 우측 패널 */}
      <RightPanel />
    </div>
  )
}

// ── 모바일 ────────────────────────────────────────────────
function MobileHome() {
  const selectedStock    = useStockStore(s => s.selectedStock)
  const setSelectedStock = useStockStore(s => s.setSelectedStock)

  // 종목 선택 시: 리스트 숨기고 디테일 뷰로 전환
  if (selectedStock) {
    return (
      <div style={{ height: 'calc(100vh - 52px)', background: '#080C17', display: 'flex', flexDirection: 'column' }}>
        {/* 뒤로가기 */}
        <div
          onClick={() => setSelectedStock(null)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '10px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            cursor: 'pointer', flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 16, color: '#4B5675' }}>←</span>
          <span style={{ fontSize: 12, color: '#4B5675' }}>종목 목록</span>
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <StockDetailPanel />
        </div>
      </div>
    )
  }

  // 종목 미선택 시: 리스트 전체 화면
  return (
    <div style={{ height: 'calc(100vh - 52px)', background: '#080C17', display: 'flex', flexDirection: 'column' }}>
      <HotStockList />
    </div>
  )
}
