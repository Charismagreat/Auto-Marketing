'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Printer,
  Sparkles,
  Send,
  Download,
  Copy,
  Check,
  RefreshCw,
  Eye,
  Code,
  FileText,
  CreditCard,
  Flag,
  ArrowLeft,
  Save,
  Package,
  Camera,
} from 'lucide-react';
import MediaPickerModal from '@/components/MediaPickerModal';
import Footer from '@/components/Footer';

export default function PrintStudioPage() {
  const [format, setFormat] = useState<'card' | 'flyer' | 'banner'>('card');
  const [loading, setLoading] = useState(false);
  const [tweaking, setTweaking] = useState(false);
  const [savingAsset, setSavingAsset] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [htmlCode, setHtmlCode] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [customMediaUrl, setCustomMediaUrl] = useState<string | null>(null);

  // DB 연동 상태
  const [business, setBusiness] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // 1. DB 비즈니스 프로필 및 상품 목록 로드
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
          const allObj = {
            id: 'all',
            name: `${biz?.name || '퐁신제빵소'} 전 메뉴 라인업 (총 ${prods.length}종)`,
            price: '전 품목 및 세트 구성',
            description: prods.map((p: any) => `${p.name} (${Number(p.price).toLocaleString()}원)`).join(', '),
            is_all: true,
          };
          setSelectedProduct(allObj);
          handleGenerate('flyer', biz, allObj, null, 'all', prods);
        }
      } catch (err) {
        console.error('Print Studio bootstrap error:', err);
      }
    }
    loadData();
  }, []);

  // 인쇄물 생성 (실물 사진 연동)
  const handleGenerate = async (
    selectedFormat = format,
    biz = business,
    prod = selectedProduct,
    overrideImg = customMediaUrl,
    modeOverride?: string,
    prodList = products
  ) => {
    setLoading(true);
    try {
      const mode = modeOverride || (prod?.id === 'all' ? 'all' : prod?.id === 'bundle' ? 'bundle' : 'single');
      const bizPayload = biz || {
        name: '퐁신제빵소',
        category: '베이커리/디저트',
        phone: '0507-1335-5147',
        road_address: '경기 시흥시 서울대학로 59-69 배곧테크노밸리 1층 138호',
      };

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'print',
          printFormat: selectedFormat,
          business: {
            name: bizPayload.name,
            category: bizPayload.category,
            phone: bizPayload.phone,
            address: bizPayload.road_address || bizPayload.address,
            usp: bizPayload.usp,
          },
          product: prod ? {
            name: prod.name,
            price: prod.price,
            description: prod.description,
            image_url: overrideImg || prod.image_url,
            is_all: prod.is_all,
            is_bundle: prod.is_bundle,
          } : undefined,
          products: prodList,
          mode,
        }),
      });
      const data = await res.json();
      if (data.success && data.html) {
        let finalHtml = data.html;
        if (overrideImg) {
          finalHtml = finalHtml.replace(/src="https:\/\/[^"]+"/g, `src="${overrideImg}"`);
        }
        setHtmlCode(finalHtml);
      }
    } catch (err) {
      console.error('Generate print error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMediaSelect = (url: string) => {
    setCustomMediaUrl(url);
    handleGenerate(format, business, selectedProduct, url);
  };

  // 포맷 변경 시 즉시 재생성
  const handleFormatChange = (newFormat: 'card' | 'flyer' | 'banner') => {
    setFormat(newFormat);
    handleGenerate(newFormat, business, selectedProduct);
  };

  // 상품 변경 시 즉시 재생성
  const handleProductChange = (prodId: string) => {
    let chosen: any = null;
    if (prodId === 'all') {
      chosen = {
        id: 'all',
        name: `${business?.name || '퐁신제빵소'} 전 메뉴 라인업 (총 ${products.length}종)`,
        price: '전 품목 및 세트 구성',
        description: products.map((p) => `${p.name} (${Number(p.price).toLocaleString()}원)`).join(', '),
        is_all: true,
      };
    } else if (prodId === 'bundle') {
      const topSet = products.slice(0, 3);
      const sum = topSet.reduce((acc, p) => acc + (Number(p.price) || 0), 0);
      chosen = {
        id: 'bundle',
        name: `[세트 기획] ${business?.name || '퐁신제빵소'} 시그니처 3종 선물세트`,
        price: `${Math.max(sum - 2000, 10000).toLocaleString()}원`,
        description: `퐁신 대표 메뉴 3종(${topSet.map((p) => p.name).join(' + ')}) 선물 세트 (2,000원 할인)`,
        is_bundle: true,
      };
    } else {
      chosen = products.find((p) => p.id === prodId) || null;
    }
    setSelectedProduct(chosen);
    handleGenerate(format, business, chosen, customMediaUrl, prodId === 'all' ? 'all' : prodId === 'bundle' ? 'bundle' : 'single');
  };

  // 핀셋 수정 (AI Tweak)
  const handleTweak = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !htmlCode) return;
    setTweaking(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'tweak',
          existingCode: htmlCode,
          chatMessage: chatInput,
        }),
      });
      const data = await res.json();
      if (data.success && data.code) {
        setHtmlCode(data.code);
        setChatInput('');
      }
    } catch (err) {
      console.error('Tweak print error:', err);
    } finally {
      setTweaking(false);
    }
  };

  // 완성된 인쇄물 에셋 DB에 영구 저장 (auto_assets 연동)
  const handleSaveToAssets = async () => {
    if (!htmlCode) return;
    setSavingAsset(true);
    try {
      const formatName = format === 'card' ? '명함 (90x50)' : format === 'banner' ? 'X배너 (600x1800)' : 'A4 전단지';
      const title = `[인쇄] ${business?.name || '퐁신제빵소'} - ${selectedProduct?.name || '시그니처'} ${formatName}`;
      const res = await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: business?.id || 'biz_pongshin_baegot',
          type: 'print',
          title,
          spec: `${formatName} 300 DPI`,
          component_code: htmlCode,
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

  // 300 DPI 상업 인쇄용 PDF 원클릭 다운로드
  const handleDownloadPdf = async () => {
    if (!htmlCode) return;
    setDownloadingPdf(true);
    try {
      const formatLabel = format === 'card' ? '명함' : format === 'banner' ? 'X배너' : 'A4전단지';
      const title = `${business?.name || '퐁신제빵소'}_${selectedProduct?.name || '시그니처'}_${formatLabel}`;
      const res = await fetch('/api/print/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html: htmlCode,
          format,
          title,
        }),
      });

      if (!res.ok) {
        throw new Error('PDF 다운로드 실패');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title}_300DPI_인쇄소접수용.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('PDF download error:', err);
      alert('PDF 생성 중 오류가 발생했습니다.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(htmlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 포맷별 미리보기 컨테이너 스타일
  const getContainerStyle = () => {
    if (format === 'card') {
      return 'w-[480px] min-h-[270px] shadow-2xl rounded-2xl'; // 약 90x50mm 명함 비율
    }
    if (format === 'banner') {
      return 'w-[320px] min-h-[960px] shadow-2xl rounded-2xl'; // 1:3 X배너 비율
    }
    return 'w-[600px] min-h-[850px] shadow-2xl rounded-2xl'; // A4 전단지 비율
  };

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
              <div className="w-7 h-7 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center font-bold border border-pink-200/60">
                <Printer className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-sm text-slate-900">
                인쇄물 스튜디오
              </span>
            </div>

            {/* DB 상품 선택 드롭다운 */}
            {products.length > 0 && (
              <div className="flex items-center gap-2 ml-2 pl-3 border-l border-slate-200">
                <Package className="w-3.5 h-3.5 text-amber-600" />
                <select
                  value={selectedProduct?.id || 'all'}
                  onChange={(e) => handleProductChange(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold rounded-xl px-2.5 py-1.5 focus:ring-2 focus:ring-pink-500 focus:outline-none"
                >
                  <option value="all">📋 [전체] 매장 전 메뉴판/가격표 (A4/배너/명함)</option>
                  <option value="bundle">🎁 [세트] 시그니처 3종 선물세트 묶음</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      🍰 [단품] {p.name} ({p.price?.toLocaleString()}원)
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={() => setShowMediaPicker(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-xs font-bold text-white transition-colors shadow-xs ml-2"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>📷 실물 사진 변경</span>
            </button>
          </div>

          {/* 포맷 전환 탭 */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              onClick={() => handleFormatChange('card')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                format === 'card'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>명함 (90x50)</span>
            </button>

            <button
              onClick={() => handleFormatChange('flyer')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                format === 'flyer'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>전단지 (A4)</span>
            </button>

            <button
              onClick={() => handleFormatChange('banner')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                format === 'banner'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Flag className="w-3.5 h-3.5" />
              <span>X배너 (입간판)</span>
            </button>
          </div>

          {/* 액션 버튼군 */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveToAssets}
              disabled={savingAsset || !htmlCode}
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

            <button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf || !htmlCode}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-xs font-bold text-white transition-all shadow-xs disabled:opacity-50"
            >
              {downloadingPdf ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5 text-white" />
              )}
              <span>{downloadingPdf ? '인쇄용 PDF 변환 중...' : '📥 300 DPI 인쇄용 PDF 다운로드'}</span>
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-all border border-slate-200"
            >
              <Printer className="w-3.5 h-3.5 text-pink-600" />
              <span>브라우저 인쇄</span>
            </button>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-all border border-slate-200"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? '복사 완료!' : '규격 코드 복사'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* 작업 영역 */}
      <div className="flex-1 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 lg:p-6">
        
        {/* 좌측 AI 핀셋 수정 창 */}
        <div className="lg:col-span-4 flex flex-col bg-white rounded-3xl border border-slate-200 p-5 shadow-xs h-[calc(100vh-140px)]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                실시간 핀셋 수정 (AI Co-pilot)
              </h2>
            </div>
            <button
              onClick={() => handleGenerate(format, business, selectedProduct)}
              disabled={loading}
              className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 disabled:opacity-50 transition"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              <span>재생성</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs text-slate-600">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 leading-relaxed text-slate-700">
              🏪 <strong>매장 정보</strong>: {business?.name || '로딩 중...'} ({business?.category})
              <br />
              📦 <strong>선택 상품</strong>: {selectedProduct?.name || '시그니처'}
              <br />
              🏷️ <strong>출력 포맷</strong>: {format === 'card' ? '명함 (90x50mm)' : format === 'banner' ? 'X배너 (600x1800mm)' : 'A4 전단지'}
            </div>

            <div className="p-3 rounded-2xl bg-pink-50/70 border border-pink-200 text-[11px] text-pink-900">
              💡 <strong>인쇄물 핀셋 수정 예시:</strong>
              <ul className="list-disc pl-4 mt-1.5 space-y-1 text-pink-800">
                <li>"할인 쿠폰 금액을 2,000원으로 바꿔줘"</li>
                <li>"오픈 이벤트 날짜를 '이번 주말까지'로 명시해줘"</li>
                <li>"배경을 따뜻한 베이커리 우드 톤으로 바꿔줘"</li>
                <li>"전화번호 글씨를 조금 더 크게 강조해줘"</li>
              </ul>
            </div>
          </div>

          {/* 대화형 입력창 */}
          <form onSubmit={handleTweak} className="mt-4 pt-3 border-t border-slate-100 flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="예: 뒷면에 오시는 길 약도 텍스트 추가해줘"
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:bg-white transition"
            />
            <button
              type="submit"
              disabled={tweaking || !chatInput.trim()}
              className="px-3.5 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs flex items-center justify-center disabled:opacity-40 transition-colors shadow-xs"
            >
              {tweaking ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            </button>
          </form>
        </div>

        {/* 우측 인쇄물 실물 미리보기 캔버스 */}
        <div className="lg:col-span-8 flex flex-col items-center bg-slate-100/70 rounded-3xl border border-slate-200/80 p-6 overflow-y-auto h-[calc(100vh-140px)]">
          <div className="mb-4 text-xs font-semibold text-slate-600 flex items-center gap-2">
            <span>300 DPI 인쇄 규격 실물 비율 미리보기</span>
            <span className="text-[10px] px-2 py-0.5 bg-slate-200 rounded-full text-slate-700 font-mono font-bold">
              {format === 'card' ? '90 x 50 mm' : format === 'banner' ? '600 x 1800 mm' : '210 x 297 mm (A4)'}
            </span>
          </div>

          {loading ? (
            <div className="h-full flex flex-col items-center justify-center py-20 text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin text-pink-600 mb-3" />
              <span className="text-sm font-bold text-slate-600">인쇄물 레이아웃 구성 중...</span>
            </div>
          ) : (
            <div
              className={`bg-white text-slate-900 overflow-hidden font-sans border border-slate-200/80 ${getContainerStyle()}`}
              dangerouslySetInnerHTML={{ __html: htmlCode }}
            />
          )}
        </div>

      </div>

      {/* 실물 미디어 피커 모달 */}
      <MediaPickerModal
        isOpen={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        onSelect={handleMediaSelect}
        title="인쇄용 대표 실물 사진 선택 및 업로드"
      />

      {/* 글로벌 푸터 및 모바일 내비 안전 영역 */}
      <div className="pb-16 sm:pb-0 mt-8">
        <Footer />
      </div>
    </div>
  );
}
