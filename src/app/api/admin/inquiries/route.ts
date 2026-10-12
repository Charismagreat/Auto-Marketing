import { NextResponse } from 'next/server';

export interface Inquiry {
  id: string;
  storeId: string;
  storeName: string;
  authorName: string;
  contact: string;
  category: 'CHANNEL_CONNECT' | 'BILLING' | 'QUALITY' | 'FEATURE_REQUEST' | 'ETC';
  categoryLabel: string;
  title: string;
  content: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED';
  priority: 'URGENT' | 'HIGH' | 'NORMAL';
  sentiment: 'NEGATIVE' | 'NEUTRAL' | 'POSITIVE';
  createdAt: string;
  replies: Array<{
    id: string;
    author: string;
    content: string;
    createdAt: string;
    isAiDraft?: boolean;
  }>;
  internalNote?: string;
}

let mockInquiries: Inquiry[] = [
  {
    id: 'inq-101',
    storeId: 'store-1',
    storeName: '배곧 달콤베이커리',
    authorName: '김점주 사장님',
    contact: '010-9876-5432',
    category: 'CHANNEL_CONNECT',
    categoryLabel: '채널 연동',
    title: '네이버 스마트플레이스 새소식 연동 시 권한 오류가 발생합니다.',
    content: '플레이스 새소식 발행을 시도했는데 "인증 토큰 유효기간 만료" 오류가 뜹니다. 어떻게 재연동해야 하나요?',
    status: 'PENDING',
    priority: 'HIGH',
    sentiment: 'NEGATIVE',
    createdAt: '2026-10-12 16:10:00',
    replies: [],
    internalNote: '네이버 플레이스 파트너센터 권한 만료 건. 재인증 링크 안내 필요.',
  },
  {
    id: 'inq-102',
    storeId: 'store-2',
    storeName: '정왕동 불타는 쭈꾸미',
    authorName: '박대표 사장님',
    contact: '010-1234-5678',
    category: 'QUALITY',
    categoryLabel: '생성 품질',
    title: '인스타 숏폼 대본 생성 시 매운맛 단계를 더 강조하고 싶어요.',
    content: '기본 15초 숏폼 릴스 대본이 너무 얌전하게 나옵니다. "눈물 쏙 빠지는 3단계 매운맛"을 비주얼 훅으로 넣고 싶은데 프롬프트 조정이 가능한가요?',
    status: 'IN_PROGRESS',
    priority: 'NORMAL',
    sentiment: 'NEUTRAL',
    createdAt: '2026-10-12 15:00:20',
    replies: [
      {
        id: 'rep-1',
        author: '운영자 AI 어시스턴트',
        content: '사장님 안녕하세요! 릴스 바이럴 훅에 매운맛 단계를 극대화할 수 있도록 관리자 프롬프트 스튜디오에서 숏폼 대본 훅 강도를 튜닝해 두었습니다. 지금 바로 테스트해 보세요!',
        createdAt: '2026-10-12 15:20:00',
        isAiDraft: false,
      },
    ],
    internalNote: '프롬프트 튜닝 스튜디오에서 숏폼 Temperature 0.8로 상향 완료.',
  },
  {
    id: 'inq-103',
    storeId: 'store-3',
    storeName: '배곧 피트니스 24',
    authorName: '최관장 님',
    contact: '010-5555-7777',
    category: 'BILLING',
    categoryLabel: '요금 및 토큰',
    title: '오토파일럿 프로 팩 세금계산서 발행 요청드립니다.',
    content: '이번 달 정기 구독료 790,000원에 대한 전자세금계산서 발행 부탁드립니다. 사업자등록증 첨부했습니다.',
    status: 'RESOLVED',
    priority: 'NORMAL',
    sentiment: 'POSITIVE',
    createdAt: '2026-10-12 11:30:00',
    replies: [
      {
        id: 'rep-2',
        author: '정산팀 관리자',
        content: '안녕하세요 관장님! 국세청 홈택스를 통해 전자세금계산서 발행 완료되었습니다. 이메일(fit24@gym.com)을 확인해 주시기 바랍니다.',
        createdAt: '2026-10-12 11:45:00',
        isAiDraft: false,
      },
    ],
    internalNote: '홈택스 역발행 및 이메일 발송 완료.',
  },
];

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const search = searchParams.get('search')?.toLowerCase();

    let filtered = [...mockInquiries];

    if (status && status !== 'ALL') {
      filtered = filtered.filter((i) => i.status === status);
    }
    if (category && category !== 'ALL') {
      filtered = filtered.filter((i) => i.category === category);
    }
    if (search) {
      filtered = filtered.filter(
        (i) =>
          i.storeName.toLowerCase().includes(search) ||
          i.title.toLowerCase().includes(search) ||
          i.content.toLowerCase().includes(search)
      );
    }

    const stats = {
      total: mockInquiries.length,
      pending: mockInquiries.filter((i) => i.status === 'PENDING').length,
      inProgress: mockInquiries.filter((i) => i.status === 'IN_PROGRESS').length,
      resolved: mockInquiries.filter((i) => i.status === 'RESOLVED').length,
    };

    return NextResponse.json({
      success: true,
      data: {
        inquiries: filtered,
        stats,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || '문의 목록 조회 실패' },
      { status: 500 }
    );
  }
}

