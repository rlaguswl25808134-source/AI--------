# AI Stock Intelligence Dashboard (Next.js & Tailwind CSS)

This plan outlines the design of a stock intelligence dashboard using **Next.js (App Router)** and **Tailwind CSS**. It uses Gemini API's Google Search Grounding to fetch live financial news, analyze industry trends/CEO moves, and presents the output alongside live TradingView charts. The application will be ready for zero-cost deployment on **Vercel**.

## Technical Strategy
1. **Next.js Client-Side State**: State management for active stock symbols (Ticker), API Key input, search queues, loading progress indicators, and generated markdown reports.
2. **Tailwind CSS Styling**: Gorgeous glassmorphic theme elements, animated loading steps, and responsive grids.
3. **TradingView Script Loading**: Dynamic inclusion of TradingView script using Next.js `next/script` to load `https://s3.tradingview.com/tv.js` and initialize widgets reactively.
4. **Vercel Ready**: Clean Next.js architecture ready to import into Vercel for single-click hosting.

## Proposed Changes

We will modify files inside the Next.js `app` folder:

### [MODIFY] [layout.js](file:///c:/Users/kim25/Desktop/영어/app/layout.js)
- Update language to Korean (`lang="ko"`).
- Customize SEO title, meta descriptions, and icons suitable for the Stock Intelligence Platform.

### [MODIFY] [globals.css](file:///c:/Users/kim25/Desktop/영어/app/globals.css)
- Implement global styles for scrollbars, markdown elements (headers, lists, blockquotes, custom reports), and dark theme colors using Tailwind/PostCSS directives.

### [MODIFY] [page.js](file:///c:/Users/kim25/Desktop/영어/app/page.js)
- Build the core interactive Dashboard Component (`"use client"`).
- Logic:
  - Form validation and dynamic local storage keys (`localStorage`).
  - Async Gemini API requests carrying prompt structure and `googleSearch: {}` tool specification.
  - Step-by-step indicator tracking the API progress.
  - Dynamic `useEffect` hook to initialize and reload the `new window.TradingView.widget` whenever a stock symbol changes.
  - Custom markdown parse and citation lists generator.
  - Recommended KRX-listed ETFs containing this stock, prioritized by total fee rate (TER + other expenses + trade commissions) and weight with inception dates and URLs.
- Layout: Responsive desktop split-pane (Report Panel vs Chart Panel) with premium styling.

---

## Verification & Deployment Plan

### Local Verification
1. Run the local development server:
   ```bash
   npm run dev
   ```
2. Open `http://localhost:3000` in Google Chrome or Edge.
3. Test saving a Gemini API Key, entering tickers like `TSLA` or `NVDA`, and verifying that the live report and TradingView chart load correctly.

### Vercel Deployment
To deploy this project to Vercel for free:
1. Initialize Git in the project root:
   ```bash
   git init
   git add .
   git commit -m "Initialize stock dashboard"
   ```
2. Push the code to a public or private GitHub/GitLab/Bitbucket repository.
3. Log in to [Vercel](https://vercel.com/) and click **Add New Project**.
4. Import the Git repository.
5. **Configure Environment Variables**:
   - Under the Vercel project settings (during setup, or under **Settings -> Environment Variables** after initial deploy):
   - Add the following environment variable:
     - **Key**: `NEXT_PUBLIC_GEMINI_API_KEY`
     - **Value**: [Your Free Gemini API Key]
     - Click **Add**.
6. Click **Deploy**. Vercel will automatically build and publish the Next.js application with your fallback key configured.
7. *(Note)* If you update this key in Vercel settings later, you must trigger a **Redeploy** from the Vercel deployments tab for the static compilation to pull the updated variable.
