'use client';

import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  Video,
  Film,
  Image as ImageIcon,
  FileText,
  ShoppingBag,
  Printer,
  Compass,
  Calendar,
  Wallet,
  Store,
  MapPin,
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  RefreshCw,
  PlusCircle,
  HelpCircle,
  ArrowRight,
  Zap,
  Menu,
  X,
} from 'lucide-react';
import Footer from '@/components/Footer';
import DirectDepositModal from '@/components/DirectDepositModal';

interface BundleData {
  user: any;
  business: any;
  products: any[];
  assets: any[];
  campaigns: any[];
  references: any[];
  faqs: any[];
  footer?: any;
}

export default function DashboardPage() {
  const [data, setData] = useState<BundleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [referenceUrl, setReferenceUrl] = useState('');
  const [showAppModal, setShowAppModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 🚀 1-Click 마케팅 풀 패키지 번들 생성 상태
  const [selectedBundleProdId, setSelectedBundleProdId] = useState<string>('');
  const [generatingBundle, setGeneratingBundle] = useState(false);
  const [bundleResult, setBundleResult] = useState<any | null>(null);

  const handleGenerateBundle = async () => {
    const targetProdId = selectedBundleProdId || data?.products?.[0]?.id;
    setGeneratingBundle(true);
    setBundleResult(null);
    try {
      const res = await fetch('/api/bundle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: targetProdId,
          businessId: data?.business?.id,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setBundleResult(json);
        fetchBootstrap(); // 보관함 에셋 개수 등 동기화
      } else {
        alert(`번들 생성 실패: ${json.error}`);
      }
    } catch {
      alert('번들 생성 중 오류가 발생했습니다.');
    } finally {
      setGeneratingBundle(false);
    }
  };

  // ⚡ 통합번들 부트스트랩 데이터 1회 초고속 로드
  const fetchBootstrap = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/bootstrap');
      const json = await res.json();
      if (json.success) {
        setData(json.bundle);
      }
    } catch (err) {
      console.error('Bootstrap fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBootstrap();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* 1. 상단 글로벌 네비게이션 헤더 */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-amber-400 flex items-center justify-center shadow-md shadow-indigo-100 shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-indigo-700 to-indigo-900 bg-clip-text text-transparent">
                Auto-Marketing
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                AI 마케팅 OS v1.0
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* 토큰 지갑 잔액 & 충전 버튼 */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-amber-50 border border-amber-200/70 text-amber-900 shadow-xs">
                <Wallet className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="hidden xs:inline text-[11px] sm:text-xs font-medium text-amber-700">체험 토큰</span>
                <span className="text-xs font-bold text-amber-950 font-mono">
                  {data?.user?.token_balance?.toLocaleString() || '50,000'} T
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowDepositModal(true)}
                className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:scale-95 text-white text-[11px] sm:text-xs font-bold shadow-xs hover:shadow transition-all flex items-center gap-1 cursor-pointer shrink-0"
                title="무통장 입금으로 토큰 즉시 충전 (Agent M 자동 감지)"
              >
                <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>충전</span>
              </button>
            </div>

            {/* 사용자 프로필 (중형 화면 이상) */}
            <div className="hidden md:flex items-center gap-2 pl-2 border-l border-slate-200">
              <img
                src={data?.user?.avatar_url || 'https://ldb-phinf.pstatic.net/20250613_51/1749793026669I569w_JPEG/%C6%FE%BD%C5%BD%C9%BA%BC1.jpg'}
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-200"
              />
              <span className="text-xs font-semibold text-slate-800">
                {data?.user?.name || '퐁신제빵소 사장님'}
              </span>
            </div>

            {/* 데스크톱 전용 네비게이션 메뉴 (대형 화면) */}
            <div className="hidden xl:flex items-center gap-1.5 pl-2 border-l border-slate-200">
              <a
                href="/library"
                className="px-2.5 py-1 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition border border-indigo-200 flex items-center gap-1"
              >
                <span>📦 에셋 보관함</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-600 text-white font-mono">
                  {data?.assets?.length || 0}
                </span>
              </a>
              <button
                type="button"
                onClick={() => setShowAppModal(true)}
                className="px-2.5 py-1 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition border border-emerald-200 flex items-center gap-1 cursor-pointer"
              >
                <span>📱 안드로이드 앱</span>
              </button>
              <a
                href="/calendar"
                className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
              >
                📅 오토 캘린더
              </a>
              <a
                href="/onboarding"
                className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
              >
                비즈니스 등록
              </a>
              <a
                href="/login"
                className="px-2.5 py-1 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition shadow-xs"
              >
                로그인
              </a>
              <a
                href="/admin"
                className="px-2.5 py-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition border border-rose-200"
              >
                🛡️ 관리자
              </a>
            </div>

            {/* 모바일 햄버거 토글 버튼 (xl 미만 화면) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-1.5 sm:p-2 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="메뉴 열기"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-slate-800" /> : <Menu className="w-5 h-5 text-slate-800" />}
            </button>
          </div>
        </div>

        {/* 모바일 슬라이드다운 메뉴 (xl 미만) */}
        {mobileMenuOpen && (
          <div className="xl:hidden mt-3 pt-3 border-t border-slate-100 max-w-7xl mx-auto animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-3 p-2 mb-2 rounded-xl bg-slate-50 border border-slate-100">
              <img
                src={data?.user?.avatar_url || 'https://ldb-phinf.pstatic.net/20250613_51/1749793026669I569w_JPEG/%C6%FE%BD%C5%BD%C9%BA%BC1.jpg'}
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-200"
              />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-900">{data?.user?.name || '퐁신제빵소 사장님'}</span>
                <span className="text-[11px] text-slate-500">{data?.business?.name || '퐁신제빵소'} 대표</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <a
                href="/library"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-100 text-indigo-900 font-bold flex items-center justify-between"
              >
                <span>📦 에셋 보관함</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-600 text-white font-mono">
                  {data?.assets?.length || 0}
                </span>
              </a>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowAppModal(true);
                }}
                className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100 text-emerald-900 font-bold flex items-center gap-1.5 text-left cursor-pointer"
              >
                <span>📱 안드로이드 앱</span>
              </button>
              <a
                href="/calendar"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-800 font-semibold flex items-center gap-1.5"
              >
                <span>📅 마케팅 캘린더</span>
              </a>
              <a
                href="/references"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-800 font-semibold flex items-center gap-1.5"
              >
                <span>🧭 레퍼런스 인텔리전스</span>
              </a>
              <a
                href="/onboarding"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-800 font-semibold flex items-center gap-1.5"
              >
                <span>🏢 비즈니스 등록</span>
              </a>
              <a
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-xl bg-rose-50/70 border border-rose-200 text-rose-800 font-bold flex items-center gap-1.5"
              >
                <span>🛡️ 슈퍼 관리자</span>
              </a>
            </div>
          </div>
        )}
      </header>

      {/* 메인 콘텐츠 영역 */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 lg:px-8 py-6 space-y-6">
        {/* 2. 소상공인 프로필 요약 카드 (퐁신제빵소) */}
        <section className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs overflow-hidden relative">
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-amber-100/40 via-indigo-50/20 to-transparent pointer-events-none rounded-full blur-2xl" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
            <div className="flex items-start gap-4">
              <img
                src="https://ldb-phinf.pstatic.net/20250613_51/1749793026669I569w_JPEG/%C6%FE%BD%C5%BD%C9%BA%BC1.jpg"
                alt="퐁신제빵소"
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-1 ring-slate-200 shadow-sm shrink-0"
              />
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {data?.business?.name || '퐁신제빵소'}
                  </h1>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    🟢 실전 테스트 가동 중
                  </span>
                  <span className="text-xs font-medium text-slate-500">
                    {data?.business?.category || '베이커리 / 수제 디저트'}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 max-w-2xl">
                  {data?.business?.usp ||
                    '입안 가득 구름처럼 사르르 녹아내리는 부드러움, 매일 아침 당일 구워내는 신선한 수제 대만 카스테라'}
                </p>

                <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap pt-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {data?.business?.road_address || '경기 시흥시 서울대학로 59-69 1층 (배곧테크노밸리)'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {data?.business?.business_hours || '10:00 - 21:00 (라스트오더 20:30)'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
              <a
                href={data?.business?.naver_place_url || 'https://naver.me/FJIPv54p'}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition"
              >
                <span>네이버 플레이스</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <span className="text-xs text-slate-400">등록 상품 {data?.products?.length || 3}개</span>
            </div>
          </div>

          {/* 등록된 대표 상품 칩 */}
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-slate-400 font-medium shrink-0">시그니처:</span>
            {data?.products?.map((p: any) => (
              <span
                key={p.id}
                className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium whitespace-nowrap"
              >
                🍰 {p.name} ({p.price?.toLocaleString()}원)
              </span>
            ))}
          </div>
        </section>

        {/* 2-1. 🚀 1-Click 마케팅 풀 패키지 일괄 생성 배너 */}
        <section className="bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-xl shadow-indigo-950/20 border border-indigo-500/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-radial from-amber-400/20 via-pink-500/10 to-transparent pointer-events-none rounded-full blur-3xl" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/30 text-amber-300 text-xs font-bold border border-indigo-400/30">
                <Sparkles className="w-3.5 h-3.5" />
                <span>사장님 전용 원터치 풀 패키지 AI 오토 드라이브</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-snug">
                신메뉴 마케팅 준비 끝! 7대 온·오프라인 채널 에셋을 1-Click으로 완성하세요
              </h2>
              <p className="text-xs sm:text-sm text-indigo-200/90 leading-relaxed">
                상품만 고르면 <strong className="text-amber-300">① 860px 상세페이지</strong>, <strong className="text-pink-300">② 15초 숏폼 릴스</strong>, <strong className="text-emerald-300">③ A4 오픈 전단지</strong>, <strong className="text-purple-300">④ 인스타 6컷 카드뉴스</strong>, <strong className="text-cyan-300">⑤ 네이버 블로그 원고</strong>, <strong className="text-orange-300">⑥ 🥕 당근마켓 소식</strong>, <strong className="text-emerald-400">⑦ 🌿 스마트플레이스 쿠폰</strong>까지 AI가 동시에 일괄 제작하여 보관함에 자동 적재합니다.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              {/* 상품 선택기 */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-1.5 border border-white/15">
                <select
                  value={selectedBundleProdId || data?.products?.[0]?.id || ''}
                  onChange={(e) => setSelectedBundleProdId(e.target.value)}
                  disabled={generatingBundle}
                  className="bg-transparent text-white text-xs font-bold px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 w-full sm:w-auto"
                >
                  {data?.products?.map((p: any) => (
                    <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                      🍰 {p.name} ({p.price?.toLocaleString()}원)
                    </option>
                  ))}
                </select>
              </div>

              {/* 번들 생성 실행 버튼 */}
              <button
                type="button"
                disabled={generatingBundle}
                onClick={handleGenerateBundle}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 shrink-0"
              >
                {generatingBundle ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                    <span>7대 에셋 동시 생성 중...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-slate-950" />
                    <span>⚡ 7대 에셋 1-Click 일괄 생성</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 생성 완료 피드백 알림 배너 */}
          {bundleResult && (
            <div className="mt-5 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fadeIn">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs sm:text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{bundleResult.message}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {bundleResult.assets?.map((a: any) => (
                    <span
                      key={a.id}
                      className="px-2 py-0.5 rounded-md bg-white/15 text-[11px] font-mono text-indigo-100"
                    >
                      ✓ {a.title}
                    </span>
                  ))}
                </div>
              </div>

              <a
                href="/library"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-white text-indigo-900 font-black text-xs hover:bg-indigo-50 transition shadow-md shrink-0"
              >
                <span>📦 보관함에서 바로 열람 & 다운로드</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </section>

        {/* 3. 6대 마케팅 엔진 퀵 런처 그리드 */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>AI 마케팅 제작 엔진 (Code-as-Asset)</span>
            </h2>
            <span className="text-xs text-slate-500">대화형 핀셋 수정 지원</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* 1. Code-as-Video */}
            <a
              href="/studio/video"
              className="flex flex-col items-start p-4 rounded-xl bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-md transition text-left group"
            >
              <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2.5 group-hover:scale-110 transition">
                <Video className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-900">숏폼 광고 영상</span>
              <span className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">사진 1장 ➔ Remotion</span>
            </a>

            {/* 2. 촬영 영상 AI 편집 */}
            <a
              href="/studio/video"
              className="flex flex-col items-start p-4 rounded-xl bg-white border border-slate-200 hover:border-rose-400 hover:shadow-md transition text-left group"
            >
              <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center mb-2.5 group-hover:scale-110 transition">
                <Film className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-900">촬영 영상 컷편집</span>
              <span className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">무음절단 + 자막/더빙</span>
            </a>

            {/* 3. Code-as-Image */}
            <a
              href="/studio/social"
              className="flex flex-col items-start p-4 rounded-xl bg-white border border-slate-200 hover:border-amber-400 hover:shadow-md transition text-left group"
            >
              <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-2.5 group-hover:scale-110 transition">
                <ImageIcon className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-900">카드뉴스 / 썸네일</span>
              <span className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">1:1 & 16:9 한글 벡터</span>
            </a>

            {/* 4. Code-as-Post */}
            <a
              href="/studio/social"
              className="flex flex-col items-start p-4 rounded-xl bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-md transition text-left group"
            >
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2.5 group-hover:scale-110 transition">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-900">블로그 / SNS 글</span>
              <span className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">SEO 롱폼 + 에셋 배치</span>
            </a>

            {/* 5. Code-as-DetailPage */}
            <a
              href="/studio/detail"
              className="flex flex-col items-start p-4 rounded-xl bg-white border border-slate-200 hover:border-purple-400 hover:shadow-md transition text-left group"
            >
              <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-2.5 group-hover:scale-110 transition">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-900">상품 상세페이지</span>
              <span className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">스마트스토어 860px</span>
            </a>

            {/* 6. Code-as-Print */}
            <a
              href="/studio/print"
              className="flex flex-col items-start p-4 rounded-xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition text-left group"
            >
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-2.5 group-hover:scale-110 transition">
                <Printer className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-900">명함 / 전단지 / 배너</span>
              <span className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">300 DPI 인쇄소 직통</span>
            </a>
          </div>

          {/* 에셋 보관함 바로가기 퀵 배너 */}
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl p-4 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm border border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/30">
                <Sparkles className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xs text-white">마케팅 에셋 보관함</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-600/80 text-indigo-200 font-mono">
                    {data?.assets?.length || 0}개 영구 보관 중
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  스튜디오에서 저장한 860px 상세페이지, 15초 숏폼 씬, 300 DPI 인쇄 파일이 클라우드에 안전하게 보관되어 있습니다.
                </p>
              </div>
            </div>

            <a
              href="/library"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm shrink-0"
            >
              <span>에셋 갤러리 열기</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </section>

        {/* 4. 💡 벤치마크 레퍼런스 인텔리전스 섹션 */}
        <section className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
                💡
              </div>
              <h2 className="text-sm font-bold text-slate-900">벤치마크 레퍼런스 인텔리전스</h2>
            </div>
            <a href="/references" className="text-xs text-indigo-600 font-semibold hover:underline">
              AI 인기 콘텐츠 더보기 ➔
            </a>
          </div>

          {/* 링크 직접 추가 바 */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="참고하고 싶은 인스타그램 피드, 유튜브 쇼츠, 블로그 링크(URL)를 입력하세요"
              value={referenceUrl}
              onChange={(e) => setReferenceUrl(e.target.value)}
              className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50"
            />
            <a
              href={`/references?url=${encodeURIComponent(referenceUrl)}`}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition shadow-xs shrink-0 flex items-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>레퍼런스 분석</span>
            </a>
          </div>

          {/* AI 추천 베이커리 1위 레퍼런스 카드 3선 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:border-indigo-300 transition text-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="font-semibold text-rose-600">📸 인스타 릴스 (조회수 120만)</span>
                <span>카스테라 쪼개기</span>
              </div>
              <p className="font-bold text-slate-800 line-clamp-1">"자르자마자 튀어나오는 크림 폭탄 씬"</p>
              <div className="text-[11px] text-slate-500 line-clamp-2">
                후킹: "이게 진짜 카스테라라고?" ➔ 1.2초 빠른 컷 ➔ 가라오케 자막 ➔ 당일 한정 특가 안내.
              </div>
              <a
                href="/studio/video"
                className="block text-center w-full py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-indigo-50 hover:text-indigo-700 font-semibold transition text-slate-700 text-[11px]"
              >
                이 DNA로 숏폼 영상 생성 ➔
              </a>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:border-indigo-300 transition text-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="font-semibold text-purple-600">🛍️ 스마트스토어 1위</span>
                <span>선물세트 상세페이지</span>
              </div>
              <p className="font-bold text-slate-800 line-clamp-1">"아침에 구워 당일 출발! 퐁신 보증제"</p>
              <div className="text-[11px] text-slate-500 line-clamp-2">
                860px 표준 규격 ➔ 무항생제 계란 42% 함유 증명 ➔ 안심 에어팩 포장 ➔ 리뷰 4.9점.
              </div>
              <a
                href="/studio/detail"
                className="block text-center w-full py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-indigo-50 hover:text-indigo-700 font-semibold transition text-slate-700 text-[11px]"
              >
                이 구조로 상세페이지 생성 ➔
              </a>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:border-indigo-300 transition text-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="font-semibold text-emerald-600">🏷️ 오픈 전단지 & X배너</span>
                <span>선착순 1,000원 쿠폰</span>
              </div>
              <p className="font-bold text-slate-800 line-clamp-1">"입간판 보고 들어온 손님 40% 증가"</p>
              <div className="text-[11px] text-slate-500 line-clamp-2">
                300 DPI 규격 ➔ 갓 구운 시간표 노출 ➔ 절취선 1,000원 할인 쿠폰 ➔ 네이버 플레이스 QR.
              </div>
              <a
                href="/studio/print"
                className="block text-center w-full py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-indigo-50 hover:text-indigo-700 font-semibold transition text-slate-700 text-[11px]"
              >
                이 규격으로 전단지/배너 생성 ➔
              </a>
            </div>
          </div>
        </section>

        {/* 5. 자주 묻는 질문 FAQ (동적 아코디언) */}
        <section className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">자주 묻는 질문 (FAQ)</h2>
          </div>

          <div className="divide-y divide-slate-100">
            {data?.faqs?.map((faq: any, idx: number) => (
              <div key={faq.id} className="py-2.5">
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between text-left text-xs font-semibold text-slate-800 hover:text-indigo-600 transition"
                >
                  <span className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] text-slate-600">
                      {faq.category}
                    </span>
                    <span>{faq.question}</span>
                  </span>
                  {openFaq === idx ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </button>
                {openFaq === idx && (
                  <p className="mt-2 text-xs text-slate-600 leading-relaxed pl-2 border-l-2 border-indigo-400 bg-indigo-50/30 p-2 rounded-r-lg">
                    {faq.answer}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* 푸터 (사업자 정보 & 법무 약관 연동 - 모바일 하단 내비게이션 바와 여백 확보) */}
      <div className="pb-16 sm:pb-0">
        <Footer initialConfig={data?.footer} />
      </div>

      {/* 📱 안드로이드 앱 설치 및 APK 안내 모달 */}
      {showAppModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">📱</span>
                <h3 className="font-extrabold text-base text-slate-900">
                  안드로이드 앱 설치 및 실행 방법
                </h3>
              </div>
              <button
                onClick={() => setShowAppModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-600">
              {/* 방법 1 */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/80 border border-indigo-200/80 space-y-1.5">
                <span className="font-extrabold text-indigo-900 flex items-center gap-1.5 text-xs">
                  <span className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">1</span>
                  모바일 브라우저에서 1초 설치 (추천)
                </span>
                <p className="text-indigo-800/90 leading-relaxed text-[11px]">
                  스마트폰 크롬/삼성 인터넷에서 접속 후, 우측 상단 메뉴(⋮) ➔ <strong>[홈 화면에 앱 추가]</strong>를 누르시면 앱 서랍에 네이티브 앱으로 즉시 설치됩니다.
                </p>
              </div>

              {/* 방법 2 */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 space-y-1.5">
                <span className="font-extrabold text-emerald-900 flex items-center gap-1.5 text-xs">
                  <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">2</span>
                  네이티브 Android APK 빌드 완료
                </span>
                <p className="text-emerald-800/90 leading-relaxed text-[11px]">
                  Capacitor Android 프로젝트(`android/`)와 매니페스트 설정이 완비되어 있습니다. Android Studio에서 열기(<code className="bg-emerald-100 px-1 py-0.5 rounded font-mono">npx cap open android</code>)를 통해 즉시 <code className="bg-emerald-100 px-1 py-0.5 rounded font-mono">.apk</code> 파일로 추출할 수 있습니다.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowAppModal(false)}
                className="w-full py-3 rounded-2xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition shadow-md"
              >
                확인했습니다
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. 다이렉트 무통장 입금 감지 토큰 충전 모달 (Agent M) */}
      <DirectDepositModal
        isOpen={showDepositModal}
        userEmail={data?.user?.email || 'guest@automarketing.com'}
        userName={data?.user?.name || '퐁신제빵소 사장님'}
        initialBalance={data?.user?.token_balance || 50000}
        onClose={() => setShowDepositModal(false)}
        onSuccess={() => {
          fetchBootstrap();
        }}
      />
    </div>
  );
}
