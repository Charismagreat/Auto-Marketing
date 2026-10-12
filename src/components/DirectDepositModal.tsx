'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Coins,
  X,
  Check,
  CheckCircle2,
  Copy,
  Zap,
  Lock,
  Unlock,
  RefreshCw,
  QrCode,
  ShieldCheck,
  Sparkles,
  Smartphone,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';
import { TOKEN_PACKAGES, PaymentPackage } from '@/lib/token-wallet';

interface DirectDepositModalProps {
  isOpen: boolean;
  userEmail?: string;
  userName?: string;
  initialBalance?: number;
  onClose: () => void;
  onSuccess: (tokensAdded: number, newBalance?: number) => void;
}

export default function DirectDepositModal({
  isOpen,
  userEmail = 'guest@automarketing.com',
  userName = '소상공인 점주님',
  initialBalance = 50000,
  onClose,
  onSuccess,
}: DirectDepositModalProps) {
  const [selectedPkgId, setSelectedPkgId] = useState<string>('pkg_standard');
  const [depositorName, setDepositorName] = useState(userName || '');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 발급된 세션 데이터
  const [sessionData, setSessionData] = useState<{
    requestId: string;
    depositCode: string;
    depositorName: string;
    packageName: string;
    tokensToCredit: number;
    originalAmountKrw: number;
    discountKrw: number;
    amountKrw: number;
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    expiresAt: string;
  } | null>(null);

  // 입금 감지 상태
  const [isCompleted, setIsCompleted] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [pollCount, setPollCount] = useState(0);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const selectedPkg = TOKEN_PACKAGES.find((p) => p.id === selectedPkgId) || TOKEN_PACKAGES[1];

  // 모달 닫힐 때 폴링 해제 및 상태 초기화
  useEffect(() => {
    if (!isOpen) {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      setSessionData(null);
      setIsUnlocked(false);
      setIsCompleted(false);
      setPollCount(0);
    }
  }, [isOpen]);

  // 세션이 발급되었을 때 실시간 상태 폴링 (1.5초 주기)
  useEffect(() => {
    if (sessionData && !isCompleted && isOpen) {
      pollIntervalRef.current = setInterval(async () => {
        try {
          setPollCount((prev) => prev + 1);
          const res = await fetch(`/api/wallet/direct-deposit?requestId=${sessionData.requestId}`);
          const json = await res.json();

          if (json.success && json.isCompleted) {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            setIsCompleted(true);
            onSuccess(sessionData.tokensToCredit);
          }
        } catch (e) {
          console.warn('[DirectDepositModal] Polling error:', e);
        }
      }, 1500);

      return () => {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      };
    }
  }, [sessionData, isCompleted, isOpen, onSuccess]);

  if (!isOpen) return null;

  // 1단계: 계좌 발급 신청
  const handleRequestDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositorName.trim() || depositorName.trim().length < 2) {
      alert('실제 송금하실 분의 성함(입금자명)을 2글자 이상 입력해 주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/wallet/direct-deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail,
          userName,
          packageId: selectedPkgId,
          depositorName: depositorName.trim(),
          phoneNumber: phoneNumber.trim(),
        }),
      });

      const json = await res.json();
      if (json.success && json.deposit) {
        setSessionData(json.deposit);
        setIsUnlocked(true);
      } else {
        alert(json.error || '입금 요청 생성에 실패했습니다.');
      }
    } catch (err: any) {
      alert('서버 통신 중 오류가 발생했습니다: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = (text: string, type: 'account' | 'amount' | 'code') => {
    navigator.clipboard.writeText(text);
    if (type === 'account') {
      setCopiedAccount(true);
      setTimeout(() => setCopiedAccount(false), 2000);
    } else if (type === 'amount') {
      setCopiedAmount(true);
      setTimeout(() => setCopiedAmount(false), 2000);
    } else {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
        {/* 상단 헤더 */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-50 via-slate-50 to-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">다이렉트 무통장 토큰 충전</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                  Agent M 자동 감지
                </span>
              </div>
              <p className="text-xs text-slate-500">입금 즉시 1초 만에 마케팅 토큰이 자동 충전됩니다</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-200/70 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 바디 컨텐츠 */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* 완료 화면 */}
          {isCompleted ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center animate-bounce shadow-md">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-slate-900">입금 확인 및 토큰 충전 완료!</h4>
                <p className="text-sm text-slate-500 mt-1">
                  <span className="font-semibold text-indigo-600">
                    +{sessionData?.tokensToCredit.toLocaleString()}T
                  </span>
                  가 점주님 지갑에 정상 적립되었습니다.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-1.5 text-slate-600">
                <div className="flex justify-between">
                  <span>충전 패키지</span>
                  <span className="font-medium text-slate-900">{sessionData?.packageName}</span>
                </div>
                <div className="flex justify-between">
                  <span>결제 금액</span>
                  <span className="font-medium text-slate-900">{sessionData?.amountKrw.toLocaleString()}원</span>
                </div>
                <div className="flex justify-between">
                  <span>전자세금계산서</span>
                  <span className="font-medium text-emerald-600">발행 대장 등록 완료 (부가세 포함)</span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-colors"
              >
                확인 및 마케팅 제작 계속하기
              </button>
            </div>
          ) : !isUnlocked ? (
            /* 1단계: 패키지 선택 및 입금자명 입력 */
            <form onSubmit={handleRequestDeposit} className="space-y-4">
              {/* 패키지 선택 그리드 */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">충전 패키지 선택</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {TOKEN_PACKAGES.map((pkg) => {
                    const isSelected = selectedPkgId === pkg.id;
                    return (
                      <div
                        key={pkg.id}
                        onClick={() => setSelectedPkgId(pkg.id)}
                        className={`p-3 rounded-2xl border text-left cursor-pointer transition-all relative ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-2 ring-indigo-500/20'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        {pkg.badge && (
                          <span
                            className={`absolute top-2.5 right-2.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                              pkg.recommended ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {pkg.badge}
                          </span>
                        )}
                        <div className="font-bold text-slate-900 text-sm">{pkg.name}</div>
                        <div className="text-xs text-indigo-600 font-semibold mt-0.5">
                          {pkg.tokens.toLocaleString()} 토큰
                        </div>
                        <div className="text-sm font-bold text-slate-900 mt-2">{pkg.priceStr}원</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 입금자 실명 및 연락처 */}
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    송금자 성함 (실제 입금자명) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={depositorName}
                    onChange={(e) => setDepositorName(e.target.value)}
                    placeholder="예: 홍길동"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-sm font-medium text-slate-900"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    은행 송금 시 표시되는 보내는 분 이름을 정확히 적어주세요.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    입금 알림 휴대폰 번호 (선택)
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="010-0000-0000"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-sm font-medium text-slate-900"
                  />
                </div>
              </div>

              {/* 혜택 안내 배너 */}
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80 text-xs text-amber-800 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">1원 단위 자동 감지 즉시 할인 혜택:</span> 계좌 발급 시 1~99원의 난수 할인이 적용되어 더 저렴하며, 실시간 은행 SMS 자동 감지로 송금 즉시 토큰이 충전됩니다.
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    전용 입금 계좌 및 할인 금액 생성 중...
                  </>
                ) : (
                  <>
                    <span>입금 계좌 및 금액 확인하기</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* 2단계: 입금 계좌 안내 및 실시간 감지 대기 */
            <div className="space-y-4">
              {/* 실시간 감지 레이더 */}
              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative flex items-center justify-center">
                    <span className="absolute w-4 h-4 rounded-full bg-indigo-400 animate-ping opacity-75"></span>
                    <span className="relative w-3 h-3 rounded-full bg-indigo-600"></span>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-indigo-950">Agent M 실시간 입금 감지 중</div>
                    <div className="text-[11px] text-indigo-700">은행 송금 시 1초 만에 자동 충전됩니다 ({pollCount}회 확인)</div>
                  </div>
                </div>
                <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />
              </div>

              {/* 입금 금액 안내 */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>패키지 정가</span>
                  <span className="line-through">{sessionData?.originalAmountKrw.toLocaleString()}원</span>
                </div>
                <div className="flex items-center justify-between text-xs text-emerald-600 font-semibold">
                  <span>고유 감지 즉시 할인</span>
                  <span>-{sessionData?.discountKrw}원</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">최종 송금하실 금액</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black text-rose-600">
                      {sessionData?.amountKrw.toLocaleString()}원
                    </span>
                    <button
                      onClick={() => handleCopy(String(sessionData?.amountKrw), 'amount')}
                      className="px-2 py-1 rounded-lg bg-white border border-slate-300 text-[11px] font-bold text-slate-700 hover:bg-slate-100 flex items-center gap-1"
                    >
                      {copiedAmount ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      금액 복사
                    </button>
                  </div>
                </div>
              </div>

              {/* 입금 계좌 정보 */}
              <div className="p-4 rounded-2xl bg-white border-2 border-slate-300 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600">입금 은행</span>
                  <span className="text-sm font-bold text-slate-900">{sessionData?.bankName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600">예금주</span>
                  <span className="text-sm font-bold text-slate-900">{sessionData?.accountHolder}</span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-bold text-slate-600">계좌번호</span>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black text-slate-900 tracking-wider">
                      {sessionData?.accountNumber}
                    </span>
                    <button
                      onClick={() => handleCopy(sessionData?.accountNumber || '', 'account')}
                      className="px-2 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-[11px] font-bold text-indigo-700 hover:bg-indigo-100 flex items-center gap-1"
                    >
                      {copiedAccount ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      복사
                    </button>
                  </div>
                </div>
              </div>

              {/* 주의사항 */}
              <div className="text-[11px] text-slate-500 space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center gap-1 font-semibold text-slate-700">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                  정확한 자동 처리를 위한 안내
                </div>
                <p>• 반드시 발급된 정확한 금액(<strong>{sessionData?.amountKrw.toLocaleString()}원</strong>)을 송금해 주세요.</p>
                <p>• 송금자명이 <strong>{sessionData?.depositorName}</strong>과 다를 경우 승인이 지연될 수 있습니다.</p>
                <p>• 입금 확인 시 이 창이 자동으로 완료 화면으로 전환됩니다.</p>
              </div>

              {/* 버튼 그룹 */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setIsUnlocked(false)}
                  className="w-1/3 py-2.5 px-3 rounded-xl border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  패키지 재선택
                </button>
                <button
                  onClick={onClose}
                  className="w-2/3 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold shadow-xs transition-colors"
                >
                  송금 완료 후 창 닫기
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
