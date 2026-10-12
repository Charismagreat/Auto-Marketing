'use client';

import React, { useState, useEffect } from 'react';
import {
  Radio,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Trash2,
  Search,
  ExternalLink,
  Clock,
  Zap,
  Activity,
  Filter,
  Eye,
  X,
  RefreshCw,
  Send,
} from 'lucide-react';

interface DispatchLog {
  id: string;
  channel: 'instagram' | 'naver_blog' | 'karrot' | 'naver_place' | 'print_pdf' | 'video_short' | 'detail_page';
  storeId: string;
  storeName: string;
  title: string;
  status: 'SUCCESS' | 'FAILED' | 'RETRYING';
  statusCode: number;
  latencyMs: number;
  payloadSummary: string;
  errorMessage?: string;
  retryCount: number;
  createdAt: string;
  externalUrl?: string;
}

interface DispatchStats {
  total: number;
  successCount: number;
  failedCount: number;
  successRate: number;
  avgLatency: number;
  channelStats: Record<string, number>;
}

export default function AdminDispatchLogsTab() {
  const [logs, setLogs] = useState<DispatchLog[]>([]);
  const [stats, setStats] = useState<DispatchStats>({
    total: 0,
    successCount: 0,
    failedCount: 0,
    successRate: 100,
    avgLatency: 0,
    channelStats: {},
  });
  const [loading, setLoading] = useState(true);
  const [selectedChannel, setSelectedChannel] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState<DispatchLog | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedChannel !== 'ALL') params.set('channel', selectedChannel);
      if (selectedStatus !== 'ALL') params.set('status', selectedStatus);
      if (searchQuery) params.set('search', searchQuery);

      const res = await fetch(`/api/admin/dispatch-logs?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setLogs(json.data.logs);
        setStats(json.data.stats);
      }
    } catch (e) {
      console.error('디스패치 로그 조회 오류:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedChannel, selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  // 원클릭 재시도 핸들러
  const handleRetry = async (logId: string) => {
    try {
      setRetryingId(logId);
      const res = await fetch('/api/admin/dispatch-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'retry', logId }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message || '재시도가 완료되었습니다.');
        fetchLogs();
        if (selectedLog && selectedLog.id === logId) {
          setSelectedLog(data.updatedLog);
        }
      } else {
        alert(data.error || '재시도 실패');
      }
    } catch (err: any) {
      alert('재시도 중 오류: ' + err.message);
    } finally {
      setRetryingId(null);
    }
  };

  // 로그 삭제
  const handleDelete = async (logId: string) => {
    if (!confirm('이 디스패치 로그를 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`/api/admin/dispatch-logs?id=${logId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchLogs();
        if (selectedLog?.id === logId) setSelectedLog(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 채널별 시각적 배지 정보
  const getChannelBadge = (channel: string) => {
    switch (channel) {
      case 'karrot':
        return { label: '🥕 당근 비즈', bg: 'bg-orange-50 text-orange-700 border-orange-200' };
      case 'naver_place':
        return { label: '🌿 스마트플레이스', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'instagram':
        return { label: '📷 인스타그램', bg: 'bg-pink-50 text-pink-700 border-pink-200' };
      case 'naver_blog':
        return { label: '📝 네이버 블로그', bg: 'bg-green-50 text-green-700 border-green-200' };
      case 'print_pdf':
        return { label: '🖨️ A4 전단지', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'video_short':
        return { label: '🎬 15초 숏폼', bg: 'bg-purple-50 text-purple-700 border-purple-200' };
      default:
        return { label: '📄 상세페이지', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
    }
  };

  return (
    <div className="space-y-6">
      {/* 4대 감사 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold">총 발행 디스패치</span>
            <Radio className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {stats.total}
            <span className="text-xs font-normal text-slate-400 ml-1">건</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">7대 채널 누적 전송 요청</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-xs font-bold">발행 성공률</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600">
            {stats.successRate}%
          </div>
          <p className="text-[11px] text-emerald-700/70 mt-1">
            성공 {stats.successCount}건 / 실패 {stats.failedCount}건
          </p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-rose-600 mb-2">
            <span className="text-xs font-bold">발행 실패 / 오류</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600">
            {stats.failedCount}
            <span className="text-xs font-normal text-slate-400 ml-1">건</span>
          </div>
          <p className="text-[11px] text-rose-500/80 mt-1">원클릭 즉시 재시도 가능</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-indigo-600 mb-2">
            <span className="text-xs font-bold">평균 전송 레이턴시</span>
            <Clock className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {stats.avgLatency}
            <span className="text-xs font-normal text-slate-400 ml-1">ms</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">외부 API 응답 소요 시간</p>
        </div>
      </div>

      {/* 채널 탭 및 필터 바 */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
        {/* 채널 필터 버튼군 */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'ALL', label: '전체 채널' },
            { id: 'karrot', label: '🥕 당근' },
            { id: 'naver_place', label: '🌿 플레이스' },
            { id: 'instagram', label: '📷 인스타' },
            { id: 'naver_blog', label: '📝 블로그' },
            { id: 'print_pdf', label: '🖨️ 전단지' },
            { id: 'video_short', label: '🎬 숏폼' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedChannel(tab.id)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                selectedChannel === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 검색 및 상태 필터 */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="매장명 또는 작업 내용 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </form>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-medium text-slate-700"
            >
              <option value="ALL">전체 상태</option>
              <option value="SUCCESS">성공 (200 OK)</option>
              <option value="FAILED">실패 / 오류</option>
            </select>

            <button
              onClick={fetchLogs}
              className="p-1.5 text-slate-500 hover:text-slate-900 bg-slate-100 rounded-xl transition-all"
              title="새로고침"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 디스패치 로그 실시간 테이블 */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
              <tr>
                <th className="py-3 px-4">채널</th>
                <th className="py-3 px-4">상태</th>
                <th className="py-3 px-4">대상 매장</th>
                <th className="py-3 px-4">발행 콘텐츠 / 요약</th>
                <th className="py-3 px-4">HTTP 코드</th>
                <th className="py-3 px-4">지연시간</th>
                <th className="py-3 px-4">발행일시</th>
                <th className="py-3 px-4 text-center">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    조회된 외부 채널 디스패치 로그가 없습니다.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const badge = getChannelBadge(log.channel);
                  const isSuccess = log.status === 'SUCCESS';

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded-lg border font-bold text-[11px] ${badge.bg}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {isSuccess ? (
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" /> 성공
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md text-[11px]">
                            <AlertTriangle className="w-3.5 h-3.5" /> 실패
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800">
                        {log.storeName}
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate text-slate-600 font-medium" title={log.title}>
                        {log.title}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`font-mono font-bold text-xs ${isSuccess ? 'text-emerald-700' : 'text-rose-600'}`}>
                          {log.statusCode}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {log.latencyMs}ms
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                        {log.createdAt}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                            title="로그 상세 감사"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {!isSuccess && (
                            <button
                              onClick={() => handleRetry(log.id)}
                              disabled={retryingId === log.id}
                              className="p-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-all"
                              title="원클릭 재전송"
                            >
                              <RotateCcw className={`w-4 h-4 ${retryingId === log.id ? 'animate-spin' : ''}`} />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(log.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            title="로그 삭제"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 로그 상세 감사 모달 */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-xl border text-xs font-bold ${getChannelBadge(selectedLog.channel).bg}`}>
                  {getChannelBadge(selectedLog.channel).label}
                </span>
                <h3 className="text-base font-black text-slate-900">디스패치 상세 감사</h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl">
                <div>
                  <span className="text-slate-400 font-medium">대상 매장:</span>
                  <p className="font-bold text-slate-800 text-sm mt-0.5">{selectedLog.storeName}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">발행 일시:</span>
                  <p className="font-mono text-slate-700 mt-0.5">{selectedLog.createdAt}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">HTTP 응답 코드:</span>
                  <p className={`font-mono font-bold mt-0.5 ${selectedLog.status === 'SUCCESS' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {selectedLog.statusCode} ({selectedLog.status})
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">응답 지연시간:</span>
                  <p className="font-mono text-slate-700 mt-0.5">{selectedLog.latencyMs} ms</p>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-700 block mb-1">발행 제목 및 작업:</span>
                <div className="p-3 bg-slate-50 rounded-xl font-medium text-slate-800 border border-slate-100">
                  {selectedLog.title}
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-700 block mb-1">페이로드 및 디스패치 내용:</span>
                <div className="p-3 bg-slate-50 rounded-xl font-mono text-[11px] text-slate-700 border border-slate-100 whitespace-pre-wrap">
                  {selectedLog.payloadSummary}
                </div>
              </div>

              {selectedLog.errorMessage && (
                <div>
                  <span className="font-bold text-rose-600 block mb-1">⚠️ 오류 스택 트레이스:</span>
                  <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl font-mono text-[11px] text-rose-800 whitespace-pre-wrap">
                    {selectedLog.errorMessage}
                  </div>
                </div>
              )}

              {selectedLog.externalUrl && (
                <div className="pt-2">
                  <a
                    href={selectedLog.externalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 underline"
                  >
                    발행된 외부 채널 페이지 바로가기 <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <span className="text-[11px] text-slate-400">
                재시도 횟수: <span className="font-bold text-slate-700">{selectedLog.retryCount}회</span>
              </span>
              <div className="flex items-center gap-2">
                {selectedLog.status === 'FAILED' && (
                  <button
                    onClick={() => handleRetry(selectedLog.id)}
                    disabled={retryingId === selectedLog.id}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs shadow-xs transition-all"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${retryingId === selectedLog.id ? 'animate-spin' : ''}`} />
                    원클릭 재전송 (Retry)
                  </button>
                )}
                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-all"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
