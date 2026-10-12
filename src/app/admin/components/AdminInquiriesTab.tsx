'use client';

import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Sparkles,
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Filter,
  User,
  Store,
  Tag,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Edit3,
} from 'lucide-react';
import { type Inquiry } from '@/app/api/admin/inquiries/route';
import { onUserDataChanged } from '@/lib/egdesk-helpers';

export default function AdminInquiriesTab() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, resolved: 0 });
  const [selectedId, setSelectedId] = useState<string>('inq-101');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // 답변 입력창 상태
  const [replyInput, setReplyInput] = useState('');
  const [internalNoteInput, setInternalNoteInput] = useState('');
  const [aiDrafting, setAiDrafting] = useState(false);
  const [submittingReply, setSubmittingReply] = useState(false);

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (categoryFilter !== 'ALL') params.set('category', categoryFilter);
      if (searchQuery) params.set('search', searchQuery);

      const res = await fetch(`/api/admin/inquiries?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setInquiries(json.data.inquiries);
        setStats(json.data.stats);
        if (json.data.inquiries.length > 0 && !selectedId) {
          setSelectedId(json.data.inquiries[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();

    // ⚡ [0초 실시간 감시] 이지데스크 공식 DB Watcher(SSE) 연동 (CS 문의 및 답변 실시간 동기화)
    const unsub = onUserDataChanged((event) => {
      if (!event.tableName || event.tableName === 'auto_inquiries' || event.tableName === 'auto_inquiry_replies') {
        fetchInquiries();
      }
    });

    return () => unsub();
  }, [statusFilter, categoryFilter]);

  const selectedInquiry = inquiries.find((i) => i.id === selectedId) || inquiries[0];

  useEffect(() => {
    if (selectedInquiry) {
      setInternalNoteInput(selectedInquiry.internalNote || '');
      setReplyInput('');
    }
  }, [selectedId]);

  // AI 자동 답변 초안 생성
  const handleGenerateAiDraft = async () => {
    if (!selectedInquiry) return;
    try {
      setAiDrafting(true);
      const res = await fetch('/api/admin/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ai_draft',
          inquiryId: selectedInquiry.id,
          storeName: selectedInquiry.storeName,
          title: selectedInquiry.title,
          content: selectedInquiry.content,
        }),
      });
      const data = await res.json();
      if (data.success && data.aiDraft) {
        setReplyInput(data.aiDraft);
      }
    } catch (err: any) {
      alert('AI 초안 생성 실패: ' + err.message);
    } finally {
      setAiDrafting(false);
    }
  };

  // 답변 제출
  const handleSubmitReply = async (newStatus: 'IN_PROGRESS' | 'RESOLVED' = 'RESOLVED') => {
    if (!replyInput.trim() || !selectedInquiry) return;
    try {
      setSubmittingReply(true);
      const res = await fetch('/api/admin/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reply',
          inquiryId: selectedInquiry.id,
          replyContent: replyInput,
          newStatus,
          internalNote: internalNoteInput,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert('답변이 점주님께 발송되었습니다.');
        setReplyInput('');
        fetchInquiries();
      }
    } catch (err: any) {
      alert('답변 등록 실패: ' + err.message);
    } finally {
      setSubmittingReply(false);
    }
  };

  // 상태만 변경
  const handleUpdateStatus = async (status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED') => {
    if (!selectedInquiry) return;
    try {
      const res = await fetch('/api/admin/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_status',
          inquiryId: selectedInquiry.id,
          newStatus: status,
          internalNote: internalNoteInput,
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchInquiries();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* 문의 통계 4종 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold">전체 점주 문의</span>
            <MessageSquare className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.total}건</div>
          <p className="text-[11px] text-slate-400 mt-0.5">누적 접수 상담 건수</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-rose-600 mb-1">
            <span className="text-xs font-bold">답변 대기 (미답변)</span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600">{stats.pending}건</div>
          <p className="text-[11px] text-rose-500/70 mt-0.5">긴급 답변 우선 처리</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-amber-600 mb-1">
            <span className="text-xs font-bold">상담 처리 중</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600">{stats.inProgress}건</div>
          <p className="text-[11px] text-slate-400 mt-0.5">추가 피드백 진행 중</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-emerald-600 mb-1">
            <span className="text-xs font-bold">해결 완료</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600">{stats.resolved}건</div>
          <p className="text-[11px] text-emerald-700/70 mt-0.5">고객 만족 해결</p>
        </div>
      </div>

      {/* 메인 2열 그리드 (좌측: 목록 / 우측: 상세 및 AI 답변) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 좌측: 문의 목록 (5열) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-800">점주 문의 접수함</h3>
            <button
              onClick={fetchInquiries}
              className="p-1 text-slate-400 hover:text-slate-700 transition"
              title="새로고침"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* 필터 셀렉터 */}
          <div className="flex items-center gap-2 text-xs">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-1/2 p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700"
            >
              <option value="ALL">전체 상태</option>
              <option value="PENDING">대기중 (PENDING)</option>
              <option value="IN_PROGRESS">상담중 (IN_PROGRESS)</option>
              <option value="RESOLVED">해결완료 (RESOLVED)</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-1/2 p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700"
            >
              <option value="ALL">전체 카테고리</option>
              <option value="CHANNEL_CONNECT">채널 연동</option>
              <option value="BILLING">요금/토큰</option>
              <option value="QUALITY">생성 품질</option>
              <option value="FEATURE_REQUEST">기능 제안</option>
            </select>
          </div>

          {/* 문의 목록 아이템 */}
          <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
            {inquiries.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                조건에 맞는 문의 내역이 없습니다.
              </div>
            ) : (
              inquiries.map((inq) => {
                const isSelected = selectedInquiry?.id === inq.id;
                return (
                  <div
                    key={inq.id}
                    onClick={() => setSelectedId(inq.id)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-50/70 border-indigo-300 shadow-xs'
                        : 'bg-white hover:bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-bold text-slate-900 truncate max-w-[150px]">
                        {inq.storeName}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                          inq.status === 'PENDING'
                            ? 'bg-rose-100 text-rose-700'
                            : inq.status === 'IN_PROGRESS'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {inq.status === 'PENDING' ? '대기' : inq.status === 'IN_PROGRESS' ? '상담중' : '완료'}
                      </span>
                    </div>

                    <h4 className="font-bold text-xs text-slate-800 line-clamp-1 mb-1">{inq.title}</h4>
                    <p className="text-[11px] text-slate-500 line-clamp-2">{inq.content}</p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 pt-2 border-t border-slate-100">
                      <span>{inq.categoryLabel}</span>
                      <span>{inq.createdAt}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 우측: 문의 상세 및 AI 답변 작성기 (7열) */}
        {selectedInquiry ? (
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 space-y-5 shadow-xs">
            {/* 문의 메타 정보 헤더 */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {selectedInquiry.categoryLabel}
                  </span>
                  <span className="text-xs text-slate-400">접수일: {selectedInquiry.createdAt}</span>
                </div>
                <h2 className="text-base font-black text-slate-900 mt-1">{selectedInquiry.title}</h2>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                  <span className="font-bold text-slate-800">{selectedInquiry.storeName}</span>
                  <span>({selectedInquiry.authorName})</span>
                  <span>· 연락처: {selectedInquiry.contact}</span>
                </div>
              </div>

              {/* 상태 변경 셀렉터 */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleUpdateStatus('PENDING')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                    selectedInquiry.status === 'PENDING' ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  대기
                </button>
                <button
                  onClick={() => handleUpdateStatus('IN_PROGRESS')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                    selectedInquiry.status === 'IN_PROGRESS' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  상담중
                </button>
                <button
                  onClick={() => handleUpdateStatus('RESOLVED')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                    selectedInquiry.status === 'RESOLVED' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  완료
                </button>
              </div>
            </div>

            {/* 문의 내용 본문 */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-800 leading-relaxed whitespace-pre-wrap font-medium">
              {selectedInquiry.content}
            </div>

            {/* 내부 관리자 메모 (비공개) */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 flex items-center gap-1">
                <Edit3 className="w-3.5 h-3.5 text-slate-400" /> 관리자 내부 메모 (점주 비공개)
              </label>
              <input
                type="text"
                placeholder="담당자 및 특이사항 메모..."
                value={internalNoteInput}
                onChange={(e) => setInternalNoteInput(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-amber-50/50 border border-amber-200 rounded-xl text-slate-800 outline-hidden focus:ring-1 focus:ring-amber-400"
              />
            </div>

            {/* 기존 답변 히스토리 */}
            {selectedInquiry.replies.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-700 block">이전 답변 내역:</span>
                {selectedInquiry.replies.map((r) => (
                  <div key={r.id} className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-bold text-indigo-900">
                      <span>{r.author}</span>
                      <span className="text-slate-400 font-normal">{r.createdAt}</span>
                    </div>
                    <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{r.content}</p>
                  </div>
                ))}
              </div>
            )}

            {/* 답변 입력창 및 AI 원클릭 초안 생성기 */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-indigo-600" /> 점주 답변 작성
                </label>
                <button
                  type="button"
                  onClick={handleGenerateAiDraft}
                  disabled={aiDrafting}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${aiDrafting ? 'animate-spin' : ''}`} />
                  {aiDrafting ? 'AI 답변 작성 중...' : '⚡ AI 1-Click 답변 초안 생성'}
                </button>
              </div>

              <textarea
                rows={5}
                placeholder="점주님께 전달할 정중한 답변을 입력해 주세요. (또는 상단 AI 초안 생성 버튼 활용)"
                value={replyInput}
                onChange={(e) => setReplyInput(e.target.value)}
                className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-2xl outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-800 leading-relaxed"
              />

              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => handleSubmitReply('IN_PROGRESS')}
                  disabled={submittingReply || !replyInput.trim()}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition disabled:opacity-50"
                >
                  상담중 상태로 답변
                </button>
                <button
                  onClick={() => handleSubmitReply('RESOLVED')}
                  disabled={submittingReply || !replyInput.trim()}
                  className="inline-flex items-center gap-1 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  답변 발송 및 해결 완료
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-7 py-20 text-center text-slate-400 bg-white rounded-3xl border border-slate-200 text-xs">
            문의 항목을 선택해 주세요.
          </div>
        )}
      </div>
    </div>
  );
}
