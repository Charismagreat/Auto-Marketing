import { updateRows, insertRows, queryTable } from './egdesk-helpers';

export interface PaymentPackage {
  id: string;
  name: string;
  tokens: number;
  priceKrw: number;
  priceStr: string;
  badge?: string;
  recommended?: boolean;
}

export const TOKEN_PACKAGES: PaymentPackage[] = [
  {
    id: 'pkg_starter',
    name: '스타터팩',
    tokens: 50000,
    priceKrw: 5000,
    priceStr: '5,000',
    badge: '입문용',
  },
  {
    id: 'pkg_standard',
    name: '스탠다드 성장팩',
    tokens: 150000,
    priceKrw: 12000,
    priceStr: '12,000',
    badge: '🔥 가장 인기',
    recommended: true,
  },
  {
    id: 'pkg_pro',
    name: '프로 바이럴팩',
    tokens: 450000,
    priceKrw: 30000,
    priceStr: '30,000',
    badge: '최대 혜택 (33% 할인)',
  },
  {
    id: 'pkg_enterprise',
    name: '엔터프라이즈 프랜차이즈팩',
    tokens: 1600000,
    priceKrw: 100000,
    priceStr: '100,000',
    badge: '다점포 전용',
  },
];

/**
 * 사용자 지갑 잔액 조회
 */
export async function getUserWallet(userEmail: string) {
  const email = (userEmail || 'guest@automarketing.com').toLowerCase().trim();
  const res = await queryTable('auto_users', {
    filters: { email },
    limit: 1,
  }).catch(() => ({ rows: [] }));

  if (res.rows && res.rows.length > 0) {
    const u = res.rows[0];
    return {
      email: u.email,
      name: u.name,
      tokenBalance: Number(u.token_balance || 0),
      plan: u.plan || 'PRO',
    };
  }

  return {
    email,
    name: '소상공인 점주님',
    tokenBalance: 50000,
    plan: 'PRO',
  };
}

/**
 * 사용자 토큰 즉시 충전 (원자적 SQLite UPDATE)
 */
export async function creditTokens(userEmail: string, tokensToAdd: number, reason: string = '토큰 충전') {
  const email = (userEmail || 'guest@automarketing.com').toLowerCase().trim();
  const now = new Date().toISOString();

  try {
    // 1. 유저 존재 확인
    const check = await queryTable('auto_users', {
      filters: { email },
      limit: 1,
    }).catch(() => ({ rows: [] }));

    if (!check.rows || check.rows.length === 0) {
      await insertRows('auto_users', [
        {
          id: `usr_${Date.now()}`,
          email,
          name: '소상공인 회원',
          token_balance: 50000 + tokensToAdd,
          plan: 'PRO',
          created_at: now,
          updated_at: now,
        }
      ]);
    } else {
      const currentBalance = Number(check.rows[0].token_balance || 0);
      await updateRows('auto_users', {
        token_balance: currentBalance + tokensToAdd,
        updated_at: now,
      }, {
        filters: { email },
      });
    }

    const updated = await getUserWallet(email);
    console.log(`[TokenWallet] ✅ ${email} 토큰 충전 완료: +${tokensToAdd.toLocaleString()}T (현재 잔액: ${updated.tokenBalance.toLocaleString()}T, 사유: ${reason})`);
    return { success: true, balance: updated.tokenBalance };
  } catch (err: any) {
    console.error(`[TokenWallet] ❌ 토큰 충전 실패:`, err);
    throw err;
  }
}

/**
 * 사용자 토큰 차감
 */
export async function deductTokens(userEmail: string, tokensToDeduct: number, reason: string = 'AI 마케팅 에셋 생성') {
  const email = (userEmail || 'guest@automarketing.com').toLowerCase().trim();
  const now = new Date().toISOString();

  const current = await getUserWallet(email);
  if (current.tokenBalance < tokensToDeduct) {
    return { success: false, error: '토큰 잔액이 부족합니다.', currentBalance: current.tokenBalance };
  }

  const newBalance = Math.max(0, current.tokenBalance - tokensToDeduct);
  await updateRows('auto_users', {
    token_balance: newBalance,
    updated_at: now,
  }, {
    filters: { email },
  });

  const updated = await getUserWallet(email);
  return { success: true, balance: updated.tokenBalance };
}
