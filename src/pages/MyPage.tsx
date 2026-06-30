import TossAccountSection from '../components/mypage/TossAccountSection'
import TotpSetupSection from '../components/mypage/TotpSetupSection'
import TossOrderSection from '../components/mypage/TossOrderSection'
import NotificationSection from '../components/mypage/NotificationSection'

export default function MyPage() {
    return (
        <div style={{ height: '100%', overflowY: 'auto', boxSizing: 'border-box', padding: '16px', maxWidth: 800, margin: '0 auto' }}>
            <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700 }}>마이페이지</h2>

            <TossAccountSection />
            <TotpSetupSection />
            <TossOrderSection />
            <NotificationSection />
        </div>
    )
}
