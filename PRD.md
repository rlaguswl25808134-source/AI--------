# 제품 요구사항 정의서 (Product Requirements Document - PRD)

## 1. 프로젝트 개요
- **프로젝트 명**: AI Stock Market Intelligence Dashboard
- **목적**: 사용자가 미국 주식 티커를 입력하면 실시간 구글 검색 및 Gemini AI를 통해 최신 영문 뉴스와 업계 동향, CEO 행보를 취합 및 분석하여, 주가 영향 예측 및 투자 조언을 담은 종합 보고서와 실시간 차트를 한눈에 볼 수 있는 웹 서비스 구축.
- **기술 스택**:
  - **Framework**: Next.js (App Router 권장)
  - **Styling**: Tailwind CSS
  - **Deployment**: Vercel (자동 CI/CD 연동 및 최적화 배포)
  - **API Integration**: Gemini 2.5 Flash API (Google Search Grounding 활성화), TradingView Widget Embed

---

## 2. 주요 기능 및 요구사항 (Functional Requirements)

### 2.1. 실시간 주식 분석 및 리포트 자동 생성
- **종목 검색**: Ticker(예: TSLA, NVDA)를 검색창에 입력하거나 추천 종목 칩(Button)을 클릭하여 분석 시작.
- **실시간 데이터 수집**: 
  - Gemini API의 Google Search Grounding 기능을 활용하여 최근 3~5일간의 최신 영어 뉴스 수집.
  - 해당 업종(전기차, 반도체 등)의 거시적 산업 동향 수집.
  - CEO(일론 머스크 등)의 행보 및 최근 발언/SNS 언급 수집.
- **구조화된 AI 보고서 작성**:
  - **Executive Summary**: 기업 한 줄 요약 및 핵심 호재/악재, 최종 매매 의견([BUY], [HOLD], [SELL] 중 택1).
  - **CEO & Industry Analysis**: 경영진 이슈 및 산업 동향이 시장에 미칠 영향 분석.
  - **Historical Precedents**: 과거 유사 위기/기회 상황 당시의 주가 추이와 비교 분석.
  - **Stock Impact & Projection**: 단기(1~2주) 및 중기(1~3개월) 주가 방향 전망 및 모니터링 포인트 제시.
- **인터넷 검색 소스 제공**: 보고서 생성에 기여한 구글 검색어와 원본 웹 뉴스 URL 목록을 하단에 리스트로 표기.
- **한국 상장 미국 주식 ETF 추천**:
  - 사용자가 검색한 미국 기업을 담고 있는 **한국 거래소(KRX) 상장 ETF**들을 실시간으로 검색하여 추천.
  - **추천 기준**: 실질 **총보수율(총보수 + 기타비용 + 매매중개수수료)**이 낮은 순으로 정렬/비교하여 추천.
  - **제공 정보**:
    1. 해당 ETF 내 검색 기업의 **편입 비중(%)**
    2. **총보수율 정보** (총보수, 기타비용, 매매중개수수료 명시)
    3. ETF의 **상장 기간** (상장일 및 경과일)
    4. **추천 이유 요약** 및 관련 근거 **출처 웹 링크** 표기.


### 2.2. 실시간 금융 차트 연동
- TradingView 무료 위젯을 활용하여 검색된 Ticker의 실시간 차트를 화면에 동적 로드.
- 사용자가 종목을 변경할 때마다 차트가 즉시 갱신되어야 함.

### 2.3. 사용자 설정 (API Key 관리)
- 구글 AI Studio에서 무료로 발급한 Gemini API Key를 입력받아 브라우저의 `localStorage` 또는 쿠키에 안전하게 저장.
- 유료 서버 인프라를 사용하지 않고 완전 무료로 서비스하기 위해 클라이언트 사이드 환경 또는 Vercel Serverless Function(사용자 키 전달 방식)을 통해 실행.

---

## 3. 비기능적 요구사항 (Non-Functional Requirements)
- **비용**: 서비스 유지 비용 및 API 호출 비용은 **100% 무료**여야 함 (Gemini 무료 티어 사용).
- **디자인/UI**: 
  - Tailwind CSS를 활용한 다크 모드 기반의 프리미엄 금융 대시보드 인터페이스 구현.
  - 다양한 기기(모바일, 태블릿, PC)를 지원하는 반응형 웹 레이아웃.
  - 리포트 로딩 시 스텝 바이 스텝 진행 상태(검색 중 -> 분석 중 -> 보고서 작성 중)를 직관적인 애니메이션으로 노출.
- **배포**: Vercel에 단 한 번의 클릭으로 연결 및 배포할 수 있는 Next.js 프로젝트 구조 유지.
- **보안**: 사용자가 입력한 API 키는 어떠한 외부 타사 서버로도 유출되어서는 안 되며, 사용자의 웹 브라우저 내에서만 활용되어야 함.
