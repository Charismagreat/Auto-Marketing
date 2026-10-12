'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar as CalendarIcon,
  Sparkles,
  Video,
  FileText,
  Camera,
  ShoppingBag,
  Printer,
  Clock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Plus,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Send,
  X,
} from 'lucide-react';

export default function CalendarPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // 새 일정 폼 상태
  const [newTitle, setNewTitle] = useState('');
  const [newPlatform, setNewPlatform] = useState('instagram');
  const [newChannelType, setNewChannelType] = useState('15초 숏폼 릴스');
  const [newDate, setNewDate] = useState('');
  const [newTimeSlot, setNewTimeSlot] = useState('오후 02:00');
  const [newTip, setNewTip] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [autoGenerating, setAutoGenerating] = useState(false);

  // 1. DB 캠페인 및 비즈니스 데이터 로드
  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const [campRes, bootRes] = await Promise.all([
        fetch('/api/campaigns'),
        fetch('/api/bootstrap'),
      ]);
      const campJson = await campRes.json();
      const bootJson = await bootRes.json();

      if (campJson.success) {
        setCampaigns(campJson.campaigns || []);
      }
      if (bootJson.success && bootJson.bundle) {
        setBusiness(bootJson.bundle.business);
      }
    } catch (err) {
      console.error('Fetch campaigns error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  // ⚡ AI 7일 주간 골든 마케팅 오토 파일럿 일괄 생성
  const handleAutoGenerateWeek = async () => {
    if (!confirm('현재 매장과 상품 정보를 분석하여 7일간의 주간 마케팅 오토파일럿 스케줄을 자동으로 등록하시겠습니까?')) return;
    setAutoGenerating(true);
    try {
      const res = await fetch('/api/campaigns/auto-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: business?.id }),
      });
      const json = await res.json();
      if (json.success) {
        alert(json.message || '7일간의 주간 마케팅 스케줄이 성공적으로 등록되었습니다!');
        fetchCampaigns();
      } else {
        alert(`오류: ${json.error}`);
      }
    } catch (err) {
      console.error('Auto generate error:', err);
      alert('스케줄 생성 중 오류가 발생했습니다.');
    } finally {
      setAutoGenerating(false);
    }
  };

  // 플랫폼별 스튜디오 링크 매핑
  const getStudioLink = (platform: string, channelType: string = '') => {
    if (platform === 'karrot') {
      return '/studio/social';
    }
    if (platform === 'naver_place') {
      return '/studio/social';
    }
    if (platform === 'instagram' || channelType.includes('릴스') || channelType.includes('숏폼')) {
      return '/studio/video';
    }
    if (platform === 'print' || channelType.includes('전단') || channelType.includes('배너') || channelType.includes('명함')) {
      return '/studio/print';
    }
    if (platform === 'blog' || platform === 'card' || channelType.includes('블로그') || channelType.includes('카드뉴스')) {
      return '/studio/social';
    }
    if (platform === 'store' || channelType.includes('상세페이지')) {
      return '/studio/detail';
    }
    return '/studio/social';
  };

  // 캠페인 상태 변경 및 발행 예약
  const handleUpdateStatus = async (camp: any, nextStatus: string) => {
    setPublishingId(camp.id);
    try {
      const res = await fetch('/api/campaigns', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: camp.id, status: nextStatus }),
      });
      const json = await res.json();
      if (json.success) {
        await fetch('/api/publish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            target: 'scheduler',
            title: camp.title,
            scheduledTime: `${camp.scheduled_at} ${camp.time_slot || ''}`,
          }),
        }).catch(() => {});

        setCampaigns((prev) =>
          prev.map((c) => (c.id === camp.id ? { ...c, status: nextStatus } : c))
        );
        alert(`[${camp.title}] 일정이 성공적으로 '${nextStatus === 'published' ? '즉시 발행 완료' : '자동 예약'}' 상태로 갱신되었습니다.`);
      }
    } catch (err) {
      console.error('Update status error:', err);
    } finally {
      setPublishingId(null);
    }
  };

  // 새 마케팅 일정 DB 저장
  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: business?.id || 'biz_pongshin_baegot',
          title: newTitle,
          platform: newPlatform,
          channel_type: newChannelType,
          scheduled_at: newDate,
          time_slot: newTimeSlot,
          tip: newTip || 'AI가 제안하는 타겟 맞춤형 마케팅 메시지입니다.',
          status: 'scheduled',
        }),
      });
      const json = await res.json();
      if (json.success) {
        setShowAddModal(false);
        setNewTitle('');
        setNewTip('');
        fetchCampaigns();
      }
    } catch (err) {
      console.error('Create campaign error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // 플랫폼별 배지 스타일 헬퍼
  const getPlatformBadge = (platform: string) => {
    switch (platform) {
      case 'karrot':
        return <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-200">🥕 당근마켓</span>;
      case 'naver_place':
        return <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">🌿 스마트플레이스</span>;
      case 'instagram':
        return <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-pink-50 text-pink-700 border border-pink-200">📷 인스타그램</span>;
      case 'blog':
        return <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">📝 네이버 블로그</span>;
      case 'card':
        return <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">📸 6컷 카드뉴스</span>;
      case 'print':
        return <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">🖨️ 인쇄물 PDF</span>;
      default:
        return <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">⚡ 마케팅 에셋</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* 헤더 */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
              <ArrowLeft className="w-4 h-4" />
              <span>대시보드로 돌아가기</span>
            </Link>
            <Link href="/library" className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-bold hover:bg-indigo-100 transition border border-indigo-200">
              <span>📦 에셋 보관함</span>
            </Link>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-indigo-600" />
              <span className="font-extrabold text-base text-slate-900">
                AI 마케팅 오토 캘린더 & 캠페인 스케줄러
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleAutoGenerateWeek}
              disabled={autoGenerating}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white font-extrabold text-xs shadow-md transition disabled:opacity-50"
            >
              {autoGenerating ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 text-amber-200" />
              )}
              <span>{autoGenerating ? '7일 스케줄 AI 기획 중...' : '⚡ AI 주간 7일 오토파일럿 플래닝'}</span>
            </button>

            <button
              onClick={() => {
                setNewDate(new Date().toISOString().slice(0, 10));
                setShowAddModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>새 일정 추가</span>
            </button>

            <button
              onClick={fetchCampaigns}
              disabled={loading}
              className="p-1.5 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto w-full px-4 lg:px-8 py-8 flex-1 space-y-8">
        
        {/* 상단 브리핑 카드 */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-indigo-950/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/30 text-indigo-200 text-xs font-bold border border-indigo-400/30">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>{business?.name || '퐁신제빵소'} 주간 100% 자동 마케팅 로드맵</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                사장님은 빵만 구우세요, 마케팅은 AI가 발행합니다
              </h1>
              <p className="text-xs sm:text-sm text-indigo-200/90 max-w-2xl leading-relaxed">
                요일별 최적 노출 시간대에 맞춰 숏폼 영상, 네이버 블로그, 인스타 카드뉴스, 당근마켓 소식, 스마트플레이스 쿠폰이 빈틈없이 연결되어 고객을 자동으로 불러옵니다.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-center">
                <span className="text-[11px] text-indigo-200 block font-medium">등록된 캠페인</span>
                <span className="text-2xl font-black text-amber-300 font-mono">{campaigns.length}건</span>
              </div>
              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-center">
                <span className="text-[11px] text-indigo-200 block font-medium">예상 매출 증대 효과</span>
                <span className="text-2xl font-black text-emerald-300 font-mono">+32%</span>
              </div>
            </div>
          </div>
        </div>

        {/* 주간 캘린더 그리드 */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
            <span className="text-sm font-bold text-slate-500">데이터베이스에서 캠페인 스케줄 로드 중...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {campaigns.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-3xl p-5 border border-slate-200 hover:border-indigo-400 transition-all shadow-xs hover:shadow-md flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getPlatformBadge(item.platform)}
                      <span className="font-extrabold text-sm text-slate-900">
                        {item.scheduled_at}
                      </span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      item.status === 'published'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : item.status === 'draft'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {item.status === 'published' ? '발행 완료' : item.status === 'draft' ? '초안 검토' : '자동 예약'}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 mb-3 space-y-1">
                    <span className="text-[10px] font-bold text-indigo-600 block">
                      {item.channel_type || item.platform}
                    </span>
                    <h3 className="font-bold text-xs text-slate-800 line-clamp-2">
                      {item.title}
                    </h3>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-500 mb-4">
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>발행 예정: <strong>{item.time_slot || '시간 미지정'}</strong></span>
                    </div>
                    {item.tip && (
                      <p className="text-[11px] text-slate-500 bg-amber-50/70 p-2.5 rounded-xl border border-amber-200/50 leading-relaxed">
                        💡 {item.tip}
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-2 space-y-2">
                  <button
                    type="button"
                    disabled={publishingId === item.id}
                    onClick={() => handleUpdateStatus(item, item.status === 'published' ? 'scheduled' : 'published')}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition disabled:opacity-50"
                  >
                    {publishingId === item.id ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    )}
                    <span>{item.status === 'published' ? '예약 상태로 되돌리기' : '원클릭 즉시 발행 승인'}</span>
                  </button>

                  <Link
                    href={getStudioLink(item.platform, item.channel_type)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                  >
                    <span>에셋 스튜디오에서 편집</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

      </main>

      {/* 새 일정 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-indigo-600" />
                <span>새 마케팅 캠페인 등록</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">캠페인 제목</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="예: 주말 깜짝 1+1 타임 세일 릴스"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">발행 채널</label>
                  <select
                    value={newPlatform}
                    onChange={(e) => {
                      setNewPlatform(e.target.value);
                      if (e.target.value === 'karrot') setNewChannelType('당근 비즈프로필 소식');
                      if (e.target.value === 'naver_place') setNewChannelType('스마트플레이스 알림 쿠폰');
                      if (e.target.value === 'instagram') setNewChannelType('15초 숏폼 릴스');
                      if (e.target.value === 'blog') setNewChannelType('네이버 블로그 롱폼');
                      if (e.target.value === 'card') setNewChannelType('인스타 6컷 카드뉴스');
                      if (e.target.value === 'print') setNewChannelType('A4 전단지 & X배너');
                      if (e.target.value === 'store') setNewChannelType('스마트스토어 860px');
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="karrot">🥕 당근마켓 소식</option>
                    <option value="naver_place">🌿 스마트플레이스 쿠폰</option>
                    <option value="instagram">📷 인스타그램 릴스</option>
                    <option value="blog">📝 네이버 블로그</option>
                    <option value="card">📸 인스타 카드뉴스</option>
                    <option value="print">🖨️ 인쇄물 (전단/배너)</option>
                    <option value="store">🛒 스마트스토어</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">상세 유형</label>
                  <input
                    type="text"
                    value={newChannelType}
                    onChange={(e) => setNewChannelType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">발행 예정일</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">시간대</label>
                  <input
                    type="text"
                    value={newTimeSlot}
                    onChange={(e) => setNewTimeSlot(e.target.value)}
                    placeholder="오후 02:00"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">마케팅 팁 / 메모</label>
                <textarea
                  rows={2}
                  value={newTip}
                  onChange={(e) => setNewTip(e.target.value)}
                  placeholder="예: 오후 시간대 직장인 단체 간식 타겟팅"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>등록 완료</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
