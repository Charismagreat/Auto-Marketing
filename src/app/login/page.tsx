'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowRight,
  Store,
  Layers,
  CheckCircle,
  HelpCircle,
} from 'lucide-react';
import { startVisitorGoogleLogin, VISITOR_BASIC_SCOPES } from '@/egdesk-visitor-google';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1초 원클릭 구글 로그인 핸들러
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await startVisitorGoogleLogin({
        scopes: VISITOR_BASIC_SCOPES,
        next: '/',
      });
    } catch (err: any) {
      console.error('Google login error:', err);
      setError(err?.message || '구글 로그인 초기화 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };

  // 소상공인 데모 즉시 체험 핸들러
  const handleDemoLogin = () => {
    // 퐁신제빵소 기본 세션으로 즉시 메인 대시보드로 이동
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* 브랜드 로고 */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-amber-400 shadow-xl shadow-indigo-500/20 mb-4 animate-pulse">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-white">
          Auto-Marketing
        </h2>
        <p className="mt-2 text-sm text-indigo-200">
          소상공인과 중소기업을 위한 1-Click AI 마케팅 OS
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-slate-800/80 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-3xl border border-slate-700/80 sm:px-10">
          
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 주요 혜택 뱃지 */}
          <div className="p-4 rounded-2xl bg-indigo-950/60 border border-indigo-500/30 mb-6">
            <div className="flex items-center gap-2 text-indigo-300 font-semibold text-xs mb-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>신규 회원 100% 전원 지급 혜택</span>
            </div>
            <ul className="text-xs text-slate-300 space-y-1.5 pl-1">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>체험용 <strong>50,000 마케팅 토큰</strong> 즉시 지급</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>복잡한 GCP JSON 파일 업로드 없는 <strong>1초 간편 로그인</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>15초 숏폼, 860px 상세페이지, 인쇄물 무제한 생성</span>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            {/* 1. 구글 원클릭 로그인 버튼 */}
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-2xl bg-white text-slate-900 font-bold text-sm shadow-lg hover:bg-slate-100 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{loading ? '로그인 처리 중...' : 'Google 계정으로 1초 시작'}</span>
            </button>

            {/* 구분선 */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-800 px-3 text-slate-400">또는</span>
              </div>
            </div>

            {/* 2. 퐁신제빵소 테스트 계정으로 즉시 둘러보기 */}
            <button
              onClick={handleDemoLogin}
              className="w-full flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold text-sm shadow-md hover:from-amber-600 hover:to-amber-700 transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              <Store className="w-4 h-4 text-amber-100" />
              <span>'퐁신제빵소' 사장님으로 바로 둘러보기</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-1.5 text-xs text-indigo-300 hover:text-indigo-200 transition-colors font-medium"
            >
              <span>새로운 사업장 정보를 등록하시겠습니까?</span>
              <span className="underline font-bold">30초 온보딩 시작하기</span>
            </Link>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-700/60 flex items-center justify-center gap-4 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              안전한 비민감 로그인
            </span>
            <span>•</span>
            <span>데이터 암호화 보호</span>
            <span>•</span>
            <span>무약정 즉시 해지</span>
          </div>
        </div>
      </div>
    </div>
  );
}