// 답변 등록, 상태 변경, AI 답변 초안 생성
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, inquiryId, replyContent, newStatus, internalNote } = body;

    const inqIndex = mockInquiries.findIndex((i) => i.id === inquiryId);
    if (inqIndex === -1 && action !== 'ai_draft') {
      return NextResponse.json({ success: false, error: '해당 문의를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 1. AI 자동 답변 초안 생성 액션
    if (action === 'ai_draft') {
      const inquiry = mockInquiries.find((i) => i.id === inquiryId) || {
        storeName: body.storeName || '사장님',
        title: body.title || '',
        content: body.content || '',
      };

      const aiDraft = `안녕하세요 ${inquiry.storeName} 사장님! 오토마케팅 고객 성공팀입니다.\n\n문의해 주신 "${inquiry.title}" 건과 관련하여 안내해 드립니다.\n${inquiry.content.includes('인증') || inquiry.content.includes('토큰') ? '네이버 스마트플레이스 연동 보안 정책에 따라 90일 주기로 파트너 재인증이 필요합니다. 관리자 화면 상단의 [채널 연동 관리]에서 1-Click 재인증을 진행해 주시면 즉시 정상 가동됩니다.' : '요청해 주신 내용을 반영하여 맞춤형 최적화를 즉시 적용해 드렸습니다.'}\n\n추가로 궁금하신 사항이 있으시면 언제든 말씀해 주세요. 사장님의 골목상권 1등 매장 성장을 항상 응원합니다! 감사합니다.`;

      return NextResponse.json({
        success: true,
        aiDraft,
      });
    }

    // 2. 답변 등록
    if (action === 'reply' && replyContent) {
      mockInquiries[inqIndex].replies.push({
        id: `rep-${Date.now()}`,
        author: 'Auto-Marketing 슈퍼관리자',
        content: replyContent,
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      });
      mockInquiries[inqIndex].status = newStatus || 'RESOLVED';
      if (internalNote !== undefined) mockInquiries[inqIndex].internalNote = internalNote;

      return NextResponse.json({
        success: true,
        message: '답변이 성공적으로 등록되었습니다.',
        inquiry: mockInquiries[inqIndex],
      });
    }

    // 3. 상태 또는 내부 메모 변경
    if (action === 'update_status') {
      if (newStatus) mockInquiries[inqIndex].status = newStatus;
      if (internalNote !== undefined) mockInquiries[inqIndex].internalNote = internalNote;

      return NextResponse.json({
        success: true,
        message: '문의 상태가 업데이트되었습니다.',
        inquiry: mockInquiries[inqIndex],
      });
    }

    return NextResponse.json({ success: false, error: '유효하지 않은 요청입니다.' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || '문의 처리 중 오류 발생' },
      { status: 500 }
    );
  }
}
