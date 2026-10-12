'use client';

import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Zap,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Check,
  Search,
  Sparkles,
  ArrowRight,
  FlaskConical,
} from 'lucide-react';

interface DepositRequest {
  id: string;
  deposit_code: string;
  depositor_name: string;
  user_email: string;
  user_name: string;
  package_name: string;
  original_amount_krw: number;
  discount_krw: number;
  amount_krw: number;
  tokens_to_credit: number;
  status: string;
  raw_sms?: string;
  matched_at?: string;
  created_at: string;
}

export default function AdminDepositAgentSection() {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [stats, setStats] = useState({
    totalCount: 0,
    completedCount: 0,
    pendingCount: 0,
    totalRevenueKrw: 0,
    isOnline: true,
    pairedDevicesCount: 1,
  });

  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'COMPLETED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // 입금 대장 및 상태 불러오기
  const fetchDeposits = async () => {
    try {
      const [depRes, agentRes] = await Promise.all([
        fetch('/api/wallet/direct-deposit'),
        fetch('/api/wallet/deposit-agent'),
      ]);

      const depJson = await depRes.json();
      const agentJson = await agentRes.json();

      if (depJson.success) {
        setDeposits(depJson.deposits || []);
      }

      if (agentJson.success && agentJson.agentStatus) {
        const ag = agentJson.agentStatus;
        setStats({
          totalCount: ag.stats?.totalCount || 0,
          completedCount: ag.stats?.completedCount || 0,
          pendingCount: ag.stats?.pendingCount || 0,
          totalRevenueKrw: ag.stats?.totalRevenueKrw || 0,
          isOnline: ag.isOnline,
          pairedDevicesCount: ag.pairedDevices?.length || 1,
        });
      }
    } catch (err) {
      console.error('Fetch deposits error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeposits();
    const interval = setInterval(fetchDeposits, 5000); // 5초 주기 자동 갱신
    return () => clearInterval(interval);
  }, []);

  // 1. 스마트폰 구글 메시지 SMS 즉시 동기화 실행
  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/wallet/deposit-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SYNC_PHONE' }),
      });
      const json = await res.json();
      if (json.success && json.syncResult?.matched) {
        alert(`🎉 입금 문자 감지 및 자동 승인 완료!\n- 입금자: ${json.syncResult.depositorName}\n- 금액: ${json.syncResult.amountKrw?.toLocaleString()}원\n- 지급 토큰: +${json.syncResult.tokensCredited?.toLocaleString()}T`);
      } else {
        alert('동기화 완료: 새로운 미처리 입금 문자가 없거나 모두 처리되었습니다.');
      }
      fetchDeposits();
    } catch {
      alert('스마트폰 동기화 중 오류가 발생했습니다.');
    } finally {
      setSyncing(false);
    }
  };

  // 2. 가상 입금 SMS 테스트 시뮬레이션
  const handleSimulateTestDeposit = async () => {
    const pendingList = deposits.filter((d) => d.status === 'PENDING');
    if (pendingList.length === 0) {
      alert('현재 대기 중(PENDING)인 입금 요청이 없습니다.\n메인 화면에서 먼저 [⚡ 충전] 버튼을 눌러 입금 계좌를 발급받으세요.');
      return;
    }

    const target = pendingList[0];
    const testSms = `[카카오뱅크] 10/12 ${new Date().toLocaleTimeString().slice(0, 5)} 3333-12-1695965 입금 ${target.amount_krw.toLocaleString()}원 ${target.depositor_name} 잔액 1,500,000원`;

    if (!confirm(`대기 건 [${target.depositor_name} / ${target.amount_krw.toLocaleString()}원]에 대해 아래 은행 문자를 가상으로 감지시키겠습니까?\n\n"${testSms}"`)) {
      return;
    }

    setSimulating(true);
    try {
      const res = await fetch('/api/wallet/deposit-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SIMULATE_SMS',
          simulatedSms: testSms,
        }),
      });
      const json = await res.json();
      if (json.success) {
        alert(json.message);
        fetchDeposits();
      } else {
        alert(`시뮬레이션 실패: ${json.message || json.error}`);
      }
    } catch (err: any) {
      alert('시뮬레이터 오류: ' + err.message);
    } finally {
      setSimulating(false);
    }
  };

  // 3. 관리자 원클릭 수동 승인
  const handleManualAction = async (requestId: string, action: 'APPROVE' | 'HOLD' | 'CANCEL') => {
    if (action === 'APPROVE' && !confirm('해당 입금 건을 수동으로 즉시 승인하고 토큰을 지급하시겠습니까?')) return;
    try {
      const res = await fetch('/api/wallet/direct-deposit', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action }),
      });
      const json = await res.json();
      if (json.success) {
        fetchDeposits();
      } else {
        alert(json.error || '처리에 실패했습니다.');
      }
    } catch {
      alert('처리 중 오류가 발생했습니다.');
    }
  };

  const filteredDeposits = deposits.filter((d) => {
    if (filterStatus !== 'ALL' && d.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        d.depositor_name?.toLowerCase().includes(q) ||
        d.user_email?.toLowerCase().includes(q) ||
        d.package_name?.toLowerCase().includes(q) ||
        d.deposit_code?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
      {/* 1. 상단 타이틀 & 에이전트 상태 바 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center shadow-xs">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-slate-900">Agent M 무통장 입금 자동 감지 엔진 &amp; 토큰 대장</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                실시간 감지 활성 (v2.4)
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              은행 입금 통보 SMS를 실시간 파싱하여 1초 만에 점주 지갑에 토큰을 무인 자동 충전합니다.
            </p>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSimulateTestDeposit}
            disabled={simulating}
            className="px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold transition border border-amber-200 flex items-center gap-1.5 cursor-pointer"
            title="대기 중인 입금 건에 대해 가상 은행 SMS를 즉시 감지시켜 토큰 충전 검증"
          >
            <FlaskConical className="w-4 h-4 text-amber-600" />
            <span>{simulating ? '시뮬레이션 중...' : '🧪 가상 SMS 입금 테스트'}</span>
          </button>

          <button
            onClick={handleSyncNow}
            disabled={syncing}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:bg-indigo-400"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'SMS 동기화 중...' : '스마트폰 SMS 즉시 동기화'}</span>
          </button>
        </div>
      </div>

      {/* 2. 통계 미니 대시보드 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-[11px] font-bold text-slate-500 block">총 무통장 신청</span>
          <span className="text-xl font-black text-slate-900 mt-1 block">
            {stats.totalCount.toLocaleString()}건
          </span>
        </div>

        <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200">
          <span className="text-[11px] font-bold text-emerald-700 block">자동 충전 완료</span>
          <span className="text-xl font-black text-emerald-800 mt-1 block">
            {stats.completedCount.toLocaleString()}건
          </span>
        </div>

        <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200">
          <span className="text-[11px] font-bold text-amber-700 block">입금 대기 (PENDING)</span>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xl font-black text-amber-800">
              {stats.pendingCount.toLocaleString()}건
            </span>
            {stats.pendingCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
            )}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-200">
          <span className="text-[11px] font-bold text-indigo-700 block">무통장 결제 누적 매출</span>
          <span className="text-xl font-black text-indigo-900 mt-1 block">
            {stats.totalRevenueKrw.toLocaleString()}원
          </span>
        </div>
      </div>

      {/* 3. 검색 및 필터 바 */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          {(['ALL', 'PENDING', 'COMPLETED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                filterStatus === st
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'ALL' && '전체 보기'}
              {st === 'PENDING' && `입금 대기 (${stats.pendingCount})`}
              {st === 'COMPLETED' && `완료 (${stats.completedCount})`}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="입금자명, 이메일, 식별코드 검색..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </div>

      {/* 4. 입금 대장 테이블 */}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left text-xs text-slate-700">
          <thead className="bg-slate-50 text-slate-500 text-[11px] font-bold uppercase border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">식별코드 / 요청일시</th>
              <th className="py-3 px-4">입금자명 / 점주 계정</th>
              <th className="py-3 px-4">선택 패키지</th>
              <th className="py-3 px-4">입금 금액 (원가/할인)</th>
              <th className="py-3 px-4">지급 토큰</th>
              <th className="py-3 px-4">상태</th>
              <th className="py-3 px-4 text-right">수동 제어</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {filteredDeposits.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  입금 요청 내역이 없습니다.
                </td>
              </tr>
            ) : (
              filteredDeposits.map((item) => {
                const isPending = item.status === 'PENDING';
                const isCompleted = item.status === 'COMPLETED';

                return (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded inline-block">
                        {item.deposit_code}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        {item.created_at?.slice(0, 16)}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{item.depositor_name}</div>
                      <div className="text-[11px] text-slate-500">{item.user_email}</div>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {item.package_name}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-rose-600 text-sm">
                        {item.amount_krw?.toLocaleString()}원
                      </div>
                      <div className="text-[10px] text-slate-400 line-through">
                        {item.original_amount_krw?.toLocaleString()}원 (-{item.discount_krw}원)
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">
                      +{item.tokens_to_credit?.toLocaleString()} T
                    </td>

                    <td className="py-3.5 px-4">
                      {isCompleted && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          충전 완료
                        </span>
                      )}
                      {isPending && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 animate-pulse">
                          <Clock className="w-3 h-3 text-amber-600" />
                          입금 대기 중
                        </span>
                      )}
                      {!isCompleted && !isPending && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600">
                          {item.status}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right space-x-1.5">
                      {isPending ? (
                        <>
                          <button
                            onClick={() => handleManualAction(item.id, 'APPROVE')}
                            className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold transition shadow-xs cursor-pointer"
                          >
                            원클릭 승인
                          </button>
                          <button
                            onClick={() => handleManualAction(item.id, 'CANCEL')}
                            className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-semibold transition"
                          >
                            취소
                          </button>
                        </>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-mono">
                          {item.matched_at ? 'SMS 자동 감지' : '처리 완료'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
