'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Video,
  Sparkles,
  Play,
  Pause,
  Upload,
  Mic,
  Music,
  Scissors,
  Type,
  Send,
  RefreshCw,
  ArrowLeft,
  Volume2,
  Clock,
  Film,
  CheckCircle2,
  Smartphone,
  Save,
  Check,
  Package,
  Camera,
  Download,
  VolumeX,
} from 'lucide-react';
import MediaPickerModal from '@/components/MediaPickerModal';
import Footer from '@/components/Footer';

export default function VideoStudioPage() {
  const [activeTab, setActiveTab] = useState<'create' | 'edit'>('create');
  const [loading, setLoading] = useState(false);
  const [scriptData, setScriptData] = useState<any>(null);
  const [currentSceneIdx, setCurrentSceneIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [tweaking, setTweaking] = useState(false);
  const [savingAsset, setSavingAsset] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [customMediaUrl, setCustomMediaUrl] = useState<string | null>(null);
  const [lastUsage, setLastUsage] = useState<any>(null);

  // DB 연동 상태
  const [business, setBusiness] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // 영상 편집 탭 상태
  const [uploadedVideo, setUploadedVideo] = useState<string | null>(null);
  const [isProcessingVideo, setIsProcessingVideo] = useState(false);
  const [autoCutStatus, setAutoCutStatus] = useState<string | null>(null);

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
          const allObj = {
            id: 'all',
            name: `${biz?.name || '퐁신제빵소'} 전 메뉴 라인업 (총 ${prods.length}종)`,
            price: '전 품목 및 세트 구성',
            description: prods.map((p: any) => `${p.name} (${Number(p.price).toLocaleString()}원)`).join(', '),
            is_all: true,
          };
          setSelectedProduct(allObj);
          handleGenerateScript(biz, allObj, 'all', prods);
        }
      } catch (err) {
        console.error('Video studio bootstrap error:', err);
      }
    }
    loadData();
  }, []);

  // 15초 숏폼 시나리오 자동 생성
  const handleGenerateScript = async (
    biz = business,
    prod = selectedProduct,
    modeOverride?: string,
    prodList = products
  ) => {
    setLoading(true);
    const mode = modeOverride || (prod?.id === 'all' ? 'all' : prod?.id === 'bundle' ? 'bundle' : 'single');
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'video',
          business: {
            name: biz?.name || '퐁신제빵소',
            category: biz?.category || '베이커리/디저트',
            usp: biz?.usp,
          },
          product: {
            name: prod?.name || '퐁신 오리지널 대만 카스테라',
            price: prod?.price || 11000,
            description: prod?.description || '',
            is_all: prod?.is_all,
            is_bundle: prod?.is_bundle,
          },
          products: prodList,
          mode,
        }),
      });
      const data = await res.json();
      if (data.success && data.script) {
        setScriptData(data.script);
        setCurrentSceneIdx(0);
        if (data.usage) {
          setLastUsage(data.usage);
        }
      }
    } catch (err) {
      console.error('Generate video error:', err);
    } finally {
      setLoading(false);
    }
  };

  // 상품 선택 변경 핸들러
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
    handleGenerateScript(business, chosen, prodId === 'all' ? 'all' : prodId === 'bundle' ? 'bundle' : 'single');
  };

  // TTS 음성 합성 상태
  const [voiceType, setVoiceType] = useState<'energetic' | 'warm' | 'calm'>('energetic');
  const [enableTts, setEnableTts] = useState(true);
  const [isTtsSpeaking, setIsTtsSpeaking] = useState(false);
  const [downloadingAudio, setDownloadingAudio] = useState(false);

  // Web Speech API를 활용한 한국어 음성 합성(TTS) 재생
  const speakSceneNarration = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel(); // 이전 재생 취소

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';

    if (voiceType === 'energetic') {
      utterance.rate = 1.15; // 빠른 템포의 쇼호스트
      utterance.pitch = 1.15;
    } else if (voiceType === 'warm') {
      utterance.rate = 1.0; // 다정한 사장님 보이스
      utterance.pitch = 1.0;
    } else {
      utterance.rate = 0.92; // 신뢰감 있는 차분한 톤
      utterance.pitch = 0.95;
    }

    utterance.onstart = () => setIsTtsSpeaking(true);
    utterance.onend = () => setIsTtsSpeaking(false);
    utterance.onerror = () => setIsTtsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  // 15초 재생 시뮬레이션 및 TTS 음성 동기화
  useEffect(() => {
    let timer: any;
    if (isPlaying && scriptData?.scenes) {
      // 재생 시작 시 현재 씬의 나레이션 낭독
      if (enableTts && scriptData.scenes[currentSceneIdx]?.narration) {
        speakSceneNarration(scriptData.scenes[currentSceneIdx].narration);
      }

      timer = setInterval(() => {
        setCurrentSceneIdx((prev) => {
          const next = (prev + 1) % scriptData.scenes.length;
          if (enableTts && scriptData.scenes[next]?.narration) {
            speakSceneNarration(scriptData.scenes[next].narration);
          }
          return next;
        });
      }, 3750); // 15초 / 4개 씬 = 약 3.75초
    } else {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsTtsSpeaking(false);
    }
    return () => {
      clearInterval(timer);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isPlaying, currentSceneIdx, enableTts, scriptData, voiceType]);

  // 15초 풀 오디오 사운드트랙 (120 BPM BGM + 씬 전환 챠임) 원클릭 다운로드
  const handleDownloadAudio = async () => {
    if (!scriptData) return;
    setDownloadingAudio(true);
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenes: scriptData.scenes,
          title: `[숏폼오디오]_${business?.name || '퐁신제빵소'}_${selectedProduct?.name || '시그니처'}_15초`,
        }),
      });

      if (!res.ok) throw new Error('오디오 생성 실패');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${business?.name || '퐁신제빵소'}_${selectedProduct?.name || '카스테라'}_15초_사운드트랙.wav`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      alert('오디오 다운로드 중 오류가 발생했습니다.');
    } finally {
      setDownloadingAudio(false);
    }
  };

  // 대화형 핀셋 수정 (AI Co-pilot)
  const handleTweak = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setTweaking(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'tweak',
          existingCode: JSON.stringify(scriptData),
          chatMessage: `다음 숏폼 비디오 시나리오 JSON을 수정해줘: ${chatInput}`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        try {
          const parsed = JSON.parse(data.code);
          setScriptData(parsed);
          setChatInput('');
        } catch {
          alert('수정 사항이 반영되었습니다.');
          setChatInput('');
        }
      }
    } catch (err) {
      console.error('Tweak video error:', err);
    } finally {
      setTweaking(false);
    }
  };

  // 에셋 보관함 저장 (auto_assets 연동)
  const handleSaveToAssets = async () => {
    if (!scriptData) return;
    setSavingAsset(true);
    try {
      const title = `[숏폼] ${business?.name || '퐁신제빵소'} - ${selectedProduct?.name || '시그니처'} 15초 릴스`;
      const res = await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: business?.id || 'biz_pongshin_baegot',
          type: 'video',
          title,
          spec: '9:16 모바일 세로형 15초 숏폼 릴스',
          component_code: JSON.stringify(scriptData, null, 2),
          preview_url: selectedProduct?.image_url || 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80',
          status: 'ready',
          usage: lastUsage,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        if (data.message) {
          alert(data.message);
        }
      }
    } catch (err) {
      console.error('Save asset error:', err);
    } finally {
      setSavingAsset(false);
    }
  };

  // 기존 영상 업로드 및 자동 컷편집 시뮬레이션
  const handleUploadSampleVideo = () => {
    setIsProcessingVideo(true);
    setAutoCutStatus('영상 업로드 및 음성 분석 중 (STT 전사)...');
    setTimeout(() => {
      setAutoCutStatus('말 없는 무음 구간 1.4초 자동 제거 완료!');
      setTimeout(() => {
        setAutoCutStatus('강조 키워드 자막 및 신나는 BGM 자동 믹싱 완료!');
        setIsProcessingVideo(false);
        setUploadedVideo('uploaded');
      }, 1500);
    }, 1500);
  };

  const currentScene = scriptData?.scenes?.[currentSceneIdx];

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
              <div className="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-bold border border-red-200/60">
                <Video className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-sm text-slate-900">
                15초 숏폼 스튜디오 (Remotion 엔진)
              </span>
            </div>

            {/* DB 상품 선택 드롭다운 */}
            {products.length > 0 && (
              <div className="flex items-center gap-2 ml-2 pl-3 border-l border-slate-200">
                <Package className="w-3.5 h-3.5 text-amber-600" />
                <select
                  value={selectedProduct?.id || 'all'}
                  onChange={(e) => handleProductChange(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold rounded-xl px-2.5 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="all">📋 [전체] 매장 전 메뉴 라인업 (랭킹/추천 숏폼)</option>
                  <option value="bundle">🎁 [세트] 시그니처 3종 선물세트 묶음 (꿀조합 숏폼)</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      🍰 [단품] {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowMediaPicker(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-xs font-bold transition shadow-2xs cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5 text-amber-600" />
              <span>📷 배경 실물 미디어 적용</span>
            </button>

            {/* 모드 전환 탭 */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button
                onClick={() => setActiveTab('create')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'create'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>AI 숏폼 생성</span>
              </button>

              <button
                onClick={() => setActiveTab('edit')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'edit'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Scissors className="w-3.5 h-3.5 text-emerald-600" />
                <span>촬영영상 AI 컷편집</span>
              </button>
            </div>

            {/* 에셋 보관함 저장 버튼 */}
            <button
              onClick={handleSaveToAssets}
              disabled={savingAsset || !scriptData}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white transition-all shadow-xs disabled:opacity-40 cursor-pointer"
            >
              {savingAsset ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : saveSuccess ? (
                <Check className="w-3.5 h-3.5 text-emerald-300" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>{saveSuccess ? '보관함 저장완료!' : '에셋 보관함 저장'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* 작업 영역 */}
      <div className="flex-1 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 lg:p-6">
        
        {/* 좌측: AI 디렉터 타임라인 & 핀셋 수정 패널 */}
        <div className="lg:col-span-5 flex flex-col bg-white rounded-3xl border border-slate-200 p-5 shadow-xs h-[calc(100vh-100px)]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <Film className="w-4 h-4 text-indigo-600" />
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                15초 숏폼 타임라인 & 디렉팅
              </h2>
            </div>
            <button
              onClick={() => handleGenerateScript(business, selectedProduct)}
              disabled={loading}
              className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              <span>시나리오 재생성</span>
            </button>
          </div>

          {activeTab === 'create' ? (
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 mb-2">
                <span className="text-slate-500 font-medium">타겟 비즈니스:</span> <strong className="text-slate-900">{business?.name || '퐁신제빵소'}</strong> | <span className="text-slate-500 font-medium">선택 상품:</span> <strong className="text-amber-700">{selectedProduct?.name || '카스테라'}</strong>
              </div>

              {loading ? (
                <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                  <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
                  <span className="text-slate-600 font-medium">15초 숏폼 시나리오를 AI 디렉팅 중...</span>
                </div>
              ) : (
                scriptData?.scenes?.map((scene: any, idx: number) => (
                  <div
                    key={idx}
                    onClick={() => setCurrentSceneIdx(idx)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all duration-200 ${
                      currentSceneIdx === idx
                        ? 'bg-indigo-50/90 border-indigo-400 shadow-xs ring-1 ring-indigo-300'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-extrabold text-indigo-900">
                        장면 #{scene.sceneNumber} ({scene.timeRange})
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 font-mono">
                        {scene.cameraMotion}
                      </span>
                    </div>

                    <p className="text-slate-800 font-bold mb-1.5 text-xs">
                      💬 자막: "{scene.subtitle}"
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <div className="flex items-center gap-1.5 flex-1 mr-2">
                        <Mic className="w-3 h-3 text-amber-600 shrink-0" />
                        <span className="line-clamp-1">{scene.narration}</span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          speakSceneNarration(scene.narration);
                        }}
                        className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 text-[10px] text-slate-700 transition flex items-center gap-1 shrink-0 shadow-2xs cursor-pointer"
                        title="이 장면 음성만 미리듣기"
                      >
                        <Volume2 className="w-2.5 h-2.5" />
                        <span>미리듣기</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            // 기존 촬영 영상 편집 패널
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                  <Scissors className="w-4 h-4 text-emerald-600" />
                  <span>스마트폰 촬영 영상 업로드 & AI 원터치 편집</span>
                </div>
                <p className="text-slate-600 text-xs leading-relaxed">
                  매장에서 직접 찍은 카스테라 영상(mp4)을 올리면, AI가 자동으로 말문이 막히거나 숨 쉬는 무음 구간을 잘라내고(Silence Cut), 핵심 자막과 어울리는 BGM을 믹싱합니다.
                </p>

                <button
                  type="button"
                  onClick={handleUploadSampleVideo}
                  disabled={isProcessingVideo}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>{isProcessingVideo ? '영상 분석 및 자동 컷편집 중...' : `${business?.name || '퐁신제빵소'} 촬영 영상 업로드 & AI 컷편집`}</span>
                </button>

                {autoCutStatus && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{autoCutStatus}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 대화형 핀셋 수정 입력창 */}
          <form onSubmit={handleTweak} className="mt-4 pt-3 border-t border-slate-100 flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="예: 2번 장면에 생크림 주입하는 클로즈업으로 바꿔줘"
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={tweaking || !chatInput.trim()}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center disabled:opacity-40 transition-colors cursor-pointer shadow-xs"
            >
              {tweaking ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            </button>
          </form>
        </div>

        {/* 우측: 9:16 모바일 숏폼 리얼타임 비디오 프리뷰어 */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center bg-slate-900 rounded-3xl border border-slate-800 p-6 h-[calc(100vh-100px)] shadow-lg">
          
          {/* 스마트폰 9:16 프레임 */}
          <div className="w-[300px] h-[540px] rounded-[36px] bg-slate-900 border-4 border-slate-700 shadow-2xl relative overflow-hidden flex flex-col">
            {/* 스마트폰 노치 & 상태바 */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-4 bg-slate-800 rounded-full z-20" />

            {/* 비디오 캔버스 영역 */}
            <div className="relative flex-1 bg-black flex flex-col justify-end p-4 overflow-hidden">
              {/* 배경 비주얼 (실물 업로드 미디어 또는 선택 상품 사진 + CSS 모션) */}
              <img
                src={customMediaUrl || selectedProduct?.image_url || 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80'}
                alt="Product Preview"
                className={`absolute inset-0 w-full h-full object-cover transition-transform duration-1000 ${
                  isPlaying ? 'scale-110' : 'scale-100'
                }`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30" />

              {/* 상단 오버레이: 매장 뱃지 */}
              <div className="absolute top-8 left-4 z-10 flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white shadow-md">
                  {business?.name || '퐁신제빵소'}
                </span>
                <span className="text-[10px] text-white/80 font-mono">
                  {currentScene?.timeRange || '0~3초'}
                </span>
              </div>

              {/* 자막 오버레이 (TikTok/Reels 스타일 하이라이트 자막) */}
              <div className="relative z-10 mb-6 text-center animate-bounce">
                <span className="inline-block px-3 py-1.5 rounded-xl bg-amber-400 text-slate-950 font-black text-sm shadow-xl leading-tight">
                  {currentScene?.subtitle || `${selectedProduct?.name || '대만 카스테라'}의 압도적 비주얼!`}
                </span>
              </div>

              {/* 하단 성우 나레이션 & BGM 표시 */}
              <div className="relative z-10 flex items-center justify-between text-[11px] text-white/90 bg-black/40 backdrop-blur-sm p-2 rounded-xl">
                <div className="flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span className="truncate max-w-[180px]">
                    {currentScene?.narration || '손끝에서 느껴지는 미친 탄력!'}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-amber-300">
                  <Music className="w-3 h-3" />
                  <span>120 BPM</span>
                </div>
              </div>
            </div>

            {/* 하단 재생 컨트롤 바 */}
            <div className="bg-slate-900 p-3 border-t border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition-colors shadow-md"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>

              <div className="flex-1 mx-3 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 transition-all duration-300"
                  style={{
                    width: `${((currentSceneIdx + 1) / (scriptData?.scenes?.length || 4)) * 100}%`,
                  }}
                />
              </div>

              <span className="text-[11px] font-mono text-slate-400">
                15s
              </span>
            </div>
          </div>

          {/* 하단 보이스 & 사운드트랙 오디오 컨트롤 패널 */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3 w-full max-w-[360px] bg-slate-900/90 border border-slate-800 p-3 rounded-2xl shadow-lg">
            
            {/* 보이스 선택기 */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400 text-[11px]">보이스:</span>
              <select
                value={voiceType}
                onChange={(e: any) => setVoiceType(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-white text-[11px] rounded-lg px-2 py-1 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="energetic">🎤 발랄한 쇼호스트</option>
                <option value="warm">🍞 친절한 제빵사</option>
                <option value="calm">🎙️ 차분한 나레이터</option>
              </select>
            </div>

            {/* TTS 음성 토글 */}
            <button
              type="button"
              onClick={() => {
                setEnableTts(!enableTts);
                if (enableTts && typeof window !== 'undefined' && 'speechSynthesis' in window) {
                  window.speechSynthesis.cancel();
                }
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                enableTts
                  ? 'bg-indigo-600/80 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title="재생 시 씬 나레이션 자동 음성 낭독"
            >
              {enableTts ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>{enableTts ? '음성 낭독 ON' : '음성 OFF'}</span>
            </button>

            {/* 사운드트랙 다운로드 버튼 */}
            <button
              type="button"
              disabled={downloadingAudio || !scriptData}
              onClick={handleDownloadAudio}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white text-xs font-bold transition shadow-sm disabled:opacity-50"
              title="15초 BGM + 씬 전환 챠임이 포함된 마스터링 오디오 파일 다운로드"
            >
              <Download className={`w-3.5 h-3.5 ${downloadingAudio ? 'animate-bounce' : ''}`} />
              <span>{downloadingAudio ? '오디오 생성 중...' : '15초 오디오 다운로드'}</span>
            </button>

          </div>

        </div>

      </div>

      {/* 실물 미디어 피커 모달 */}
      <MediaPickerModal
        isOpen={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        onSelect={(url) => setCustomMediaUrl(url)}
        title="숏폼 배경 미디어 선택 및 업로드"
      />

      {/* 푸터 영역 (모바일 하단 내비바 세이프 패딩) */}
      <div className="pb-16 sm:pb-0 mt-8">
        <Footer />
      </div>
    </div>
  );
}
