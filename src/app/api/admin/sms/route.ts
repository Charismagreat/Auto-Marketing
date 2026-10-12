import { NextResponse } from 'next/server';

export interface SmsMessage {
  id: string;
  type: 'SMS' | 'LMS' | 'ALIMTALK';
  recipientStore: string;
  recipientPhone: string;
  senderNumber: string;
  content: string;
  bytes: number;
  status: 'SENT' | 'FAILED';
  sentAt: string;
}

let mockSmsHistory: SmsMessage[] = [
  {
    id: 'sms-001',
    type: 'LMS',
    recipientStore: '전체 점주 (3개 매장)',
    recipientPhone: '010-9876-**** 외 2건',
    senderNumber: '1588-0000',
    content: '[오토마케팅 공지]\n사장님 안녕하세요! 가을 시즌 대비 당근마켓/플레이스 7대 채널 올인원 자동 생성 엔진이 런칭되었습니다. 대시보드에서 1-Click 번들 생성을 체험해 보세요!',
    bytes: 142,
    status: 'SENT',
    sentAt: '2026-10-12 14:00:00',
  },
  {
    id: 'sms-002',
    type: 'SMS',
    recipientStore: '배곧 달콤베이커리',
    recipientPhone: '010-9876-5432',
    senderNumber: '1588-0000',
    content: '[오토마케팅] 내일 오전 10시 당근 단골 소식 예약 발행이 대기 중입니다.',
    bytes: 72,
    status: 'SENT',
    sentAt: '2026-10-12 12:30:15',
  },
];

// 발신 번호 목록
const REGISTERED_CALLERS = [
  { number: '1588-0000', label: '오토마케팅 대표번호 (인증완료)', isDefault: true },
  { number: '02-1234-5678', label: '고객성공센터 직통 (인증완료)', isDefault: false },
];

// 자주 쓰는 알림 템플릿
const SMS_TEMPLATES = [
  {
    id: 't-1',
    title: '주간 오토파일럿 예약 알림',
    content: '[오토마케팅] {storeName} 사장님! 요일별 7대 채널 자동 발행 스케줄이 준비되었습니다. 검토 후 승인해 주세요. {link}',
  },
  {
    id: 't-2',
    title: '토큰 충전 완료 안내',
    content: '[오토마케팅] {storeName} 매장에 마케팅 토큰 50,000T가 충전되었습니다. 풍성한 마케팅을 즐겨보세요!',
  },
  {
    id: 't-3',
    title: '시스템 정기 점검 사전 공지',
    content: '[오토마케팅 점검안내] 금일 밤 02:00~04:00 네이버 API 업그레이드 점검이 진행됩니다. 서비스 이용에 참고 부탁드립니다.',
  },
];

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: {
        history: mockSmsHistory,
        callers: REGISTERED_CALLERS,
        templates: SMS_TEMPLATES,
        balance: {
          cash: 450000,
          smsPrice: 15,
          lmsPrice: 40,
          alimtalkPrice: 12,
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'SMS 정보 조회 실패' },
      { status: 500 }
    );
  }
}

// SMS/알림톡 단체 발송
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { targetGroup, senderNumber, content, recipientList } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ success: false, error: '메시지 본문이 누락되었습니다.' }, { status: 400 });
    }

    // 바이트 수 계산 (한글 2바이트, 영문/기호 1바이트)
    let totalBytes = 0;
    for (let i = 0; i < content.length; i++) {
      totalBytes += content.charCodeAt(i) > 127 ? 2 : 1;
    }

    const type: 'SMS' | 'LMS' = totalBytes > 90 ? 'LMS' : 'SMS';
    const storeCount = recipientList?.length || (targetGroup === 'ALL' ? 3 : 1);

    const newRecord: SmsMessage = {
      id: `sms-${Date.now()}`,
      type,
      recipientStore: targetGroup === 'ALL' ? `전체 점주 (${storeCount}개 매장)` : '선택 매장',
      recipientPhone: targetGroup === 'ALL' ? '010-****-**** 단체 발송' : '010-9876-5432',
      senderNumber: senderNumber || '1588-0000',
      content,
      bytes: totalBytes,
      status: 'SENT',
      sentAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    mockSmsHistory.unshift(newRecord);

    return NextResponse.json({
      success: true,
      message: `${storeCount}개 매장에 ${type} 메시지 발송이 완료되었습니다 (${totalBytes} Byte).`,
      record: newRecord,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || '발송 중 오류 발생' },
      { status: 500 }
    );
  }
}
