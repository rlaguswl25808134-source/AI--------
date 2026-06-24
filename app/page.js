"use client";

import React, { useState, useEffect } from "react";

export default function Home() {
  // State
  const [apiKey, setApiKey] = useState("");
  const [isKeySaved, setIsKeySaved] = useState(false);
  const [ticker, setTicker] = useState("TSLA");
  const [currentTicker, setCurrentTicker] = useState("TSLA");
  const [currentCompanyName, setCurrentCompanyName] = useState("테슬라");
  const [status, setStatus] = useState("idle"); // idle, searching, analyzing, writing, complete, error
  const [reportHtml, setReportHtml] = useState("");
  const [citations, setCitations] = useState([]);

  // Popular tickers list
  const popularStocks = [
    { ticker: "TSLA", name: "테슬라" },
    { ticker: "NVDA", name: "엔비디아" },
    { ticker: "AAPL", name: "애플" },
    { ticker: "MSFT", name: "마이크로소프트" },
    { ticker: "GOOGL", name: "구글" },
    { ticker: "AMZN", name: "아마존" },
  ];

  // 1. Load saved API Key on Mount
  useEffect(() => {
    const savedKey = localStorage.getItem("gemini_api_key");
    if (savedKey) {
      setApiKey(savedKey);
      setIsKeySaved(true);
    }
  }, []);

  // 2. Initialize and Update TradingView Widget
  useEffect(() => {
    const scriptId = "tradingview-widget-script";
    let script = document.getElementById(scriptId);

    const initWidget = () => {
      if (window.TradingView) {
        new window.TradingView.widget({
          "autosize": true,
          "symbol": `NASDAQ:${currentTicker}`,
          "interval": "D",
          "timezone": "Asia/Seoul",
          "theme": "dark",
          "style": "1",
          "locale": "ko",
          "enable_publishing": false,
          "hide_side_toolbar": false,
          "allow_symbol_change": true,
          "calendar": true,
          "container_id": "tradingview-widget-container",
          "studies": [
            "MASimple@tv-basicstudies"
          ]
        });
      }
    };

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://s3.tradingview.com/tv.js";
      script.onload = initWidget;
      document.head.appendChild(script);
    } else {
      initWidget();
    }
  }, [currentTicker]);

  // Save API Key
  const saveApiKey = () => {
    if (!apiKey.trim()) {
      alert("올바른 API 키를 입력해 주세요.");
      return;
    }
    localStorage.setItem("gemini_api_key", apiKey.trim());
    setIsKeySaved(true);
    alert("API 키가 안전하게 로컬에 저장되었습니다.");
  };

  // Select quick stock chip
  const handleChipClick = (stock) => {
    setTicker(stock.ticker);
    setCurrentTicker(stock.ticker);
    setCurrentCompanyName(stock.name);
  };

  // Submit search form
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const cleanTicker = ticker.trim().toUpperCase();
    if (!cleanTicker) return;

    setCurrentTicker(cleanTicker);
    // Try to match popular company name, otherwise default to ticker
    const match = popularStocks.find(s => s.ticker === cleanTicker);
    setCurrentCompanyName(match ? match.name : cleanTicker);
  };

  // Execute Analysis with Google Search Grounding
  const startAnalysis = async () => {
    const activeKey = localStorage.getItem("gemini_api_key") || apiKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!activeKey) {
      alert("분석을 시작하려면 먼저 상단 우측에 Gemini API 키를 저장해 주세요. (Google AI Studio에서 무료 발급 가능)");
      return;
    }

    setStatus("searching");
    setReportHtml("");
    setCitations([]);

    // Visual step flow Simulation timers
    const stepTimer1 = setTimeout(() => setStatus("analyzing"), 2200);
    const stepTimer2 = setTimeout(() => setStatus("writing"), 4500);

    try {
      const response = await callGeminiAPI(activeKey, currentTicker, currentCompanyName);
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      
      setStatus("complete");
      renderReport(response);
    } catch (err) {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      console.error(err);
      setStatus("error");
      if (err.message === "RATE_LIMIT_EXCEEDED") {
        setReportHtml(`
          <div class="bg-rose-500/10 border border-rose-500/20 rounded-xl p-5 text-slate-100">
            <h3 class="text-rose-400 font-bold text-sm mb-2">⚠️ 무료 사용량 한도 초과 (Rate Limit Exceeded)</h3>
            <p class="text-xs text-slate-300 leading-relaxed mb-1.5">
              현재 Google Gemini API의 무료 제공량 한도(분당 15회)를 초과하여 분석이 잠시 중단되었습니다.
            </p>
            <p class="text-xs text-slate-300 leading-relaxed">
              <strong>약 1~2분 뒤에</strong> 다시 [리포트 생성하기] 버튼을 누르시면 정상적으로 무료 작동합니다.
            </p>
          </div>
        `);
      } else if (err.message === "SERVER_OVERLOADED" || err.message.includes("high demand")) {
        setReportHtml(`
          <div class="bg-orange-500/10 border border-orange-500/20 rounded-xl p-5 text-slate-100">
            <h3 class="text-orange-400 font-bold text-sm mb-2">⚠️ 서버 일시적 과부하 (High Demand)</h3>
            <p class="text-xs text-slate-300 leading-relaxed mb-1.5">
              현재 Google Gemini AI 서버에 전 세계적인 요청이 폭주하여 처리가 일시적으로 지연되고 있습니다.
            </p>
            <p class="text-xs text-slate-300 leading-relaxed">
              <strong>잠시 후 다시</strong> 시도해 주세요. 스파이크성 과부하는 보통 일시적인 현상입니다.
            </p>
          </div>
        `);
      } else {
        alert(`분석 중 오류가 발생했습니다: ${err.message || "API 통신 실패"}`);
      }
    }
  };

  // Gemini API Request Wrapper
  const callGeminiAPI = async (key, symbol, compName) => {
    const model = "gemini-1.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${key}`;

    const promptText = `미국 주식 ${compName} (티커: ${symbol})에 대해 분석해줘.
너는 구글 검색 도구(googleSearch)를 활성화하여 반드시 다음 정보들을 영어와 한국어 사이트에서 실시간 검색 및 수집한 후 분석해야 해.

검색 및 분석 대상:
1. ${compName} (${symbol})에 대한 최근 3~5일간의 최신 영어 뉴스 및 주요 이슈들.
2. 이 회사가 속한 산업 분야(예: 전기차, 반도체 등) 전체의 글로벌 최신 동향과 요인들.
3. 이 회사의 대표/CEO(예: 테슬라라면 일론 머스크, 엔비디아라면 젠슨 황)의 최근 행보, 공식 발언, 트위터(X) 언급 또는 보도 내용.
4. **[핵심 요구사항]** 이 미국 기업(${symbol}) 주식을 담고 있거나 관련 있는 **한국 거래소(KRX) 상장 ETF 2~3종**을 찾아 추천해줘.
   - **추천 기준**: 실질 **총보수율**이 낮은 순으로 정렬/비교하여 추천.
     * 실질 총보수율 = 총보수(TER) + 기타비용 + 매매중개수수료 (최신 공시자료나 뉴스를 기반으로 세 항목을 합산해 계산하거나 언급할 것)
   - **추천 리스트 작성 필수 항목**:
     * ETF 공식 명칭 및 종목 코드 (예: KODEX 테슬라밸류체인액티브 461580)
     * 해당 ETF 내에서 이 기업(${compName})이 차지하는 **편입 비중(%)**
     * 실질 **총보수율 정보** (총보수, 기타비용, 매매중개수수료를 각각 명시하고 이를 합한 합계 총보수율 제시)
     * 해당 ETF의 **상장일 및 상장 기간** (상장된 지 얼마나 되었는지 경과 기간)
     * **추천한 이유 요약** 및 관련 근거 **출처 웹 링크** 표기.

수집이 완료되면 다음의 포맷과 순서를 엄격히 준수하여 보고서를 한글로 작성해줘. 

---
[EXECUTIVE SUMMARY]
- 기업에 대한 한 줄 요약
- 현재 주가에 영향을 줄 만한 가장 크리티컬한 호재와 악재 요인
- 분석 결과 최종 의견 제시: 다음 세 개의 키워드 중 하나를 **대괄호**와 함께 명시할 것: [BUY], [HOLD], [SELL]. (예: 최종 투자의견은 [BUY] 입니다.) 그에 대한 핵심 근거 서술.

[CEO & INDUSTRY NEWS ANALYSIS]
- CEO의 최근 행보 및 발언이 시장/대중에게 어떻게 비춰졌으며, 기업 신뢰도에 미칠 영향 분석.
- 해당 산업군의 거시경제 동향 및 시장 경쟁 강도 분석.

[KOREAN ETF RECOMMENDATIONS]
- 위의 핵심 요구사항에 따른 한국 상장 미국주식 ETF 추천 표 또는 리스트 제공.
- 총보수율(총보수 + 기타비용 + 매매중개수수료)과 해당 개별 종목 편입비중, 상장 기간을 비교 요약하고 추천 이유 및 해당 정보가 수집된 웹 출처 링크(URL)를 각 ETF 마다 명확하게 삽입할 것.

[HISTORICAL PRECEDENTS]
- 과거 이 회사에 발생했던 유사한 이벤트나 상황을 찾아 당시 주가는 어떻게 반응했는지 비교 서술.
- 과거 사례를 비추어 보아 향후 수 주간 예상되는 흐름 예측.

[STOCK IMPACT & PROJECTION]
- 단기(1-2주) 및 중기(1-3개월) 주가 방향에 대한 구체적인 전망.
- 어떤 지표나 뉴스가 다음 변곡점이 될지 주목해야 할 모니터링 포인트 서술.
---

반드시 신뢰할 수 있고 구체적인 데이터에 기반해야 하며 실시간 인터넷 검색 결과를 요약 반영해줘.`;

    const requestPayload = {
      contents: [
        {
          role: "user",
          parts: [{ text: promptText }]
        }
      ],
      systemInstruction: {
        parts: [
          { text: "너는 미국 금융 투자 및 주식 시장 분석 전문가야. 객관적이고 사실에 기반하여 전문적인 보고서를 작성해줘. 모든 추천 ETF 정보에는 실질 수수료(총보수율)와 원본 정보 출처 웹링크를 꼭 명시해줘. 투자 주의사항을 반드시 마지막에 덧붙여줘." }
        ]
      },
      generationConfig: {
        temperature: 0.2,
        topP: 0.95
      }
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestPayload)
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error("RATE_LIMIT_EXCEEDED");
      }
      if (response.status === 503) {
        throw new Error("SERVER_OVERLOADED");
      }
      const errJson = await response.json().catch(() => ({}));
      const errMsg = errJson.error?.message || `HTTP error! status: ${response.status}`;
      throw new Error(errMsg);
    }

    return await response.json();
  };

  // Convert Markdown Response to HTML
  const renderReport = (apiResponse) => {
    const candidate = apiResponse.candidates?.[0];
    if (!candidate || !candidate.content?.parts?.[0]?.text) {
      setReportHtml(`<p class="text-rose-500 font-medium">분석 결과를 가져오지 못했습니다. API 응답 형식이 올바르지 않습니다.</p>`);
      return;
    }

    const rawText = candidate.content.parts[0].text;
    
    // Parse Markdown
    let html = parseSimpleMarkdown(rawText);
    setReportHtml(html);

    // Citations list
    const groundingMetadata = candidate.groundingMetadata;
    if (groundingMetadata && groundingMetadata.groundingChunks) {
      const uniqueSources = [];
      const visitedUrls = new Set();

      groundingMetadata.groundingChunks.forEach(chunk => {
        const web = chunk.web;
        if (web && web.uri && web.title && !visitedUrls.has(web.uri)) {
          visitedUrls.add(web.uri);
          let domain = "";
          try {
            domain = new URL(web.uri).hostname.replace("www.", "");
          } catch (e) {
            domain = "Link";
          }
          uniqueSources.push({
            title: web.title,
            uri: web.uri,
            domain: domain
          });
        }
      });
      setCitations(uniqueSources);
    }
  };

  // Minimal Markdown Parser Utility
  const parseSimpleMarkdown = (markdown) => {
    let html = markdown;

    // Line breaks
    html = html.replace(/\r\n/g, "\n");

    // Replace Opinion Badges
    html = html.replace(/\[BUY\]/g, '<span class="opinion-badge opinion-buy">BUY</span>');
    html = html.replace(/\[SELL\]/g, '<span class="opinion-badge opinion-sell">SELL</span>');
    html = html.replace(/\[HOLD\]/g, '<span class="opinion-badge opinion-hold">HOLD</span>');

    // Blockquotes
    html = html.replace(/^\s*>\s+(.+)$/gm, "<blockquote><p>$1</p></blockquote>");

    // Headers
    html = html.replace(/^### (.*$)/gim, "<h3>$1</h3>");
    html = html.replace(/^## (.*$)/gim, "<h2>$1</h2>");
    html = html.replace(/^# (.*$)/gim, "<h1>$1</h1>");

    // Bold text
    html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

    // Unordered lists (bullet points)
    let lines = html.split("\n");
    let inList = false;
    
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();
        if (line.startsWith("- ") || line.startsWith("* ")) {
            let content = line.substring(2);
            if (!inList) {
                lines[i] = "<ul>\n<li>" + content + "</li>";
                inList = true;
            } else {
                lines[i] = "<li>" + content + "</li>";
            }
        } else {
            if (inList) {
                lines[i] = "</ul>\n" + lines[i];
                inList = false;
            }
        }
    }
    
    if (inList) {
        lines.push("</ul>");
    }
    html = lines.join("\n");

    // Paragraph splits
    html = html.split(/\n\n+/).map(p => {
        let trimmed = p.trim();
        if (!trimmed) return "";
        if (trimmed.startsWith("<h") || trimmed.startsWith("<ul") || trimmed.startsWith("<ol") || trimmed.startsWith("<block")) {
            return trimmed;
        }
        return `<p>${trimmed.replace(/\n/g, "<br>")}</p>`;
    }).join("\n");

    // Format section dividers
    const sections = [
      "[EXECUTIVE SUMMARY]", 
      "[CEO & INDUSTRY NEWS ANALYSIS]", 
      "[KOREAN ETF RECOMMENDATIONS]", 
      "[HISTORICAL PRECEDENTS]", 
      "[STOCK IMPACT & PROJECTION]"
    ];

    sections.forEach(secName => {
        const cleanSecName = secName.replace(/[\[\]]/g, "");
        const replaceRegex = new RegExp(`(<p>)?${secName.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")}(<\/p>)?`, "g");
        html = html.replace(replaceRegex, `<div class="report-section-header">${cleanSecName}</div>`);
    });

    return html;
  };

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden">
      
      {/* Top Header */}
      <header className="bg-[#0B111E]/85 backdrop-blur-md border-b border-white/5 px-6 py-3 flex justify-between items-center z-50">
        <div className="flex items-center gap-3">
          <span className="bg-gradient-to-r from-[#00E5FF] to-[#8A2BE2] text-white font-extrabold text-[0.68rem] px-2.5 py-0.5 rounded tracking-wider font-mono">PRO</span>
          <h1 className="font-extrabold text-lg tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 font-mono">
            AI STOCK INTELLIGENCE
          </h1>
        </div>
        
        {/* API Key Form */}
        <div className="flex items-center gap-2">
          <div className="relative flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 text-slate-500 pointer-events-none">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <input 
              type="password" 
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setIsKeySaved(false);
              }}
              placeholder="Gemini API Key 입력"
              className="bg-white/5 border border-white/10 rounded-lg text-xs text-slate-100 pl-9 pr-3 py-2 w-[220px] focus:outline-none focus:border-[#00E5FF] focus:bg-white/10 transition-all duration-300"
            />
          </div>
          <button 
            onClick={saveApiKey}
            className={`text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer transition-all duration-300 ${
              isKeySaved 
                ? "bg-emerald-600/90 text-white" 
                : "bg-gradient-to-r from-[#00E5FF] to-[#8A2BE2] hover:opacity-90 active:scale-95 text-white"
            }`}
          >
            {isKeySaved ? "저장됨" : "저장"}
          </button>
          
          <a 
            href="https://aistudio.google.com/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-slate-400 hover:text-[#00E5FF] bg-white/5 p-2 rounded-full transition-all duration-300 hover:rotate-12"
            title="무료 API 키 발급받기"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 16v-4"/>
              <path d="M12 8h.01"/>
            </svg>
          </a>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-4 p-4 h-[calc(100%-88px)] overflow-hidden">
        
        {/* Left Panel: Inputs & AI Reports */}
        <section className="flex flex-col gap-4 overflow-hidden">
          
          {/* Inputs Card */}
          <div className="bg-[#121A2C]/65 backdrop-blur-md border border-white/5 rounded-2xl p-5 shadow-2xl flex-shrink-0">
            <h2 className="text-white font-bold text-[0.95rem] tracking-wide">종목 분석 (Stock Search)</h2>
            <p className="text-slate-400 text-xs mt-1">분석을 시작할 종목 코드(Ticker)를 입력하거나 선택하세요.</p>
            
            {/* Quick Chips */}
            <div className="flex flex-wrap gap-2 my-4">
              {popularStocks.map(stock => (
                <button
                  key={stock.ticker}
                  onClick={() => handleChipClick(stock)}
                  className={`text-xs font-semibold rounded-full px-3.5 py-1.5 cursor-pointer border transition-all duration-300 ${
                    currentTicker === stock.ticker
                      ? "bg-[#00E5FF]/10 border-[#00E5FF] text-[#00E5FF] shadow-[0_0_12px_rgba(0,229,255,0.15)]"
                      : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {stock.ticker === "TSLA" ? "🚗" : stock.ticker === "NVDA" ? "🧠" : stock.ticker === "AAPL" ? "🍎" : stock.ticker === "MSFT" ? "💻" : stock.ticker === "GOOGL" ? "🔍" : "📦"}{" "}
                  {stock.ticker} ({stock.name})
                </button>
              ))}
            </div>

            {/* Custom Ticker Search */}
            <form onSubmit={handleSearchSubmit} className="flex gap-2.5">
              <div className="relative flex items-center flex-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3.5 text-slate-500">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.3-4.3"/>
                </svg>
                <input 
                  type="text" 
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value)}
                  placeholder="예: AAPL, AMD, TSLA"
                  className="bg-white/3 border border-white/5 w-full rounded-xl text-sm text-slate-100 pl-10 pr-4 py-3 focus:outline-none focus:border-[#00E5FF] focus:bg-white/6 transition-all duration-300"
                  required
                />
              </div>
              
              <button 
                type="button" 
                onClick={startAnalysis}
                className="bg-gradient-to-r from-[#00E5FF] to-[#8A2BE2] hover:opacity-90 active:scale-98 text-white text-xs font-bold px-6 rounded-xl cursor-pointer shadow-[0_0_20px_rgba(0,229,255,0.15)] hover:shadow-[0_0_25px_rgba(0,229,255,0.25)] transition-all duration-300 flex items-center justify-center"
              >
                리포트 생성하기
              </button>
            </form>
          </div>

          {/* Report Viewer Card */}
          <div className="bg-[#121A2C]/65 backdrop-blur-md border border-white/5 rounded-2xl shadow-2xl flex-1 flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5 flex justify-between items-center">
              <h2 className="text-white font-bold text-[0.95rem] tracking-wide">실시간 AI 리포트</h2>
              <div className="flex gap-2">
                <span className="bg-white/5 text-white font-bold text-[0.75rem] px-2.5 py-1 rounded border border-white/5 tracking-wider">{currentTicker}</span>
                <span className={`text-[0.7rem] font-semibold px-2.5 py-1 rounded border ${
                  status === "idle" ? "bg-white/5 text-slate-400 border-white/5" :
                  status === "searching" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                  status === "analyzing" ? "bg-violet-500/10 text-violet-400 border-violet-500/20" :
                  status === "writing" ? "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20" :
                  status === "complete" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                  "bg-rose-500/10 text-rose-400 border-rose-500/20"
                }`}>
                  {status === "idle" ? "대기 중" :
                   status === "searching" ? "검색 중" :
                   status === "analyzing" ? "분석 중" :
                   status === "writing" ? "리포트 작성 중" :
                   status === "complete" ? "분석 완료" :
                   "에러 발생"}
                </span>
              </div>
            </div>

            {/* Content Viewport */}
            <div className="flex-1 overflow-y-auto p-5 relative">
              
              {/* Load Status Box */}
              {(status === "searching" || status === "analyzing" || status === "writing") && (
                <div className="h-full flex flex-col justify-center items-center py-10">
                  <div className="w-12 h-12 border-4 border-cyan-500/10 border-t-cyan-400 rounded-full loader-spinner-animate mb-6"></div>
                  <div className="flex flex-col gap-3 max-w-[380px] w-full text-slate-400 text-xs">
                    <div className={`flex gap-3 items-center transition-all ${status === "searching" ? "text-cyan-400 font-medium" : "text-emerald-500"}`}>
                      <span>{status === "searching" ? "●" : "✓"}</span>
                      <span>실시간 해외 주식 뉴스 및 CEO 동향 검색 중...</span>
                    </div>
                    <div className={`flex gap-3 items-center transition-all ${
                      status === "analyzing" ? "text-cyan-400 font-medium" :
                      status === "writing" || status === "complete" ? "text-emerald-500" : "text-slate-600"
                    }`}>
                      <span>{status === "analyzing" ? "●" : status === "searching" ? "○" : "✓"}</span>
                      <span>산업 동향 및 관련 ETF 조건 수집 중...</span>
                    </div>
                    <div className={`flex gap-3 items-center transition-all ${status === "writing" ? "text-cyan-400 font-medium" : "text-slate-600"}`}>
                      <span>{status === "writing" ? "●" : "○"}</span>
                      <span>종합 주가 평가 및 한국 상장 ETF 추천 보고서 작성 중...</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Default Placeholder */}
              {status === "idle" && (
                <div className="h-full flex flex-col justify-center items-center text-center text-slate-400 py-10 px-8">
                  <div className="text-4xl mb-4 opacity-50">📊</div>
                  <h3 className="text-white font-semibold text-sm mb-1.5">분석 대기 중</h3>
                  <p className="text-xs leading-relaxed max-w-[320px]">
                    종목 코드를 입력하고 **[리포트 생성하기]**를 눌러주세요.<br />
                    AI가 실시간 인터넷 검색을 통해 최신 업계 뉴스와 실질 총보수가 저렴한 국내 상장 ETF를 함께 추천합니다.
                  </p>
                </div>
              )}

              {/* Rendered HTML Report */}
              {(status === "complete" || status === "error") && reportHtml && (
                <div className="report-content" dangerouslySetInnerHTML={{ __html: reportHtml }} />
              )}

              {/* Citations Block */}
              {status === "complete" && citations.length > 0 && (
                <div className="mt-8 pt-6 border-t border-white/5">
                  <div className="report-section-header">실시간 구글 검색 소스 (Real-time Citations)</div>
                  <ul className="mt-3 space-y-2">
                    {citations.map((cite, index) => (
                      <li key={index} className="text-xs flex gap-2 items-baseline">
                        <span className="text-cyan-400 font-bold">🌐</span>
                        <div>
                          <a 
                            href={cite.uri} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="citation-link text-cyan-400 hover:underline font-medium"
                          >
                            {cite.title}
                          </a>
                          <span className="text-slate-500 text-[0.7rem] ml-1.5">({cite.domain})</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Right Panel: TradingView Live Chart */}
        <section className="flex flex-col overflow-hidden">
          <div className="bg-[#121A2C]/65 backdrop-blur-md border border-white/5 rounded-2xl shadow-2xl h-full flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5 flex justify-between items-center">
              <h2 className="text-white font-bold text-[0.95rem] tracking-wide">실시간 금융 차트 (TradingView)</h2>
              <span className="bg-rose-500/10 text-rose-400 text-[0.65rem] font-bold px-2.5 py-0.5 rounded-full border border-rose-500/20 pulse-animate tracking-wider">● LIVE</span>
            </div>
            
            {/* Chart Container */}
            <div className="flex-1 bg-[#131722] relative">
              <div id="tradingview-widget-container" className="w-full h-full"></div>
            </div>
          </div>
        </section>

      </main>

      {/* Footer Disclaimer */}
      <footer className="bg-[#0B111E]/85 border-t border-white/5 py-2 px-6 text-center text-[0.68rem] text-slate-500">
        <p className="max-w-[1200px] mx-auto leading-relaxed">
          <strong>⚠️ 투자 면책 고지:</strong> 본 분석 서비스에서 제공하는 리포트, 추천 ETF 데이터 및 매매 의견은 AI가 실시간 구글 검색 데이터를 기반으로 자체 취합하고 해석한 정보입니다. 이는 어떠한 경우에도 투자 권유나 법적 책임을 지는 조언이 되지 않으며, 모든 투자의 결정과 최종 책임은 투자자 본인에게 있습니다.
        </p>
      </footer>
    </div>
  );
}
