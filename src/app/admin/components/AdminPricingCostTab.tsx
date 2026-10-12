'use client';

import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  Cpu,
  Layers,
  PieChart,
  Percent,
  Sparkles,
  Save,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { type ModelCostConfig, type PlanPricing } from '@/app/api/admin/pricing-cost/route';

export default function AdminPricingCostTab() {
  const [modelCosts, setModelCosts] = useState<ModelCostConfig[]>([]);
  const [plans, setPlans] = useState<PlanPricing[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [singleBundleCost, setSingleBundleCost] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchPricingData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/pricing-cost');
      const json = await res.json();
      if (json.success) {
        setModelCosts(json.data.modelCosts);
        setPlans(json.data.plans);
        setStats(json.data.stats);
        setSingleBundleCost(json.data.singleBundleCost);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPricingData();
  }, []);

  const handleUpdateModelCost = (id: string, newCost: number) => {
    setModelCosts((prev) =>
      prev.map((m) => (m.id === id ? { ...m, unitCostKrw: newCost } : m))
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch('/api/admin/pricing-cost', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelCosts, plans }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        fetchPricingData();
      }
    } catch (err: any) {
      alert('저장 실패: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 4대 비즈니스 지표 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold">월간 예상 매출 (MRR)</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            ₩{stats?.mrrEstimate?.toLocaleString() || '1,739,000'}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">현재 가입 매장 기준</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-rose-600 mb-1">
            <span className="text-xs font-bold">월간 AI API 지출 원가</span>
            <Cpu className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600 font-mono">
            ₩{stats?.apiCostEstimate?.toLocaleString() || '214,650'}
          </div>
          <p className="text-[11px] text-rose-500/70 mt-0.5">매출 대비 약 12.3%</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-indigo-600 mb-1">
            <span className="text-xs font-bold">월간 예상 순이익</span>
            <TrendingUp className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-indigo-700 font-mono">
            ₩{stats?.netProfitEstimate?.toLocaleString() || '1,524,350'}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">영업이익률 극대화</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-amber-600 mb-1">
            <span className="text-xs font-bold">평균 종합 마진율</span>
            <Percent className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600">
            {stats?.overallMargin || 87.7}%
          </div>
          <p className="text-[11px] text-emerald-600 font-bold mt-0.5">초고수익 SaaS 구조</p>
        </div>
      </div>

      {/* 1-Click 번들 생성 1회 실측 원가 안내 배너 */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-5 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg border border-indigo-900/50">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 rounded-lg text-xs font-bold">
              초저비용 AI 아키텍처
            </span>
            <h3 className="text-base font-black">7대 채널 올인원 1-Click 번들 1회 생성 원가:</h3>
          </div>
          <p className="text-xs text-slate-300">
            당근 소식 + 스마트플레이스 + 릴스 대본 + 블로그 본문 + 상세페이지 + A4 전단 + 숏폼 합성 일괄 생성 시
          </p>
        </div>
        <div className="text-right">
          <span className="text-3xl font-black text-amber-400 font-mono">₩{singleBundleCost || 178}원</span>
          <span className="text-xs text-slate-400 block font-normal">/ 1회 전체 생성당</span>
        </div>
      </div>

      {/* 모델별 호출 단가 테이블 & 요금제별 마진율 시뮬레이터 (2열 그리드) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 좌측: 모델별 원가 설정 (5열) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-black text-sm text-slate-900 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-indigo-600" /> AI 엔진별 호출 단가 (원)
            </h3>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-2xs"
            >
              <Save className="w-3.5 h-3.5" /> {saving ? '저장 중...' : '단가 저장'}
            </button>
          </div>

          <div className="space-y-3">
            {modelCosts.map((m) => (
              <div key={m.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1 text-xs">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-slate-800">{m.name}</span>
                  <span className="text-[10px] text-slate-400">{m.provider}</span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-500">번들당 {m.typicalCallsPerBundle}회 호출</span>
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400">1회당: ₩</span>
                    <input
                      type="number"
                      step="0.5"
                      value={m.unitCostKrw}
                      onChange={(e) => handleUpdateModelCost(m.id, Number(e.target.value))}
                      className="w-16 px-2 py-0.5 font-bold font-mono text-right bg-white border border-slate-200 rounded-lg"
                    />
                    <span className="text-slate-600">원</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 우측: 요금제 플랜별 마진율 시뮬레이터 (7열) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-black text-sm text-slate-900 flex items-center gap-1.5">
              <PieChart className="w-4 h-4 text-emerald-600" /> SaaS 요금제별 수익성 & 마진율 시뮬레이션
            </h3>
            <span className="text-xs text-slate-400">월간 정기 결제 기준</span>
          </div>

          <div className="space-y-4">
            {plans.map((p) => (
              <div key={p.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-slate-900">{p.name}</span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md font-bold text-[10px]">
                      마진율 {p.marginRate}%
                    </span>
                  </div>
                  <span className="font-mono font-black text-base text-indigo-700">
                    ₩{p.monthlyPriceKrw.toLocaleString()}원/월
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 text-[11px]">
                  <div>
                    <span className="text-slate-400 block">제공 토큰:</span>
                    <span className="font-mono font-bold text-slate-700">{p.monthlyTokenQuota.toLocaleString()} T</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">월간 예상 원가:</span>
                    <span className="font-mono font-bold text-rose-600">₩{p.estimatedMonthlyCostKrw.toLocaleString()}원</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">월간 고객당 순익:</span>
                    <span className="font-mono font-bold text-emerald-600">
                      ₩{(p.monthlyPriceKrw - p.estimatedMonthlyCostKrw).toLocaleString()}원
                    </span>
                  </div>
                </div>

                {/* 마진율 게이지 바 */}
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden mt-1">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-indigo-600 h-full rounded-full"
                    style={{ width: `${p.marginRate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
