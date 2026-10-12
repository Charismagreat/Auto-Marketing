'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Store,
  MapPin,
  Phone,
  Link as LinkIcon,
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Wand2,
  HelpCircle,
  Cake,
} from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // 폼 상태
  const [formData, setFormData] = useState({
    name: '',
    category: '베이커리/디저트',
    address: '',
    phone: '',
    description: '',
    place_url: '',
    products: [
      { name: '', price: '', description: '', signature_badge: '대표메뉴' }
    ]
  });

  // 🪄 '퐁신제빵소' 네이버 플레이스 실전 데이터 1초 자동 완성 핸들러
  const handleFillPongshin = () => {
    setFormData({
      name: '퐁신제빵소',
      category: '베이커리/디저트',
      address: '경기도 시흥시 서울대학로 59-69 배곧테크노밸리 1층 138, 139호',
      phone: '0507-1335-5147',
      description: '매일 아침 갓 구워내는 구름처럼 부드럽고 촉촉한 정통 수제 대만 카스테라 전문점',
      place_url: 'https://naver.me/FJIPv54p',
      products: [
        {
          name: '퐁신 오리지널 대만 카스테라',
          price: '11000',
          description: '신선한 무항생제 계란을 듬뿍 넣어 구름처럼 사르르 녹아내리는 시그니처 카스테라',
          signature_badge: '베스트 1위'
        },
        {
          name: '생크림 폭탄 카스테라',
          price: '13000',
          description: '동물성 생크림이 터질 듯이 가득 찬 극상의 부드러움과 달콤함',
          signature_badge: '인기 폭발'
        },
        {
          name: '단짠 체다치즈 카스테라',
          price: '12500',
          description: '진한 체다치즈 2장이 통째로 녹아들어 단짠의 황금 밸런스를 자랑하는 별미',
          signature_badge: '단짠 별미'
        }
      ]
    });
  };

  const handleProductChange = (index: number, field: string, value: string) => {
    const updated = [...formData.products];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, products: updated });
  };

  const addProductField = () => {
    if (formData.products.length < 5) {
      setFormData({
        ...formData,
        products: [
          ...formData.products,
          { name: '', price: '', description: '', signature_badge: '추천' }
        ]
      });
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/business/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        alert('🎉 축하합니다! 비즈니스 프로필이 등록되었으며, 50,000T 마케팅 체험 토큰이 충전되었습니다!');
        router.push('/');
      } else {
        alert(`등록 실패: ${data.error}`);
      }
    } catch (err: any) {
      console.error('Registration failed:', err);
      alert('등록 중 네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto w-full">
        {/* 상단 헤더 & 원클릭 샘플 채우기 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" />
              <span>30초 마케팅 프로필 온보딩</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              비즈니스 정보를 입력하고 AI 마케팅을 시작하세요
            </h1>
          </div>

          <button
            type="button"
            onClick={handleFillPongshin}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-bold shadow-md hover:from-amber-600 hover:to-amber-700 transition-all shadow-amber-500/20 shrink-0 self-start sm:self-center"
          >
            <Wand2 className="w-4 h-4" />
            <span>'퐁신제빵소' 샘플로 1초 채우기</span>
          </button>
        </div>

        {/* 진행 스텝 표시 인디케이터 */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-md mx-auto relative">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -translate-y-1/2 -z-0" />
            <div
              className="absolute top-1/2 left-0 h-0.5 bg-indigo-600 -translate-y-1/2 transition-all duration-300 -z-0"
              style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}
            />

            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                  step >= s
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                    : 'bg-white border-2 border-slate-300 text-slate-400'
                }`}
              >
                {step > s ? <CheckCircle2 className="w-5 h-5 text-white" /> : s}
              </div>
            ))}
          </div>
          <div className="flex justify-between max-w-md mx-auto mt-2 text-[11px] font-semibold text-slate-500">
            <span className={step >= 1 ? 'text-indigo-600' : ''}>기본 정보</span>
            <span className={step >= 2 ? 'text-indigo-600' : ''}>매장/소셜 링크</span>
            <span className={step >= 3 ? 'text-indigo-600' : ''}>주력 상품 등록</span>
          </div>
        </div>

        {/* 폼 카드 컨테이너 */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xl shadow-slate-200/50">
          {/* STEP 1: 비즈니스 기본 정보 */}
          {step === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg font-bold text-slate-900">매장 및 비즈니스 기본 정보</h2>
                <p className="text-xs text-slate-500 mt-1">
                  모든 마케팅 에셋(영상, 상세페이지, 인쇄물)의 기초가 되는 정보입니다.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  상호명 (매장명) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Store className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="예: 퐁신제빵소"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">업종 카테고리</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium bg-white"
                  >
                    <option value="베이커리/디저트">베이커리 / 수제 디저트</option>
                    <option value="음식점/카페">음식점 / 카페</option>
                    <option value="뷰티/헤어">뷰티 / 헤어 / 네일</option>
                    <option value="패션/잡화">패션 / 의류 / 잡화</option>
                    <option value="학원/교육">학원 / 교육 / 클래스</option>
                    <option value="기타">기타 전문 서비스</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">매장 전화번호</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="예: 0507-1335-5147"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">매장 주소 (오프라인 위치)</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="예: 경기도 시흥시 서울대학로 59-69 배곧테크노밸리 1층"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">한 줄 소개 및 매력 포인트</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="예: 매일 아침 구워내는 구름처럼 부드러운 정통 대만 수제 카스테라 전문점"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium resize-none"
                />
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (!formData.name.trim()) {
                      alert('상호명을 입력해 주세요.');
                      return;
                    }
                    setStep(2);
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 text-white font-bold text-sm shadow-md hover:bg-indigo-700 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>다음 단계로 이동</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: 네이버 플레이스 및 링크 */}
          {step === 2 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg font-bold text-slate-900">네이버 플레이스 및 온라인 링크</h2>
                <p className="text-xs text-slate-500 mt-1">
                  플레이스 링크를 등록하면 인쇄물과 포스팅에 지도 QR코드와 링크가 자동으로 삽입됩니다.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  네이버 플레이스 지도 링크 (단축 URL 지원)
                </label>
                <div className="relative">
                  <LinkIcon className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="url"
                    value={formData.place_url}
                    onChange={(e) => setFormData({ ...formData, place_url: e.target.value })}
                    placeholder="예: https://naver.me/FJIPv54p"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  * 네이버 지도 앱에서 '공유' 버튼을 눌러 복사한 주소를 그대로 붙여넣으시면 됩니다.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80">
                <div className="flex items-start gap-2.5">
                  <Cake className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-amber-900">AI 스마트 추출 기능 작동 중</h4>
                    <p className="text-xs text-amber-700/90 mt-0.5 leading-relaxed">
                      네이버 플레이스 링크가 등록되면 AI가 매장의 대표 사진, 메뉴판, 고객 리뷰를 자동으로 크롤링하여 마케팅 에셋에 반영합니다.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>이전 단계</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 text-white font-bold text-sm shadow-md hover:bg-indigo-700 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>다음: 대표 상품 등록</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: 주력 상품 등록 */}
          {step === 3 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">대표 상품 / 시그니처 메뉴 등록</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    쇼핑몰 상세페이지와 숏폼 영상 제작에 사용될 대표 상품을 등록해 주세요.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addProductField}
                  disabled={formData.products.length >= 5}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 disabled:opacity-40"
                >
                  + 상품 추가
                </button>
              </div>

              <div className="space-y-4">
                {formData.products.map((p, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">상품 #{idx + 1}</span>
                      <span className="text-[11px] font-semibold px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-md">
                        {p.signature_badge || '시그니처'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">상품명</label>
                        <input
                          type="text"
                          value={p.name}
                          onChange={(e) => handleProductChange(idx, 'name', e.target.value)}
                          placeholder="예: 퐁신 오리지널 대만 카스테라"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500/20 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">가격 (원)</label>
                        <input
                          type="number"
                          value={p.price}
                          onChange={(e) => handleProductChange(idx, 'price', e.target.value)}
                          placeholder="예: 11000"
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500/20 bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">특징 및 매력 설명</label>
                      <input
                        type="text"
                        value={p.description}
                        onChange={(e) => handleProductChange(idx, 'description', e.target.value)}
                        placeholder="예: 매일 아침 구워내는 구름처럼 촉촉하고 탱글한 식감"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500/20 bg-white"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>이전 단계</span>
                </button>

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-8 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-800 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 hover:from-indigo-700 hover:to-indigo-900 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>{loading ? '비즈니스 등록 중...' : '50,000T 받고 마케팅 시작하기'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
