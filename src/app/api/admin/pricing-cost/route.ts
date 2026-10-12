import { NextResponse } from 'next/server';
import { setupDatabase, queryTable } from '@/lib/setup-db';
import { executeSQL } from '@/lib/egdesk-helpers';

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

export async function GET() {
  try {
    await setupDatabase();

    const [costRes, planRes] = await Promise.all([
      queryTable('auto_model_costs', { limit: 50 }).catch(() => ({ rows: [] })),
      queryTable('auto_pricing_plans', { limit: 50 }).catch(() => ({ rows: [] })),
    ]);

    const modelCosts: ModelCostConfig[] = (costRes.rows || []).map((r: any) => ({
      id: r.id,
      name: r.name,
      provider: r.provider,
      type: r.type as any,
      unitCostKrw: Number(r.unit_cost) || 0,
      typicalCallsPerBundle: Number(r.typical_calls) || 1,
    }));

    const plans: PlanPricing[] = (planRes.rows || []).map((r: any) => ({
      id: r.id,
      name: r.name,
      monthlyPriceKrw: Number(r.monthly_price) || 0,
      monthlyTokenQuota: Number(r.token_quota) || 0,
      estimatedBundles: Number(r.estimated_bundles) || 0,
      estimatedMonthlyCostKrw: Number(r.estimated_cost) || 0,
      marginRate: Number(r.margin_rate) || 0,
    }));

    const singleBundleCost = modelCosts.reduce(
      (acc, cur) => acc + cur.unitCostKrw * cur.typicalCallsPerBundle,
      0
    );

    return NextResponse.json({
      success: true,
      data: {
        modelCosts,
        plans,
        singleBundleCost: Math.round(singleBundleCost),
        stats: {
          mrrEstimate: 39000 * 5 + 79000 * 12 + 149000 * 4,
          apiCostEstimate: 2650 * 5 + 7950 * 12 + 21200 * 4,
          netProfitEstimate: 1545650,
          overallMargin: 88.8,
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

// 모델 원가 또는 요금제 가격 시뮬레이션 수정 (SQLite 물리 DB 반영)
export async function PUT(req: Request) {
  try {
    await setupDatabase();
    const body = await req.json();
    const { modelCosts, plans } = body;

    if (Array.isArray(modelCosts)) {
      for (const m of modelCosts) {
        await executeSQL(
          `UPDATE auto_model_costs SET unit_cost = ${Number(m.unitCostKrw) || 0}, typical_calls = ${Number(m.typicalCallsPerBundle) || 1} WHERE id = '${m.id}';`
        );
      }
    }

    if (Array.isArray(plans)) {
      for (const p of plans) {
        await executeSQL(
          `UPDATE auto_pricing_plans SET monthly_price = ${Number(p.monthlyPriceKrw) || 0}, token_quota = ${Number(p.monthlyTokenQuota) || 0}, estimated_bundles = ${Number(p.estimatedBundles) || 0}, estimated_cost = ${Number(p.estimatedMonthlyCostKrw) || 0}, margin_rate = ${Number(p.marginRate) || 0} WHERE id = '${p.id}';`
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'AI 모델 원가 및 요금제 마진율이 SQLite DB에 영구 저장되었습니다.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || '수정 중 오류 발생' },
      { status: 500 }
    );
  }
}
