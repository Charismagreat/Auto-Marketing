'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ShieldCheck,
  FileText,
  HelpCircle,
  Phone,
  Mail,
  MapPin,
  Lock,
  ChevronRight,
  ExternalLink,
  X,
  Share2,
} from 'lucide-react';
import { SnsIcon } from '@/components/SnsIcons';

export interface SnsChannel {
  id: string;
  type: 'youtube' | 'instagram' | 'blog' | 'github' | 'kakao' | 'twitter' | 'custom';
  name: string;
  url: string;
  enabled: boolean;
}

export interface FooterConfig {
  companyName: string;
  ceoName: string;
  bizNumber: string;
  mailOrderNumber: string;
  address: string;
  tel: string;
  email: string;
  hostingProvider: string;
  privacyManager: string;
  copyrightText: string;
  depositBankName?: string;
  depositAccountNumber?: string;
  depositAccountHolder?: string;
  sns_channels?: SnsChannel[];
  termsOfService: string;
  privacyPolicy: string;
  refundPolicy: string;
}

interface FooterProps {
  initialConfig?: FooterConfig | null;
}

export default function Footer({ initialConfig }: FooterProps) {
  const [config, setConfig] = useState<FooterConfig | null>(initialConfig || null);
  const [activeModal, setActiveModal] = useState<'terms' | 'privacy' | 'refund' | null>(null);

  useEffect(() => {
    if (!initialConfig) {
      fetch('/api/admin/footer')
        .then((res) => res.json())
        .then((json) => {
          if (json.success && json.data) {
            setConfig(json.data);
          }
        })
        .catch(() => {});
    } else {
      setConfig(initialConfig);
    }
  }, [initialConfig]);

  const current = config || {
    companyName: '(주)오토마케팅',
    ceoName: '홍길동',
    bizNumber: '123-86-09876',
    mailOrderNumber: '제 2026-경기시흥-0412호',
    address: '경기도 시흥시 배곧4로 32-27, 골든플라자 5층 501호',
    tel: '1588-0000',
    email: 'support@auto-marketing.kr',
    hostingProvider: 'Google Cloud Platform (GCP)',
    privacyManager: '김보안 (privacy@auto-marketing.kr)',
    copyrightText: 'Copyright © 2026 Auto-Marketing Corp. All Rights Reserved.',
    termsOfService: '제1조 (목적)\n본 약관은 (주)오토마케팅이 제공하는 소상공인 마케팅 자동화 솔루션 이용에 관한 권리와 의무를 규정합니다.',
    privacyPolicy: '1. 개인정보의 수집 및 이용 목적: 소상공인 회원 본인확인, 마케팅 토큰 충전 정산, 외부 SNS 채널 연동 API 토큰 관리.',
    refundPolicy: '제1조 (환불 규정): 마케팅 토큰 결제 후 미사용 시 7일 이내 전액 환불이 가능합니다.',
  };

  const activeSnsChannels = (current.sns_channels || []).filter((ch) => ch.enabled && ch.url);

  return (
    <footer className="border-t border-slate-200 bg-white text-slate-500 text-xs mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
        {/* 상단 1단: 브랜드 및 고객센터 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-amber-400 flex items-center justify-center text-white shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-base tracking-tight text-slate-900">
                Auto-Marketing
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/50">
                소상공인 1-Click AI 마케팅 OS
              </span>
            </div>
            <p className="text-slate-500 text-xs max-w-xl leading-relaxed">
              사진 1장과 한 줄 설명으로 광고 영상, 인스타그램 카드뉴스, 네이버 블로그, 스마트스토어 상세페이지, 오프라인 인쇄물까지 올인원 자동 생성하고 발행합니다.
            </p>

            {/* 공식 SNS 채널 바로가기 목록 (시트봇 스타일) */}
            {activeSnsChannels.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[11px] font-bold text-slate-700 mr-1 flex items-center gap-1">
                  <Share2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>공식 채널:</span>
                </span>
                {activeSnsChannels.map((sns) => (
                  <a
                    key={sns.id}
                    href={sns.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200/80 transition text-[11px] font-semibold shadow-2xs hover:shadow-xs cursor-pointer"
                  >
                    <SnsIcon type={sns.type} className="w-3.5 h-3.5" />
                    <span>{sns.name}</span>
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* 고객성공센터 빠른 안내 */}
          <div className="flex items-center gap-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-medium text-slate-400">점주 전용 고객센터</div>
              <div className="text-sm font-extrabold text-slate-900 font-mono">{current.tel}</div>
              <div className="text-[10px] text-slate-400">평일 09:30 ~ 18:30 (주말/공휴일 휴무)</div>
            </div>
          </div>
        </div>

        {/* 중단 2단: 약관 및 정책 링크 탭 바 */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-semibold text-slate-600">
          <button
            onClick={() => setActiveModal('terms')}
            className="hover:text-indigo-600 transition underline underline-offset-4 cursor-pointer"
          >
            서비스 이용약관
          </button>
          <span className="text-slate-300">•</span>
          <button
            onClick={() => setActiveModal('privacy')}
            className="hover:text-indigo-600 font-bold text-slate-800 transition underline underline-offset-4 cursor-pointer"
          >
            개인정보처리방침
          </button>
          <span className="text-slate-300">•</span>
          <button
            onClick={() => setActiveModal('refund')}
            className="hover:text-indigo-600 transition underline underline-offset-4 cursor-pointer"
          >
            청약철회 및 환불규정
          </button>
          <span className="text-slate-300">•</span>
          <Link
            href="/admin"
            className="hover:text-indigo-600 transition flex items-center gap-1 text-indigo-600"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            슈퍼 관리자 관제탑
          </Link>
        </div>

        {/* 하단 3단: 전자상거래법 필수 사업자 고지 정보 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-2 gap-x-6 text-[11px] text-slate-500 leading-normal pt-2">
          <div>
            <span className="font-semibold text-slate-700">상호명:</span> {current.companyName}
            <span className="mx-1.5 text-slate-300">|</span>
            <span className="font-semibold text-slate-700">대표자:</span> {current.ceoName}
          </div>
          <div>
            <span className="font-semibold text-slate-700">사업자등록번호:</span> {current.bizNumber}
          </div>
          <div>
            <span className="font-semibold text-slate-700">통신판매업신고번호:</span> {current.mailOrderNumber}
          </div>
          <div>
            <span className="font-semibold text-slate-700">사업장 주소:</span> {current.address}
          </div>
          <div>
            <span className="font-semibold text-slate-700">대표 이메일:</span> {current.email}
          </div>
          <div>
            <span className="font-semibold text-slate-700">개인정보보호책임자:</span> {current.privacyManager}
          </div>
          <div className="lg:col-span-3 text-slate-400 text-[10px] pt-1">
            호스팅 서비스 제공: {current.hostingProvider} • 오토마케팅의 모든 콘텐츠 생성 및 AI 엔진은 소상공인 사업장 정보를 안전하게 보호합니다.
          </div>
        </div>

        {/* 저작권 표시 */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
          <p>{current.copyrightText}</p>
          <p className="text-[10px] text-slate-400">
            Powered by EGDesk AI Engine • Single Click Marketing Automation OS
          </p>
        </div>
      </div>

      {/* 법무 약관 전문 모달 */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h3 className="font-extrabold text-base text-slate-900">
                  {activeModal === 'terms' && '서비스 이용약관'}
                  {activeModal === 'privacy' && '개인정보처리방침'}
                  {activeModal === 'refund' && '청약철회 및 환불규정'}
                </h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto text-xs text-slate-700 leading-relaxed whitespace-pre-line font-mono bg-slate-50/50">
              {activeModal === 'terms' && current.termsOfService}
              {activeModal === 'privacy' && current.privacyPolicy}
              {activeModal === 'refund' && current.refundPolicy}
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setActiveModal(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}
