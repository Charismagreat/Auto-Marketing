'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FolderArchive,
  Sparkles,
  ArrowLeft,
  Video,
  FileText,
  Printer,
  ShoppingBag,
  Camera,
  Trash2,
  Copy,
  Check,
  Eye,
  Send,
  RefreshCw,
  ExternalLink,
  Layers,
  X,
  Search,
  Download,
} from 'lucide-react';
import Footer from '@/components/Footer';
import { onUserDataChanged } from '@/lib/egdesk-helpers';

interface Asset {
  id: string;
  business_id: string;
  type: 'detail' | 'video' | 'print' | 'blog' | 'card' | 'karrot' | 'naver_place';
  title: string;
  spec: string;
  component_code: string;
  preview_url: string;
  status: string;
  created_at: string;
}

export default function AssetLibraryPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // DB 에셋 목록 로드
  const fetchAssets = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/assets');
      const data = await res.json();
      if (data.success) {
        setAssets(data.assets || []);
      }
    } catch (err) {
      console.error('Fetch assets error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();

    // ⚡ [0초 실시간 감시] 이지데스크 공식 DB Watcher(SSE) 연동 (에셋 생성/삭제 시 자동 반영)
    const unsub = onUserDataChanged((event) => {
      if (!event.tableName || event.tableName === 'auto_assets') {
        fetchAssets();
      }
    }, { tableName: 'auto_assets' });

    return () => unsub();
  }, []);

  // 에셋 삭제
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('이 에셋을 영구 삭제하시겠습니까?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/assets?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setAssets((prev) => prev.filter((a) => a.id !== id));
        if (selectedAsset?.id === id) {
          setPreviewModalOpen(false);
          setSelectedAsset(null);
        }
      }
    } catch (err) {
      console.error('Delete asset error:', err);
    } finally {
      setDeletingId(null);
    }
  };

  // 클립보드 복사
  const handleCopyCode = (asset: Asset, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(asset.component_code);
    setCopiedId(asset.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // 즉시 재발행
  const handlePublish = async (asset: Asset, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const target = asset.type === 'blog' ? 'naver_blog' : asset.type === 'video' || asset.type === 'card' ? 'instagram' : 'scheduler';
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target,
          title: asset.title,
          content: asset.component_code,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`[${asset.title}] 성공적으로 재발행되었습니다!\n결과 URL: ${data.resultUrl || '발행 큐 등록 완료'}`);
      }
    } catch {
      alert('발행 중 오류가 발생했습니다.');
    }
  };

  // 300 DPI 상업 인쇄용 PDF 원클릭 다운로드
  const handleDownloadPdf = async (asset: Asset, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDownloadingId(asset.id);
    try {
      const res = await fetch('/api/print/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html: asset.component_code,
          format: asset.spec?.includes('90') ? 'card' : asset.spec?.includes('배너') ? 'banner' : 'flyer',
          title: asset.title,
        }),
      });

      if (!res.ok) throw new Error('PDF 다운로드 실패');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${asset.title}_300DPI_인쇄용.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      alert('인쇄용 PDF 다운로드 중 오류가 발생했습니다.');
    } finally {
      setDownloadingId(null);
    }
  };

  // 필터 및 검색 적용
  const filteredAssets = assets.filter((asset) => {
    const matchesFilter = activeFilter === 'all' || asset.type === activeFilter;
    const matchesSearch = asset.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          asset.spec?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // 타입별 뱃지 & 아이콘
  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'detail':
        return { label: '상세페이지', color: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: ShoppingBag };
      case 'video':
        return { label: '15초 숏폼', color: 'bg-red-50 text-red-700 border-red-200', icon: Video };
      case 'print':
        return { label: '인쇄물', color: 'bg-pink-50 text-pink-700 border-pink-200', icon: Printer };
      case 'blog':
        return { label: '네이버 블로그', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: FileText };
      case 'card':
        return { label: '인스타 카드뉴스', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: Camera };
      case 'karrot':
        return { label: '당근 비즈프로필', color: 'bg-orange-50 text-orange-700 border-orange-200', icon: Sparkles };
      case 'naver_place':
        return { label: '스마트플레이스', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: Sparkles };
      default:
        return { label: type, color: 'bg-slate-50 text-slate-700 border-slate-200', icon: Layers };
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* 헤더 */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/" className="flex items-center gap-1.5 text-indigo-600 font-bold text-xs sm:text-sm hover:text-indigo-800 transition shrink-0">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden xs:inline">대시보드로 돌아가기</span>
              <span className="xs:hidden">대시보드</span>
            </Link>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs shrink-0">
                <FolderArchive className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-sm sm:text-base text-slate-900 truncate">
                마케팅 에셋 보관함
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={fetchAssets}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden xs:inline">새로고침</span>
            </button>
          </div>
        </div>
      </header>

      {/* 메인 */}
      <main className="max-w-7xl mx-auto w-full px-4 lg:px-8 py-6 sm:py-8 flex-1 space-y-6">
        
        {/* 상단 브리핑 카드 */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-indigo-950/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/30 text-indigo-200 text-xs font-bold border border-indigo-400/30">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>퐁신제빵소 영구 보관 마케팅 자산</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                생성된 모든 고화질 마케팅 에셋을 한곳에서 관리하세요
              </h1>
              <p className="text-xs sm:text-sm text-indigo-200/90 max-w-2xl leading-relaxed">
                상세페이지, 15초 숏폼 릴스, 인쇄용 전단지/명함, 네이버 블로그 포스팅까지 저장된 모든 규격 에셋을 원클릭으로 열람, 복사, 재발행할 수 있습니다.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-center min-w-[100px]">
                <span className="text-[11px] text-indigo-200 block font-medium">총 보관 에셋</span>
                <span className="text-2xl font-black text-amber-300 font-mono">{assets.length}개</span>
              </div>
            </div>
          </div>
        </div>

        {/* 필터 탭 & 검색바 */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
            {[
              { id: 'all', label: '전체 보기' },
              { id: 'detail', label: '상세페이지 (860px)' },
              { id: 'video', label: '15초 숏폼' },
              { id: 'print', label: '인쇄물 (전단/배너)' },
              { id: 'blog', label: '네이버 블로그' },
              { id: 'card', label: '인스타 카드뉴스' },
              { id: 'karrot', label: '당근마켓 소식' },
              { id: 'naver_place', label: '스마트플레이스' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  activeFilter === tab.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="에셋 제목 검색..."
              className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* 에셋 갤러리 그리드 */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
            <span className="text-sm font-bold text-slate-500">에셋 라이브러리 로드 중...</span>
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-3xl border border-slate-200 p-8">
            <FolderArchive className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-base text-slate-700">보관된 에셋이 없습니다</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              스튜디오에서 콘텐츠를 생성한 후 '에셋 보관함 저장' 버튼을 누르면 이곳에 영구 보관됩니다.
            </p>
            <div className="mt-5 flex justify-center gap-2">
              <Link href="/studio/detail" className="px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition">
                상세페이지 만들기
              </Link>
              <Link href="/studio/video" className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-900 transition">
                숏폼 영상 만들기
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAssets.map((asset) => {
              const badge = getTypeBadge(asset.type);
              const BadgeIcon = badge.icon;

              return (
                <div
                  key={asset.id}
                  onClick={() => {
                    setSelectedAsset(asset);
                    setPreviewModalOpen(true);
                  }}
                  className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-lg hover:border-indigo-400 transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    {/* 상단 썸네일 영역 */}
                    <div className="relative h-44 bg-slate-100 overflow-hidden">
                      <img
                        src={asset.preview_url || 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80'}
                        alt={asset.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
                      
                      <div className="absolute top-3 left-3">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border shadow-xs backdrop-blur-md ${badge.color}`}>
                          <BadgeIcon className="w-3 h-3" />
                          <span>{badge.label}</span>
                        </span>
                      </div>

                      <div className="absolute bottom-2.5 left-3 right-3 text-white">
                        <span className="text-[10px] text-white/80 font-mono block">
                          {asset.created_at ? new Date(asset.created_at).toLocaleDateString('ko-KR') : '최근 생성'}
                        </span>
                        <span className="text-xs font-bold truncate block">
                          {asset.spec || '표준 규격'}
                        </span>
                      </div>
                    </div>

                    {/* 본문 정보 */}
                    <div className="p-4 space-y-1.5">
                      <h3 className="font-bold text-sm text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                        {asset.title}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2">
                        {asset.type === 'video' ? '15초 세로형 숏폼 시나리오 및 씬 구성 데이터' :
                         asset.type === 'blog' ? '네이버 스마트블록 상위노출 최적화 블로그 원고' :
                         asset.type === 'card' ? '인스타그램 1:1 정방형 6컷 카드뉴스' :
                         'Code-as-Asset 고화질 반응형 렌더링 코드'}
                      </p>
                    </div>
                  </div>

                  {/* 하단 액션 버튼 바 */}
                  <div className="p-3 pt-0 border-t border-slate-100 flex items-center justify-between gap-1.5 text-xs">
                    {asset.type === 'print' ? (
                      <button
                        type="button"
                        disabled={downloadingId === asset.id}
                        onClick={(e) => handleDownloadPdf(asset, e)}
                        className="flex-1 py-1.5 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 font-bold flex items-center justify-center gap-1 transition disabled:opacity-50"
                        title="인쇄소 접수용 300 DPI PDF 다운로드"
                      >
                        <Download className={`w-3.5 h-3.5 ${downloadingId === asset.id ? 'animate-bounce' : ''}`} />
                        <span>{downloadingId === asset.id ? '생성 중...' : 'PDF 인쇄'}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => handleCopyCode(asset, e)}
                        className="flex-1 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold flex items-center justify-center gap-1 transition"
                      >
                        {copiedId === asset.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedId === asset.id ? '복사됨' : '코드 복사'}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={(e) => handlePublish(asset, e)}
                      className="flex-1 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center gap-1 transition"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>재발행</span>
                    </button>

                    <button
                      type="button"
                      disabled={deletingId === asset.id}
                      onClick={(e) => handleDelete(asset.id, e)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                      title="에셋 삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </main>

      {/* 푸터 영역 */}
      <Footer />

      {/* 에셋 실물 상세 미리보기 모달 */}
      {previewModalOpen && selectedAsset && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 text-white rounded-3xl w-full max-w-4xl max-h-[90vh] shadow-2xl border border-slate-700 flex flex-col overflow-hidden animate-fadeIn">
            
            {/* 모달 헤더 */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-600 text-white">
                  {getTypeBadge(selectedAsset.type).label}
                </span>
                <h2 className="font-bold text-base text-white truncate max-w-md">
                  {selectedAsset.title}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                {selectedAsset.type === 'print' && (
                  <button
                    disabled={downloadingId === selectedAsset.id}
                    onClick={() => handleDownloadPdf(selectedAsset)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-xs font-bold text-white transition shadow-sm disabled:opacity-50"
                  >
                    <Download className={`w-3.5 h-3.5 ${downloadingId === selectedAsset.id ? 'animate-bounce' : ''}`} />
                    <span>{downloadingId === selectedAsset.id ? 'PDF 생성 중...' : '300 DPI PDF 다운로드'}</span>
                  </button>
                )}

                <button
                  onClick={() => handleCopyCode(selectedAsset)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedId === selectedAsset.id ? '복사 완료' : '전체 복사'}</span>
                </button>

                <button
                  onClick={() => handlePublish(selectedAsset)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>원클릭 재발행</span>
                </button>

                <button
                  onClick={() => setPreviewModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 모달 바디: 콘텐츠 실물 렌더링 뷰어 */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-950 flex justify-center">
              {selectedAsset.type === 'detail' || selectedAsset.type === 'print' ? (
                /* HTML 렌더링 */
                <div
                  className="bg-white text-slate-900 rounded-2xl overflow-hidden shadow-2xl p-4 max-w-2xl w-full"
                  dangerouslySetInnerHTML={{ __html: selectedAsset.component_code }}
                />
              ) : selectedAsset.type === 'blog' ? (
                /* 블로그 본문 뷰어 */
                <div className="bg-white text-slate-900 rounded-2xl p-8 max-w-2xl w-full whitespace-pre-wrap font-sans text-sm leading-relaxed shadow-xl">
                  {selectedAsset.component_code}
                </div>
              ) : (
                /* JSON 코드 뷰어 (숏폼 / 카드뉴스) */
                <div className="w-full max-w-2xl">
                  <pre className="bg-slate-900 text-indigo-300 p-5 rounded-2xl text-xs overflow-x-auto font-mono border border-slate-800">
                    {selectedAsset.component_code}
                  </pre>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* 푸터 (모바일 하단 내비바 세이프 패딩) */}
      <div className="pb-16 sm:pb-0 mt-8">
        <Footer />
      </div>

    </div>
  );
}
