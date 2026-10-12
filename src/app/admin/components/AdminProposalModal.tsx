'use client';

import React, { useState } from 'react';
import {
  Printer,
  Copy,
  Check,
  X,
  FileText,
  Sparkles,
  ShieldCheck,
  Send,
  Plus,
  Trash2,
  Building,
  User,
  CreditCard,
  DollarSign,
} from 'lucide-react';
import { MARKETING_PACKAGES, DEFAULT_SUPPLIER, type ProposalItem, type ProposalPackage } from '@/app/api/admin/proposal/route';

interface AdminProposalModalProps {
  initialStore?: {
    name: string;
    ownerName?: string;
    contact?: string;
    address?: string;
  };
  onClose: () => void;
}

/**
 * 숫자를 한글 금액 표기(예: 일백이십만원)로 변환하는 함수
 */
function numberToKoreanWon(amount: number): string {
  if (!amount || isNaN(amount)) return '영';
  const units = ['', '만', '억', '조'];
  const digits = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];

  let result = '';
  let unitIdx = 0;
  let num = Math.floor(amount);

  while (num > 0 && unitIdx < units.length) {
    const part = num % 10000;
    if (part > 0) {
      let partStr = '';
      const p1000 = Math.floor(part / 1000);
      const p100 = Math.floor((part % 1000) / 100);
      const p10 = Math.floor((part % 100) / 10);
      const p1 = part % 10;

      if (p1000 > 0) partStr += (p1000 > 1 ? digits[p1000] : '') + '천';
      if (p100 > 0) partStr += (p100 > 1 ? digits[p100] : '') + '백';
      if (p10 > 0) partStr += (p10 > 1 ? digits[p10] : '') + '십';
      if (p1 > 0) partStr += digits[p1];

      result = partStr + units[unitIdx] + ' ' + result;
    }
    num = Math.floor(num / 10000);
    unitIdx++;
  }

  return result.trim() + '원정';
}

