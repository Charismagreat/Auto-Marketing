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
  Share2,
  Plus,
  Trash2,
  Globe,
} from 'lucide-react';
import { type FooterConfig, type SnsChannel } from '@/app/api/admin/footer/route';
import { SnsIcon } from '@/components/SnsIcons';

export default function AdminFooterTab() {
  const [config, setConfig] = useState<FooterConfig | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'info' | 'sns' | 'terms' | 'privacy' | 'refund'>('info');
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

  // SNS 채널 추가/수정/삭제 핸들러 (시트봇 스타일)
  const handleAddSnsChannel = () => {
    if (!config) return;
    const newChan: SnsChannel = {
      id: `sns_${Date.now()}`,
      type: 'custom',
      name: '새 공식 채널',
      url: 'https://',
      enabled: true,
    };
    setConfig({
      ...config,
      sns_channels: [...(config.sns_channels || []), newChan],
    });
  };

  const handleUpdateSnsChannel = (id: string, updates: Partial<SnsChannel>) => {
    if (!config) return;
    setConfig({
      ...config,
      sns_channels: (config.sns_channels || []).map((ch) =>
        ch.id === id ? { ...ch, ...updates } : ch
      ),
    });
  };

  const handleDeleteSnsChannel = (id: string) => {
    if (!config) return;
    setConfig({
      ...config,
      sns_channels: (config.sns_channels || []).filter((ch) => ch.id !== id),
    });
  };

  if (loading || !config) {
    return <div className="p-8 text-center text-slate-400 text-xs">설정을 불러오는 중입니다...</div>;
  }

  return (
    <div className="space-y-6">
      {/* 서브 탭 네비게이션 & 저장 버튼 */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            onClick={() => setActiveSubTab('info')}
            className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
              activeSubTab === 'info' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            🏢 사업자 기본 정보
          </button>
          <button
            onClick={() => setActiveSubTab('sns')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 cursor-pointer ${
              activeSubTab === 'sns' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>🌐 공식 SNS 채널 ({config.sns_channels?.length || 0})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('terms')}
            className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
              activeSubTab === 'terms' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            📜 이용약관
          </button>
          <button
            onClick={() => setActiveSubTab('privacy')}
            className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
              activeSubTab === 'privacy' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            🛡️ 개인정보처리방침
          </button>
          <button
            onClick={() => setActiveSubTab('refund')}
            className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
              activeSubTab === 'refund' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            💳 환불/취소 규정
          </button>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition shadow-xs cursor-pointer disabled:opacity-50"
        >
          <Save className="w-3.5 h-3.5 text-emerald-400" />
          {saving ? '반영 중...' : '설정 저장 완료'}
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

            {/* 사업자 기본 정보 탭 하단에도 공식 SNS 채널 설정 카드 배치 */}
            <div className="sm:col-span-2 pt-6 border-t border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Share2 className="w-4 h-4 text-indigo-600" />
                    <h4 className="font-extrabold text-sm text-slate-900">
                      공식 SNS 채널 바로가기 설정 ({config.sns_channels?.length || 0}개 등록)
                    </h4>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    푸터에 노출될 소셜 미디어(유튜브, 인스타그램, 블로그, 카카오톡 등) 링크를 켜고 끄거나 새 채널을 추가합니다.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddSnsChannel}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition flex items-center gap-1 cursor-pointer border border-indigo-200/60 shrink-0 self-start sm:self-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ SNS 채널 추가</span>
                </button>
              </div>

              {(!config.sns_channels || config.sns_channels.length === 0) ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  등록된 SNS 채널이 없습니다. [+ SNS 채널 추가] 버튼을 눌러 채널을 등록해 보세요.
                </div>
              ) : (
                <div className="space-y-3 mt-3">
                  {config.sns_channels.map((ch) => (
                    <div
                      key={ch.id}
                      className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        ch.enabled ? 'bg-slate-50/70 border-slate-200' : 'bg-slate-100/50 border-slate-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <span className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs shrink-0">
                          <SnsIcon type={ch.type} className="w-4 h-4" />
                        </span>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1">
                          {/* 채널 종류 */}
                          <select
                            value={ch.type}
                            onChange={(e) =>
                              handleUpdateSnsChannel(ch.id, {
                                type: e.target.value as SnsChannel['type'],
                              })
                            }
                            className="text-xs p-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-800"
                          >
                            <option value="youtube">유튜브 (YouTube)</option>
                            <option value="instagram">인스타그램 (Instagram)</option>
                            <option value="blog">네이버 블로그 (Blog)</option>
                            <option value="kakao">카카오톡 채널 (Kakao)</option>
                            <option value="github">깃허브 (GitHub)</option>
                            <option value="twitter">X (트위터)</option>
                            <option value="custom">기타 공식 웹사이트</option>
                          </select>

                          {/* 채널명 */}
                          <input
                            type="text"
                            value={ch.name}
                            onChange={(e) => handleUpdateSnsChannel(ch.id, { name: e.target.value })}
                            placeholder="채널 표시 이름"
                            className="text-xs p-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-800"
                          />

                          {/* URL */}
                          <input
                            type="url"
                            value={ch.url}
                            onChange={(e) => handleUpdateSnsChannel(ch.id, { url: e.target.value })}
                            placeholder="https://..."
                            className="text-xs p-2 rounded-xl border border-slate-200 bg-white font-mono text-slate-600"
                          />
                        </div>
                      </div>

                      {/* 활성화 토글 & 삭제 */}
                      <div className="flex items-center justify-end gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
                        <button
                          type="button"
                          onClick={() => handleUpdateSnsChannel(ch.id, { enabled: !ch.enabled })}
                          className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer inline-flex items-center gap-1 ${
                            ch.enabled
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                          }`}
                        >
                          {ch.enabled ? '노출 ON' : '숨김 OFF'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteSnsChannel(ch.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl cursor-pointer transition-colors"
                          title="채널 삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 탭: 공식 SNS 채널 전용 관리 화면 (시트봇 스타일) */}
      {activeSubTab === 'sns' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
            <div>
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <Share2 className="w-4 h-4 text-indigo-600" />
                <span>공식 SNS 채널 바로가기 설정</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                서비스 하단 푸터에 노출될 소셜 미디어(유튜브, 인스타그램, 블로그, 카카오톡 등) 링크를 켜고 끄거나 새 채널을 추가합니다.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddSnsChannel}
              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition flex items-center gap-1 cursor-pointer border border-indigo-200/60 shrink-0 self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ SNS 채널 추가</span>
            </button>
          </div>

          {(!config.sns_channels || config.sns_channels.length === 0) ? (
            <div className="p-8 text-center text-xs text-slate-400">
              등록된 SNS 채널이 없습니다. [+ SNS 채널 추가] 버튼을 눌러 채널을 등록해 보세요.
            </div>
          ) : (
            <div className="space-y-3">
              {config.sns_channels.map((ch) => (
                <div
                  key={ch.id}
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    ch.enabled ? 'bg-slate-50/70 border-slate-200' : 'bg-slate-100/50 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <span className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs shrink-0">
                      <SnsIcon type={ch.type} className="w-4 h-4" />
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1">
                      {/* 채널 종류 */}
                      <select
                        value={ch.type}
                        onChange={(e) =>
                          handleUpdateSnsChannel(ch.id, {
                            type: e.target.value as SnsChannel['type'],
                          })
                        }
                        className="text-xs p-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-800"
                      >
                        <option value="youtube">유튜브 (YouTube)</option>
                        <option value="instagram">인스타그램 (Instagram)</option>
                        <option value="blog">네이버 블로그 (Blog)</option>
                        <option value="kakao">카카오톡 채널 (Kakao)</option>
                        <option value="github">깃허브 (GitHub)</option>
                        <option value="twitter">X (트위터)</option>
                        <option value="custom">기타 공식 웹사이트</option>
                      </select>

                      {/* 채널명 */}
                      <input
                        type="text"
                        value={ch.name}
                        onChange={(e) => handleUpdateSnsChannel(ch.id, { name: e.target.value })}
                        placeholder="채널 표시 이름"
                        className="text-xs p-2 rounded-xl border border-slate-200 bg-white font-bold text-slate-800"
                      />

                      {/* URL */}
                      <input
                        type="url"
                        value={ch.url}
                        onChange={(e) => handleUpdateSnsChannel(ch.id, { url: e.target.value })}
                        placeholder="https://..."
                        className="text-xs p-2 rounded-xl border border-slate-200 bg-white font-mono text-slate-600"
                      />
                    </div>
                  </div>

                  {/* 활성화 토글 & 삭제 */}
                  <div className="flex items-center justify-end gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
                    <button
                      type="button"
                      onClick={() => handleUpdateSnsChannel(ch.id, { enabled: !ch.enabled })}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer inline-flex items-center gap-1 ${
                        ch.enabled
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                      }`}
                    >
                      {ch.enabled ? '노출 ON' : '숨김 OFF'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteSnsChannel(ch.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl cursor-pointer transition-colors"
                      title="채널 삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
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
