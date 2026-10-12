'use client';

import React, { useState, useEffect } from 'react';
import {
  Building2,
  Shield,
  FileText,
  Save,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';
import { type FooterConfig } from '@/app/api/admin/footer/route';

export default function AdminFooterTab() {
  const [config, setConfig] = useState<FooterConfig | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'info' | 'terms' | 'privacy' | 'refund'>('info');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  const fetchFooter = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/footer');
      const json = await res.json();
      if (json.success) {
        setConfig(json.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFooter();
  }, []);

  const handleSave = async () => {
    if (!config) return;
    try {
      setSaving(true);
      const res = await fetch('/api/admin/footer', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (data.success) {
        setSavedMsg(true);
        setTimeout(() => setSavedMsg(false), 3000);
      }
    } catch (err: any) {
      alert('저장 실패: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !config) {
    return <div className="p-8 text-center text-slate-400 text-xs">설정을 불러오는 중입니다...</div>;
  }

  return (
    <div className="space-y-6">
      {/* 서브 탭 네비게이션 & 저장 버튼 */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-1.5 text-xs">
          <button
            onClick={() => setActiveSubTab('info')}
            className={`px-3 py-1.5 rounded-xl font-bold transition ${
              activeSubTab === 'info' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            🏢 사업자 기본 정보
          </button>
          <button
            onClick={() => setActiveSubTab('terms')}
            className={`px-3 py-1.5 rounded-xl font-bold transition ${
              activeSubTab === 'terms' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            📜 이용약관
          </button>
          <button
            onClick={() => setActiveSubTab('privacy')}
            className={`px-3 py-1.5 rounded-xl font-bold transition ${
              activeSubTab === 'privacy' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            🛡️ 개인정보처리방침
          </button>
          <button
            onClick={() => setActiveSubTab('refund')}
            className={`px-3 py-1.5 rounded-xl font-bold transition ${
              activeSubTab === 'refund' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            💳 환불/취소 규정
          </button>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
        >
          <Save className="w-3.5 h-3.5" />
          {saving ? '반영 중...' : '실시간 무배포 저장'}
        </button>
      </div>

      {savedMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          사업자 정보 및 법무 약관이 프론트엔드 푸터에 즉시 반영되었습니다.
        </div>
      )}

      {/* 탭 1: 사업자 기본 정보 편집기 */}
      {activeSubTab === 'info' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <h3 className="font-black text-sm text-slate-900 border-b border-slate-100 pb-3">
            전자상거래법 의무 고지 사업자 메타 정보
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">상호명 (법인명):</label>
              <input
                type="text"
                value={config.companyName}
                onChange={(e) => setConfig({ ...config, companyName: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">대표자 성함:</label>
              <input
                type="text"
                value={config.ceoName}
                onChange={(e) => setConfig({ ...config, ceoName: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">사업자등록번호:</label>
              <input
                type="text"
                value={config.bizNumber}
                onChange={(e) => setConfig({ ...config, bizNumber: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">통신판매업신고번호:</label>
              <input
                type="text"
                value={config.mailOrderNumber}
                onChange={(e) => setConfig({ ...config, mailOrderNumber: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-bold text-slate-700 block mb-1">사업장 소재지 주소:</label>
              <input
                type="text"
                value={config.address}
                onChange={(e) => setConfig({ ...config, address: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">고객센터 대표 전화번호:</label>
              <input
                type="text"
                value={config.tel}
                onChange={(e) => setConfig({ ...config, tel: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">대표 고객지원 이메일:</label>
              <input
                type="text"
                value={config.email}
                onChange={(e) => setConfig({ ...config, email: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            {/* 🏦 무통장 입금 수령 계좌 설정 (Agent M 연동) */}
            <div className="sm:col-span-2 pt-4 border-t border-slate-200">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <h4 className="font-extrabold text-sm text-slate-900">
                  🏦 Agent M 무통장 입금 수령 계좌 설정 (점주 결제용)
                </h4>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                  결제 모달 실시간 연동
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mb-3">
                점주가 토큰 충전 시 입금할 은행명, 계좌번호, 예금주를 지정합니다. 수정 후 [실시간 무배포 저장]을 누르면 결제 모달에 즉시 반영됩니다.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">입금 은행명:</label>
                  <input
                    type="text"
                    value={config.depositBankName || ''}
                    onChange={(e) => setConfig({ ...config, depositBankName: e.target.value })}
                    placeholder="예: 카카오뱅크, 국민은행"
                    className="w-full p-2.5 bg-indigo-50/40 border border-indigo-200 rounded-xl font-medium text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">수령 계좌번호:</label>
                  <input
                    type="text"
                    value={config.depositAccountNumber || ''}
                    onChange={(e) => setConfig({ ...config, depositAccountNumber: e.target.value })}
                    placeholder="예: 3333-12-1695965"
                    className="w-full p-2.5 bg-indigo-50/40 border border-indigo-200 rounded-xl font-mono font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">예금주명:</label>
                  <input
                    type="text"
                    value={config.depositAccountHolder || ''}
                    onChange={(e) => setConfig({ ...config, depositAccountHolder: e.target.value })}
                    placeholder="예: 차호석"
                    className="w-full p-2.5 bg-indigo-50/40 border border-indigo-200 rounded-xl font-medium text-slate-900"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 탭 2: 이용약관 에디터 */}
      {activeSubTab === 'terms' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-3 shadow-xs">
          <h3 className="font-black text-sm text-slate-900">서비스 이용약관 (Terms of Service)</h3>
          <textarea
            rows={14}
            value={config.termsOfService}
            onChange={(e) => setConfig({ ...config, termsOfService: e.target.value })}
            className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-200 rounded-2xl outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-800 leading-relaxed"
          />
        </div>
      )}

      {/* 탭 3: 개인정보처리방침 에디터 */}
      {activeSubTab === 'privacy' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-3 shadow-xs">
          <h3 className="font-black text-sm text-slate-900">개인정보처리방침 (Privacy Policy)</h3>
          <textarea
            rows={14}
            value={config.privacyPolicy}
            onChange={(e) => setConfig({ ...config, privacyPolicy: e.target.value })}
            className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-200 rounded-2xl outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-800 leading-relaxed"
          />
        </div>
      )}

      {/* 탭 4: 환불 규정 에디터 */}
      {activeSubTab === 'refund' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-3 shadow-xs">
          <h3 className="font-black text-sm text-slate-900">청약철회 및 토큰 환불 규정</h3>
          <textarea
            rows={10}
            value={config.refundPolicy}
            onChange={(e) => setConfig({ ...config, refundPolicy: e.target.value })}
            className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-200 rounded-2xl outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-800 leading-relaxed"
          />
        </div>
      )}
    </div>
  );
}
