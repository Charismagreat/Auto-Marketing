'use client';

import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  CheckCircle2,
  Clock,
  Send,
  Building,
  DollarSign,
  Download,
  Search,
  RefreshCw,
} from 'lucide-react';
import { type TaxInvoice } from '@/app/api/admin/tax-invoices/route';

export default function AdminTaxInvoicesTab() {
  const [invoices, setInvoices] = useState<TaxInvoice[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const fetchTaxData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/tax-invoices');
      const json = await res.json();
      if (json.success) {
        setInvoices(json.data.invoices);
        setStats(json.data.stats);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxData();
  }, []);

  // 국세청 홈택스 즉시 승인 및 전송
  const handleApprove = async (invoiceId: string) => {
    try {
      setApprovingId(invoiceId);
      const res = await fetch('/api/admin/tax-invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', invoiceId }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        fetchTaxData();
      } else {
        alert(data.error || '승인 실패');
      }
    } catch (err: any) {
      alert('오류 발생: ' + err.message);
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* 3대 정산 KPI 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold">국세청 승인 완료 매출액</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">
            ₩{stats?.totalSales?.toLocaleString() || '431,000'}원
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">부가세 10% 포함 정산액</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-amber-600 mb-1">
            <span className="text-xs font-bold">발행 승인 대기</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600">{stats?.pendingCount || 1}건</div>
          <p className="text-[11px] text-amber-600/70 mt-0.5">홈택스 전송 대기 중</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-indigo-600 mb-1">
            <span className="text-xs font-bold">누적 계산서 발행</span>
            <FileCheck2 className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-indigo-700">{stats?.totalCount || 3}건</div>
          <p className="text-[11px] text-slate-400 mt-0.5">사업자 정식 증빙 완료</p>
        </div>
      </div>

      {/* 전자세금계산서 발행 리스트 테이블 */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-black text-sm text-slate-900">전자세금계산서 발급 및 정산 내역</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              유료 요금제 및 맞춤 패키지 결제 점주님들의 홈택스 전자세금계산서 승인 현황을 관리합니다.
            </p>
          </div>
          <button
            onClick={fetchTaxData}
            className="p-1.5 text-slate-500 hover:text-slate-900 bg-slate-100 rounded-xl transition"
            title="새로고침"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
              <tr>
                <th className="py-3 px-4">발행일자</th>
                <th className="py-3 px-4">매장명 / 대표자</th>
                <th className="py-3 px-4">사업자번호</th>
                <th className="py-3 px-4">품목 내역</th>
                <th className="py-3 px-4 text-right">공급가액</th>
                <th className="py-3 px-4 text-right">세액 (VAT)</th>
                <th className="py-3 px-4 text-right">합계금액</th>
                <th className="py-3 px-4 text-center">국세청 승인상태</th>
                <th className="py-3 px-4 text-center">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {invoices.map((inv) => {
                const isApproved = inv.status === 'APPROVED';
                return (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-mono text-slate-500">{inv.issueDate}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{inv.storeName}</div>
                      <div className="text-[11px] text-slate-400">대표 {inv.ceoName} ({inv.email})</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-700">{inv.bizNumber}</td>
                    <td className="py-3.5 px-4 max-w-xs truncate text-slate-700 font-medium">
                      {inv.itemDescription}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-700">
                      ₩{inv.supplyAmount.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-400">
                      ₩{inv.vatAmount.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                      ₩{inv.totalAmount.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {isApproved ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md font-bold text-[10px]">
                            <CheckCircle2 className="w-3 h-3" /> 승인완료
                          </span>
                          {inv.ntsApprovalNumber && (
                            <span className="block font-mono text-[9px] text-slate-400">
                              {inv.ntsApprovalNumber.slice(-8)}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-md font-bold text-[10px]">
                          <Clock className="w-3 h-3" /> 전송대기
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {!isApproved && (
                        <button
                          onClick={() => handleApprove(inv.id)}
                          disabled={approvingId === inv.id}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-2xs"
                        >
                          <Send className="w-3 h-3" /> 국세청 전송
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
