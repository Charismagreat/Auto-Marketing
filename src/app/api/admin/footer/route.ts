import { NextResponse } from 'next/server';
import { setupDatabase, queryTable } from '@/lib/setup-db';
import { executeSQL } from '@/lib/egdesk-helpers';

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
  termsOfService: string;
  privacyPolicy: string;
  refundPolicy: string;
}

const DEFAULT_FOOTER: FooterConfig = {
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
  termsOfService: `제1조 (목적)\n본 약관은 (주)오토마케팅이 제공하는 소상공인 마케팅 자동화 서비스 이용에 관한 권리와 의무를 규정합니다.`,
  privacyPolicy: `1. 개인정보의 수집 및 이용 목적\n회사는 소상공인 회원가입 및 본인 확인, 마케팅 토큰 충전 및 결제 정산, 외부 SNS 채널 연동 API 인증 관리를 위해 개인정보를 처리합니다.`,
  refundPolicy: `제1조 (청약철회 및 환불 규정)\n1. 이용자가 구매한 마케팅 토큰은 결제일로부터 7일 이내 미사용 시 전액 환불됩니다.`,
};

export async function GET() {
  try {
    await setupDatabase();
    const res = await queryTable('auto_footer_configs', { limit: 1 }).catch(() => ({ rows: [] }));
    const row = res.rows?.[0];

    const data: FooterConfig = row
      ? {
          companyName: row.company_name || DEFAULT_FOOTER.companyName,
          ceoName: row.ceo_name || DEFAULT_FOOTER.ceoName,
          bizNumber: row.biz_number || DEFAULT_FOOTER.bizNumber,
          mailOrderNumber: row.mail_order_number || DEFAULT_FOOTER.mailOrderNumber,
          address: row.address || DEFAULT_FOOTER.address,
          tel: row.tel || DEFAULT_FOOTER.tel,
          email: row.email || DEFAULT_FOOTER.email,
          hostingProvider: row.hosting_provider || DEFAULT_FOOTER.hostingProvider,
          privacyManager: row.privacy_manager || DEFAULT_FOOTER.privacyManager,
          copyrightText: row.copyright_text || DEFAULT_FOOTER.copyrightText,
          termsOfService: row.terms_of_service || DEFAULT_FOOTER.termsOfService,
          privacyPolicy: row.privacy_policy || DEFAULT_FOOTER.privacyPolicy,
          refundPolicy: row.refund_policy || DEFAULT_FOOTER.refundPolicy,
        }
      : DEFAULT_FOOTER;

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || '사업자 정보 조회 실패' },
      { status: 500 }
    );
  }
}

// 사업자 정보 및 법무 약관 수정 (SQLite DB 영구 반영)
export async function PUT(req: Request) {
  try {
    await setupDatabase();
    const body: Partial<FooterConfig> = await req.json();
    const now = new Date().toISOString();

    const escape = (str?: string) => (str || '').replace(/'/g, "''");

    const sets: string[] = [];
    if (body.companyName !== undefined) sets.push(`company_name = '${escape(body.companyName)}'`);
    if (body.ceoName !== undefined) sets.push(`ceo_name = '${escape(body.ceoName)}'`);
    if (body.bizNumber !== undefined) sets.push(`biz_number = '${escape(body.bizNumber)}'`);
    if (body.mailOrderNumber !== undefined) sets.push(`mail_order_number = '${escape(body.mailOrderNumber)}'`);
    if (body.address !== undefined) sets.push(`address = '${escape(body.address)}'`);
    if (body.tel !== undefined) sets.push(`tel = '${escape(body.tel)}'`);
    if (body.email !== undefined) sets.push(`email = '${escape(body.email)}'`);
    if (body.hostingProvider !== undefined) sets.push(`hosting_provider = '${escape(body.hostingProvider)}'`);
    if (body.privacyManager !== undefined) sets.push(`privacy_manager = '${escape(body.privacyManager)}'`);
    if (body.copyrightText !== undefined) sets.push(`copyright_text = '${escape(body.copyrightText)}'`);
    if (body.termsOfService !== undefined) sets.push(`terms_of_service = '${escape(body.termsOfService)}'`);
    if (body.privacyPolicy !== undefined) sets.push(`privacy_policy = '${escape(body.privacyPolicy)}'`);
    if (body.refundPolicy !== undefined) sets.push(`refund_policy = '${escape(body.refundPolicy)}'`);
    sets.push(`updated_at = '${now}'`);

    if (sets.length > 0) {
      await executeSQL(`UPDATE auto_footer_configs SET ${sets.join(', ')} WHERE id = 'default_footer';`);
    }

    return NextResponse.json({
      success: true,
      message: '사업자 정보 및 법무 약관이 SQLite DB에 영구 저장되었으며 프론트엔드에 실시간 반영되었습니다.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || '저장 중 오류 발생' },
      { status: 500 }
    );
  }
}
