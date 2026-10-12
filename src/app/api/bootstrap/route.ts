import { NextRequest, NextResponse } from 'next/server';
import { setupDatabase, queryTable } from '@/lib/setup-db';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-user-email',
    },
  });
}

/**
 * ⚡ GET /api/bootstrap
 * 오토마케팅 대시보드 초기 구동에 필요한 모든 핵심 데이터를
 * 단 1회의 초고속 HTTP 왕복으로 번들링하여 반환
 */
export async function GET(req: NextRequest) {
  try {
    await setupDatabase();

    // 퐁신제빵소 계정을 guest@automarketing.com으로 확실하게 동기화
    try {
      const { updateRows } = await import('@/lib/egdesk-helpers');
      await updateRows('auto_users', { email: 'guest@automarketing.com' }, { filters: { id: 'usr_pongshin_master' } });
    } catch {}

    // 1. 활성 사용자 조회 (기본: 퐁신제빵소 사장님)
    const userRes = await queryTable('auto_users', { limit: 1 }).catch(() => ({ rows: [] }));
    const user = userRes.rows?.[0] || {
      id: 'usr_pongshin_master',
      email: 'guest@automarketing.com',
      name: '퐁신제빵소 사장님',
      token_balance: 50000,
      plan: 'PRO',
    };

    // 2. 비즈니스 프로필 (퐁신제빵소)
    const bizRes = await queryTable('auto_businesses', { limit: 1 }).catch(() => ({ rows: [] }));
    const business = bizRes.rows?.[0] || null;

    // 3. 상품 카탈로그 (카스테라 3종)
    const prodRes = await queryTable('auto_products', { limit: 20 }).catch(() => ({ rows: [] }));
    const products = prodRes.rows || [];

    // 4. 최근 생성된 마케팅 에셋
    const assetRes = await queryTable('auto_assets', {
      limit: 20,
      orderBy: 'created_at',
      orderDirection: 'DESC',
    }).catch(() => ({ rows: [] }));
    const assets = assetRes.rows || [];

    // 5. 마케팅 캘린더 발행 스케줄
    const campRes = await queryTable('auto_campaigns', {
      limit: 20,
      orderBy: 'created_at',
      orderDirection: 'DESC',
    }).catch(() => ({ rows: [] }));
    const campaigns = campRes.rows || [];

    // 6. 벤치마크 레퍼런스
    const refRes = await queryTable('auto_references', { limit: 20 }).catch(() => ({ rows: [] }));
    const references = refRes.rows || [];

    // 7. 자주 묻는 질문 FAQ
    const faqRes = await queryTable('auto_faqs', {
      limit: 50,
      orderBy: 'sort_order',
      orderDirection: 'ASC',
    }).catch(() => ({ rows: [] }));
    const faqs = (faqRes.rows || []).filter((f: any) => f.is_published !== 0);

    // 8. 사업자 정보 및 법무 약관
    const footerRes = await queryTable('auto_footer_configs', { limit: 1 }).catch(() => ({ rows: [] }));
    const footerRow = footerRes.rows?.[0];
    const footer = footerRow
      ? {
          companyName: footerRow.company_name || '(주)오토마케팅',
          ceoName: footerRow.ceo_name || '홍길동',
          bizNumber: footerRow.biz_number || '123-86-09876',
          mailOrderNumber: footerRow.mail_order_number || '제 2026-경기시흥-0412호',
          address: footerRow.address || '경기도 시흥시 배곧4로 32-27, 골든플라자 5층 501호',
          tel: footerRow.tel || '1588-0000',
          email: footerRow.email || 'support@auto-marketing.kr',
          hostingProvider: footerRow.hosting_provider || 'Google Cloud Platform (GCP)',
          privacyManager: footerRow.privacy_manager || '김보안 (privacy@auto-marketing.kr)',
          copyrightText: footerRow.copyright_text || 'Copyright © 2026 Auto-Marketing Corp. All Rights Reserved.',
          termsOfService: footerRow.terms_of_service || '',
          privacyPolicy: footerRow.privacy_policy || '',
          refundPolicy: footerRow.refund_policy || '',
        }
      : null;

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      bundle: {
        user,
        business,
        products,
        assets,
        campaigns,
        references,
        faqs,
        footer,
      },
    });
  } catch (error: any) {
    console.error('[/api/bootstrap Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Bootstrap load failed' },
      { status: 500 }
    );
  }
}
