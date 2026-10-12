'use client';

import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Send,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  UserCheck,
  CreditCard,
  Copy,
  Plus,
} from 'lucide-react';
import { type SmsMessage } from '@/app/api/admin/sms/route';

export default function AdminSmsTab() {
  const [history, setHistory] = useState<SmsMessage[]>([]);
  const [callers, setCallers] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [balance, setBalance] = useState({ cash: 450000, smsPrice: 15, lmsPrice: 40 });
  const [loading, setLoading] = useState(true);

  // 발송 폼 상태
  const [targetGroup, setTargetGroup] = useState<'ALL' | 'SINGLE'>('ALL');
  const [singleStoreName, setSingleStoreName] = useState('배곧 달콤베이커리');
  const [selectedCaller, setSelectedCaller] = useState('1588-0000');
  const [messageContent, setMessageContent] = useState('');
  const [sending, setSending] = useState(false);

  const fetchSmsData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/sms');
      const json = await res.json();
      if (json.success) {
        setHistory(json.data.history);
        setCallers(json.data.callers);
        setTemplates(json.data.templates);
        setBalance(json.data.balance);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSmsData();
  }, []);

  // 바이트 수 실시간 계산 (한글 2Byte, 영문 1Byte)
  const calculateBytes = (text: string) => {
    let bytes = 0;
    for (let i = 0; i < text.length; i++) {
      bytes += text.charCodeAt(i) > 127 ? 2 : 1;
    }
    return bytes;
  };

  const currentBytes = calculateBytes(messageContent);
  const isLms = currentBytes > 90;

  // 치환 태그 삽입
  const handleInsertTag = (tag: string) => {
    setMessageContent((prev) => prev + tag);
  };

  // 템플릿 적용
  const handleApplyTemplate = (tmpl: any) => {
    setMessageContent(tmpl.content);
  };

  // 발송 핸들러
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageContent.trim()) {
      alert('발송할 메시지 내용을 입력해 주세요.');
      return;
    }
    try {
      setSending(true);
      const res = await fetch('/api/admin/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetGroup,
          singleStoreName,
          senderNumber: selectedCaller,
          content: messageContent,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setMessageContent('');
        fetchSmsData();
      } else {
        alert(data.error || '발송 실패');
      }
    } catch (err: any) {
      alert('발송 오류: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 상단 발송 현황 카드 4종 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold">SMS 충전 잔액</span>
            <CreditCard className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            ₩{balance.cash.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">건당 단문 15원 / 장문 40원</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-indigo-600 mb-1">
            <span className="text-xs font-bold">누적 발송 완료</span>
            <Smartphone className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-indigo-700">{history.length}건</div>
          <p className="text-[11px] text-slate-400 mt-0.5">최근 30일 집계</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-sky-600 mb-1">
            <span className="text-xs font-bold">인증 발신번호</span>
            <UserCheck className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{callers.length}개 번호</div>
          <p className="text-[11px] text-sky-600/80 mt-0.5">전기통신사업법 인증필</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-amber-600 mb-1">
            <span className="text-xs font-bold">자주 쓰는 템플릿</span>
            <FileText className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{templates.length}종</div>
          <p className="text-[11px] text-slate-400 mt-0.5">원클릭 불러오기 지원</p>
        </div>
      </div>

      {/* 발송 폼 & 템플릿 2열 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 좌측: SMS/알림톡 작성 패널 (7열) */}
        <form onSubmit={handleSend} className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-indigo-600" /> 점주 긴급 문자 & 알림톡 발송
            </h3>
            <span className={`px-2.5 py-1 rounded-xl text-xs font-bold font-mono ${isLms ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
              {isLms ? '장문 (LMS)' : '단문 (SMS)'} · {currentBytes} / {isLms ? '2000' : '90'} Byte
            </span>
          </div>

          {/* 발송 대상 및 발신 번호 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">수신 대상:</label>
              <select
                value={targetGroup}
                onChange={(e) => setTargetGroup(e.target.value as any)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
              >
                <option value="ALL">전체 가입 점주 (일괄 발송)</option>
                <option value="SINGLE">특정 점주 지정 (배곧 달콤베이커리)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">발신 번호 (공식 인증):</label>
              <select
                value={selectedCaller}
                onChange={(e) => setSelectedCaller(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-medium font-mono"
              >
                {callers.map((c) => (
                  <option key={c.number} value={c.number}>
                    {c.number} ({c.label.split(' ')[0]})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 치환 태그 단축키 */}
          <div className="flex items-center gap-1.5 text-xs flex-wrap">
            <span className="font-bold text-slate-500 mr-1">치환 태그:</span>
            {['{storeName}', '{ownerName}', '{link}'].map((tag) => (
              <button
                type="button"
                key={tag}
                onClick={() => handleInsertTag(tag)}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono font-bold rounded-lg transition"
              >
                + {tag}
              </button>
            ))}
          </div>

          {/* 메시지 본문 에디터 */}
          <div>
            <textarea
              rows={7}
              placeholder="점주님들께 발송할 메시지 내용을 입력해 주세요. (90바이트 초과 시 자동으로 장문 LMS로 전환됩니다)"
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              className="w-full p-3.5 text-xs bg-slate-50 border border-slate-200 rounded-2xl outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-800 leading-relaxed font-sans"
            />
          </div>

          <div className="flex justify-between items-center pt-2">
            <span className="text-[11px] text-slate-400">
              ※ 야간 시간대(21시~08시) 광고성 메시지 발송 시 정보통신망법에 의해 과태료가 부과될 수 있습니다.
            </span>
            <button
              type="submit"
              disabled={sending || !messageContent.trim()}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              {sending ? '발송 처리 중...' : '메시지 즉시 발송'}
            </button>
          </div>
        </form>

        {/* 우측: 알림 템플릿 프리셋 & 최근 발송 이력 (5열) */}
        <div className="lg:col-span-5 space-y-4">
          {/* 자주 쓰는 템플릿 */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-3 shadow-xs">
            <h4 className="text-xs font-black text-slate-900 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-amber-500" /> 추천 마케팅 공지 템플릿
            </h4>
            <div className="space-y-2">
              {templates.map((tmpl) => (
                <div
                  key={tmpl.id}
                  onClick={() => handleApplyTemplate(tmpl)}
                  className="p-3 bg-slate-50 hover:bg-indigo-50/70 border border-slate-200 hover:border-indigo-300 rounded-2xl cursor-pointer transition text-xs space-y-1"
                >
                  <div className="font-bold text-slate-800 flex items-center justify-between">
                    <span>{tmpl.title}</span>
                    <span className="text-[10px] text-indigo-600 font-bold">적용 ➔</span>
                  </div>
                  <p className="text-slate-500 line-clamp-2 text-[11px] font-sans">{tmpl.content}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 최근 발송 이력 요약 */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-3 shadow-xs">
            <h4 className="text-xs font-black text-slate-900 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" /> 최근 발송 내역
            </h4>
            <div className="space-y-2 max-h-[220px] overflow-y-auto">
              {history.map((h) => (
                <div key={h.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-800">{h.recipientStore}</span>
                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                      {h.type} 완료
                    </span>
                  </div>
                  <p className="text-slate-500 line-clamp-1 text-[11px]">{h.content}</p>
                  <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
                    <span>{h.sentAt}</span>
                    <span>{h.bytes} Byte</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
