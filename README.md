# 📈 지금 (JIGEUM) — 동전주 도파민

주식을 잘 모르는 사람도 **"지금"** 뭘 봐야 하는지 알 수 있는 주식 분석 서비스입니다.  
Groq AI가 수치를 언어로 바꿔 누구나 이해할 수 있는 인사이트를 제공합니다.

> 개발 상태: Phase 1~4 완료, Phase 5 고도화 진행 중

---

## 📌 주요 기능

### 🔴 트랙 A — 동전주 도파민 (테마주)
세력 움직임과 테마 흐름을 감지하여 급등 가능 종목을 실시간으로 하이라이트

| 감지 조건 | 기준 |
|---|---|
| 장기 거래량 급등 | 10일 EMA 대비 300% 이상 |
| 장중 거래량 급등 | 장중 EMA 대비 150% 이상 |
| 복합 급등 | 거래량 급등 + 등락률 3% 이상 동시 충족 |
| 극단 급등 | 등락률 10% 이상 단독 감지 |

- Groq AI가 매일 핫한 테마 5개 동적 선정
- 부채비율 200% 초과 종목 자동 제외
- 국장 5,000원 / 미장 $5 이하 동전주 풀 (~1,500종목)

### 🔵 트랙 B — 실적주 스크리너
EPS 성장 + PER + PBR + 매출성장률 + 영업이익률 기준으로 저평가 or 성장주 자동 필터링

### 📊 실시간 시세
- 국장/미장 주요 100종목 + 지수 4개 (WebSocket 5초 Push)
- 동전주 ~1,500종목 롤링 갱신 (30초 배치)

### 🕯️ 차트
| 구분 | 차트 | 보조 지표 |
|---|---|---|
| 단타용 | 1분 / 5분 / 15분봉 | RSI, MACD, 볼린저밴드, 거래량 |
| 장타용 | 일봉 / 주봉 / 월봉 | 실적 발표 시점, 과거 AI 예측 마커 |

### 🤖 AI 기능
- **경제 국면 판단**: 금리(FRED), VIX, WTI, 금 현물가, 환율 종합 분석
- **AI 가격 예측**: 종목 클릭 시 Groq 예측 생성 (TTL 24h 캐시), 과거 예측 차트 오버레이
- **용어 해석**: 주식 용어 AI 설명

### 👤 사용자 인증
- 이메일/비밀번호 회원가입·로그인
- JWT (HS256, 7일 TTL) + token_version 기반 즉시 로그아웃
- 시세/차트는 비로그인 허용, 관심종목/거래기록/토스 연동은 로그인 필수

### 🏦 토스증권 Open API 연동
- 시세/캔들/투자경고/장운영시간 투트랙 운영 (Yahoo Finance 병행)
- 사용자 계좌 연동: 보유종목 / 주문 / 평가손익 조회
- client_secret, access_token AES-GCM 암호화 저장

---

## 🏗️ 기술 스택

### Backend
| 항목 | 기술 |
|---|---|
| 서버 프레임워크 | Netty 4.1.x |
| 스케줄러 | ScheduledExecutorService |
| DB | PostgreSQL |
| HTTP 클라이언트 | Apache HttpClient |
| JSON | Jackson |
| AI | Groq API (Llama 3) |
| 인증 | JWT (HS256 자체 구현) + BCrypt |
| 암호화 | AES-GCM (토스 연동 정보 보호) |
| 빌드 | Apache Ant |

### Frontend
| 항목 | 기술 |
|---|---|
| Framework | React 18 |
| 상태관리 | Zustand + TanStack Query |
| 차트 | Recharts |
| HTTP | Axios |
| 실시간 | WebSocket |
| 스타일 | 인라인 스타일 (CSS 변수 기반 다크 테마) |

---

## 🗄️ DB 테이블

| 테이블 | 용도 |
|---|---|
| stock_cache | 종목 시세 + 재무 (EPS/PER/PBR/부채비율) |
| penny_pool | 동전주 풀 심볼 목록 |
| trades | 거래 기록 |
| watchlist | 관심 종목 (사용자별) |
| disclosure_cache | DART 공시 캐시 |
| prediction_cache | AI 예측 캐시 (TTL 24h) |
| prediction_history | AI 예측 이력 누적 |
| users | 회원 계정 |
| toss_accounts | 토스 OpenAPI 연동 정보 (암호화) |

---

## 🔗 데이터 소스

| 소스 | 용도 |
|---|---|
| Yahoo Finance | 현재가, 차트, 지수, 금 선물 |
| DART API (금융감독원) | 국장 재무제표 (EPS/PER/PBR/부채비율) |
| SEC EDGAR | 미장 재무제표 |
| FRED API | 금리, VIX, WTI 유가 |
| Groq API | AI 인사이트, 테마 분류, 가격 예측 |
| 토스증권 Open API | 시세, 계좌 연동 |

---

## 🚀 개발 단계

- ✅ Phase 1 — MVP (Yahoo Finance 수집, Netty 서버, REST API, React 화면)
- ✅ Phase 2 — AI 인사이트 (Groq, 테마 동적 분류, 인사이트 API)
- ✅ Phase 3 — 분석 기능 (DART/SEC/FRED 연동, 세력 감지, 실적주 스크리너)
- ✅ Phase 4 — 실시간 (WebSocket, 롤링 동전주 업데이터)
- 🔄 Phase 5 — 고도화 진행 중 (PostgreSQL, AI 예측, 인증, 토스 연동)
- ⬜ Phase 6 — 배포 (EC2 + Docker Compose, Nginx, Redis Pub/Sub)
