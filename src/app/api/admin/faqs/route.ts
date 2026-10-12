import { NextResponse } from 'next/server';

export interface FaqItem {
  id: string;
  category: 'CONNECT' | 'BILLING' | 'QUALITY' | 'PRINT';
  categoryLabel: string;
  question: string;
  answer: string;
  isPublished: boolean;
  order: number;
}

let mockFaqs: FaqItem[] = [
  {
    id: 'faq-1',
    category: 'CONNECT',
    categoryLabel: '채널 연동',
    question: '당근마켓 비즈프로필 연동 시 개인 계정으로도 가능한가요?',
    answer: '당근마켓 마케팅 자동 발행은 당근 비즈프로필(전문 판매자 계정)과 연동됩니다. 개인 계정이시라면 당근 앱 내에서 무료로 1분 만에 비즈프로필로 전환하신 후 연동하실 수 있습니다.',
    isPublished: true,
    order: 1,
  },
  {
    id: 'faq-2',
    category: 'CONNECT',
    categoryLabel: '채널 연동',
    question: '네이버 스마트플레이스 새소식 쿠폰은 어떻게 자동 연동되나요?',
    answer: '네이버 스마트플레이스 파트너센터 API 권한을 1회 승인해 주시면, 오토마케팅 엔진이 생성한 이벤트 소식글과 함께 [알림받기 전용 웰컴 쿠폰]이 플레이스 매장에 즉시 등록됩니다.',
    isPublished: true,
    order: 2,
  },
  {
    id: 'faq-3',
    category: 'BILLING',
    categoryLabel: '결제/토큰',
    question: '남은 마케팅 토큰은 다음 달로 이월되나요?',
    answer: '네, 정기 구독 회원의 경우 사용하지 않고 남은 토큰은 다음 달로 자동 이월되어 소멸되지 않습니다.',
    isPublished: true,
    order: 3,
  },
  {
    id: 'faq-4',
    category: 'PRINT',
    categoryLabel: '인쇄/배송',
    question: '생성된 A4 전단지는 어떻게 인쇄하나요?',
    answer: '에셋 보관함에서 [인쇄용 고해상도 PDF 다운로드] 버튼을 누르시면 300DPI 인쇄소 규격 CMYK 파일이 다운로드됩니다. 가까운 인쇄소에 바로 맡기시거나 매장 프린터로 즉시 출력하실 수 있습니다.',
    isPublished: true,
    order: 4,
  },
];

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: mockFaqs,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'FAQ 목록 조회 실패' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const newFaq: FaqItem = {
      id: `faq-${Date.now()}`,
      category: body.category || 'CONNECT',
      categoryLabel: body.categoryLabel || '채널 연동',
      question: body.question,
      answer: body.answer,
      isPublished: true,
      order: mockFaqs.length + 1,
    };
    mockFaqs.push(newFaq);

    return NextResponse.json({
      success: true,
      message: 'FAQ가 성공적으로 등록되었습니다.',
      faq: newFaq,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'FAQ 등록 실패' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (id) {
      mockFaqs = mockFaqs.filter((f) => f.id !== id);
      return NextResponse.json({ success: true, message: 'FAQ가 삭제되었습니다.' });
    }
    return NextResponse.json({ success: false, error: 'ID 누락' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'FAQ 삭제 실패' }, { status: 500 });
  }
}
