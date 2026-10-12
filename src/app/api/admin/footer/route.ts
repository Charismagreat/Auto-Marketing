import { NextResponse } from 'next/server';

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

let mockFooter: FooterConfig = {
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
  termsOfService: `제1조 (목적)
본 약관은 (주)오토마케팅(이하 "회사")이 제공하는 소상공인 마케팅 자동화 서비스(이하 "서비스")의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.

제2조 (용어의 정의)
1. "서비스"란 소상공인 점주가 당근마켓, 스마트플레이스, 인스타그램, 블로그 등 온·오프라인 마케팅 콘텐츠를 자동으로 생성하고 발행할 수 있도록 회사가 제공하는 웹 및 모바일 솔루션을 의미합니다.
2. "토큰"이란 서비스 내에서 AI 에셋 생성 및 디스패치를 위해 사용되는 디지털 단위를 의미합니다.`,
  privacyPolicy: `1. 개인정보의 수집 및 이용 목적
회사는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 개인정보 보호법 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
- 소상공인 회원가입 및 본인 확인, 마케팅 토큰 충전 및 결제 정산, 외부 SNS 채널 연동 API 인증 토큰 관리

2. 수집하는 개인정보 항목
- 필수항목: 성명, 휴대전화번호, 이메일 주소, 사업자등록번호, 상호명, 사업장 주소, 외부 채널 연동 키`,
  refundPolicy: `제1조 (청약철회 및 환불 규정)
1. 이용자가 구매한 마케팅 토큰 또는 정기 구독 상품은 결제일로부터 7일 이내에 토큰을 전혀 사용하지 않은 경우 전액 환불이 가능합니다.
2. 이미 1-Click 번들 생성 엔진 또는 외부 디스패치가 1회 이상 실행된 경우, 해당 사용분(소모된 토큰 가액)을 공제한 잔액이 환불됩니다.`,
};

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: mockFooter,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || '사업자 정보 조회 실패' },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    mockFooter = {
      ...mockFooter,
      ...body,
    };

    return NextResponse.json({
      success: true,
      message: '사업자 정보 및 법무 약관이 실시간으로 저장 및 프론트엔드에 반영되었습니다.',
      data: mockFooter,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || '저장 중 오류 발생' },
      { status: 500 }
    );
  }
}
