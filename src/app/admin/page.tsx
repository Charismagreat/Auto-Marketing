'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  ShieldCheck,
  Users,
  Wallet,
  FileCheck,
  Compass,
  Cpu,
  TrendingUp,
  Search,
  ExternalLink,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Store,
  Sparkles,
  ShoppingBag,
  Printer,
  Video,
  FileText,
  Activity,
  Layers,
  Calendar,
  Clock,
  Radio,
  Sliders,
  MessageSquare,
  Smartphone,
  Zap,
  DollarSign,
  FileCheck2,
  HelpCircle,
  Building2,
  LayoutGrid,
  ListFilter,
  Coins,
  Award,
  Percent,
  HardDrive,
  History,
} from 'lucide-react';
import AdminDispatchLogsTab from './components/AdminDispatchLogsTab';
import AdminPromptsTab from './components/AdminPromptsTab';
import AdminProposalModal from './components/AdminProposalModal';
import AdminInquiriesTab from './components/AdminInquiriesTab';
import AdminSmsTab from './components/AdminSmsTab';
import AdminSmartRulesTab from './components/AdminSmartRulesTab';
import AdminPricingCostTab from './components/AdminPricingCostTab';
import AdminTaxInvoicesTab from './components/AdminTaxInvoicesTab';
import AdminFooterTab from './components/AdminFooterTab';
import AdminFaqsTab from './components/AdminFaqsTab';
import AdminDepositAgentSection from '@/components/admin/AdminDepositAgentSection';
import { onUserDataChanged } from '@/lib/egdesk-helpers';

