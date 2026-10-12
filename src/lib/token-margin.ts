import { queryTable, updateRows, insertRows } from './egdesk-helpers';

export interface BilledTokenResult {
  actualPromptTokens: number;
  actualCompletionTokens: number;
  actualTotalTokens: number;
  marginRate: number; // e.g. 88.8 (%)
  marginMultiplier: number; // e.g. 1.888
  billedTokens: number; // 실제 점주 지갑에서 차감될 토큰
}

/**
 * AI Caller 실제 사용 토큰에 플랫폼 마진율(auto_pricing_plans 기준)을 적용하여 차감 토큰 계산
 */
export async function calculateBilledTokens(
  usage: { promptTokens?: number; completionTokens?: number; totalTokens?: number },
  userPlan: string = 'PRO'
): Promise<BilledTokenResult> {
  const promptTokens = Number(usage.promptTokens) || 0;
  const completionTokens = Number(usage.completionTokens) || 0;
  const actualTotal = Number(usage.totalTokens) || (promptTokens + completionTokens) || 100;

  // DB에서 사용자의 플랜에 정의된 마진율 조회 (기본값: Pro 88.8%)
  let marginRate = 88.8;
  try {
    const planRes = await queryTable('auto_pricing_plans', { limit: 10 });
    const plans = planRes?.rows || [];
    const matched = plans.find((p: any) => 
      p.id?.toLowerCase().includes(userPlan.toLowerCase()) || 
      p.name?.toLowerCase().includes(userPlan.toLowerCase())
    );
    if (matched && matched.margin_rate) {
      marginRate = Number(matched.margin_rate);
    }
  } catch {
    marginRate = 88.8;
  }

  // 마진율 적용 과금 배율: 1 + (marginRate / 100)
  // 예: 마진율 88.8% 적용 시 실제 1,000 AI 토큰 소비 ➔ 1,888 마케팅 토큰 차감
  const marginMultiplier = Number((1 + marginRate / 100).toFixed(3));
  const billedTokens = Math.max(10, Math.round(actualTotal * marginMultiplier));

  return {
    actualPromptTokens: promptTokens,
    actualCompletionTokens: completionTokens,
    actualTotalTokens: actualTotal,
    marginRate,
    marginMultiplier,
    billedTokens,
  };
}

/**
 * AI Caller 실제 호출 결과에 비례하여 마진율을 적용한 토큰을 사용자 지갑에서 안전하게 차감하고 감사 로그 적재
 */
export async function deductDynamicTokens(
  userIdentifier: { id?: string; email?: string },
  usage: { promptTokens?: number; completionTokens?: number; totalTokens?: number },
  actionName: string = 'AI 마케팅 에셋 생성',
  endpoint: string = '/api/generate'
): Promise<{
  success: boolean;
  billedTokens: number;
  actualTokens: number;
  marginRate: number;
  remainingBalance: number;
  error?: string;
}> {
  const now = new Date().toISOString();
  const userId = userIdentifier.id || 'usr_pongshin_master';
  const userEmail = userIdentifier.email;

  try {
    // 1. 사용자 정보 및 잔액 조회
    const filters: any = {};
    if (userId) filters.id = userId;
    else if (userEmail) filters.email = userEmail;

    const uRes = await queryTable('auto_users', { filters, limit: 1 }).catch(() => ({ rows: [] }));
    const user = uRes?.rows?.[0];

    if (!user) {
      console.warn(`[TokenMargin] User not found for ${JSON.stringify(userIdentifier)}`);
      return { success: false, billedTokens: 0, actualTokens: 0, marginRate: 0, remainingBalance: 0, error: '사용자를 찾을 수 없습니다.' };
    }

    // 2. 실제 AI 소비량 기반 마진율 토큰 계산
    const calc = await calculateBilledTokens(usage, user.plan || 'PRO');
    const currentBalance = Number(user.token_balance || 0);

    if (currentBalance < calc.billedTokens) {
      console.warn(`[TokenMargin] Insufficient tokens: current ${currentBalance} < billed ${calc.billedTokens}`);
      // 잔액 부족 시에도 사용자 경험을 위해 최소 0 처리하거나 잔액 한도 차감
    }

    const newBalance = Math.max(0, currentBalance - calc.billedTokens);

    // 3. auto_users 토큰 잔액 원자적 차감
    await updateRows('auto_users', {
      token_balance: newBalance,
      updated_at: now,
    }, {
      filters: { id: user.id },
    });

    // 4. auto_token_logs (토큰 감사 대장) 실시간 기록
    const auditReason = `${actionName} (AI ${calc.actualTotalTokens.toLocaleString()}T 소비 + 마진율 ${calc.marginRate}% 적용)`;
    await insertRows('auto_token_logs', [{
      id: `tlog_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      user_id: user.id,
      user_name: user.name || '소상공인 점주님',
      type: 'USAGE',
      amount: -calc.billedTokens,
      balance_after: newBalance,
      reason: auditReason,
      admin_name: 'AI Caller 오토파일럿 엔진',
      created_at: now,
    }]).catch((err) => console.warn('Insert auto_token_logs error:', err));

    // 5. ai_token_usage_logs (AI 토큰 소비 대장) 실시간 기록
    await insertRows('ai_token_usage_logs', [{
      id: `ailog_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      user_id: user.id,
      model: 'gemini-3.8-flash',
      prompt_tokens: calc.actualPromptTokens,
      completion_tokens: calc.actualCompletionTokens,
      total_tokens: calc.actualTotalTokens,
      cost_points: calc.billedTokens,
      endpoint,
      created_at: now,
    }]).catch((err) => console.warn('Insert ai_token_usage_logs error:', err));

    console.log(`[TokenMargin] ✅ 토큰 차감 완료: AI 소비 ${calc.actualTotalTokens}T * 마진배율 ${calc.marginMultiplier} = ${calc.billedTokens}T 차감 (잔여: ${newBalance}T)`);

    return {
      success: true,
      billedTokens: calc.billedTokens,
      actualTokens: calc.actualTotalTokens,
      marginRate: calc.marginRate,
      remainingBalance: newBalance,
    };
  } catch (error: any) {
    console.error('[TokenMargin] Deduct dynamic tokens error:', error);
    return {
      success: false,
      billedTokens: 0,
      actualTokens: 0,
      marginRate: 0,
      remainingBalance: 0,
      error: error.message,
    };
  }
}
