'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Compass,
  Sparkles,
  Plus,
  ExternalLink,
  Video,
  Camera,
  FileText,
  ShoppingBag,
  Printer,
  BookmarkPlus,
  ArrowRight,
  TrendingUp,
  Sliders,
  CheckCircle2,
  RefreshCw,
  Lightbulb,
  Music,
  Palette,
} from 'lucide-react';
import Footer from '@/components/Footer';

export default function ReferencesPage() {
  const [activeTab, setActiveTab] = useState<'curated' | 'my'>('curated');
  const [curatedList, setCuratedList] = useState<any[]>([]);
  const [myList, setMyList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRef, setSelectedRef] = useState<any | null>(null);

  // 새 링크 등록 폼 상태
  const [newUrl, setNewUrl] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newChannel, setNewChannel] = useState('youtube');
  const [analyzing, setAnalyzing] = useState(false);

  // 데이터 로드
  const fetchReferences = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/references');
      const data = await res.json();
      if (data.success) {
        setCuratedList(data.curated_benchmarks || []);
        setMyList(data.user_references || []);
        if (data.curated_benchmarks?.length > 0 && !selectedRef) {
          setSelectedRef(data.curated_benchmarks[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load references:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferences();
  }, []);

  // 새 링크 추가 및 AI 분석
  const handleAddReference = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.trim()) return;
    setAnalyzing(true);
    try {
      const res = await fetch('/api/references', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: newUrl,
          title: newTitle,
          channel: newChannel,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert('🎉 링크가 성공적으로 추가되었으며, AI 성공 요인 분석이 완료되었습니다!');
        setNewUrl('');
        setNewTitle('');
        fetchReferences();
        setActiveTab('my');
      } else {
        alert(`추가 실패: ${data.error}`);
      }
    } catch (err) {
      console.error('Add reference error:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  // AI 추천 항목을 내 보드로 담기
  const handleSaveCurated = async (item: any) => {
    try {
      const res = await fetch('/api/references', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: item.url,
          title: item.title,
          channel: item.channel,
          notes: item.analysis?.marketing_tip,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert('✨ 내 벤치마크 보드에 저장되었습니다!');
        fetchReferences();
      }
    } catch (err) {
      console.error('Save curated error:', err);
    }
  };

  const getChannelBadge = (ch: string) => {
    switch (ch) {
      case 'youtube':
        return <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md border border-red-200"><Video className="w-3 h-3" /> 유튜브 쇼츠</span>;
      case 'instagram':
        return <span className="inline-flex items-center gap-1 text-[11px] font-bold text-pink-600 bg-pink-50 px-2 py-0.5 rounded-md border border-pink-200"><Camera className="w-3 h-3" /> 인스타 릴스</span>;
      case 'naver_blog':
        return <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200"><FileText className="w-3 h-3" /> 네이버 블로그</span>;
      case 'smartstore':
        return <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200"><ShoppingBag className="w-3 h-3" /> 스마트스토어</span>;
      default:
        return <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200"><Printer className="w-3 h-3" /> 인쇄물</span>;
    }
  };

  const displayList = activeTab === 'curated' ? curatedList : myList;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* 상단 네비게이션 */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
              <span>← 메인 대시보드로 돌아가기</span>
            </Link>
            <span className="text-slate-300">|</span>
            <span className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <Compass className="w-5 h-5 text-indigo-600" />
              벤치마크 레퍼런스 인텔리전스
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/studio/video"
              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
            >
              숏폼 스튜디오
            </Link>
            <Link
              href="/studio/detail"
              className="text-xs font-bold px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
            >
              상세페이지 스튜디오
            </Link>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 영역 */}
      <main className="max-w-7xl mx-auto w-full px-4 lg:px-8 py-8 flex-1">
        {/* 상단 안내 & 링크 추가 바 */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full mb-2">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>바이럴 공식 & 성공 DNA 분석기</span>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                잘 팔리는 1위 마케팅 레퍼런스를 벤치마크하세요
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                유튜브 쇼츠, 인스타 릴스, 스마트스토어 링크를 넣거나 AI 추천 큐레이션에서 원하는 것을 선택하면 성공 요인을 즉시 추출합니다.
              </p>
            </div>

            {/* 링크 직접 추가 폼 */}
            <form onSubmit={handleAddReference} className="flex flex-col sm:flex-row gap-2 shrink-0">
              <select
                value={newChannel}
                onChange={(e) => setNewChannel(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50"
              >
                <option value="youtube">유튜브 쇼츠</option>
                <option value="instagram">인스타 릴스</option>
                <option value="naver_blog">네이버 블로그</option>
                <option value="smartstore">상세페이지</option>
                <option value="print">인쇄물/기타</option>
              </select>
              <input
                type="url"
                required
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="참고할 링크 (URL) 붙여넣기"
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs w-full sm:w-64 focus:ring-2 focus:ring-indigo-500/20"
              />
              <button
                type="submit"
                disabled={analyzing}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 disabled:opacity-50 shadow-md shadow-indigo-200 shrink-0"
              >
                {analyzing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                <span>{analyzing ? 'AI 분석 중...' : '링크 분석 & 추가'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex items-center gap-3 border-b border-slate-200 mb-6">
          <button
            onClick={() => setActiveTab('curated')}
            className={`pb-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'curated'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>AI 추천 베이커리 1위 큐레이션 ({curatedList.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('my')}
            className={`pb-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'my'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookmarkPlus className="w-4 h-4 text-indigo-500" />
            <span>내가 스크랩한 레퍼런스 ({myList.length})</span>
          </button>
        </div>

        {/* 2열 레이아웃: 좌측 리스트 / 우측 실시간 DNA 분석 패널 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 좌측 레퍼런스 카드 그리드 */}
          <div className="lg:col-span-7 space-y-4">
            {displayList.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedRef(item)}
                className={`p-4 rounded-2xl bg-white border cursor-pointer transition-all hover:shadow-md ${
                  selectedRef?.id === item.id
                    ? 'border-indigo-600 ring-2 ring-indigo-500/10 shadow-md'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex gap-4">
                  <img
                    src={item.thumbnail_url}
                    alt={item.title}
                    className="w-24 h-24 rounded-xl object-cover shrink-0 bg-slate-100"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      {getChannelBadge(item.channel)}
                      {activeTab === 'curated' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSaveCurated(item);
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition-colors"
                        >
                          <BookmarkPlus className="w-3.5 h-3.5" />
                          <span>내 보드에 담기</span>
                        </button>
                      )}
                    </div>
                    <h3 className="font-bold text-sm text-slate-900 line-clamp-1 mb-1">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {item.analysis?.hook || item.notes || 'AI 성공 DNA가 분석된 레퍼런스입니다.'}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-700 underline"
                      >
                        <span>원문 보기</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 우측 DNA 분석 및 에셋 생성 연동 패널 */}
          <div className="lg:col-span-5">
            <div className="sticky top-20 bg-white rounded-3xl p-6 border border-slate-200 shadow-md">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wider">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  <span>레퍼런스 성공 DNA 심층 분석</span>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                  AI 추출 완료
                </span>
              </div>

              {selectedRef ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                      {selectedRef.title}
                    </h3>
                  </div>

                  {/* 훅 문구 */}
                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80">
                    <span className="text-[11px] font-bold text-amber-900 block mb-1">
                      🔥 시선 강탈 훅 (Hook) 공식
                    </span>
                    <p className="text-xs font-semibold text-amber-800 leading-relaxed">
                      "{selectedRef.analysis?.hook || '단 1초 만에 식욕을 돋우는 극초근접 샷'}"
                    </p>
                  </div>

                  {/* 콘텐츠 진행 구조 */}
                  <div className="p-3.5 rounded-2xl bg-indigo-50/80 border border-indigo-200/80">
                    <span className="text-[11px] font-bold text-indigo-900 block mb-1">
                      📐 스토리보드 전개 구조
                    </span>
                    <p className="text-xs text-indigo-800 leading-relaxed font-medium">
                      {selectedRef.analysis?.structure || '인트로 ➔ 원재료 ➔ 커팅 ➔ 콜투액션'}
                    </p>
                  </div>

                  {/* BGM 및 컬러 팔레트 */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 mb-1">
                        <Music className="w-3.5 h-3.5 text-indigo-500" />
                        <span>권장 BGM 템포</span>
                      </div>
                      <p className="text-xs text-slate-600 font-semibold">
                        {selectedRef.analysis?.bgm_tempo || '120 BPM 경쾌한 팝'}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 mb-1">
                        <Palette className="w-3.5 h-3.5 text-indigo-500" />
                        <span>컬러 팔레트</span>
                      </div>
                      <div className="flex gap-1.5 mt-1">
                        {selectedRef.analysis?.color_palette?.map((col: string, i: number) => (
                          <div
                            key={i}
                            className="w-5 h-5 rounded-md border border-slate-200 shadow-xs"
                            style={{ backgroundColor: col }}
                            title={col}
                          />
                        )) || (
                          <span className="text-xs text-slate-400">색상 자동 감지</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 사장님 실전 마케팅 팁 */}
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/80">
                    <span className="text-[11px] font-bold text-emerald-900 block mb-1">
                      💡 퐁신제빵소 즉시 적용 팁
                    </span>
                    <p className="text-xs text-emerald-800 leading-relaxed">
                      {selectedRef.analysis?.marketing_tip || '카스테라의 단면과 포장 패키지를 함께 노출하세요.'}
                    </p>
                  </div>

                  {/* 원클릭 에셋 스튜디오 연동 버튼 */}
                  <div className="pt-2 space-y-2">
                    <Link
                      href={`/studio/video?refId=${selectedRef.id}`}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200"
                    >
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>이 공식 그대로 15초 숏폼 비디오 생성</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>

                    <Link
                      href={`/studio/detail?refId=${selectedRef.id}`}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-amber-500 text-white font-bold text-xs hover:bg-amber-600 transition-all shadow-md shadow-amber-200"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>이 구조로 스마트스토어 상세페이지 생성</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-slate-400">
                  레퍼런스를 클릭하면 AI 심층 성공 DNA 분석이 표시됩니다.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* 푸터 영역 */}
      <Footer />
    </div>
  );
}
