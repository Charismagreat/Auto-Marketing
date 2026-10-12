'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Sparkles,
  Send,
  Download,
  Copy,
  Check,
  RefreshCw,
  Eye,
  Code,
  Smartphone,
  Layers,
  Store,
  ArrowLeft,
  Sliders,
  Camera,
} from 'lucide-react';
import MediaPickerModal from '@/components/MediaPickerModal';
import Footer from '@/components/Footer';

export default function DetailStudioPage() {
  const [loading, setLoading] = useState(false);
  const [tweaking, setTweaking] = useState(false);
  const [htmlCode, setHtmlCode] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [customImageUrl, setCustomImageUrl] = useState<string | null>(null);

  // DB 연동 비즈니스 및 상품 상태
  const [business, setBusiness] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');

  // 1. DB 비즈니스 및 상품 목록 로드
  useEffect(() => {
    fetch('/api/bootstrap')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.bundle) {
          setBusiness(json.bundle.business);
          const prods = json.bundle.products || [];
          setProducts(prods);
          if (prods.length > 0) {
            setSelectedProductId(prods[0].id);
            // 첫 번째 상품으로 상세페이지 생성
            handleGenerate(json.bundle.business, prods[0]);
          }
        }
      })
      .catch((err) => console.error('Failed to load DB data:', err));
  }, []);

  // 상세페이지 생성 호출 (DB 데이터 기반 + 실물 사진 연동)
  const handleGenerate = async (currentBiz = business, currentProd?: any, overrideImg = customImageUrl) => {
    const baseProd = currentProd || products.find((p) => p.id === selectedProductId) || products[0];
    const targetProd = baseProd ? {
      ...baseProd,
      image_url: overrideImg || baseProd.image_url,
    } : { name: '대표 메뉴', image_url: overrideImg };

    setLoading(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'detail',
          business: currentBiz || { name: '퐁신제빵소' },
          product: targetProd,
        }),
      });
      const data = await res.json();
      if (data.success && data.html) {
        let finalHtml = data.html;
        if (overrideImg) {
          // HTML 내 이미지 src를 실물 업로드 사진으로 교체
          finalHtml = finalHtml.replace(/src="https:\/\/[^"]+"/g, `src="${overrideImg}"`);
        }
        setHtmlCode(finalHtml);
      }
    } catch (err) {
      console.error('Generate detail error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMediaSelect = (url: string) => {
    setCustomImageUrl(url);
    handleGenerate(business, undefined, url);
  };

  // 대화형 핀셋 수정 (AI Tweak)
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
      console.error('Tweak detail error:', err);
    } finally {
      setTweaking(false);
    }
  };

  // 초기 렌더링 시 기본 상세페이지 1회 자동 생성
  useEffect(() => {
    handleGenerate();
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(htmlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold border border-amber-200/60">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-sm text-slate-900">
                {business?.name || '퐁신제빵소'} 상세페이지 (DB 연동)
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                네이버/쿠팡 규격
              </span>
            </div>

            {/* DB 상품 선택 드롭다운 */}
            {products.length > 0 && (
              <select
                value={selectedProductId}
                onChange={(e) => {
                  const newId = e.target.value;
                  setSelectedProductId(newId);
                  const selectedProd = products.find((p) => p.id === newId);
                  if (selectedProd) handleGenerate(business, selectedProd);
                }}
                className="bg-slate-50 text-slate-900 text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    🍰 {p.name} ({Number(p.price).toLocaleString()}원)
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMediaPicker(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-xs font-bold text-white transition-colors shadow-xs"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>📷 매장 실물 사진 적용</span>
            </button>

            <button
              onClick={() => setViewMode(viewMode === 'preview' ? 'code' : 'preview')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors border border-slate-200"
            >
              {viewMode === 'preview' ? <Code className="w-3.5 h-3.5 text-indigo-600" /> : <Eye className="w-3.5 h-3.5 text-indigo-600" />}
              <span>{viewMode === 'preview' ? 'HTML 코드 보기' : '디자인 프리뷰'}</span>
            </button>

            <button
              onClick={async () => {
                try {
                  const res = await fetch('/api/assets', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      title: '퐁신 오리지널 대만 카스테라 860px 상세페이지',
                      type: 'detail',
                      codeContent: htmlCode,
                      costTokens: 2000,
                    }),
                  });
                  const json = await res.json();
                  if (json.success) {
                    alert('✨ 상세페이지가 마케팅 라이브러리에 안전하게 저장되었습니다!');
                  }
                } catch {
                  alert('저장 중 오류가 발생했습니다.');
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-all shadow-xs"
            >
              <span>💾 에셋 저장</span>
            </button>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-all shadow-sm shadow-indigo-600/20"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-200" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? '복사 완료!' : '스마트스토어 HTML 복사'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* 메인 작업 영역: 좌측 핀셋 대화창 / 우측 860px 라이브 뷰어 */}
      <div className="flex-1 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 lg:p-6">
        
        {/* 좌측: AI 핀셋 수정 (Code-as-Asset 대화형 에디터) */}
        <div className="lg:col-span-4 flex flex-col bg-white rounded-3xl border border-slate-200 p-5 shadow-xs h-[calc(100vh-140px)]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                대화형 핀셋 수정 (AI Co-pilot)
              </h2>
            </div>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 disabled:opacity-50 transition"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              <span>전체 재생성</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs text-slate-600">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 leading-relaxed text-slate-700">
              👋 안녕하세요 사장님! <strong>퐁신 오리지널 대만 카스테라</strong>의 860px 고전환 상세페이지가 실시간 생성되었습니다.
              <br /><br />
              마음에 안 드는 부분이나 추가하고 싶은 내용이 있다면 채팅으로 편하게 말씀해 주세요.
            </div>

            <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-200 text-[11px] text-indigo-900">
              💡 <strong>추천 핀셋 요청 예시:</strong>
              <ul className="list-disc pl-4 mt-1.5 space-y-1 text-indigo-800">
                <li>"가격 할인 배너를 더 굵고 강렬한 빨간색으로 바꿔줘"</li>
                <li>"아이들 간식에 좋은 이유 3가지를 추가해줘"</li>
                <li>"당일 발송 마감 시간을 오후 2시로 수정해줘"</li>
              </ul>
            </div>
          </div>

          {/* 대화형 입력창 */}
          <form onSubmit={handleTweak} className="mt-4 pt-3 border-t border-slate-100 flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="예: 보관법 섹션에 냉동 보관 꿀팁 추가해줘"
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
            />
            <button
              type="submit"
              disabled={tweaking || !chatInput.trim()}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center disabled:opacity-40 transition-colors shadow-xs"
            >
              {tweaking ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            </button>
          </form>
        </div>

        {/* 우측: 860px 표준 규격 라이브 캔버스 프리뷰 */}
        <div className="lg:col-span-8 flex flex-col bg-slate-100/70 rounded-3xl border border-slate-200/80 p-4 overflow-hidden h-[calc(100vh-140px)]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 px-2 mb-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <Smartphone className="w-4 h-4 text-slate-500" />
              <span>모바일/스마트스토어 860px 캔버스 뷰</span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              Width: 860px (Standard E-Commerce)
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-white rounded-2xl shadow-xs border border-slate-200/60 p-4 text-slate-900">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center py-20 text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin text-indigo-500 mb-3" />
                <span className="text-sm font-bold text-slate-600">860px 상세페이지 6대 섹션 렌더링 중...</span>
                <span className="text-xs text-slate-400 mt-1">네이버 스마트스토어 표준 레이아웃 적용 중</span>
              </div>
            ) : viewMode === 'preview' ? (
              <div
                className="max-w-[860px] mx-auto min-h-full font-sans antialiased"
                dangerouslySetInnerHTML={{ __html: htmlCode }}
              />
            ) : (
              <pre className="text-xs font-mono bg-slate-900 text-slate-100 p-4 rounded-xl overflow-x-auto whitespace-pre-wrap">
                {htmlCode}
              </pre>
            )}
          </div>
        </div>

      </div>

      {/* 매장 실물 미디어 피커 모달 */}
      <MediaPickerModal
        isOpen={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        onSelect={handleMediaSelect}
        title="카스테라 실물 사진 선택 및 업로드 (스토리지 연동)"
      />

      {/* 글로벌 푸터 및 모바일 내비 안전 영역 */}
      <div className="pb-16 sm:pb-0 mt-8">
        <Footer />
      </div>
    </div>
  );
}
