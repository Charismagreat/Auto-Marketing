'use client';

import React, { useState, useEffect } from 'react';
import {
  Zap,
  Play,
  ToggleLeft,
  ToggleRight,
  Plus,
  Trash2,
  CloudRain,
  Clock,
  Package,
  Calendar,
  CheckCircle2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { type SmartRule } from '@/app/api/admin/smart-rules/route';

export default function AdminSmartRulesTab() {
  const [rules, setRules] = useState<SmartRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggeringId, setTriggeringId] = useState<string | null>(null);

  // 신규 규칙 모달 상태
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRuleForm, setNewRuleForm] = useState({
    name: '',
    conditionType: 'WEATHER',
    conditionSummary: '',
    targetChannel: 'karrot',
    actionTemplate: '',
  });

  const fetchRules = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/smart-rules');
      const json = await res.json();
      if (json.success) {
        setRules(json.data.rules);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  // 활성/비활성 토글
  const handleToggle = async (ruleId: string) => {
    try {
      const res = await fetch('/api/admin/smart-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle', ruleId }),
      });
      const data = await res.json();
      if (data.success) {
        setRules((prev) =>
          prev.map((r) => (r.id === ruleId ? { ...r, isActive: !r.isActive } : r))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 즉시 1회 실행(Run Now)
  const handleRunNow = async (ruleId: string) => {
    try {
      setTriggeringId(ruleId);
      const res = await fetch('/api/admin/smart-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'run_now', ruleId }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        fetchRules();
      }
    } catch (err: any) {
      alert('실행 실패: ' + err.message);
    } finally {
      setTriggeringId(null);
    }
  };

  // 규칙 삭제
  const handleDelete = async (ruleId: string) => {
    if (!confirm('이 스마트 자동화 규칙을 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`/api/admin/smart-rules?id=${ruleId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchRules();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 새 규칙 등록
  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleForm.name || !newRuleForm.conditionSummary) {
      alert('규칙명과 조건을 입력해 주세요.');
      return;
    }
    try {
      const res = await fetch('/api/admin/smart-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', newRule: newRuleForm }),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setNewRuleForm({
          name: '',
          conditionType: 'WEATHER',
          conditionSummary: '',
          targetChannel: 'karrot',
          actionTemplate: '',
        });
        fetchRules();
      }
    } catch (err: any) {
      alert('규칙 등록 실패: ' + err.message);
    }
  };

  const getConditionIcon = (type: string) => {
    switch (type) {
      case 'WEATHER':
        return <CloudRain className="w-4 h-4 text-sky-500" />;
      case 'DAY_TIME':
        return <Clock className="w-4 h-4 text-amber-500" />;
      case 'STOCK':
        return <Package className="w-4 h-4 text-rose-500" />;
      case 'HOLIDAY':
      default:
        return <Calendar className="w-4 h-4 text-purple-500" />;
    }
  };

  const activeRulesCount = rules.filter((r) => r.isActive).length;
  const totalTriggerCount = rules.reduce((acc, cur) => acc + (cur.totalTriggeredCount || 0), 0);

  return (
    <div className="space-y-6">
      {/* 4대 규칙 현황 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold">등록 스마트 규칙</span>
            <Zap className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{rules.length}개</div>
          <p className="text-[11px] text-slate-400 mt-0.5">이벤트 기반 자동화</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-emerald-600 mb-1">
            <span className="text-xs font-bold">실시간 활성 가동</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600">{activeRulesCount}개</div>
          <p className="text-[11px] text-emerald-700/70 mt-0.5">상시 조건 모니터링 중</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-amber-600 mb-1">
            <span className="text-xs font-bold">누적 자동 트리거</span>
            <Play className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{totalTriggerCount}회</div>
          <p className="text-[11px] text-slate-400 mt-0.5">자동 디스패치 완료</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-purple-600 mb-1">
            <span className="text-xs font-bold">지원 조건 유형</span>
            <Sparkles className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-purple-700">4대 트리거</div>
          <p className="text-[11px] text-slate-400 mt-0.5">날씨 · 요일 · 재고 · 공휴일</p>
        </div>
      </div>

      {/* 헤더 및 새 규칙 등록 버튼 */}
      <div className="flex items-center justify-between bg-white rounded-2xl border border-slate-200 p-4">
        <div>
          <h3 className="font-bold text-sm text-slate-900">이벤트 기반 스마트 자동화 룰 보드</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            특정 날씨(비, 폭염), 황금 타임(불금, 주말), 마감 시간 조건 충족 시 채널별 맞춤 콘텐츠를 자동 발행합니다.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
        >
          <Plus className="w-4 h-4" /> 새 자동화 규칙 등록
        </button>
      </div>

      {/* 스마트 규칙 카드 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className={`p-5 rounded-3xl border transition-all ${
              rule.isActive ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-50/80 border-slate-200 opacity-70'
            }`}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-slate-100 rounded-xl">{getConditionIcon(rule.conditionType)}</span>
                <div>
                  <h4 className="font-black text-sm text-slate-900">{rule.name}</h4>
                  <span className="text-[11px] text-slate-400">조건: {rule.conditionSummary}</span>
                </div>
              </div>

              {/* 활성/비활성 토글 */}
              <button
                onClick={() => handleToggle(rule.id)}
                className="text-2xl transition"
                title={rule.isActive ? '규칙 비활성화' : '규칙 활성화'}
              >
                {rule.isActive ? (
                  <ToggleRight className="w-8 h-8 text-indigo-600" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-slate-300" />
                )}
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs my-3 space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-bold">발행 대상 채널:</span>
                <span className="font-bold text-indigo-600 uppercase">{rule.targetChannel}</span>
              </div>
              <p className="text-slate-700 font-medium">{rule.actionTemplate}</p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-400">
              <div>
                <span>최근 실행: {rule.lastTriggeredAt || '대기 중'}</span>
                <span className="ml-2 font-bold text-slate-600">(누적 {rule.totalTriggeredCount}회)</span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleRunNow(rule.id)}
                  disabled={triggeringId === rule.id}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold text-xs shadow-2xs transition"
                >
                  <Play className={`w-3 h-3 ${triggeringId === rule.id ? 'animate-spin' : ''}`} />
                  즉시 실행 (Run Now)
                </button>
                <button
                  onClick={() => handleDelete(rule.id)}
                  className="p-1 text-slate-300 hover:text-rose-600 rounded-lg transition"
                  title="삭제"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 신규 규칙 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-base font-black text-slate-900">새 스마트 자동화 규칙 등록</h3>

            <form onSubmit={handleCreateRule} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">규칙 이름:</label>
                <input
                  type="text"
                  placeholder="예: ☀️ 주말 화창한 날 피크닉 세트 당근 쿠폰"
                  value={newRuleForm.name}
                  onChange={(e) => setNewRuleForm({ ...newRuleForm, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">조건 유형:</label>
                  <select
                    value={newRuleForm.conditionType}
                    onChange={(e) => setNewRuleForm({ ...newRuleForm, conditionType: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    <option value="WEATHER">기상/날씨 (WEATHER)</option>
                    <option value="DAY_TIME">특정 요일/시간 (DAY_TIME)</option>
                    <option value="STOCK">재고/마감 (STOCK)</option>
                    <option value="HOLIDAY">기념일/공휴일 (HOLIDAY)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">대상 채널:</label>
                  <select
                    value={newRuleForm.targetChannel}
                    onChange={(e) => setNewRuleForm({ ...newRuleForm, targetChannel: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    <option value="karrot">당근 비즈프로필</option>
                    <option value="naver_place">네이버 스마트플레이스</option>
                    <option value="instagram">인스타그램 릴스</option>
                    <option value="naver_blog">네이버 블로그</option>
                    <option value="all">7대 채널 올인원</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">발동 조건 요약:</label>
                <input
                  type="text"
                  placeholder="예: 기온 28도 이상 무더위 감지 시 또는 매주 토요일 오전 9시"
                  value={newRuleForm.conditionSummary}
                  onChange={(e) => setNewRuleForm({ ...newRuleForm, conditionSummary: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">실행 액션 및 콘텐츠 내용:</label>
                <textarea
                  rows={3}
                  placeholder="자동 생성 및 디스패치할 콘텐츠 템플릿..."
                  value={newRuleForm.actionTemplate}
                  onChange={(e) => setNewRuleForm({ ...newRuleForm, actionTemplate: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition shadow-xs"
                >
                  규칙 저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
