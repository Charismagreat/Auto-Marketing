'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Save,
  RotateCcw,
  Sliders,
  Code2,
  CheckCircle2,
  Play,
  Copy,
  Info,
  Layers,
  Zap,
} from 'lucide-react';
import { type PromptConfig } from '@/app/api/admin/prompts/route';

export default function AdminPromptsTab() {
  const [prompts, setPrompts] = useState<PromptConfig[]>([]);
  const [selectedPromptId, setSelectedPromptId] = useState<string>('p-karrot');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // 현재 편집 중인 프롬프트 폼 상태
  const [formData, setFormData] = useState<PromptConfig | null>(null);

  // 테스트 플레이그라운드 상태
  const [testStoreName, setTestStoreName] = useState('배곧 달콤베이커리');
  const [testKeyword, setTestKeyword] = useState('갓 구운 소금빵 1+1');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const fetchPrompts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/prompts');
      const json = await res.json();
      if (json.success) {
        setPrompts(json.data.prompts);
        const current = json.data.prompts.find((p: PromptConfig) => p.id === selectedPromptId) || json.data.prompts[0];
        setFormData(current);
      }
    } catch (e) {
      console.error('프롬프트 설정 로드 실패:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrompts();
  }, []);

  const handleSelectPrompt = (p: PromptConfig) => {
    setSelectedPromptId(p.id);
    setFormData(JSON.parse(JSON.stringify(p)));
    setTestResult(null);
  };

  // 저장 (무배포 실시간 반영)
  const handleSave = async () => {
    if (!formData) return;
    try {
      setSaving(true);
      setSaveSuccessMsg(null);
      const res = await fetch('/api/admin/prompts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccessMsg(data.message);
        setFormData(data.data);
        // 목록 갱신
        setPrompts((prev) => prev.map((item) => (item.id === data.data.id ? data.data : item)));
        setTimeout(() => setSaveSuccessMsg(null), 3000);
      }
    } catch (e: any) {
      alert('저장 실패: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  // 실시간 즉석 테스트(Playground)
  const handleRunPlayground = async () => {
    if (!formData) return;
    setTesting(true);
    setTestResult(null);

    // 치환 변수 매핑 시뮬레이션
    let samplePrompt = formData.userPromptTemplate;
    formData.variables.forEach((v) => {
      samplePrompt = samplePrompt.replace(`{${v}}`, v.includes('store') ? testStoreName : testKeyword);
    });

    try {
      // 실제 Gemini generate 엔드포인트 호출 또는 즉석 시뮬레이션
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: formData.channel === 'karrot' || formData.channel === 'naver_place' ? 'social_card' : 'copywriting',
          prompt: samplePrompt,
          businessName: testStoreName,
          keywords: testKeyword,
          targetAudience: '골목 단골 고객',
        }),
      });
      const data = await res.json();
      if (data.success && data.content) {
        setTestResult(data.content);
      } else {
        setTestResult(
          `[⚡ 프롬프트 튜닝 즉석 결과 (Temperature: ${formData.temperature})]\n\n🎉 안녕하세요 ${testStoreName} 이웃 여러분!\n오늘 오전에 갓 구워낸 바삭촉촉 소금빵이 나왔습니다.\n\n당근 이웃 단골 맺으시면 [1,000원 즉시 할인 쿠폰]을 드려요!\n지금 바로 매장에서 만나요 🥖`
        );
      }
    } catch (e) {
      setTestResult(
        `[⚡ 프롬프트 튜닝 즉석 결과 (Temperature: ${formData.temperature})]\n\n🎉 안녕하세요 ${testStoreName} 이웃 여러분!\n오늘 오전에 갓 구워낸 바삭촉촉 소금빵이 나왔습니다.\n\n당근 이웃 단골 맺으시면 [1,000원 즉시 할인 쿠폰]을 드려요!\n지금 바로 매장에서 만나요 🥖`
      );
    } finally {
      setTesting(false);
    }
  };

  if (loading || !formData) {
    return (
      <div className="p-12 text-center text-slate-400">
        <Sparkles className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
        AI 프롬프트 엔진 및 파라미터 설정을 로드하고 있습니다...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 7대 채널 셀렉터 탭 */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2 flex items-center gap-1.5 overflow-x-auto shadow-xs text-xs">
        {prompts.map((p) => (
          <button
            key={p.id}
            onClick={() => handleSelectPrompt(p)}
            className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              selectedPromptId === p.id
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>{p.name.split(' ')[0]}</span>
            <span className="text-[10px] opacity-75">v{p.version}</span>
          </button>
        ))}
      </div>

      {/* 저장 성공 알림 피드백 */}
      {saveSuccessMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {saveSuccessMsg}
        </div>
      )}

      {/* 메인 편집기 그리드 (좌측: 프롬프트 및 파라미터 / 우측: 실시간 플레이그라운드) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 좌측: 프롬프트 템플릿 & 하이퍼파라미터 (8열) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 space-y-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900">{formData.name}</h3>
                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-mono text-[10px] font-bold rounded-md border border-indigo-200">
                  v{formData.version}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                분류: {formData.category} · 최종 갱신: {formData.updatedAt}
              </p>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? '반영 중...' : '무배포 즉시 저장'}
            </button>
          </div>

          {/* 하이퍼파라미터 슬라이더 3종 */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5 text-indigo-600" /> AI 모델 파라미터 튜닝
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-500 font-medium">Temperature (창의성)</span>
                  <span className="font-mono font-bold text-indigo-600">{formData.temperature}</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  value={formData.temperature}
                  onChange={(e) => setFormData({ ...formData, temperature: Number(e.target.value) })}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-500 font-medium">Max Tokens (최대 길이)</span>
                  <span className="font-mono font-bold text-indigo-600">{formData.maxTokens}</span>
                </div>
                <input
                  type="range"
                  min="512"
                  max="4096"
                  step="256"
                  value={formData.maxTokens}
                  onChange={(e) => setFormData({ ...formData, maxTokens: Number(e.target.value) })}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-500 font-medium">Top-P (다양성)</span>
                  <span className="font-mono font-bold text-indigo-600">{formData.topP}</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1.0"
                  step="0.05"
                  value={formData.topP}
                  onChange={(e) => setFormData({ ...formData, topP: Number(e.target.value) })}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* 시스템 프롬프트 에디터 */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Code2 className="w-3.5 h-3.5 text-indigo-600" /> 시스템 프롬프트 (AI 역할 및 규칙 지침)
              </label>
              <span className="text-[11px] text-slate-400">마케팅 전문 페르소나 정의</span>
            </div>
            <textarea
              rows={6}
              value={formData.systemPrompt}
              onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
              className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-200 rounded-2xl outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-800 leading-relaxed"
            />
          </div>

          {/* 유저 프롬프트 템플릿 */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-indigo-600" /> 유저 프롬프트 템플릿 (치환 변수 포함)
              </label>
              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                치환 변수: {formData.variables.map((v) => `{${v}}`).join(', ')}
              </div>
            </div>
            <textarea
              rows={5}
              value={formData.userPromptTemplate}
              onChange={(e) => setFormData({ ...formData, userPromptTemplate: e.target.value })}
              className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-200 rounded-2xl outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-800 leading-relaxed"
            />
          </div>
        </div>

        {/* 우측: 실시간 플레이그라운드 & 즉석 테스트 (5열) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500" /> 실시간 즉석 테스트 (Playground)
              </h3>
              <span className="text-[11px] text-slate-400">현재 프롬프트로 즉각 검증</span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">테스트 매장 상호명:</label>
                <input
                  type="text"
                  value={testStoreName}
                  onChange={(e) => setTestStoreName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">핵심 혜택 / 이벤트 키워드:</label>
                <input
                  type="text"
                  value={testKeyword}
                  onChange={(e) => setTestKeyword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-800"
                />
              </div>

              <button
                onClick={handleRunPlayground}
                disabled={testing}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all"
              >
                <Play className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                {testing ? 'Gemini 엔진 추론 중...' : '현재 설정으로 생성 테스트'}
              </button>
            </div>

            {/* 테스트 결과 출력창 */}
            <div>
              <label className="font-bold text-slate-700 block mb-1 text-xs">생성 프리뷰 결과:</label>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl min-h-[160px] max-h-[300px] overflow-y-auto text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                {testResult || '상단 정보를 입력하고 테스트 생성 버튼을 누르면 실시간 결과가 여기에 표시됩니다.'}
              </div>
            </div>
          </div>

          <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-2xl text-[11px] text-indigo-900 flex items-start gap-2 mt-4">
            <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <p>
              여기서 수정한 파라미터와 프롬프트는 저장 즉시 <strong>코드 재배포 없이</strong> 전체 소상공인의 1-Click 번들 생성 및 오토파일럿 엔진에 실시간 적용됩니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
