import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "AI Stock Intelligence - 미국 주식 분석 및 국내 ETF 추천 대시보드",
  description: "실시간 구글 검색과 Gemini AI를 활용하여 미국 주식 분석 리포트, 관련 국내 상장 ETF 추천 정보 및 실시간 차트를 보여주는 대시보드입니다.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#090D16] text-[#F3F4F6] flex flex-col">{children}</body>
    </html>
  );
}
