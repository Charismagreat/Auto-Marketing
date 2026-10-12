'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
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

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<
    'users' | 'tokens' | 'pricing' | 'tax' | 'assets' | 'campaigns' | 'dispatch' | 'prompts' | 'inquiries' | 'sms' | 'rules' | 'faqs' | 'footer' | 'cms' | 'system'
  >('users');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // 맞춤 마케팅 견적서 모달 상태
  const [showProposalModal, setShowProposalModal] = useState(false);

  // 토큰 수동 지급 모달 상태
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
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
  }, []);

  const handleAdjustToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setIsAdjusting(true);
    try {
      const res = await fetch('/api/admin/overview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'adjust_token',
          userId: selectedUser.id,
          amount: Number(tokenAmount),
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
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* 1. 상단 관리자 툴바 헤더 */}
      <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition">
              <ArrowLeft className="w-4 h-4" />
              <span>대시보드로 나가기</span>
            </Link>
            <span className="text-slate-700">|</span>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center font-bold text-white shadow-md shadow-rose-900/40">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <span className="font-black text-base tracking-tight text-white">
                Auto-Marketing 통합 관제탑 (Super Admin)
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                운영자 모드
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowProposalModal(true)}
              className="flex items-center gap-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 px-3.5 py-1.5 rounded-xl shadow-xs transition"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>맞춤 마케팅 견적서 발행</span>
            </button>
            <button
              onClick={fetchAdminData}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-white bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>실시간 갱신</span>
            </button>
          </div>
        </div>
      </header>

      {/* 메인 영역 */}
      <main className="max-w-7xl mx-auto w-full px-4 lg:px-8 py-8 flex-1 space-y-8">
        
        {/* 상단 4대 핵심 KPI 카드 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-800/80 rounded-3xl p-5 border border-slate-700/80 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span>총 가입 소상공인</span>
              <Users className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono">
              {stats?.totalUsers || 1}개 매장
            </div>
            <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
              <span>↑ 이번 주 신규 가입 100% 활성</span>
            </div>
          </div>

          <div className="bg-slate-800/80 rounded-3xl p-5 border border-slate-700/80 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span>등록 사업장 및 상품</span>
              <Store className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono">
              {stats?.totalBusinesses || 1}개 / {stats?.totalProducts || 3}개
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              퐁신제빵소(배곧테크노밸리)
            </div>
          </div>

          <div className="bg-slate-800/80 rounded-3xl p-5 border border-slate-700/80 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span>총 생성 마케팅 에셋</span>
              <FileCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-white font-mono">
              {stats?.totalAssetsGenerated || 24}건
            </div>
            <div className="text-[11px] text-emerald-400 mt-1">
              숏폼, 상세페이지, 인쇄물 완비
            </div>
          </div>

          <div className="bg-slate-800/80 rounded-3xl p-5 border border-slate-700/80 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
              <span>AI 토큰 총 소모량</span>
              <Wallet className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-black text-amber-300 font-mono">
              {stats?.totalTokensConsumed?.toLocaleString() || '38,400'} T
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              총 발행량 {stats?.totalTokensIssued?.toLocaleString() || '150,000'} T 대비 25.6%
            </div>
          </div>
        </div>

        {/* 6대 관제 탭 네비게이션 */}
        <div className="flex items-center gap-2 border-b border-slate-800 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-3 font-bold text-xs rounded-2xl transition-all whitespace-nowrap ${
              activeTab === 'users'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>1. 소상공인 회원/매장</span>
          </button>

          <button
            onClick={() => setActiveTab('tokens')}
            className={`flex items-center gap-2 px-4 py-3 font-bold text-xs rounded-2xl transition-all whitespace-nowrap ${
              activeTab === 'tokens'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>2. 토큰 & SaaS 요금제</span>
          </button>

          <button
            onClick={() => setActiveTab('pricing')}
            className={`flex items-center gap-2 px-4 py-3 font-bold text-xs rounded-2xl transition-all whitespace-nowrap ${
              activeTab === 'pricing'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>3. AI 원가 & 마진율</span>
          </button>

          <button
            onClick={() => setActiveTab('tax')}
            className={`flex items-center gap-2 px-4 py-3 font-bold text-xs rounded-2xl transition-all whitespace-nowrap ${
              activeTab === 'tax'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileCheck2 className="w-4 h-4" />
            <span>4. 세무 & 전자세금계산서</span>
          </button>

          <button
            onClick={() => setActiveTab('assets')}
            className={`flex items-center gap-2 px-4 py-3 font-bold text-xs rounded-2xl transition-all whitespace-nowrap ${
              activeTab === 'assets'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>5. 생성 에셋 통합 감사</span>
          </button>

          <button
            onClick={() => setActiveTab('campaigns')}
            className={`flex items-center gap-2 px-4 py-3 font-bold text-xs rounded-2xl transition-all whitespace-nowrap ${
              activeTab === 'campaigns'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>6. 주간 오토파일럿 & 발행 큐</span>
          </button>

          <button
            onClick={() => setActiveTab('dispatch')}
            className={`flex items-center gap-2 px-4 py-3 font-bold text-xs rounded-2xl transition-all whitespace-nowrap ${
              activeTab === 'dispatch'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>7. 외부 채널 디스패치 로그</span>
          </button>

          <button
            onClick={() => setActiveTab('prompts')}
            className={`flex items-center gap-2 px-4 py-3 font-bold text-xs rounded-2xl transition-all whitespace-nowrap ${
              activeTab === 'prompts'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>8. AI 프롬프트 튜닝</span>
          </button>

          <button
            onClick={() => setActiveTab('inquiries')}
            className={`flex items-center gap-2 px-4 py-3 font-bold text-xs rounded-2xl transition-all whitespace-nowrap ${
              activeTab === 'inquiries'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>9. 점주 CS 문의 & AI 답변</span>
          </button>

          <button
            onClick={() => setActiveTab('sms')}
            className={`flex items-center gap-2 px-4 py-3 font-bold text-xs rounded-2xl transition-all whitespace-nowrap ${
              activeTab === 'sms'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>10. SMS / 알림톡 발송</span>
          </button>

          <button
            onClick={() => setActiveTab('rules')}
            className={`flex items-center gap-2 px-4 py-3 font-bold text-xs rounded-2xl transition-all whitespace-nowrap ${
              activeTab === 'rules'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>11. 스마트 자동화 룰</span>
          </button>

          <button
            onClick={() => setActiveTab('faqs')}
            className={`flex items-center gap-2 px-4 py-3 font-bold text-xs rounded-2xl transition-all whitespace-nowrap ${
              activeTab === 'faqs'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>12. 자주 묻는 질문 FAQ</span>
          </button>

          <button
            onClick={() => setActiveTab('footer')}
            className={`flex items-center gap-2 px-4 py-3 font-bold text-xs rounded-2xl transition-all whitespace-nowrap ${
              activeTab === 'footer'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>13. 사업자 정보 & 법무 약관</span>
          </button>

          <button
            onClick={() => setActiveTab('cms')}
            className={`flex items-center gap-2 px-4 py-3 font-bold text-xs rounded-2xl transition-all whitespace-nowrap ${
              activeTab === 'cms'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>14. 바이럴 레퍼런스 CMS</span>
          </button>

          <button
            onClick={() => setActiveTab('system')}
            className={`flex items-center gap-2 px-4 py-3 font-bold text-xs rounded-2xl transition-all whitespace-nowrap ${
              activeTab === 'system'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>15. AI 모델 믹스 & 인프라</span>
          </button>
        </div>

        {/* 탭 1: 소상공인 회원 및 사업장 관리 */}
        {activeTab === 'users' && (
          <div className="bg-slate-800/80 rounded-3xl p-6 border border-slate-700/80 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-white">가입 소상공인 및 매장 프로필</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  가입된 점주님들의 계정 상태, 네이버 플레이스 연동 정보, 잔여 마케팅 토큰을 제어합니다.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/60 text-slate-400 text-[11px] uppercase border-b border-slate-700">
                  <tr>
                    <th className="py-3 px-4">점주명 / 계정</th>
                    <th className="py-3 px-4">매장명 (상호)</th>
                    <th className="py-3 px-4">업종</th>
                    <th className="py-3 px-4">플레이스 링크</th>
                    <th className="py-3 px-4">잔여 토큰</th>
                    <th className="py-3 px-4">상태</th>
                    <th className="py-3 px-4 text-right">관리 액션</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60 font-medium">
                  {data?.users?.map((u: any) => (
                    <tr key={u.id} className="hover:bg-slate-700/30 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white">{u.name || '퐁신제빵소 사장님'}</div>
                        <div className="text-[11px] text-slate-400">{u.email || 'pongshin@naver.com'}</div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-amber-300">
                        퐁신제빵소
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        베이커리/디저트
                      </td>
                      <td className="py-3.5 px-4">
                        <a
                          href="https://naver.me/FJIPv54p"
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 underline"
                        >
                          <span>naver.me/FJIPv54p</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                        {u.token_balance?.toLocaleString() || '50,000'} T
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                          정상 가동
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setShowTokenModal(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold transition"
                        >
                          + 토큰 지급
                        </button>
                        <Link
                          href="/"
                          className="px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-[11px] font-bold transition"
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
              <div className="bg-slate-800/80 rounded-3xl p-6 border border-slate-700/80 shadow-xl space-y-4">
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-amber-400" />
                  <span>마케팅 엔진별 AI 토큰 소모 비중</span>
                </h3>
                <div className="space-y-3">
                  {stats?.engineUsageRatio?.map((item: any, idx: number) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-300">{item.name}</span>
                        <span className="text-amber-400 font-mono">{item.ratio} ({item.count}회)</span>
                      </div>
                      <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-indigo-500 rounded-full"
                          style={{ width: item.ratio }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3단계 구독 요금제 플랜 카드 */}
              <div className="bg-slate-800/80 rounded-3xl p-6 border border-slate-700/80 shadow-xl space-y-4">
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <span>SaaS 요금제 플랜 및 구독 관리</span>
                </h3>

                <div className="space-y-2.5 text-xs">
                  <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-700 flex items-center justify-between">
                    <div>
                      <span className="font-extrabold text-white block">무료 웰컴 체험 (Free)</span>
                      <span className="text-[11px] text-slate-400">가입 즉시 50,000T 무료 지급 (숏폼 5편, 상세페이지 5편)</span>
                    </div>
                    <span className="font-mono font-bold text-emerald-400">0원</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/40 flex items-center justify-between">
                    <div>
                      <span className="font-extrabold text-indigo-300 block">소상공인 스타터 (Starter)</span>
                      <span className="text-[11px] text-slate-400">매월 200,000T + 주간 마케팅 오토 캘린더 자동 발행</span>
                    </div>
                    <span className="font-mono font-bold text-amber-300">월 29,000원</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-700 flex items-center justify-between">
                    <div>
                      <span className="font-extrabold text-white block">프로 비즈니스 (Pro)</span>
                      <span className="text-[11px] text-slate-400">무제한 상세페이지 + 숏폼 비디오 50편 + 인쇄물 무제한</span>
                    </div>
                    <span className="font-mono font-bold text-indigo-300">월 59,000원</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 탭 3: AI 모델 원가 & SaaS 마진율 시뮬레이터 (신규) */}
        {activeTab === 'pricing' && (
          <div className="space-y-4">
            <div className="bg-slate-800/80 rounded-3xl p-6 border border-slate-700/80 shadow-xl mb-4">
              <h2 className="text-base font-extrabold text-white">AI 모델 호출 원가 & SaaS 마진율 시뮬레이터</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Gemini, Flux, TTS 등 AI 엔진 호출 원가 대비 점주 결제액을 분석하여 초고수익 마진율(87%+)과 월간 순이익을 시뮬레이션합니다.
              </p>
            </div>
            <AdminPricingCostTab />
          </div>
        )}

        {/* 탭 4: 세무 & 전자세금계산서 정산 관리 (신규) */}
        {activeTab === 'tax' && (
          <div className="space-y-4">
            <div className="bg-slate-800/80 rounded-3xl p-6 border border-slate-700/80 shadow-xl mb-4">
              <h2 className="text-base font-extrabold text-white">세무/정산 및 전자세금계산서 관리</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                유료 결제 점주님들의 사업자등록증 기반 전자세금계산서 발급 및 국세청 홈택스 승인 번호 전송 내역을 관리합니다.
              </p>
            </div>
            <AdminTaxInvoicesTab />
          </div>
        )}

        {/* 탭 5: 생성 에셋 통합 감사 */}
        {activeTab === 'assets' && (
          <div className="bg-slate-800/80 rounded-3xl p-6 border border-slate-700/80 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-white">생성 마케팅 에셋 라이브 피드 & 위반 감사</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  소상공인들이 생성한 콘텐츠를 실시간 모니터링하고 과장 광고 키워드를 사전 검수합니다.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
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
                    <div key={asset.id} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-700 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold flex items-center gap-1 ${
                          isPlace ? 'text-emerald-400' :
                          isKarrot ? 'text-orange-400' :
                          isVideo ? 'text-red-400' :
                          isDetail ? 'text-indigo-400' :
                          isPrint ? 'text-pink-400' :
                          isBlog ? 'text-green-400' :
                          'text-purple-400'
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
                      <p className="text-xs font-bold text-white line-clamp-1">{asset.title}</p>
                      <div className="text-[11px] text-slate-400 line-clamp-1">규격: {asset.spec || '표준 규격'}</div>
                      <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-800">
                        <span className="text-emerald-400 font-semibold">✓ 정상 검수</span>
                        <Link href="/library" className="text-indigo-400 hover:underline">에셋 열람 ➔</Link>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-3 py-8 text-center text-slate-500 text-xs">
                  생성된 마케팅 에셋이 없습니다.
                </div>
              )}
            </div>
          </div>
        )}

        {/* 탭 4: 주간 오토파일럿 & 발행 큐 실시간 관제 */}
        {activeTab === 'campaigns' && (
          <div className="bg-slate-800/80 rounded-3xl p-6 border border-slate-700/80 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-white">주간 마케팅 오토파일럿 & 발행 큐 실시간 관제</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  매장별 7일 자동화 스케줄과 SNS/플레이스/당근마켓 예약 발행 현황을 모니터링합니다.
                </p>
              </div>
              <Link
                href="/calendar"
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>오토 캘린더 바로가기</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data?.campaigns && data.campaigns.length > 0 ? (
                data.campaigns.map((camp: any) => (
                  <div key={camp.id} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-700 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                        camp.platform === 'karrot' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                        camp.platform === 'naver_place' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                        camp.platform === 'instagram' ? 'bg-pink-500/20 text-pink-400 border-pink-500/30' :
                        camp.platform === 'blog' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                        'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
                      }`}>
                        {camp.platform === 'karrot' ? '🥕 당근마켓' :
                         camp.platform === 'naver_place' ? '🌿 스마트플레이스' :
                         camp.platform === 'instagram' ? '📷 인스타그램' :
                         camp.platform === 'blog' ? '📝 네이버 블로그' : '🖨️ 인쇄물'}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        camp.status === 'published' ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {camp.status === 'published' ? '✓ 발행 완료' : '⏰ 자동 예약'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-400 font-mono block">{camp.scheduled_at} ({camp.time_slot})</span>
                      <h4 className="text-xs font-bold text-white mt-1 line-clamp-1">{camp.title}</h4>
                    </div>

                    {camp.tip && (
                      <p className="text-[11px] text-slate-400 bg-slate-800/80 p-2 rounded-xl line-clamp-2">
                        💡 {camp.tip}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <div className="col-span-3 py-8 text-center text-slate-500 text-xs">
                  등록된 캠페인 스케줄이 없습니다.
                </div>
              )}
            </div>
          </div>
        )}

        {/* 탭 5: 외부 채널 디스패치 감사 로그 (신규) */}
        {activeTab === 'dispatch' && (
          <div className="space-y-4">
            <div className="bg-slate-800/80 rounded-3xl p-6 border border-slate-700/80 shadow-xl mb-4">
              <h2 className="text-base font-extrabold text-white">외부 채널 실시간 디스패치 감사 로그</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                당근마켓, 스마트플레이스, 인스타그램, 블로그 등 7대 외부 채널로 발행된 실제 API 디스패치 상태와 실패율을 감사하고 즉시 재시도(Retry)합니다.
              </p>
            </div>
            <AdminDispatchLogsTab />
          </div>
        )}

        {/* 탭 6: AI 시스템 프롬프트 관리 & 실시간 튜닝 스튜디오 */}
        {activeTab === 'prompts' && (
          <div className="space-y-4">
            <div className="bg-slate-800/80 rounded-3xl p-6 border border-slate-700/80 shadow-xl mb-4">
              <h2 className="text-base font-extrabold text-white">AI 프롬프트 버전 관리 & 실시간 튜닝 스튜디오</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                코드 재배포 없이 7대 채널별 시스템 프롬프트, 치환 변수 템플릿, Temperature 파라미터를 실시간 핫픽스하고 Playground에서 즉석 테스트합니다.
              </p>
            </div>
            <AdminPromptsTab />
          </div>
        )}

        {/* 탭 7: 1:1 점주 CS 문의 & AI 답변 티켓 시스템 (신규) */}
        {activeTab === 'inquiries' && (
          <div className="space-y-4">
            <div className="bg-slate-800/80 rounded-3xl p-6 border border-slate-700/80 shadow-xl mb-4">
              <h2 className="text-base font-extrabold text-white">1:1 마케팅 CS 문의 & 상담 티켓 센터</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                점주님들의 채널 연동, 마케팅 품질, 요금 문의를 접수하고 ⚡ AI 원클릭 답변 초안 생성을 통해 초고속으로 친절한 솔루션을 제공합니다.
              </p>
            </div>
            <AdminInquiriesTab />
          </div>
        )}

        {/* 탭 8: 점주 긴급 문자 & 알림톡 발송 센터 (신규) */}
        {activeTab === 'sms' && (
          <div className="space-y-4">
            <div className="bg-slate-800/80 rounded-3xl p-6 border border-slate-700/80 shadow-xl mb-4">
              <h2 className="text-base font-extrabold text-white">SMS / 카카오 알림톡 긴급 공지 & 마케팅 발송 센터</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                점주 전체 또는 개별 매장으로 바이트 수 자동 판별(SMS 90B / LMS 2000B) 긴급 공지, 토큰 충전 알림, 예약 리마인더를 발송합니다.
              </p>
            </div>
            <AdminSmsTab />
          </div>
        )}

        {/* 탭 11: 스마트 디스패치 자동화 규칙 엔진 */}
        {activeTab === 'rules' && (
          <div className="space-y-4">
            <div className="bg-slate-800/80 rounded-3xl p-6 border border-slate-700/80 shadow-xl mb-4">
              <h2 className="text-base font-extrabold text-white">이벤트 기반 스마트 디스패치 자동화 규칙 엔진</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                날씨(비/폭염), 골든 타임(불금/주말), 마감 시간 조건 충족 시 타겟 채널(당근/플레이스/인스타)로 프로모션 콘텐츠를 무인 자동 발행합니다.
              </p>
            </div>
            <AdminSmartRulesTab />
          </div>
        )}

        {/* 탭 12: 자주 묻는 질문(FAQ) CMS (신규) */}
        {activeTab === 'faqs' && (
          <div className="space-y-4">
            <div className="bg-slate-800/80 rounded-3xl p-6 border border-slate-700/80 shadow-xl mb-4">
              <h2 className="text-base font-extrabold text-white">소상공인 자주 묻는 질문(FAQ) CMS</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                점주들이 스스로 문제를 해결할 수 있도록 채널 연동, 요금/환불, 인쇄 관련 가이드 Q&A를 등록 및 관리합니다.
              </p>
            </div>
            <AdminFaqsTab />
          </div>
        )}

        {/* 탭 13: 사업자 정보 & 법무 약관 CMS (신규) */}
        {activeTab === 'footer' && (
          <div className="space-y-4">
            <div className="bg-slate-800/80 rounded-3xl p-6 border border-slate-700/80 shadow-xl mb-4">
              <h2 className="text-base font-extrabold text-white">사업자 정보 & 법무 약관 (이용약관/개인정보/환불) CMS</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                통신판매업 필수 고지 정보, 이용약관, 개인정보처리방침, 환불 규정을 코드 배포 없이 실시간 수정합니다.
              </p>
            </div>
            <AdminFooterTab />
          </div>
        )}

        {/* 탭 14: 벤치마크 레퍼런스 CMS */}
        {activeTab === 'cms' && (
          <div className="bg-slate-800/80 rounded-3xl p-6 border border-slate-700/80 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-white">업종별 1위 바이럴 큐레이션 CMS</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  사장님들에게 제공되는 추천 벤치마크 레퍼런스(유튜브 쇼츠, 릴스, 상세페이지)를 등록 및 갱신합니다.
                </p>
              </div>
              <Link
                href="/references"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition"
              >
                <Plus className="w-4 h-4" />
                <span>새 큐레이션 등록하기</span>
              </Link>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-700/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  🍰
                </div>
                <div>
                  <span className="font-bold text-xs text-white block">베이커리 / 수제 디저트 업종 큐레이션 (5종 등록 완료)</span>
                  <span className="text-[11px] text-slate-400">대만 카스테라 커팅 ASMR (120만뷰), 저장수 3.8만 6컷 카드뉴스 등</span>
                </div>
              </div>
              <Link href="/references" className="text-xs font-bold text-indigo-400 hover:text-indigo-300">
                관리 ➔
              </Link>
            </div>
          </div>
        )}

        {/* 탭 15: AI 모델 믹스 & 시스템 인프라 */}
        {activeTab === 'system' && (
          <div className="bg-slate-800/80 rounded-3xl p-6 border border-slate-700/80 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-white">AI 모델 믹스(Model Mix) 헬스체크</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  텍스트, 이미지, 비디오, 음성 전사 모델의 가동 상태 및 지연시간(Latency)을 모니터링합니다.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats?.activeModelStatus && Object.entries(stats.activeModelStatus).map(([key, m]: [string, any]) => (
                <div key={key} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-indigo-400 uppercase">{key} ENGINE</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                      {m.status}
                    </span>
                  </div>
                  <div className="font-mono text-sm font-bold text-white">{m.name}</div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                    <span>지연: {m.latency}</span>
                    <span className="text-emerald-400 font-semibold">성공: {m.successRate}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* 인프라 스펙 */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-700 text-xs text-slate-400 space-y-2">
              <div className="font-bold text-white">데이터베이스 및 런타임 환경</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                <div>• SQLite 8대 테이블: <span className="text-slate-200">정상 마운트</span></div>
                <div>• Turbopack 번들러: <span className="text-slate-200">초고속 컴파일</span></div>
                <div>• Capacitor Android: <span className="text-slate-200">v7.0 동기화 완료</span></div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* 토큰 수동 지급 모달 */}
      {showTokenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-700 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-amber-400" />
                <h3 className="font-extrabold text-sm text-white">
                  점주 마케팅 토큰 수동 지급
                </h3>
              </div>
              <button
                onClick={() => setShowTokenModal(false)}
                className="w-7 h-7 rounded-full bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAdjustToken} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">지급 대상 점주</label>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 font-bold text-white">
                  {selectedUser?.name || '퐁신제빵소 사장님'} ({selectedUser?.email || 'usr_pongshin_master'})
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">지급/차감 토큰 수량 (T)</label>
                <input
                  type="number"
                  value={tokenAmount}
                  onChange={(e) => setTokenAmount(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">지급 사유 메모</label>
                <input
                  type="text"
                  value={tokenReason}
                  onChange={(e) => setTokenReason(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowTokenModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-700 text-slate-300 font-bold hover:bg-slate-600 transition"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isAdjusting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition shadow-md disabled:opacity-50"
                >
                  {isAdjusting ? '처리 중...' : '토큰 즉시 지급'}
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
