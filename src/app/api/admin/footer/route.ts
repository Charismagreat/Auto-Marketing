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
  depositBankName: string;
  depositAccountNumber: string;
  depositAccountHolder: string;
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
  depositBankName: '카카오뱅크',
  depositAccountNumber: '3333-12-1695965',
  depositAccountHolder: '차호석',
  termsOfService: '',
  privacyPolicy: '',
  refundPolicy: '',
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
          depositBankName: row.deposit_bank_name || DEFAULT_FOOTER.depositBankName,
          depositAccountNumber: row.deposit_account_number || DEFAULT_FOOTER.depositAccountNumber,
          depositAccountHolder: row.deposit_account_holder || DEFAULT_FOOTER.depositAccountHolder,
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
    if (body.depositBankName !== undefined) sets.push(`deposit_bank_name = '${escape(body.depositBankName)}'`);
    if (body.depositAccountNumber !== undefined) sets.push(`deposit_account_number = '${escape(body.depositAccountNumber)}'`);
    if (body.depositAccountHolder !== undefined) sets.push(`deposit_account_holder = '${escape(body.depositAccountHolder)}'`);
    if (body.termsOfService !== undefined) sets.push(`terms_of_service = '${escape(body.termsOfService)}'`);
    if (body.privacyPolicy !== undefined) sets.push(`privacy_policy = '${escape(body.privacyPolicy)}'`);
    if (body.refundPolicy !== undefined) sets.push(`refund_policy = '${escape(body.refundPolicy)}'`);
    sets.push(`updated_at = '${now}'`);

    if (sets.length > 0) {
      await executeSQL(`UPDATE auto_footer_configs SET ${sets.join(', ')} WHERE id = 'default_footer';`);
    }

    return NextResponse.json({
      success: true,
      message: '사업자 정보, 무통장 수령 계좌 및 법무 약관이 SQLite DB에 영구 저장되었습니다.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || '저장 중 오류 발생' },
      { status: 500 }
    );
  }
}
