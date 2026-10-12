import type { Metadata, Viewport } from "next";
import "./globals.css";
import MobileBottomNav from "@/components/MobileBottomNav";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#4f46e5",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://tunneling-service.onrender.com/t/mcp-server-fxkud1/p/Auto-Marketing"),
  title: "Auto-Marketing (오토마케팅) - 소상공인을 위한 1-Click AI 마케팅 OS",
  description: "사진 1장과 한 줄 설명으로 광고 영상, 인스타 카드뉴스, 네이버 블로그, 쇼핑몰 상세페이지, 인쇄물까지! AI 코딩으로 자동 생성하고 말 한마디로 핀셋 수정하세요.",
  keywords: [
    "마케팅 자동화",
    "소상공인 마케팅",
    "AI 광고 영상",
    "인스타 카드뉴스",
    "스마트스토어 상세페이지",
    "네이버 블로그 자동화",
    "퐁신제빵소",
    "오토마케팅",
  ],
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "https://tunneling-service.onrender.com/t/mcp-server-fxkud1/p/Auto-Marketing",
    siteName: "Auto-Marketing (오토마케팅)",
    title: "Auto-Marketing (오토마케팅) - 소상공인을 위한 1-Click AI 마케팅 OS",
    description: "사진 1장으로 완성되는 마케팅 혁신! 광고 영상, 카드뉴스, 상세페이지를 AI 코딩으로 자유롭게 수정하세요.",
    images: [
      {
        url: "https://ldb-phinf.pstatic.net/20250613_51/1749793026669I569w_JPEG/%C6%FE%BD%C5%BD%C9%BA%BC1.jpg",
        width: 1200,
        height: 630,
        alt: "오토마케팅 대표 이미지",
        type: "image/jpeg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Auto-Marketing (오토마케팅) - 소상공인을 위한 1-Click AI 마케팅 OS",
    description: "사진 1장으로 완성되는 마케팅 혁신! 광고 영상, 카드뉴스, 상세페이지를 AI 코딩으로 자유롭게 수정하세요.",
    images: ["https://ldb-phinf.pstatic.net/20250613_51/1749793026669I569w_JPEG/%C6%FE%BD%C5%BD%C9%BA%BC1.jpg"],
  },
  icons: {
    icon: "/favicon.ico",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Auto-Marketing",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="bg-slate-50 text-slate-900 min-h-screen flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white pb-16 sm:pb-0">
        {children}
        <MobileBottomNav />
      </body>
    </html>
  );
}
