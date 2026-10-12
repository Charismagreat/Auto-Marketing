import { NextResponse } from 'next/server';
import { setupDatabase, queryTable, updateRows } from '@/lib/setup-db';

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
  depositBankName: string;
  depositAccountNumber: string;
  depositAccountHolder: string;
  sns_channels: SnsChannel[];
  termsOfService: string;
  privacyPolicy: string;
  refundPolicy: string;
}

const DEFAULT_SNS_CHANNELS: SnsChannel[] = [
  { id: 'sns_youtube', type: 'youtube', name: '유튜브 공식 채널', url: 'https://youtube.com/@auto-marketing', enabled: true },
  { id: 'sns_instagram', type: 'instagram', name: '인스타그램 공식 계정', url: 'https://instagram.com/auto_marketing_kr', enabled: true },
  { id: 'sns_blog', type: 'blog', name: '네이버 공식 블로그', url: 'https://blog.naver.com/auto_marketing', enabled: true },
  { id: 'sns_kakao', type: 'kakao', name: '카카오톡 1:1 상담 채널', url: 'https://pf.kakao.com/_auto_marketing', enabled: true },
];

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
  sns_channels: DEFAULT_SNS_CHANNELS,
  termsOfService: '',
  privacyPolicy: '',
  refundPolicy: '',
};

export async function GET() {
  try {
    await setupDatabase();
    const res = await queryTable('auto_footer_configs', { limit: 1 }).catch(() => ({ rows: [] }));
    const row = res.rows?.[0];

    let snsChannels: SnsChannel[] = DEFAULT_SNS_CHANNELS;
    if (row?.sns_channels) {
      try {
        const parsed = JSON.parse(row.sns_channels);
        if (Array.isArray(parsed) && parsed.length > 0) {
          snsChannels = parsed;
        }
      } catch (e) {
        console.warn('Failed to parse sns_channels:', e);
      }
    }

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
          sns_channels: snsChannels,
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

    const updates: Record<string, any> = { updated_at: now };
    if (body.companyName !== undefined) updates.company_name = body.companyName;
    if (body.ceoName !== undefined) updates.ceo_name = body.ceoName;
    if (body.bizNumber !== undefined) updates.biz_number = body.bizNumber;
    if (body.mailOrderNumber !== undefined) updates.mail_order_number = body.mailOrderNumber;
    if (body.address !== undefined) updates.address = body.address;
    if (body.tel !== undefined) updates.tel = body.tel;
    if (body.email !== undefined) updates.email = body.email;
    if (body.hostingProvider !== undefined) updates.hosting_provider = body.hostingProvider;
    if (body.privacyManager !== undefined) updates.privacy_manager = body.privacyManager;
    if (body.copyrightText !== undefined) updates.copyright_text = body.copyrightText;
    if (body.depositBankName !== undefined) updates.deposit_bank_name = body.depositBankName;
    if (body.depositAccountNumber !== undefined) updates.deposit_account_number = body.depositAccountNumber;
    if (body.depositAccountHolder !== undefined) updates.deposit_account_holder = body.depositAccountHolder;
    if (body.sns_channels !== undefined) {
      updates.sns_channels = JSON.stringify(body.sns_channels);
    }
    if (body.termsOfService !== undefined) updates.terms_of_service = body.termsOfService;
    if (body.privacyPolicy !== undefined) updates.privacy_policy = body.privacyPolicy;
    if (body.refundPolicy !== undefined) updates.refund_policy = body.refundPolicy;

    await updateRows('auto_footer_configs', updates, {
      filters: { id: 'default_footer' },
    });

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

export const POST = PUT;
