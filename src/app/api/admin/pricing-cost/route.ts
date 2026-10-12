import { NextResponse } from 'next/server';

export interface ModelCostConfig {
  id: string;
  name: string;
  provider: string;
  type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO';
  unitCostKrw: number; // 1회 호출당 원가 (원)
  typicalCallsPerBundle: number; // 7대 채널 번들 1회 생성 시 평균 호출 횟수
}

export interface PlanPricing {
  id: string;
  name: string;
  monthlyPriceKrw: number;
  monthlyTokenQuota: number;
  estimatedBundles: number;
  estimatedMonthlyCostKrw: number;
  marginRate: number; // %
}

let mockModelCosts: ModelCostConfig[] = [
  { id: 'gemini-flash', name: 'Gemini 2.5 Flash', provider: 'Google Cloud', type: 'TEXT', unitCostKrw: 3.5, typicalCallsPerBundle: 7 },
  { id: 'flux-image', name: 'Flux 1.1 Pro (고화질)', provider: 'Black Forest Labs', type: 'IMAGE', unitCostKrw: 42, typicalCallsPerBundle: 3 },
  { id: 'tts-voice', name: 'Google Cloud TTS Neural2', provider: 'Google Cloud', type: 'AUDIO', unitCostKrw: 12, typicalCallsPerBundle: 1 },
  { id: 'video-render', name: 'Capacitor 숏폼 합성 렌더러', provider: 'Auto-Marketing Local', type: 'VIDEO', unitCostKrw: 15, typicalCallsPerBundle: 1 },
];

let mockPlans: PlanPricing[] = [
  {
    id: 'plan-starter',
    name: '스타터 로컬 팩 (Starter)',
    monthlyPriceKrw: 39000,
    monthlyTokenQuota: 50000,
    estimatedBundles: 15,
    estimatedMonthlyCostKrw: 2650,
    marginRate: 93.2,
  },
  {
    id: 'plan-autopilot',
    name: '오토파일럿 프로 팩 (Pro)',
    monthlyPriceKrw: 79000,
    monthlyTokenQuota: 150000,
    estimatedBundles: 45,
    estimatedMonthlyCostKrw: 7950,
    marginRate: 89.9,
  },
  {
    id: 'plan-enterprise',
    name: '골목대장 올인원 마스터 (Master)',
    monthlyPriceKrw: 149000,
    monthlyTokenQuota: 500000,
    estimatedBundles: 150,
    estimatedMonthlyCostKrw: 26500,
    marginRate: 82.2,
  },
];

export async function GET() {
  try {
    const singleBundleCost = mockModelCosts.reduce(
      (acc, cur) => acc + cur.unitCostKrw * cur.typicalCallsPerBundle,
      0
    );

    return NextResponse.json({
      success: true,
      data: {
        modelCosts: mockModelCosts,
        plans: mockPlans,
        singleBundleCost: Math.round(singleBundleCost),
        stats: {
          mrrEstimate: 39000 * 5 + 79000 * 12 + 149000 * 4, // 1,739,000원
          apiCostEstimate: 2650 * 5 + 7950 * 12 + 26500 * 4, // 214,650원
          netProfitEstimate: 1524350,
          overallMargin: 87.7,
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || '원가 분석 데이터 조회 실패' },
      { status: 500 }
    );
  }
}

// 모델 원가 또는 요금제 가격 시뮬레이션 수정
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { modelCosts, plans } = body;

    if (modelCosts) mockModelCosts = modelCosts;
    if (plans) mockPlans = plans;

    return NextResponse.json({
      success: true,
      message: 'AI 모델 원가 및 요금제 마진율 시뮬레이션이 업데이트되었습니다.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || '수정 중 오류 발생' },
      { status: 500 }
    );
  }
}
