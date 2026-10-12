'use client';

import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  Plus,
  Trash2,
  CheckCircle2,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { type FaqItem } from '@/app/api/admin/faqs/route';

export default function AdminFaqsTab() {
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState('ALL');

  // 신규 등록 폼 상태
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    category: 'CONNECT',
    categoryLabel: '채널 연동',
    question: '',
    answer: '',
  });

  const fetchFaqs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/faqs');
      const json = await res.json();
      if (json.success) {
        setFaqs(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.question || !form.answer) {
      alert('질문과 답변을 모두 입력해 주세요.');
      return;
    }
    try {
      const res = await fetch('/api/admin/faqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setShowAdd(false);
        setForm({ category: 'CONNECT', categoryLabel: '채널 연동', question: '', answer: '' });
        fetchFaqs();
      }
    } catch (err: any) {
      alert('FAQ 등록 오류: ' + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('이 FAQ를 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`/api/admin/faqs?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchFaqs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = selectedCat === 'ALL' ? faqs : faqs.filter((f) => f.category === selectedCat);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-slate-200 p-5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div>
          <h3 className="font-black text-sm text-slate-900 flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-indigo-600" /> 소상공인 자주 묻는 질문(FAQ) CMS
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            점주들이 셀프 해결할 수 있도록 채널 연동, 결제, 인쇄 가이드를 큐레이션합니다.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" /> 새 FAQ 등록
          </button>
          <button
            onClick={fetchFaqs}
            className="p-1.5 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-xl transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 카테고리 필터 */}
      <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
        {['ALL', 'CONNECT', 'BILLING', 'PRINT'].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCat(cat)}
            className={`px-3 py-1.5 rounded-xl font-bold transition ${
              selectedCat === cat ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {cat === 'ALL' ? '전체' : cat === 'CONNECT' ? '채널 연동' : cat === 'BILLING' ? '결제/토큰' : '인쇄/배송'}
          </button>
        ))}
      </div>

      {/* FAQ 카드 목록 */}
      <div className="space-y-3">
        {filtered.map((item) => (
          <div key={item.id} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-md border border-indigo-200">
                  {item.categoryLabel}
                </span>
                <h4 className="font-bold text-xs text-slate-900">{item.question}</h4>
              </div>
              <button
                onClick={() => handleDelete(item.id)}
                className="text-slate-300 hover:text-rose-600 transition"
                title="삭제"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl leading-relaxed whitespace-pre-wrap">
              {item.answer}
            </p>
          </div>
        ))}
      </div>

      {/* 새 FAQ 추가 모달 */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="font-black text-sm text-slate-900">새 자주 묻는 질문(FAQ) 등록</h3>
            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">카테고리:</label>
                <select
                  value={form.category}
                  onChange={(e) => {
                    const cat = e.target.value;
                    const label = cat === 'CONNECT' ? '채널 연동' : cat === 'BILLING' ? '결제/토큰' : '인쇄/배송';
                    setForm({ ...form, category: cat, categoryLabel: label });
                  }}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="CONNECT">채널 연동</option>
                  <option value="BILLING">결제/토큰</option>
                  <option value="PRINT">인쇄/배송</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">질문 (Question):</label>
                <input
                  type="text"
                  placeholder="예: 당근마켓 쿠폰 발행 시 비용이 드나요?"
                  value={form.question}
                  onChange={(e) => setForm({ ...form, question: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">답변 (Answer):</label>
                <textarea
                  rows={4}
                  placeholder="점주님이 쉽게 이해할 수 있는 답변을 입력해 주세요."
                  value={form.answer}
                  onChange={(e) => setForm({ ...form, answer: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="px-4 py-2 bg-slate-100 rounded-xl font-bold text-slate-700"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-xl shadow-xs"
                >
                  등록 완료
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