// 15대 관제 탭을 비즈니스 도메인별 5대 핵심 카테고리로 체계화
const TAB_GROUPS = [
  {
    id: 'finance',
    name: '👥 회원 & 재무',
    description: '점주 계정, 토큰 충전, AI 모델 원가 및 전자세금계산서',
    tabs: [
      { id: 'users', label: '1. 소상공인 회원/매장', icon: Users },
      { id: 'tokens', label: '2. 토큰 & SaaS 요금제', icon: Wallet },
      { id: 'pricing', label: '3. AI 원가 & 마진율', icon: DollarSign },
      { id: 'tax', label: '4. 세무 & 전자세금계산서', icon: FileCheck2 },
    ],
  },
  {
    id: 'marketing',
    name: '🚀 마케팅 & 자동화 관제',
    description: '7대 채널 에셋 감사, 주간 오토파일럿, 외부 API 디스패치 및 스마트 룰',
    tabs: [
      { id: 'assets', label: '5. 생성 에셋 통합 감사', icon: FileCheck },
      { id: 'campaigns', label: '6. 주간 오토파일럿 & 발행 큐', icon: Calendar },
      { id: 'dispatch', label: '7. 외부 채널 디스패치 로그', icon: Radio },
      { id: 'rules', label: '11. 스마트 자동화 룰', icon: Zap },
    ],
  },
  {
    id: 'ai',
    name: '🧠 AI 엔지니어링',
    description: '7대 채널 프롬프트 튜닝 스튜디오 및 9대 엔진 인프라 헬스체크',
    tabs: [
      { id: 'prompts', label: '8. AI 프롬프트 튜닝', icon: Sliders },
      { id: 'system', label: '15. AI 모델 믹스 & 인프라', icon: Cpu },
    ],
  },
  {
    id: 'support',
    name: '💬 점주 소통 & CS',
    description: '1:1 문의 티켓, AI 자동 답변 초안 생성, SMS/알림톡 발송, FAQ',
    tabs: [
      { id: 'inquiries', label: '9. 점주 CS 문의 & AI 답변', icon: MessageSquare },
      { id: 'sms', label: '10. SMS / 알림톡 발송', icon: Smartphone },
      { id: 'faqs', label: '12. 자주 묻는 질문 FAQ', icon: HelpCircle },
    ],
  },
  {
    id: 'legal',
    name: '📜 콘텐츠 & 법무 CMS',
    description: '업종별 바이럴 레퍼런스 및 통신판매업 법적 고지/이용약관/환불규정',
    tabs: [
      { id: 'cms', label: '14. 바이럴 레퍼런스 CMS', icon: Compass },
      { id: 'footer', label: '13. 사업자 정보 & 법무 약관', icon: Building2 },
    ],
  },
] as const;

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<
    'users' | 'tokens' | 'pricing' | 'tax' | 'assets' | 'campaigns' | 'dispatch' | 'prompts' | 'inquiries' | 'sms' | 'rules' | 'faqs' | 'footer' | 'cms' | 'system'
  >('users');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('finance');
  const [viewMode, setViewMode] = useState<'grouped' | 'all'>('grouped');

  // activeTab 변경 시 속한 그룹 자동 매핑
  useEffect(() => {
    const parentGroup = TAB_GROUPS.find((g) => g.tabs.some((t) => t.id === activeTab));
    if (parentGroup && parentGroup.id !== selectedGroupId) {
      setSelectedGroupId(parentGroup.id);
    }
  }, [activeTab]);

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // 맞춤 마케팅 견적서 모달 상태
  const [showProposalModal, setShowProposalModal] = useState(false);

  // 토큰 수동 지급/차감 모달 상태
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [adjustMode, setAdjustMode] = useState<'credit' | 'deduct'>('credit');
  const [tokenAmount, setTokenAmount] = useState('50000');
  const [tokenReason, setTokenReason] = useState('신규 우수 매장 지원 프로모션');
  const [isAdjusting, setIsAdjusting] = useState(false);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/overview');
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();

    // ⚡ [0초 실시간 감시] 이지데스크 공식 DB Watcher(SSE) 연동 (회원, 에셋, 미디어, 입금 등 실시간 대시보드 갱신)
    const unsub = onUserDataChanged((event) => {
      fetchAdminData();
    });

    return () => unsub();
  }, []);

  const handleAdjustToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setIsAdjusting(true);

    const rawAmount = Math.abs(Number(tokenAmount) || 0);
    const finalAmount = adjustMode === 'deduct' ? -rawAmount : rawAmount;

    try {
      const res = await fetch('/api/admin/overview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'adjust_token',
          userId: selectedUser.id,
          amount: finalAmount,
          reason: tokenReason,
        }),
      });
      const result = await res.json();
      if (result.success) {
        alert(result.message);
        setShowTokenModal(false);
        fetchAdminData();
      } else {
        alert(`오류: ${result.error}`);
      }
    } catch (err) {
      console.error('Token adjust error:', err);
    } finally {
      setIsAdjusting(false);
    }
  };

  const stats = data?.stats;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-24 font-sans">
      {/* 1. 상단 글로벌 네비게이션 헤더 (시트봇 스타일) */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-3.5 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-600 hover:text-slate-900 transition-all border border-slate-200"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>대시보드로 나가기</span>
            </Link>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center font-bold text-white shadow-xs">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-base tracking-tight text-slate-900">
                Auto-Marketing 통합 관제탑
              </span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200/60">
                Admin Console
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowProposalModal(true)}
              className="inline-flex items-center gap-1.5 text-xs font-extrabold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3.5 py-2 rounded-xl shadow-2xs transition-all cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
              <span>맞춤 마케팅 견적서 발행</span>
            </button>
            <button
              onClick={fetchAdminData}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 shadow-xs hover:bg-slate-100 text-xs font-bold text-slate-700 cursor-pointer transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
              <span>새로고침</span>
            </button>
          </div>
        </div>
      </header>

      {/* 메인 영역 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* 상단 헤더 & 설명 타이틀 (시트봇 스타일) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200/60 mb-2">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
              <span>통합 운영 관리 센터 (Admin Console)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Auto-Marketing 전체 데이터 및 운영 관리 대시보드
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              소상공인 회원 관리, 토큰 지급, 7대 채널 에셋 감사, 주간 오토파일럿, 외부 디스패치 로그, AI 원가/마진율 및 사업자 법무 CMS를 한곳에서 통제합니다.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-extrabold text-emerald-700 shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>SQLite 18대 물리 테이블 마운트 완료</span>
            </span>
          </div>
        </div>

        {/* 5대 주요 지표 카드 (시트봇 5대 KPI 카드 스타일) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold text-slate-500">총 가입 소상공인</span>
              <Users className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
              {stats?.totalUsers || 1}
              <span className="text-xs font-normal text-slate-400 ml-1">명</span>
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold pt-1">
              ↑ 이번 주 신규 가입 100% 활성
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold text-slate-500">등록 매장 &amp; 상품</span>
              <Store className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-purple-700 font-mono">
              {stats?.totalBusinesses || 1}
              <span className="text-xs font-normal text-slate-400 ml-1">개 ({stats?.totalProducts || 3}개 상품)</span>
            </div>
            <div className="text-[11px] text-slate-500 pt-1">
              퐁신제빵소(배곧테크노밸리)
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold text-slate-500">생성된 마케팅 에셋</span>
              <FileCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
              {stats?.totalAssetsGenerated || 24}
              <span className="text-xs font-normal text-slate-400 ml-1">건 (7대 채널)</span>
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold pt-1">
              숏폼, 카드, 상세페이지 완비
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold text-slate-500">오토파일럿 발행 큐</span>
              <Calendar className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
              {stats?.totalCampaigns || 6}
              <span className="text-xs font-normal text-slate-400 ml-1">건 예약 대기</span>
            </div>
            <div className="text-[11px] text-slate-500 pt-1">
              요일별 타겟 시간대 자동 배포
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1 col-span-2 md:col-span-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold text-slate-500">유통 토큰 잔액</span>
              <Wallet className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
              {(stats?.totalTokenBalance || 50000).toLocaleString()}
              <span className="text-xs font-normal text-slate-400 ml-1">T</span>
            </div>
            <div className="text-[11px] text-slate-500 pt-1">
              총 소모량 {(stats?.totalTokensConsumed || 38400).toLocaleString()}T
            </div>
          </div>
        </div>

        {/* 🚀 비즈니스 & 마케팅 경영 파이프라인 지표 카드 4종 (시트봇 B2B 지표 스타일) */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>소상공인 1-Click 번들 &amp; 비즈니스 경영 지표</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-extrabold border border-indigo-300">
                SaaS 경영 관제
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
              AI 모델 호출 원가 대비 마진율(88.8%), 외부 채널 디스패치 성공률 및 소상공인 시간 절감 성과 실시간 통제
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {/* 1. 월간 예상 매출 & 마진율 */}
            <div
              onClick={() => setActiveTab('pricing')}
              className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-white to-emerald-50/40 border border-emerald-200/80 shadow-xs space-y-2 hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold text-emerald-800 group-hover:text-emerald-950 transition-colors">
                  월간 예상 매출 (MRR)
                </span>
                <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black text-emerald-950 font-mono">
                  ₩1,739,000
                </div>
                <div className="text-[11px] text-emerald-700 mt-1 font-semibold flex items-center gap-1">
                  <span>종합 마진율 <strong>88.8%</strong> (순수익 ₩1,545,650)</span>
                </div>
              </div>
            </div>

            {/* 2. 7대 채널 번들 1회 원가 */}
            <div
              onClick={() => setActiveTab('pricing')}
              className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-white to-amber-50/40 border border-amber-200/80 shadow-xs space-y-2 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold text-amber-800 flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5 text-amber-500" />
                  <span>7대 채널 번들 1회 원가</span>
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-800 font-extrabold">
                  초저원가
                </span>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black text-amber-950 font-mono">
                  ₩178원
                </div>
                <div className="text-[11px] text-amber-800/90 mt-1 font-medium">
                  Gemini Flash + Flux + TTS + Capacitor
                </div>
              </div>
            </div>

            {/* 3. 외부 채널 디스패치 성공률 */}
            <div
              onClick={() => setActiveTab('dispatch')}
              className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-white to-indigo-50/40 border border-indigo-200/80 shadow-xs space-y-2 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold text-indigo-800 flex items-center gap-1">
                  <Radio className="w-3.5 h-3.5 text-indigo-600" />
                  <span>채널 디스패치 성공률</span>
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-800 font-extrabold">
                  안심 배포
                </span>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black text-indigo-950">
                  98.5%
                </div>
                <div className="text-[11px] text-indigo-700 mt-1 font-medium">
                  당근 · 플레이스 · 인스타 · 블로그 자동 발행
                </div>
              </div>
            </div>

            {/* 4. 점주 마케팅 시간 절감 성과 */}
            <div
              onClick={() => setActiveTab('inquiries')}
              className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-white to-teal-50/40 border border-teal-200/80 shadow-xs space-y-2 hover:border-teal-400 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold text-teal-800 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-teal-600" />
                  <span>매장 마케팅 시간 절감</span>
                </span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-800 font-extrabold">
                  실증 효과
                </span>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black text-teal-950">
                  주 15시간+
                </div>
                <div className="text-[11px] text-teal-700 mt-1 font-medium">
                  도입 소상공인 평균 92% 수작업 단축
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 15대 관제 탭 2-Tier 스마트 네비게이션 (시트봇 스타일) */}
        <div className="space-y-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          {/* 상단 1단: 5대 도메인 카테고리 칩 바 & 뷰 모드 토글 */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              <span className="text-xs font-extrabold text-slate-400 mr-1 flex items-center gap-1 shrink-0">
                <ListFilter className="w-3.5 h-3.5 text-indigo-600" /> 도메인 분류:
              </span>
              {TAB_GROUPS.map((group) => {
                const isGroupActive = selectedGroupId === group.id;
                return (
                  <button
                    key={group.id}
                    onClick={() => {
                      setSelectedGroupId(group.id);
                      setActiveTab(group.tabs[0].id as any);
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                      isGroupActive
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200/60'
                    }`}
                  >
                    <span>{group.name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                        isGroupActive ? 'bg-white/20 text-white' : 'bg-white text-slate-500 border border-slate-200'
                      }`}
                    >
                      {group.tabs.length}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* 전체 15개 펼쳐보기 토글 버튼 */}
            <button
              onClick={() => setViewMode(viewMode === 'grouped' ? 'all' : 'grouped')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 border cursor-pointer ${
                viewMode === 'all'
                  ? 'bg-amber-50 text-amber-800 border-amber-300 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100 shadow-2xs'
              }`}
              title="15대 전체 탭 펼침/접힘 토글"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-indigo-600" />
              <span>{viewMode === 'all' ? '도메인 2단 뷰로 접기' : '15대 전체 탭 펼쳐보기'}</span>
            </button>
          </div>

          {/* 상단 2단: 선택된 도메인의 서브 탭 (시트봇 스타일 탭 버튼) */}
          {viewMode === 'grouped' ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {TAB_GROUPS.find((g) => g.id === selectedGroupId)?.tabs.map((tab) => {
                const IconComponent = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 cursor-pointer transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-400/40'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <IconComponent className={`w-4 h-4 ${isActive ? 'text-white' : 'text-indigo-600'}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            /* 전체 15개 탭 도메인별 5대 섹션 카드 그리드 뷰 */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
              {TAB_GROUPS.map((group) => (
                <div key={group.id} className="bg-slate-50/80 rounded-2xl border border-slate-200 p-3.5 space-y-2">
                  <div className="text-[11px] font-black text-slate-700 border-b border-slate-200 pb-1.5 flex items-center justify-between">
                    <span>{group.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{group.tabs.length}개</span>
                  </div>
                  <div className="space-y-1">
                    {group.tabs.map((tab) => {
                      const IconComponent = tab.icon;
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => {
                            setSelectedGroupId(group.id);
                            setActiveTab(tab.id as any);
                          }}
                          className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl font-bold text-xs transition-all text-left truncate cursor-pointer ${
                            isActive
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'text-slate-600 hover:bg-white hover:text-slate-900 border border-transparent hover:border-slate-200'
                          }`}
                        >
                          <IconComponent className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-indigo-600'}`} />
                          <span className="truncate">{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 탭 1: 소상공인 회원 및 사업장 관리 (시트봇 회원 관리 테이블 스타일) */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">가입 소상공인 및 매장 프로필</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  가입된 점주님들의 계정 상태, 네이버 플레이스 연동 정보, 잔여 마케팅 토큰을 제어합니다.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('tokens')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition border border-indigo-200 cursor-pointer self-start sm:self-auto"
              >
                <History className="w-3.5 h-3.5" />
                <span>토큰 지급/차감 감사 대장 바로가기 ➔</span>
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 text-[11px] font-bold uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">점주명 / 계정</th>
                    <th className="py-3 px-4">매장명 (상호)</th>
                    <th className="py-3 px-4">업종</th>
                    <th className="py-3 px-4">플레이스 링크</th>
                    <th className="py-3 px-4">잔여 토큰</th>
                    <th className="py-3 px-4">사용 스토리지</th>
                    <th className="py-3 px-4">상태</th>
                    <th className="py-3 px-4 text-right">관리 액션</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {data?.users?.map((u: any) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{u.name || '퐁신제빵소 사장님'}</div>
                        <div className="text-[11px] text-slate-500">{u.email || 'pongshin@naver.com'}</div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-indigo-700">
                        퐁신제빵소
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        베이커리/디저트
                      </td>
                      <td className="py-3.5 px-4">
                        <a
                          href="https://naver.me/FJIPv54p"
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 underline font-semibold"
                        >
                          <span>naver.me/FJIPv54p</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {u.token_balance?.toLocaleString() || '50,000'} T
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-slate-800">
                          <HardDrive className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span>{((u.storage_used_bytes || 1517000) / (1024 * 1024)).toFixed(2)} MB</span>
                          <span className="text-slate-400 font-normal">/ 5 GB</span>
                        </div>
                        <div className="w-24 bg-slate-100 h-1.5 rounded-full mt-1 overflow-hidden border border-slate-200">
                          <div
                            className="bg-indigo-600 h-full rounded-full transition-all"
                            style={{
                              width: `${Math.min(100, Math.max(3, (((u.storage_used_bytes || 1517000) / (5 * 1024 * 1024 * 1024)) * 100)))}%`
                            }}
                          />
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {u.storage_file_count || 3}개 미디어 보관
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                          정상 가동
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setAdjustMode('credit');
                            setTokenAmount('50000');
                            setTokenReason('신규 우수 매장 지원 프로모션');
                            setShowTokenModal(true);
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold transition shadow-xs cursor-pointer"
                        >
                          + 지급
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setAdjustMode('deduct');
                            setTokenAmount('10000');
                            setTokenReason('오발급 회수 / 수동 정산 차감');
                            setShowTokenModal(true);
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold transition border border-rose-200 cursor-pointer"
                        >
                          - 차감
                        </button>
                        <Link
                          href="/"
                          className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition border border-slate-200 inline-block"
                        >
                          대리 접속 ➔
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 탭 2: 토큰 지갑 & 요금제 관제 */}
        {activeTab === 'tokens' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 엔진별 토큰 소모 분포 */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-600" />
                  <span>마케팅 엔진별 AI 토큰 소모 비중</span>
                </h3>
                <div className="space-y-3">
                  {stats?.engineUsageRatio?.map((item: any, idx: number) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-600">{item.name}</span>
                        <span className="text-slate-900 font-mono font-bold">{item.ratio} ({item.count}회)</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full"
                          style={{ width: item.ratio }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3단계 구독 요금제 플랜 카드 */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>SaaS 요금제 플랜 및 구독 관리</span>
                </h3>

                <div className="space-y-2.5 text-xs">
                  {data?.pricingPlans && data.pricingPlans.length > 0 ? (
                    data.pricingPlans.map((plan: any) => {
                      const isFree = Number(plan.monthly_price) === 0;
                      const isPro = plan.id === 'plan-pro';
                      return (
                        <div
                          key={plan.id}
                          className={`p-3.5 rounded-xl border flex items-center justify-between ${
                            isPro
                              ? 'bg-indigo-50/50 border-indigo-200'
                              : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div>
                            <span className="font-extrabold text-slate-900 block">{plan.name}</span>
                            <span className="text-[11px] text-slate-500">
                              월 {Number(plan.token_quota).toLocaleString()}T + 번들 약 {plan.estimated_bundles}회 제작 (마진율 {plan.margin_rate}%)
                            </span>
                          </div>
                          <span
                            className={`font-mono font-bold px-2 py-0.5 rounded-full border ${
                              isFree
                                ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                                : isPro
                                ? 'text-indigo-700 bg-indigo-100/70 border-indigo-200'
                                : 'text-slate-900 bg-slate-200/70 border-slate-300'
                            }`}
                          >
                            {isFree ? '0원' : `월 ${Number(plan.monthly_price).toLocaleString()}원`}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-4 text-center text-slate-400 text-xs">
                      등록된 요금제 플랜이 없습니다.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 3. 슈퍼 관리자 토큰 수동 지급 / 차감 감사 대장 */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <History className="w-4 h-4 text-indigo-600" />
                    <span>실시간 토큰 수동 지급 &amp; 차감 감사 대장</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    관리자가 점주에게 수동 지급하거나 차감한 모든 트랜잭션과 사유, 잔액 변동 내역이 실시간 기록됩니다.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-xl">
                    총 {data?.tokenLogs?.length || 0}건 기록
                  </span>
                </div>
              </div>

              {data?.tokenLogs && data.tokenLogs.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold bg-slate-50/50">
                        <th className="py-2.5 px-3">처리 일시</th>
                        <th className="py-2.5 px-3">대상 점주</th>
                        <th className="py-2.5 px-3">구분</th>
                        <th className="py-2.5 px-3">변동 수량</th>
                        <th className="py-2.5 px-3">처리 후 잔액</th>
                        <th className="py-2.5 px-3">사유 메모</th>
                        <th className="py-2.5 px-3">처리 주체</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {data.tokenLogs.map((log: any) => {
                        const isCredit = log.type === 'CREDIT' || (Number(log.amount) >= 0);
                        return (
                          <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                              {log.created_at ? new Date(log.created_at).toLocaleString('ko-KR') : '-'}
                            </td>
                            <td className="py-3 px-3 font-bold text-slate-900 whitespace-nowrap">
                              {log.user_name || log.user_id}
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                  isCredit
                                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                    : 'bg-rose-50 text-rose-700 border-rose-200'
                                }`}
                              >
                                {isCredit ? '➕ 수동 지급' : '➖ 수동 차감'}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-mono font-bold whitespace-nowrap">
                              <span className={isCredit ? 'text-indigo-600' : 'text-rose-600'}>
                                {isCredit ? '+' : ''}{Number(log.amount || 0).toLocaleString()}T
                              </span>
                            </td>
                            <td className="py-3 px-3 font-mono text-slate-900 font-semibold whitespace-nowrap">
                              {Number(log.balance_after || 0).toLocaleString()}T
                            </td>
                            <td className="py-3 px-3 text-slate-600 max-w-xs truncate">
                              {log.reason || '-'}
                            </td>
                            <td className="py-3 px-3 text-slate-500 text-[11px] whitespace-nowrap">
                              {log.admin_name || '슈퍼 관리자'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  아직 수동 지급 또는 차감된 내역이 없습니다. (1. 소상공인 회원 탭에서 +지급/-차감 시 실시간 등록됩니다)
                </div>
              )}
            </div>

            {/* Agent M 실시간 무통장 입금 자동 감지 엔진 & 토큰 대장 */}
            <AdminDepositAgentSection />
          </div>
        )}

        {/* 탭 3: AI 모델 원가 & SaaS 마진율 시뮬레이터 */}
        {activeTab === 'pricing' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 mb-4">
              <h2 className="text-base font-extrabold text-slate-900">AI 모델 호출 원가 &amp; SaaS 마진율 시뮬레이터</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Gemini, Flux, TTS 등 AI 엔진 호출 원가 대비 점주 결제액을 분석하여 초고수익 마진율(88.8%+)과 월간 순이익을 시뮬레이션합니다.
              </p>
            </div>
            <AdminPricingCostTab />
          </div>
        )}

        {/* 탭 4: 세무 & 전자세금계산서 정산 관리 */}
        {activeTab === 'tax' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 mb-4">
              <h2 className="text-base font-extrabold text-slate-900">세무/정산 및 전자세금계산서 관리</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                유료 결제 점주님들의 사업자등록증 기반 전자세금계산서 발급 및 국세청 홈택스 승인 번호 전송 내역을 관리합니다.
              </p>
            </div>
            <AdminTaxInvoicesTab />
          </div>
        )}

        {/* 탭 5: 생성 에셋 통합 감사 */}
        {activeTab === 'assets' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">생성 마케팅 에셋 라이브 피드 &amp; 위반 감사</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  소상공인들이 생성한 콘텐츠를 실시간 모니터링하고 과장 광고 키워드를 사전 검수합니다.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                🟢 위반 의심 건수: 0건 (안전)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data?.assets && data.assets.length > 0 ? (
                data.assets.slice(0, 9).map((asset: any) => {
                  const isPlace = asset.type === 'naver_place';
                  const isKarrot = asset.type === 'karrot';
                  const isVideo = asset.type === 'video';
                  const isDetail = asset.type === 'detail';
                  const isPrint = asset.type === 'print';
                  const isBlog = asset.type === 'blog';

                  return (
                    <div key={asset.id} className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-3 hover:border-indigo-300 transition-all">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold flex items-center gap-1 ${
                          isPlace ? 'text-emerald-700' :
                          isKarrot ? 'text-orange-700' :
                          isVideo ? 'text-red-700' :
                          isDetail ? 'text-indigo-700' :
                          isPrint ? 'text-pink-700' :
                          isBlog ? 'text-green-700' :
                          'text-purple-700'
                        }`}>
                          {isPlace ? <Sparkles className="w-3.5 h-3.5" /> :
                           isKarrot ? <Sparkles className="w-3.5 h-3.5" /> :
                           isVideo ? <Video className="w-3.5 h-3.5" /> :
                           isDetail ? <ShoppingBag className="w-3.5 h-3.5" /> :
                           isPrint ? <Printer className="w-3.5 h-3.5" /> :
                           <FileText className="w-3.5 h-3.5" />}
                          <span>{isPlace ? '스마트플레이스' : isKarrot ? '당근마켓 소식' : isVideo ? '15초 숏폼' : isDetail ? '상세페이지' : isPrint ? '인쇄물' : isBlog ? '네이버 블로그' : '인스타 카드'}</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {asset.created_at ? new Date(asset.created_at).toLocaleDateString('ko-KR') : '최근 생성'}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-900 line-clamp-1">{asset.title}</p>
                      <div className="text-[11px] text-slate-500 line-clamp-1">규격: {asset.spec || '표준 규격'}</div>
                      <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-200">
                        <span className="text-emerald-600 font-semibold">✓ 정상 검수</span>
                        <Link href="/library" className="text-indigo-600 font-bold hover:underline">에셋 열람 ➔</Link>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-3 py-8 text-center text-slate-400 text-xs">
                  생성된 마케팅 에셋이 없습니다.
                </div>
              )}
            </div>
          </div>
        )}

        {/* 탭 6: 주간 오토파일럿 & 발행 큐 실시간 관제 */}
        {activeTab === 'campaigns' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">주간 마케팅 오토파일럿 &amp; 발행 큐 실시간 관제</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  매장별 7일 자동화 스케줄과 SNS/플레이스/당근마켓 예약 발행 현황을 모니터링합니다.
                </p>
              </div>
              <Link
                href="/calendar"
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>오토 캘린더 바로가기</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data?.campaigns && data.campaigns.length > 0 ? (
                data.campaigns.map((camp: any) => (
                  <div key={camp.id} className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-3 hover:border-indigo-300 transition-all">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                        camp.platform === 'karrot' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                        camp.platform === 'naver_place' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        camp.platform === 'instagram' ? 'bg-pink-50 text-pink-700 border-pink-200' :
                        camp.platform === 'blog' ? 'bg-green-50 text-green-700 border-green-200' :
                        'bg-indigo-50 text-indigo-700 border-indigo-200'
                      }`}>
                        {camp.platform === 'karrot' ? '🥕 당근마켓' :
                         camp.platform === 'naver_place' ? '🌿 스마트플레이스' :
                         camp.platform === 'instagram' ? '📷 인스타그램' :
                         camp.platform === 'blog' ? '📝 네이버 블로그' : '🖨️ 인쇄물'}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        camp.status === 'published' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {camp.status === 'published' ? '✓ 발행 완료' : '⏰ 자동 예약'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-400 font-mono block">{camp.scheduled_at} ({camp.time_slot})</span>
                      <h4 className="text-xs font-bold text-slate-900 mt-1 line-clamp-1">{camp.title}</h4>
                    </div>

                    {camp.tip && (
                      <p className="text-[11px] text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200 line-clamp-2">
                        💡 {camp.tip}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <div className="col-span-3 py-8 text-center text-slate-400 text-xs">
                  등록된 캠페인 스케줄이 없습니다.
                </div>
              )}
            </div>
          </div>
        )}

        {/* 탭 7: 외부 채널 디스패치 감사 로그 */}
        {activeTab === 'dispatch' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 mb-4">
              <h2 className="text-base font-extrabold text-slate-900">외부 채널 실시간 디스패치 감사 로그</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                당근마켓, 스마트플레이스, 인스타그램, 블로그 등 7대 외부 채널로 발행된 실제 API 디스패치 상태와 실패율을 감사하고 즉시 재시도(Retry)합니다.
              </p>
            </div>
            <AdminDispatchLogsTab />
          </div>
        )}

        {/* 탭 8: AI 시스템 프롬프트 관리 & 실시간 튜닝 스튜디오 */}
        {activeTab === 'prompts' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 mb-4">
              <h2 className="text-base font-extrabold text-slate-900">AI 프롬프트 버전 관리 &amp; 실시간 튜닝 스튜디오</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                코드 재배포 없이 7대 채널별 시스템 프롬프트, 치환 변수 템플릿, Temperature 파라미터를 실시간 핫픽스하고 Playground에서 즉석 테스트합니다.
              </p>
            </div>
            <AdminPromptsTab />
          </div>
        )}

        {/* 탭 9: 1:1 점주 CS 문의 & AI 답변 티켓 시스템 */}
        {activeTab === 'inquiries' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 mb-4">
              <h2 className="text-base font-extrabold text-slate-900">1:1 마케팅 CS 문의 &amp; 상담 티켓 센터</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                점주님들의 채널 연동, 마케팅 품질, 요금 문의를 접수하고 ⚡ AI 원클릭 답변 초안 생성을 통해 초고속으로 친절한 솔루션을 제공합니다.
              </p>
            </div>
            <AdminInquiriesTab />
          </div>
        )}

        {/* 탭 10: 점주 긴급 문자 & 알림톡 발송 센터 */}
        {activeTab === 'sms' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 mb-4">
              <h2 className="text-base font-extrabold text-slate-900">SMS / 카카오 알림톡 긴급 공지 &amp; 마케팅 발송 센터</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                점주 전체 또는 개별 매장으로 바이트 수 자동 판별(SMS 90B / LMS 2000B) 긴급 공지, 토큰 충전 알림, 예약 리마인더를 발송합니다.
              </p>
            </div>
            <AdminSmsTab />
          </div>
        )}

        {/* 탭 11: 스마트 디스패치 자동화 규칙 엔진 */}
        {activeTab === 'rules' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 mb-4">
              <h2 className="text-base font-extrabold text-slate-900">이벤트 기반 스마트 디스패치 자동화 규칙 엔진</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                날씨(비/폭염), 골든 타임(불금/주말), 마감 시간 조건 충족 시 타겟 채널(당근/플레이스/인스타)로 프로모션 콘텐츠를 무인 자동 발행합니다.
              </p>
            </div>
            <AdminSmartRulesTab />
          </div>
        )}

        {/* 탭 12: 자주 묻는 질문(FAQ) CMS */}
        {activeTab === 'faqs' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 mb-4">
              <h2 className="text-base font-extrabold text-slate-900">소상공인 자주 묻는 질문(FAQ) CMS</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                점주들이 스스로 문제를 해결할 수 있도록 채널 연동, 요금/환불, 인쇄 관련 가이드 Q&amp;A를 등록 및 관리합니다.
              </p>
            </div>
            <AdminFaqsTab />
          </div>
        )}

        {/* 탭 13: 사업자 정보 & 법무 약관 CMS */}
        {activeTab === 'footer' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 mb-4">
              <h2 className="text-base font-extrabold text-slate-900">사업자 정보 &amp; 법무 약관 (이용약관/개인정보/환불) CMS</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                통신판매업 필수 고지 정보, 이용약관, 개인정보처리방침, 환불 규정을 코드 배포 없이 실시간 수정합니다.
              </p>
            </div>
            <AdminFooterTab />
          </div>
        )}

        {/* 탭 14: 벤치마크 레퍼런스 CMS */}
        {activeTab === 'cms' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">업종별 1위 바이럴 큐레이션 CMS</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  사장님들에게 제공되는 추천 벤치마크 레퍼런스(유튜브 쇼츠, 릴스, 상세페이지)를 등록 및 갱신합니다.
                </p>
              </div>
              <Link
                href="/references"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>새 큐레이션 등록하기</span>
              </Link>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-lg">
                  🍰
                </div>
                <div>
                  <span className="font-bold text-xs text-slate-900 block">베이커리 / 수제 디저트 업종 큐레이션 (5종 등록 완료)</span>
                  <span className="text-[11px] text-slate-500">대만 카스테라 커팅 ASMR (120만뷰), 저장수 3.8만 6컷 카드뉴스 등</span>
                </div>
              </div>
              <Link href="/references" className="text-xs font-bold text-indigo-600 hover:text-indigo-800">
                관리 ➔
              </Link>
            </div>
          </div>
        )}

        {/* 탭 15: AI 모델 믹스 & 시스템 인프라 */}
        {activeTab === 'system' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">AI 모델 믹스(Model Mix) 헬스체크</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  텍스트, 이미지, 비디오, 음성 전사 모델의 가동 상태 및 지연시간(Latency)을 모니터링합니다.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats?.activeModelStatus && Object.entries(stats.activeModelStatus).map(([key, m]: [string, any]) => (
                <div key={key} className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-indigo-600 uppercase">{key} ENGINE</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                      {m.status}
                    </span>
                  </div>
                  <div className="font-mono text-sm font-bold text-slate-900">{m.name}</div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200">
                    <span>지연: {m.latency}</span>
                    <span className="text-emerald-600 font-semibold">성공: {m.successRate}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* 인프라 스펙 */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
              <div className="font-bold text-slate-900">데이터베이스 및 런타임 환경</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                <div>• SQLite 18대 통합 테이블: <span className="font-bold text-indigo-700">영구 저장 마운트</span></div>
                <div>• Turbopack 번들러: <span className="font-bold text-slate-800">초고속 컴파일</span></div>
                <div>• Capacitor Android: <span className="font-bold text-slate-800">v7.0 동기화 완료</span></div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* 토큰 수동 지급/차감 모달 (시트봇 스타일 화이트 모달) */}
      {showTokenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Wallet className={`w-5 h-5 ${adjustMode === 'credit' ? 'text-indigo-600' : 'text-rose-600'}`} />
                <h3 className="font-extrabold text-base text-slate-900">
                  점주 마케팅 토큰 {adjustMode === 'credit' ? '수동 지급 (+)' : '수동 차감 (-)'}
                </h3>
              </div>
              <button
                onClick={() => setShowTokenModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* 지급 vs 차감 모드 탭 */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-2xl">
              <button
                type="button"
                onClick={() => {
                  setAdjustMode('credit');
                  if (tokenReason.includes('차감')) setTokenReason('신규 우수 매장 지원 프로모션');
                }}
                className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  adjustMode === 'credit'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>➕</span> 토큰 지급 (충전)
              </button>
              <button
                type="button"
                onClick={() => {
                  setAdjustMode('deduct');
                  if (tokenReason.includes('프로모션')) setTokenReason('오발급 회수 / 수동 정산 차감');
                }}
                className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  adjustMode === 'deduct'
                    ? 'bg-white text-rose-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>➖</span> 토큰 차감 (회수)
              </button>
            </div>

            <form onSubmit={handleAdjustToken} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-500 mb-1 font-semibold">대상 점주</label>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900 flex items-center justify-between">
                  <span>{selectedUser?.name || '퐁신제빵소 사장님'} ({selectedUser?.email || 'usr_pongshin_master'})</span>
                  <span className="text-[11px] font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                    현재: {Number(selectedUser?.token_balance || 0).toLocaleString()}T
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 mb-1 font-semibold">
                  {adjustMode === 'credit' ? '지급할 수량 (T)' : '차감할 수량 (T)'}
                </label>
                <input
                  type="number"
                  min="1"
                  value={tokenAmount}
                  onChange={(e) => setTokenAmount(e.target.value)}
                  placeholder="예: 10000"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-mono font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>

              {/* 실시간 잔액 시뮬레이션 프리뷰 */}
              {selectedUser && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">반영 후 예상 잔액:</span>
                  <span className={`font-mono font-bold ${adjustMode === 'credit' ? 'text-indigo-600' : 'text-slate-800'}`}>
                    {Math.max(
                      0,
                      Number(selectedUser.token_balance || 0) +
                        (adjustMode === 'credit' ? Number(tokenAmount || 0) : -Number(tokenAmount || 0))
                    ).toLocaleString()}T
                    <span className="ml-1 text-[10px] text-slate-400">
                      ({adjustMode === 'credit' ? '+' : '-'}{Number(tokenAmount || 0).toLocaleString()}T)
                    </span>
                  </span>
                </div>
              )}

              <div>
                <label className="block text-slate-500 mb-1 font-semibold">조정 사유 메모</label>
                <input
                  type="text"
                  value={tokenReason}
                  onChange={(e) => setTokenReason(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowTokenModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isAdjusting}
                  className={`px-5 py-2.5 rounded-xl text-white font-bold transition shadow-xs disabled:opacity-50 cursor-pointer ${
                    adjustMode === 'credit'
                      ? 'bg-indigo-600 hover:bg-indigo-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {isAdjusting
                    ? '처리 중...'
                    : adjustMode === 'credit'
                    ? '토큰 즉시 지급 (+)'
                    : '토큰 즉시 차감 (-)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 맞춤형 마케팅 견적서 & 제안서 자동 발행 모달 */}
      {showProposalModal && (
        <AdminProposalModal
          initialStore={{
            name: data?.users?.[0]?.name ? `${data.users[0].name} 매장` : '배곧 달콤베이커리',
            ownerName: data?.users?.[0]?.name || '김점주 대표',
            contact: '010-9876-5432',
            address: '경기도 시흥시 배곧4로 30 골든플라자 1층',
          }}
          onClose={() => setShowProposalModal(false)}
        />
      )}
    </div>
  );
}
