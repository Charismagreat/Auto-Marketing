import { NextResponse } from 'next/server';
import { setupDatabase, queryTable, insertRows } from '@/lib/setup-db';

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
    await setupDatabase();
    const res = await queryTable('auto_sms_logs', { limit: 100, orderBy: 'created_at', orderDirection: 'DESC' }).catch(() => ({ rows: [] }));

    const history: SmsMessage[] = (res.rows || []).map((r: any) => ({
      id: r.id,
      type: (r.type || 'SMS') as any,
      recipientStore: r.recipient_store || '',
      recipientPhone: r.recipient_phone || '',
      senderNumber: r.sender_number || '1588-0000',
      content: r.content || '',
      bytes: Number(r.bytes) || 0,
      status: (r.status || 'SENT') as any,
      sentAt: r.sent_at || '',
    }));

    return NextResponse.json({
      success: true,
      data: {
        history,
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

// SMS/알림톡 단체 발송 (SQLite DB 영구 반영)
export async function POST(req: Request) {
  try {
    await setupDatabase();
    const body = await req.json();
    const { targetGroup, senderNumber, content, recipientList } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ success: false, error: '메시지 본문이 누락되었습니다.' }, { status: 400 });
    }

    let totalBytes = 0;
    for (let i = 0; i < content.length; i++) {
      totalBytes += content.charCodeAt(i) > 127 ? 2 : 1;
    }

    const type: 'SMS' | 'LMS' = totalBytes > 90 ? 'LMS' : 'SMS';
    const storeCount = recipientList?.length || (targetGroup === 'ALL' ? 3 : 1);
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const newRecord: SmsMessage = {
      id: `sms-${Date.now()}`,
      type,
      recipientStore: targetGroup === 'ALL' ? `전체 점주 (${storeCount}개 매장)` : '선택 매장',
      recipientPhone: targetGroup === 'ALL' ? '010-****-**** 단체 발송' : '010-9876-5432',
      senderNumber: senderNumber || '1588-0000',
      content,
      bytes: totalBytes,
      status: 'SENT',
      sentAt: now,
    };

    await insertRows('auto_sms_logs', [
      {
        id: newRecord.id,
        type: newRecord.type,
        recipient_store: newRecord.recipientStore,
        recipient_phone: newRecord.recipientPhone,
        sender_number: newRecord.senderNumber,
        content: newRecord.content,
        bytes: newRecord.bytes,
        status: newRecord.status,
        cost: type === 'SMS' ? 15 : 40,
        sent_at: newRecord.sentAt,
        created_at: new Date().toISOString(),
      },
    ]);

    return NextResponse.json({
      success: true,
      message: `${storeCount}개 매장에 ${type} 메시지 발송이 완료되었으며 SQLite DB에 기록되었습니다 (${totalBytes} Byte).`,
      record: newRecord,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || '발송 중 오류 발생' },
      { status: 500 }
    );
  }
}
