'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  Camera,
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Send,
  Eye,
  Share2,
  Bookmark,
  Heart,
  MessageCircle,
  Save,
  Package,
} from 'lucide-react';
import Footer from '@/components/Footer';

export default function SocialStudioPage() {
  const [activeTab, setActiveTab] = useState<'blog' | 'card' | 'karrot' | 'place'>('blog');
  const [loading, setLoading] = useState(false);
  const [tweaking, setTweaking] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [savingAsset, setSavingAsset] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // 블로그 상태
  const [blogContent, setBlogContent] = useState('');

  // 인스타 카드뉴스 상태
  const [cardData, setCardData] = useState<any>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  // 🥕 당근마켓 비즈프로필 소식 상태
  const [karrotContent, setKarrotContent] = useState('');
  const [karrotTemplate, setKarrotTemplate] = useState<'fresh' | 'coupon' | 'rainy'>('fresh');

  // 🌿 네이버 스마트플레이스 새소식 상태
  const [placeContent, setPlaceContent] = useState('');
  const [placeTemplate, setPlaceTemplate] = useState<'coupon' | 'notice' | 'time_sale'>('coupon');

  // DB 연동 상태
  const [business, setBusiness] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // 1. DB 데이터 로드
  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/bootstrap');
        const json = await res.json();
        if (json.success && json.bundle) {
          const biz = json.bundle.business;
          const prods = json.bundle.products || [];
          setBusiness(biz);
          setProducts(prods);
          const initialProd = prods.length > 0 ? prods[0] : null;
          setSelectedProduct(initialProd);
          handleGenerateAll(biz, initialProd);
        }
      } catch (err) {
        console.error('Social studio bootstrap error:', err);
      }
    }
    loadData();
  }, []);

  // 전체 콘텐츠 일괄 생성
  const handleGenerateAll = async (biz = business, prod = selectedProduct) => {
    handleGenerateBlog(biz, prod);
    handleGenerateCards(biz, prod);
    handleGenerateKarrot(biz, prod, karrotTemplate);
    handleGeneratePlace(biz, prod, placeTemplate);
  };

  // 🌿 네이버 스마트플레이스 새소식 생성
  const handleGeneratePlace = async (biz = business, prod = selectedProduct, tmpl = placeTemplate) => {
    setLoading(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'naver_place',
          template: tmpl,
          business: {
            name: biz?.name || '퐁신제빵소',
            category: biz?.category || '베이커리/디저트',
            address: biz?.road_address || biz?.address || '경기 시흥시 배곧테크노밸리 1층',
            usp: biz?.usp,
          },
          product: {
            name: prod?.name || '퐁신 오리지널 대만 카스테라',
            price: prod?.price || 11000,
            description: prod?.description || '',
          },
        }),
      });
      const data = await res.json();
      if (data.success && data.content) {
        setPlaceContent(data.content);
      }
    } catch (err) {
      console.error('Generate naver place error:', err);
    } finally {
      setLoading(false);
    }
  };

  // 🥕 당근마켓 비즈프로필 소식글 생성
  const handleGenerateKarrot = async (biz = business, prod = selectedProduct, tmpl = karrotTemplate) => {
    setLoading(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'karrot',
          template: tmpl,
          business: {
            name: biz?.name || '퐁신제빵소',
            category: biz?.category || '베이커리/디저트',
            address: biz?.road_address || biz?.address || '경기 시흥시 배곧테크노밸리 1층',
            usp: biz?.usp,
          },
          product: {
            name: prod?.name || '퐁신 오리지널 대만 카스테라',
            price: prod?.price || 11000,
            description: prod?.description || '',
          },
        }),
      });
      const data = await res.json();
      if (data.success && data.content) {
        setKarrotContent(data.content);
      }
    } catch (err) {
      console.error('Generate karrot error:', err);
    } finally {
      setLoading(false);
    }
  };

  // 블로그 생성
  const handleGenerateBlog = async (biz = business, prod = selectedProduct) => {
    setLoading(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'blog',
          business: {
            name: biz?.name || '퐁신제빵소',
            category: biz?.category || '베이커리/디저트',
            address: biz?.road_address || biz?.address || '경기 시흥시 배곧테크노밸리',
            usp: biz?.usp,
          },
          product: {
            name: prod?.name || '퐁신 오리지널 대만 카스테라',
            price: prod?.price || 11000,
            description: prod?.description || '',
          },
        }),
      });
      const data = await res.json();
      if (data.success && data.content) {
        setBlogContent(data.content);
      }
    } catch (err) {
      console.error('Generate blog error:', err);
    } finally {
      setLoading(false);
    }
  };

  // 인스타 카드뉴스 생성
  const handleGenerateCards = async (biz = business, prod = selectedProduct) => {
    setLoading(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'card',
          business: {
            name: biz?.name || '퐁신제빵소',
            category: biz?.category || '베이커리/디저트',
            address: biz?.road_address || biz?.address,
            usp: biz?.usp,
          },
          product: {
            name: prod?.name || '퐁신 오리지널 대만 카스테라',
            price: prod?.price || 11000,
            description: prod?.description || '',
          },
        }),
      });
      const data = await res.json();
      if (data.success && data.cards) {
        setCardData(data.cards);
        setCurrentSlide(0);
      }
    } catch (err) {
      console.error('Generate cards error:', err);
    } finally {
      setLoading(false);
    }
  };

  // 상품 선택 변경 핸들러
  const handleProductChange = (prodId: string) => {
    const found = products.find((p) => p.id === prodId) || null;
    setSelectedProduct(found);
    handleGenerateAll(business, found);
  };

  // 대화형 핀셋 수정 (AI Tweak)
  const handleTweak = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setTweaking(true);
    try {
      const isBlog = activeTab === 'blog';
      const isKarrot = activeTab === 'karrot';
      const isPlace = activeTab === 'place';
      const existing = isPlace ? placeContent : isKarrot ? karrotContent : isBlog ? blogContent : JSON.stringify(cardData);
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'tweak',
          existingCode: existing,
          chatMessage: chatInput,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (isPlace) {
          setPlaceContent(data.code);
        } else if (isKarrot) {
          setKarrotContent(data.code);
        } else if (isBlog) {
          setBlogContent(data.code);
        } else {
          try {
            setCardData(JSON.parse(data.code));
          } catch {
            alert('카드뉴스가 수정되었습니다.');
          }
        }
        setChatInput('');
      }
    } catch (err) {
      console.error('Tweak error:', err);
    } finally {
      setTweaking(false);
    }
  };

  // 에셋 보관함 저장 (auto_assets 연동)
  const handleSaveToAssets = async () => {
    const isBlog = activeTab === 'blog';
    const isKarrot = activeTab === 'karrot';
    const isPlace = activeTab === 'place';
    const content = isPlace ? placeContent : isKarrot ? karrotContent : isBlog ? blogContent : JSON.stringify(cardData, null, 2);
    if (!content) return;
    setSavingAsset(true);
    try {
      const type = isPlace ? 'naver_place' : isKarrot ? 'karrot' : isBlog ? 'blog' : 'card';
      const title = isPlace
        ? `[네이버 플레이스] ${business?.name || '퐁신제빵소'} - ${selectedProduct?.name || '카스테라'} 새소식/쿠폰`
        : isKarrot
        ? `[당근마켓] ${business?.name || '퐁신제빵소'} - ${selectedProduct?.name || '카스테라'} 소식글`
        : isBlog
        ? `[블로그] ${business?.name || '퐁신제빵소'} - ${selectedProduct?.name || '카스테라'} 스마트블록 SEO`
        : `[카드뉴스] ${business?.name || '퐁신제빵소'} - ${selectedProduct?.name || '카스테라'} 인스타 6컷`;

      const res = await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: business?.id || 'biz_pongshin_baegot',
          type,
          title,
          spec: isPlace
            ? '네이버 지도 스마트플레이스 새소식 및 쿠폰 규격'
            : isKarrot
            ? '당근마켓 비즈프로필 & 동네생활 피드 소식 규격'
            : isBlog
            ? '네이버 스마트에디터 ONE 서식 호환'
            : '1:1 정방형 6컷 캐러셀 피드',
          component_code: content,
          preview_url: selectedProduct?.image_url || 'https://ldb-phinf.pstatic.net/20250613_51/1749793026669I569w_JPEG/%C6%FE%BD%C5%BD%C9%BA%BC1.jpg',
          status: 'ready',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Save asset error:', err);
    } finally {
      setSavingAsset(false);
    }
  };

  const handleCopyContent = () => {
    const text = activeTab === 'place' ? placeContent : activeTab === 'karrot' ? karrotContent : activeTab === 'blog' ? blogContent : JSON.stringify(cardData, null, 2);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const slides = cardData?.slides || [];
  const currentCard = slides[currentSlide];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* 상단 툴바 */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 text-indigo-600 font-bold text-xs hover:text-indigo-800 transition">
              <ArrowLeft className="w-4 h-4" />
              <span>대시보드</span>
            </Link>
            <Link href="/library" className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-bold hover:bg-indigo-100 transition border border-indigo-200">
              <span>📦 에셋 보관함</span>
            </Link>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold border border-emerald-200/60">
                <FileText className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-sm text-slate-900">
                소셜 포스팅 스튜디오
              </span>
            </div>

            {/* DB 상품 선택 드롭다운 */}
            {products.length > 0 && (
              <div className="flex items-center gap-2 ml-2 pl-3 border-l border-slate-200">
                <Package className="w-3.5 h-3.5 text-amber-600" />
                <select
                  value={selectedProduct?.id || ''}
                  onChange={(e) => handleProductChange(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold rounded-xl px-2.5 py-1.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* 탭 전환 */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              onClick={() => setActiveTab('blog')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'blog'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>네이버 블로그 SEO 글</span>
            </button>

            <button
              onClick={() => setActiveTab('card')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'card'
                  ? 'bg-pink-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>인스타 1:1 카드뉴스 (6컷)</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('karrot');
                if (!karrotContent) handleGenerateKarrot(business, selectedProduct, karrotTemplate);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'karrot'
                  ? 'bg-orange-500 text-white shadow-xs shadow-orange-500/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-orange-500" />
              <span>🥕 당근 비즈프로필 소식</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('place');
                if (!placeContent) handleGeneratePlace(business, selectedProduct, placeTemplate);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'place'
                  ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              <span>🌿 플레이스 새소식</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* 에셋 보관함 저장 버튼 */}
            <button
              onClick={handleSaveToAssets}
              disabled={savingAsset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-all shadow-xs disabled:opacity-40"
            >
              {savingAsset ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : saveSuccess ? (
                <Check className="w-3.5 h-3.5 text-emerald-200" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>{saveSuccess ? '보관함 저장완료!' : '에셋 보관함 저장'}</span>
            </button>

            {/* 즉시 발행 또는 당근/플레이스 열기 버튼 */}
            {activeTab === 'place' ? (
              <a
                href="https://smartplace.naver.com"
                target="_blank"
                rel="noreferrer"
                onClick={handleCopyContent}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-xs font-bold text-white transition-all shadow-xs"
                title="본문을 복사하고 네이버 스마트플레이스 관리자 페이지를 엽니다"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                <span>🌿 플레이스 복사 & 관리자 열기</span>
              </a>
            ) : activeTab === 'karrot' ? (
              <a
                href="https://business.daangn.com"
                target="_blank"
                rel="noreferrer"
                onClick={handleCopyContent}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-xs font-bold text-white transition-all shadow-xs"
                title="본문을 클립보드에 복사하고 당근마켓 비즈프로필 관리자 페이지를 엽니다"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                <span>🥕 당근 복사 & 관리자 열기</span>
              </a>
            ) : (
              <button
                disabled={publishing}
                onClick={async () => {
                  const isBlog = activeTab === 'blog';
                  const target = isBlog ? 'naver_blog' : 'instagram';
                  setPublishing(true);
                  try {
                    const res = await fetch('/api/publish', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        target,
                        title: isBlog
                          ? `[${business?.name || '퐁신제빵소'}] ${selectedProduct?.name || '카스테라'} 네이버 블로그 SEO`
                          : `[${business?.name || '퐁신제빵소'}] ${selectedProduct?.name || '카스테라'} 인스타 6컷 카드뉴스`,
                        content: isBlog ? blogContent : JSON.stringify(cardData),
                      }),
                    });
                    const json = await res.json();
                    if (json.success) {
                      alert(`${json.message}\n발행 URL: ${json.resultUrl}`);
                    } else {
                      alert(`발행 중 오류: ${json.error || json.message}`);
                    }
                  } catch {
                    alert('발행 처리 중 오류가 발생했습니다.');
                  } finally {
                    setPublishing(false);
                  }
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-xs font-bold text-white transition-all shadow-xs disabled:opacity-50"
              >
                {publishing ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-amber-100" />
                )}
                <span>
                  {publishing
                    ? '채널로 발행 중...'
                    : activeTab === 'blog'
                    ? '네이버 블로그 즉시 발행'
                    : '인스타그램 피드 즉시 발행'}
                </span>
              </button>
            )}

            {/* 복사 버튼 */}
            <button
              onClick={handleCopyContent}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-all shadow-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? '복사 완료!' : activeTab === 'place' ? '플레이스 본문 복사' : activeTab === 'karrot' ? '당근 본문 복사' : activeTab === 'blog' ? '블로그 본문 복사' : 'JSON 복사'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* 메인 작업 영역 */}
      <div className="flex-1 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 lg:p-6">
        
        {/* 좌측: AI 핀셋 수정 창 */}
        <div className="lg:col-span-4 flex flex-col bg-white rounded-3xl border border-slate-200 p-5 shadow-xs h-[calc(100vh-140px)]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                실시간 핀셋 수정 (AI Co-pilot)
              </h2>
            </div>
            <button
              onClick={() => (activeTab === 'blog' ? handleGenerateBlog() : handleGenerateCards())}
              disabled={loading}
              className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 disabled:opacity-50 transition"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              <span>재생성</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs text-slate-600">
            {activeTab === 'place' ? (
              <div className="space-y-3">
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                  <span className="font-bold text-xs block mb-1">🌿 네이버 플레이스 새소식 템플릿</span>
                  <p className="text-[11px] text-emerald-800">
                    네이버 지도 검색 유입을 극대화하는 3대 템플릿을 선택해 보세요:
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {[
                    { id: 'coupon', label: '🎟️ 알림받기 1,000원 쿠폰', desc: '플레이스 알림받기 설정 시 즉시 할인' },
                    { id: 'notice', label: '🍞 갓 구운 빵 입고 새소식', desc: '아침 10시 당일 생산 따끈따끈 카스테라' },
                    { id: 'time_sale', label: '⚡ 평일 반짝 타임세일', desc: '오후 2~5시 방문 고객 빵 1+1 타임어택' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setPlaceTemplate(t.id as any);
                        handleGeneratePlace(business, selectedProduct, t.id as any);
                      }}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        placeTemplate === t.id
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-950 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-bold text-xs text-emerald-700">{t.label}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            ) : activeTab === 'karrot' ? (
              <div className="space-y-3">
                <div className="p-3 rounded-2xl bg-orange-50 border border-orange-200 text-orange-950">
                  <span className="font-bold text-xs block mb-1">🥕 당근마켓 비즈프로필 소식 템플릿</span>
                  <p className="text-[11px] text-orange-800">
                    동네 이웃들의 주목도를 높이는 3대 테마 중 하나를 선택해 보세요:
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {[
                    { id: 'fresh', label: '🍞 갓 구운 빵 오픈 알림', desc: '아침 10시 당일 생산 따끈따끈 카스테라' },
                    { id: 'coupon', label: '🎟️ 단골 전용 1,000원 쿠폰', desc: '당근 단골 맺기 시 즉시 할인 혜택' },
                    { id: 'rainy', label: '☔ 비 오는 날 우유 증정', desc: '궂은 날씨 방문 이웃 우유 1팩 무료' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setKarrotTemplate(t.id as any);
                        handleGenerateKarrot(business, selectedProduct, t.id as any);
                      }}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        karrotTemplate === t.id
                          ? 'bg-orange-50 border-orange-500 text-orange-950 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-bold text-xs text-orange-600">{t.label}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 leading-relaxed text-slate-700">
                  🏪 <strong>매장</strong>: {business?.name || '퐁신제빵소'} | 📦 <strong>선택 상품</strong>: {selectedProduct?.name || '카스테라'}
                  <br /><br />
                  ✍️ <strong>{activeTab === 'blog' ? '네이버 스마트블록 1위 최적화 블로그' : '인스타그램 6컷 캐러셀'}</strong> 초안이 생성되었습니다.
                  <br /><br />
                  원하시는 말투나 강조하고 싶은 키워드를 채팅으로 편하게 말씀해 주세요.
                </div>

                <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-[11px] text-emerald-900">
                  💡 <strong>핀셋 요청 예시:</strong>
                  <ul className="list-disc pl-4 mt-1.5 space-y-1 text-emerald-800">
                    <li>"주말 아이 간식 추천 키워드를 더 강조해줘"</li>
                    <li>"배곧 생명공원 피크닉 포장 팁을 추가해줘"</li>
                    <li>"글 끝부분에 네이버 플레이스 링크를 더 눈에 띄게 넣어줘"</li>
                    <li>"가격 {selectedProduct?.price?.toLocaleString() || '11,000'}원 가성비를 언급해줘"</li>
                  </ul>
                </div>
              </>
            )}
          </div>

          {/* 대화형 입력창 */}
          <form onSubmit={handleTweak} className="mt-4 pt-3 border-t border-slate-100 flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="예: 조금 더 친근하고 이모지가 많은 말투로 바꿔줘"
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
            />
            <button
              type="submit"
              disabled={tweaking || !chatInput.trim()}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center disabled:opacity-40 transition-colors shadow-xs"
            >
              {tweaking ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            </button>
          </form>
        </div>

        {/* 우측 캔버스 영역 */}
        <div className="lg:col-span-8 flex flex-col bg-slate-100/70 rounded-3xl border border-slate-200/80 p-6 overflow-hidden h-[calc(100vh-140px)]">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center py-20 text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin text-emerald-600 mb-3" />
              <span className="text-sm font-bold text-slate-600">콘텐츠 최적화 렌더링 중...</span>
            </div>
          ) : activeTab === 'place' ? (
            /* 🌿 네이버 스마트플레이스 모바일 UI 실물 뷰어 */
            <div className="flex-1 overflow-y-auto flex items-center justify-center p-2 sm:p-4">
              <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-xl border border-slate-200 text-slate-900 font-sans">
                {/* 네이버 플레이스 상단 초록 헤더 */}
                <div className="px-5 py-3 border-b border-emerald-600 flex items-center justify-between bg-[#03C75A] text-white">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm tracking-tight">NAVER MY플레이스</span>
                  </div>
                  <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full">
                    공식 소식
                  </span>
                </div>

                {/* 매장 타이틀 & 메타 정보 */}
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-1.5">
                        <span>{business?.name || '퐁신제빵소'}</span>
                        <span className="text-xs text-slate-500 font-normal">시흥배곧점</span>
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-slate-600 mt-1">
                        <span className="text-amber-500 font-bold">★ 4.93</span>
                        <span>·</span>
                        <span>방문자리뷰 642</span>
                        <span>·</span>
                        <span>블로그리뷰 188</span>
                      </div>
                    </div>
                    <button className="px-3 py-1 rounded-full border border-[#03C75A] text-[#03C75A] font-bold text-xs hover:bg-emerald-50 transition">
                      + 알림받기
                    </button>
                  </div>

                  {/* 탭 네비게이션 시뮬레이션 */}
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-200 text-xs font-semibold text-slate-500">
                    <span>홈</span>
                    <span>메뉴</span>
                    <span className="text-[#03C75A] font-bold border-b-2 border-[#03C75A] pb-1">새소식</span>
                    <span>리뷰</span>
                    <span>사진</span>
                    <span>정보</span>
                  </div>
                </div>

                {/* 대표 사진 */}
                <div className="w-full h-48 bg-slate-100 relative overflow-hidden">
                  <img
                    src={selectedProduct?.image_url || 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80'}
                    alt="상품 사진"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2.5 left-3 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-xs text-white text-[11px] font-bold">
                    🌿 {selectedProduct?.name || '대만 카스테라'} ({selectedProduct?.price?.toLocaleString() || '11,000'}원)
                  </div>
                </div>

                {/* 새소식 본문 */}
                <div className="p-5 space-y-3">
                  <div className="text-xs leading-relaxed text-slate-800 whitespace-pre-wrap font-sans">
                    {placeContent || '네이버 스마트플레이스 새소식을 생성하는 중입니다...'}
                  </div>

                  {/* 네이버 플레이스 알림 쿠폰 다운로드 박스 */}
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-emerald-700 block">플레이스 알림받기 고객 전용</span>
                      <span className="text-xs font-black text-slate-900">1,000원 즉시 할인 쿠폰</span>
                    </div>
                    <button className="text-xs font-bold px-3 py-1.5 rounded-xl bg-[#03C75A] text-white shadow-xs hover:bg-[#02b350] transition">
                      쿠폰 받기
                    </button>
                  </div>
                </div>

                {/* 하단 네이버 지도 액션바 */}
                <div className="p-3 bg-slate-50 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs font-bold text-slate-700">
                  <div className="py-1.5 rounded-xl bg-white border border-slate-200 flex items-center justify-center gap-1 hover:bg-slate-50 cursor-pointer">
                    <span>📞 전화</span>
                  </div>
                  <div className="py-1.5 rounded-xl bg-white border border-slate-200 flex items-center justify-center gap-1 hover:bg-slate-50 cursor-pointer">
                    <span>🗺️ 길찾기</span>
                  </div>
                  <div className="py-1.5 rounded-xl bg-[#03C75A] text-white flex items-center justify-center gap-1 shadow-xs hover:bg-[#02b350] cursor-pointer">
                    <span>📅 예약</span>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'karrot' ? (
            /* 🥕 당근마켓 비즈프로필 & 동네생활 피드 뷰어 */
            <div className="flex-1 overflow-y-auto flex items-center justify-center p-2 sm:p-4">
              <div className="w-full max-w-md bg-white rounded-3xl text-slate-900 shadow-xl border border-orange-200 overflow-hidden font-sans">
                {/* 당근 앱 상단 헤더 */}
                <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-white">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                    <span className="font-extrabold text-sm text-slate-900">당근 동네가게 소식</span>
                  </div>
                  <span className="text-[11px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                    배곧동 이웃 대상
                  </span>
                </div>

                {/* 가게 프로필 바 */}
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <img
                      src="https://ldb-phinf.pstatic.net/20250613_51/1749793026669I569w_JPEG/%C6%FE%BD%C5%BD%C9%BA%BC1.jpg"
                      alt="퐁신제빵소"
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-orange-200 shadow-xs"
                    />
                    <div>
                      <div className="font-bold text-xs text-slate-900 flex items-center gap-1">
                        <span>{business?.name || '퐁신제빵소'}</span>
                        <span className="text-[10px] text-orange-500 font-semibold">인증</span>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        시흥시 배곧동 · 단골 1,280명
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-full bg-orange-500 text-white font-bold text-xs hover:bg-orange-600 transition shadow-xs"
                  >
                    + 단골 맺기
                  </button>
                </div>

                {/* 대표 상품 사진 */}
                <div className="w-full h-52 bg-slate-100 relative overflow-hidden">
                  <img
                    src={selectedProduct?.image_url || 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80'}
                    alt="상품 사진"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2.5 left-3 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-xs text-white text-[11px] font-bold">
                    🍰 {selectedProduct?.name || '대만 카스테라'} ({selectedProduct?.price?.toLocaleString() || '11,000'}원)
                  </div>
                </div>

                {/* 소식글 본문 */}
                <div className="p-5 space-y-3">
                  <div className="text-xs leading-relaxed text-slate-800 whitespace-pre-wrap font-sans">
                    {karrotContent || '당근마켓 소식글을 생성하는 중입니다...'}
                  </div>

                  {/* 단골 쿠폰 혜택 박스 */}
                  <div className="p-3.5 rounded-2xl bg-orange-50 border border-orange-200/80 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-orange-600 block">당근 단골 전용 혜택</span>
                      <span className="text-xs font-black text-slate-900">1,000원 즉시 할인 쿠폰</span>
                    </div>
                    <span className="text-xs font-bold px-3 py-1 rounded-xl bg-orange-500 text-white">
                      쿠폰 받기
                    </span>
                  </div>
                </div>

                {/* 하단 반응 바 */}
                <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span className="text-[11px]">방문 전 네이버 예약 시 즉시 픽업 가능</span>
                  <div className="flex items-center gap-3">
                    <span className="hover:text-orange-500 cursor-pointer">🧡 관심 42</span>
                    <span className="hover:text-orange-500 cursor-pointer">💬 댓글 18</span>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'blog' ? (
            /* 네이버 블로그 스마트 뷰어 */
            <div className="flex-1 overflow-y-auto bg-white rounded-2xl p-6 sm:p-8 text-slate-900 shadow-xs border border-slate-200/60 font-sans">
              <div className="max-w-2xl mx-auto space-y-4">
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between text-xs text-slate-500">
                  <span>네이버 블로그 스마트에디터 ONE 호환 뷰</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                    검색 키워드: 시흥 배곧 맛집, 카스테라
                  </span>
                </div>
                <div className="prose prose-slate max-w-none text-xs sm:text-sm whitespace-pre-wrap leading-relaxed text-slate-800">
                  {blogContent}
                </div>
              </div>
            </div>
          ) : (
            /* 인스타그램 1:1 카드뉴스 캐러셀 뷰어 */
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="mb-4 text-xs font-semibold text-slate-600 flex items-center gap-2">
                <span>인스타그램 1:1 캐러셀 피드 미리보기</span>
                <span className="text-[10px] px-2 py-0.5 bg-slate-200 rounded-full text-slate-700 font-mono font-bold">
                  {currentSlide + 1} / {slides.length || 6}
                </span>
              </div>

              {/* 1:1 카드뉴스 실물 뷰 */}
              {currentCard && (
                <div
                  className="w-[360px] h-[360px] sm:w-[420px] sm:h-[420px] rounded-3xl shadow-xl p-8 flex flex-col justify-between transition-all duration-300 relative overflow-hidden border border-slate-200/40"
                  style={{ backgroundColor: currentCard.bgColor || '#1e293b', color: currentCard.textColor || '#ffffff' }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black px-3 py-1 rounded-full bg-white/80 text-slate-900 shadow-xs backdrop-blur-xs">
                      {currentCard.badge || '퐁신 카스테라'}
                    </span>
                    <span className="text-xs font-bold opacity-70">
                      {business?.name || '퐁신제빵소'}
                    </span>
                  </div>

                  <div className="space-y-3 my-auto">
                    <h3 className="text-xl sm:text-2xl font-black leading-snug whitespace-pre-line">
                      {currentCard.headline}
                    </h3>
                    <p className="text-xs sm:text-sm font-medium opacity-90 leading-relaxed">
                      {currentCard.subtext}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-black/10 text-[11px] font-bold opacity-80">
                    <span>좌우로 넘겨보세요 ➔</span>
                    <span>{currentCard.slideNumber || currentSlide + 1} / {slides.length}</span>
                  </div>
                </div>
              )}

              {/* 슬라이드 넘김 컨트롤 */}
              <div className="flex items-center gap-4 mt-6">
                <button
                  onClick={() => setCurrentSlide((prev) => Math.max(0, prev - 1))}
                  disabled={currentSlide === 0}
                  className="w-10 h-10 rounded-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 flex items-center justify-center disabled:opacity-30 shadow-xs transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="flex gap-1.5">
                  {slides.map((_: any, idx: number) => (
                    <div
                      key={idx}
                      onClick={() => setCurrentSlide(idx)}
                      className={`h-2.5 rounded-full cursor-pointer transition-all ${
                        currentSlide === idx ? 'bg-pink-500 w-6' : 'bg-slate-300 w-2.5'
                      }`}
                    />
                  ))}
                </div>

                <button
                  onClick={() => setCurrentSlide((prev) => Math.min(slides.length - 1, prev + 1))}
                  disabled={currentSlide >= slides.length - 1}
                  className="w-10 h-10 rounded-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 flex items-center justify-center disabled:opacity-30 shadow-xs transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* 글로벌 푸터 및 모바일 내비 안전 영역 */}
      <div className="pb-16 sm:pb-0 mt-8">
        <Footer />
      </div>
    </div>
  );
}