export default function AdminProposalModal({ initialStore, onClose }: AdminProposalModalProps) {
  // 고객(점주) 정보 상태
  const [clientInfo, setClientInfo] = useState({
    storeName: initialStore?.name || '배곧 달콤베이커리',
    ownerName: initialStore?.ownerName || '김점주 대표',
    contact: initialStore?.contact || '010-9876-5432',
    address: initialStore?.address || '경기도 시흥시 배곧4로 30',
  });

  // 견적서 메타 정보
  const today = new Date().toISOString().slice(0, 10);
  const [proposalDate] = useState(today);
  const [proposalNumber] = useState(`PROP-${today.replace(/-/g, '')}-7712`);

  // 선택된 패키지 및 품목 리스트
  const [selectedPkgId, setSelectedPkgId] = useState<string>('autopilot');
  const [items, setItems] = useState<ProposalItem[]>(() => {
    const pkg = MARKETING_PACKAGES.find((p) => p.packageId === 'autopilot') || MARKETING_PACKAGES[0];
    return JSON.parse(JSON.stringify(pkg.items));
  });

  const [discountRate, setDiscountRate] = useState<number>(15);
  const [memo, setMemo] = useState('※ 본 견적서는 발행일로부터 14일간 유효하며, 주간 오토파일럿 구독 시 첫 달 15% 얼리버드 프로모션이 적용됩니다.');
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);

  // 패키지 원클릭 변경 핸들러
  const handleSelectPackage = (pkg: ProposalPackage) => {
    setSelectedPkgId(pkg.packageId);
    setItems(JSON.parse(JSON.stringify(pkg.items)));
    setDiscountRate(pkg.discountRate);
  };

  // 품목 수량/단가 변경 핸들러
  const handleUpdateItem = (id: string, field: keyof ProposalItem, value: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === 'quantity' || field === 'unitPrice') {
            updated.amount = Number(updated.quantity || 0) * Number(updated.unitPrice || 0);
          }
          return updated;
        }
        return item;
      })
    );
  };

  // 품목 추가/삭제
  const handleAddItem = () => {
    const newItem: ProposalItem = {
      id: String(Date.now()),
      name: '맞춤 마케팅 옵션',
      specification: '규격 및 상세',
      quantity: 1,
      unitPrice: 100000,
      amount: 100000,
    };
    setItems((prev) => [...prev, newItem]);
  };

  const handleDeleteItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  // 금액 계산
  const subtotal = items.reduce((acc, cur) => acc + (cur.amount || 0), 0);
  const discountAmount = Math.round(subtotal * (discountRate / 100));
  const supplyPrice = subtotal - discountAmount;
  const vatAmount = Math.round(supplyPrice * 0.1);
  const finalTotal = supplyPrice + vatAmount;

  // 인쇄 실행
  const handlePrint = () => {
    window.print();
  };

  // 클립보드 복사 (메시지 전송용 요약본)
  const handleCopySummary = () => {
    const text = `[오토마케팅 맞춤 제안서]
수신: ${clientInfo.storeName} (${clientInfo.ownerName} 님)
견적번호: ${proposalNumber}
발행일: ${proposalDate}

■ 견적 품목 내역:
${items.map((i) => `- ${i.name} (${i.specification}) : ${i.quantity}건 x ${i.unitPrice.toLocaleString()}원 = ${i.amount.toLocaleString()}원`).join('\n')}

■ 공급가액 합계: ₩${subtotal.toLocaleString()}
■ 특별 할인 (${discountRate}%): -₩${discountAmount.toLocaleString()}
■ 최종 공급가: ₩${supplyPrice.toLocaleString()}
■ 부가세(VAT): ₩${vatAmount.toLocaleString()}
----------------------------------
★ 총 결제금액: ₩${finalTotal.toLocaleString()} (일금 ${numberToKoreanWon(finalTotal)})

■ 입금 계좌: ${DEFAULT_SUPPLIER.bankName} ${DEFAULT_SUPPLIER.accountNumber} (예금주: ${DEFAULT_SUPPLIER.accountHolder})
■ 문의: ${DEFAULT_SUPPLIER.tel} / ${DEFAULT_SUPPLIER.email}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 점주 발송 시뮬레이션
  const handleSendClient = async () => {
    try {
      setSending(true);
      const res = await fetch('/api/admin/proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientInfo,
          packageId: selectedPkgId,
          items,
          totalPrice: subtotal,
          discountAmount,
          vatAmount,
          finalAmount: finalTotal,
          memo,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`${clientInfo.storeName} 사장님께 맞춤 견적서 및 알림톡 발송이 완료되었습니다.`);
      }
    } catch (e: any) {
      alert('발송 실패: ' + e.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      {/* 견적서 전체 래퍼 */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full my-6 flex flex-col max-h-[92vh]">
        {/* 상단 툴바 (화면 표시용) */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/70 rounded-t-3xl print:hidden">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-600 text-white rounded-xl">
              <FileText className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-black text-slate-900">맞춤형 마케팅 견적서 & 제안서 발행기</h2>
              <p className="text-xs text-slate-400">공식 견적 규격 · 한글 금액 자동 표기 · VAT 10% 자동 계산</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition-all shadow-2xs"
            >
              <Printer className="w-4 h-4 text-slate-500" /> A4 인쇄 / PDF 저장
            </button>
            <button
              onClick={handleCopySummary}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition-all shadow-2xs"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
              {copied ? '복사 완료!' : '문자용 복사'}
            </button>
            <button
              onClick={handleSendClient}
              disabled={sending}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              <Send className="w-4 h-4" /> 점주 즉시 전송
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-all ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 3대 패키지 프리셋 선택 바 (화면 표시용) */}
        <div className="p-3 bg-indigo-50/50 border-b border-indigo-100 flex items-center justify-between gap-2 overflow-x-auto print:hidden">
          <span className="text-xs font-bold text-indigo-900 whitespace-nowrap pl-2 flex items-center gap-1">
            <Sparkles className="w-4 h-4 text-indigo-600" /> 원클릭 패키지 적용:
          </span>
          <div className="flex items-center gap-2">
            {MARKETING_PACKAGES.map((pkg) => (
              <button
                key={pkg.packageId}
                onClick={() => handleSelectPackage(pkg)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  selectedPkgId === pkg.packageId
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {pkg.packageName} ({pkg.discountRate > 0 ? `${pkg.discountRate}% OFF` : '기본'})
              </button>
            ))}
          </div>
        </div>

        {/* 인쇄 및 실제 견적서 서식 본문 (A4 규격 디자인) */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-slate-800 bg-white">
          {/* 견적서 헤더 타이틀 */}
          <div className="text-center pb-4 border-b-2 border-slate-900 relative">
            <h1 className="text-3xl font-black tracking-widest text-slate-900">견 적 서 (PROPOSAL)</h1>
            <div className="absolute right-0 bottom-2 text-right text-xs text-slate-500 font-mono">
              <p>문서번호: {proposalNumber}</p>
              <p>발행일자: {proposalDate}</p>
            </div>
          </div>

          {/* 공급자 & 공급받는자 2열 테이블 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* 공급받는 자 (고객/점주) */}
            <div className="border border-slate-300 rounded-xl p-3.5 space-y-2 bg-slate-50/50">
              <div className="flex items-center gap-1 text-slate-500 font-bold border-b border-slate-200 pb-1">
                <User className="w-3.5 h-3.5 text-indigo-600" /> 공급받는 자 (귀하)
              </div>
              <div className="grid grid-cols-3 gap-1">
                <span className="text-slate-400">상호(매장명):</span>
                <input
                  type="text"
                  value={clientInfo.storeName}
                  onChange={(e) => setClientInfo({ ...clientInfo, storeName: e.target.value })}
                  className="col-span-2 font-bold text-slate-900 bg-transparent border-b border-slate-200 focus:border-indigo-500 outline-hidden"
                />
                <span className="text-slate-400">대표자 성함:</span>
                <input
                  type="text"
                  value={clientInfo.ownerName}
                  onChange={(e) => setClientInfo({ ...clientInfo, ownerName: e.target.value })}
                  className="col-span-2 text-slate-800 bg-transparent border-b border-slate-200 focus:border-indigo-500 outline-hidden"
                />
                <span className="text-slate-400">연락처:</span>
                <input
                  type="text"
                  value={clientInfo.contact}
                  onChange={(e) => setClientInfo({ ...clientInfo, contact: e.target.value })}
                  className="col-span-2 text-slate-800 bg-transparent border-b border-slate-200 focus:border-indigo-500 outline-hidden"
                />
                <span className="text-slate-400">매장 주소:</span>
                <input
                  type="text"
                  value={clientInfo.address}
                  onChange={(e) => setClientInfo({ ...clientInfo, address: e.target.value })}
                  className="col-span-2 text-slate-800 bg-transparent border-b border-slate-200 focus:border-indigo-500 outline-hidden truncate"
                />
              </div>
            </div>

            {/* 공급자 정보 (당사 Auto-Marketing) */}
            <div className="border border-slate-300 rounded-xl p-3.5 space-y-2 bg-slate-50/50">
              <div className="flex items-center gap-1 text-slate-500 font-bold border-b border-slate-200 pb-1">
                <Building className="w-3.5 h-3.5 text-slate-700" /> 공급자 (당사)
              </div>
              <div className="grid grid-cols-3 gap-1">
                <span className="text-slate-400">상호 / 대표:</span>
                <span className="col-span-2 font-bold text-slate-900">
                  {DEFAULT_SUPPLIER.companyName} (대표 {DEFAULT_SUPPLIER.ceoName})
                </span>
                <span className="text-slate-400">사업자등록번호:</span>
                <span className="col-span-2 font-mono text-slate-800">{DEFAULT_SUPPLIER.bizNumber}</span>
                <span className="text-slate-400">사업장 주소:</span>
                <span className="col-span-2 text-slate-700 truncate">{DEFAULT_SUPPLIER.address}</span>
                <span className="text-slate-400">전화 / 메일:</span>
                <span className="col-span-2 text-slate-700">
                  {DEFAULT_SUPPLIER.tel} / {DEFAULT_SUPPLIER.email}
                </span>
              </div>
            </div>
          </div>

          {/* 총 견적 금액 하이라이트 배너 */}
          <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
            <div>
              <span className="text-xs text-slate-400 font-medium">총 견적 합계 금액 (VAT 포함)</span>
              <p className="text-xl sm:text-2xl font-black tracking-tight text-amber-400">
                일금 {numberToKoreanWon(finalTotal)} (₩{finalTotal.toLocaleString()})
              </p>
            </div>
            <div className="text-right text-xs text-slate-300 font-mono">
              <p>공급가액: ₩{supplyPrice.toLocaleString()}원</p>
              <p>부 가 세: ₩{vatAmount.toLocaleString()}원</p>
            </div>
          </div>

          {/* 견적 품목 내역 테이블 */}
          <div className="border border-slate-300 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold">
                <tr>
                  <th className="py-2.5 px-3 w-10 text-center">No</th>
                  <th className="py-2.5 px-3">품명 (마케팅 서비스)</th>
                  <th className="py-2.5 px-3">규격 / 상세 스펙</th>
                  <th className="py-2.5 px-3 w-16 text-center">수량</th>
                  <th className="py-2.5 px-3 w-24 text-right">단가</th>
                  <th className="py-2.5 px-3 w-28 text-right">공급가액</th>
                  <th className="py-2.5 px-2 w-10 text-center print:hidden">삭제</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {items.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="py-2 px-3 text-center text-slate-400">{idx + 1}</td>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)}
                        className="w-full font-bold text-slate-800 bg-transparent outline-hidden"
                      />
                    </td>
                    <td className="py-2 px-3 text-slate-500">
                      <input
                        type="text"
                        value={item.specification}
                        onChange={(e) => handleUpdateItem(item.id, 'specification', e.target.value)}
                        className="w-full text-slate-600 bg-transparent outline-hidden text-[11px]"
                      />
                    </td>
                    <td className="py-2 px-3 text-center">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleUpdateItem(item.id, 'quantity', Number(e.target.value))}
                        className="w-12 text-center border border-slate-200 rounded-sm py-0.5"
                      />
                    </td>
                    <td className="py-2 px-3 text-right font-mono">
                      <input
                        type="number"
                        step="1000"
                        value={item.unitPrice}
                        onChange={(e) => handleUpdateItem(item.id, 'unitPrice', Number(e.target.value))}
                        className="w-20 text-right border border-slate-200 rounded-sm py-0.5"
                      />
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                      ₩{(item.amount || 0).toLocaleString()}
                    </td>
                    <td className="py-2 px-2 text-center print:hidden">
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-slate-300 hover:text-rose-600"
                        title="항목 제거"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 항목 추가 버튼 (화면 표시용) */}
          <div className="flex justify-between items-center print:hidden">
            <button
              onClick={handleAddItem}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> 커스텀 마케팅 품목 추가
            </button>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-bold">프로모션 특별 할인율:</span>
              <input
                type="number"
                min="0"
                max="100"
                value={discountRate}
                onChange={(e) => setDiscountRate(Number(e.target.value))}
                className="w-16 px-2 py-1 text-center font-bold border border-slate-200 rounded-lg"
              />
              <span className="font-bold text-slate-700">%</span>
            </div>
          </div>

          {/* 하단 집계 및 결제 계좌 안내 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <span className="font-bold text-slate-700 flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-indigo-600" /> 공식 결제 계좌 안내
              </span>
              <p className="text-slate-800 font-mono">
                {DEFAULT_SUPPLIER.bankName} <span className="font-bold">{DEFAULT_SUPPLIER.accountNumber}</span>
              </p>
              <p className="text-slate-500">예금주: {DEFAULT_SUPPLIER.accountHolder}</p>
              <p className="text-[11px] text-slate-400">※ 세금계산서 발행 시 사업자등록증 사본을 전달해 주시기 바랍니다.</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-right">
              <div className="flex justify-between text-slate-500">
                <span>공급가액 소계:</span>
                <span className="font-mono">₩{subtotal.toLocaleString()}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-rose-600 font-bold">
                  <span>특별 할인 ({discountRate}%):</span>
                  <span className="font-mono">-₩{discountAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600 font-bold pt-1 border-t border-slate-200">
                <span>할인 적용 공급가:</span>
                <span className="font-mono">₩{supplyPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>부가가치세 (VAT 10%):</span>
                <span className="font-mono">₩{vatAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-base font-black text-indigo-900 pt-1 border-t border-slate-300">
                <span>총 견적 금액:</span>
                <span className="font-mono text-indigo-600">₩{finalTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* 특약 및 메모 */}
          <div>
            <span className="text-xs font-bold text-slate-700 block mb-1">특약 사항 / 비고:</span>
            <textarea
              rows={2}
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-700"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
