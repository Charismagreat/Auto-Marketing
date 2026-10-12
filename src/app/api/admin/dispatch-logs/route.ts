import { NextResponse } from 'next/server';

// 7대 마케팅 채널 디스패치 감사 로그 인터페이스
export interface DispatchLog {
  id: string;
  channel: 'instagram' | 'naver_blog' | 'karrot' | 'naver_place' | 'print_pdf' | 'video_short' | 'detail_page';
  storeId: string;
  storeName: string;
  title: string;
  status: 'SUCCESS' | 'FAILED' | 'RETRYING';
  statusCode: number;
  latencyMs: number;
  payloadSummary: string;
  errorMessage?: string;
  retryCount: number;
  createdAt: string;
  externalUrl?: string;
}

// 메모리 기반 디스패치 로그 저장소 (실제 운영 시 Supabase/DB 연동 가능)
let mockLogs: DispatchLog[] = [
  {
    id: 'disp-001',
    channel: 'karrot',
    storeId: 'store-1',
    storeName: '배곧 달콤베이커리',
    title: '갓 구운 소금빵 1+1 이웃 단골 쿠폰 발행',
    status: 'SUCCESS',
    statusCode: 200,
    latencyMs: 342,
    payloadSummary: '당근 비즈프로필 소식글 게시 (단골 1,000원 쿠폰 포함, 이미지 2장 첨부)',
    retryCount: 0,
    createdAt: '2026-10-12 16:45:12',
    externalUrl: 'https://town.daangn.com/biz/sweet-bakery-1',
  },
  {
    id: 'disp-002',
    channel: 'naver_place',
    storeId: 'store-1',
    storeName: '배곧 달콤베이커리',
    title: '[배곧 맛집] 네이버 스마트플레이스 알림받기 쿠폰 이벤트',
    status: 'SUCCESS',
    statusCode: 201,
    latencyMs: 512,
    payloadSummary: '스마트플레이스 새소식 등록 (알림받기 시 소금빵 1개 증정 쿠폰 연동)',
    retryCount: 0,
    createdAt: '2026-10-12 15:30:00',
    externalUrl: 'https://m.place.naver.com/restaurant/12345678/feed',
  },
  {
    id: 'disp-003',
    channel: 'instagram',
    storeId: 'store-2',
    storeName: '정왕동 불타는 쭈꾸미',
    title: '신메뉴 치즈폭탄 쭈꾸미 릴스 & 카드뉴스 발행',
    status: 'FAILED',
    statusCode: 429,
    latencyMs: 1205,
    payloadSummary: 'Instagram Graph API 릴스 업로드 (video/mp4, 15초, 해시태그 18개)',
    errorMessage: 'OAuthRateLimitException: Application request limit reached for Instagram Content Publishing API',
    retryCount: 2,
    createdAt: '2026-10-12 14:15:22',
  },
  {
    id: 'disp-004',
    channel: 'naver_blog',
    storeId: 'store-3',
    storeName: '배곧 피트니스 24',
    title: '가을맞이 바디프로필 챌린지 SEO 블로그 포스팅',
    status: 'SUCCESS',
    statusCode: 200,
    latencyMs: 780,
    payloadSummary: 'Naver Blog Open API 원고 등록 (본문 1,800자, 고화질 이미지 4장)',
    retryCount: 0,
    createdAt: '2026-10-12 13:00:15',
    externalUrl: 'https://blog.naver.com/baegotfit/223456789012',
  },
  {
    id: 'disp-005',
    channel: 'print_pdf',
    storeId: 'store-1',
    storeName: '배곧 달콤베이커리',
    title: '가을 신메뉴 오픈기념 A4 고해상도 전단지 인쇄 디스패치',
    status: 'SUCCESS',
    statusCode: 200,
    latencyMs: 2400,
    payloadSummary: 'A4 300DPI 인쇄용 고해상도 CMYK PDF 렌더링 및 클라우드 프린터 스풀링 완료',
    retryCount: 0,
    createdAt: '2026-10-12 11:20:00',
  },
  {
    id: 'disp-006',
    channel: 'video_short',
    storeId: 'store-2',
    storeName: '정왕동 불타는 쭈꾸미',
    title: '지글지글 ASMR 15초 숏폼 유튜브 쇼츠 디스패치',
    status: 'SUCCESS',
    statusCode: 200,
    latencyMs: 3100,
    payloadSummary: 'YouTube Data API v3 숏폼 자동 업로드 (공개 설정, 카테고리: 음식)',
    retryCount: 0,
    createdAt: '2026-10-12 10:10:45',
    externalUrl: 'https://youtube.com/shorts/sample123',
  },
  {
    id: 'disp-007',
    channel: 'karrot',
    storeId: 'store-3',
    storeName: '배곧 피트니스 24',
    title: '10월 한정 PT 3회 무료 체험권 당근마켓 배포',
    status: 'FAILED',
    statusCode: 401,
    latencyMs: 210,
    payloadSummary: '당근 비즈니스 채널 인증 토큰 만료',
    errorMessage: 'InvalidTokenException: Karrot Business OAuth access token expired.',
    retryCount: 1,
    createdAt: '2026-10-12 09:30:10',
  },
];

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const channel = searchParams.get('channel');
    const status = searchParams.get('status');
    const search = searchParams.get('search')?.toLowerCase();

    let filtered = [...mockLogs];

    if (channel && channel !== 'ALL') {
      filtered = filtered.filter((l) => l.channel === channel);
    }

    if (status && status !== 'ALL') {
      filtered = filtered.filter((l) => l.status === status);
    }

    if (search) {
      filtered = filtered.filter(
        (l) =>
          l.storeName.toLowerCase().includes(search) ||
          l.title.toLowerCase().includes(search) ||
          l.payloadSummary.toLowerCase().includes(search)
      );
    }

    // 통계 집계
    const total = mockLogs.length;
    const successCount = mockLogs.filter((l) => l.status === 'SUCCESS').length;
    const failedCount = mockLogs.filter((l) => l.status === 'FAILED').length;
    const successRate = total > 0 ? Math.round((successCount / total) * 100) : 100;
    const avgLatency =
      total > 0
        ? Math.round(mockLogs.reduce((acc, cur) => acc + cur.latencyMs, 0) / total)
        : 0;

    const channelStats = {
      karrot: mockLogs.filter((l) => l.channel === 'karrot').length,
      naver_place: mockLogs.filter((l) => l.channel === 'naver_place').length,
      instagram: mockLogs.filter((l) => l.channel === 'instagram').length,
      naver_blog: mockLogs.filter((l) => l.channel === 'naver_blog').length,
      print_pdf: mockLogs.filter((l) => l.channel === 'print_pdf').length,
      video_short: mockLogs.filter((l) => l.channel === 'video_short').length,
    };

    return NextResponse.json({
      success: true,
      data: {
        logs: filtered,
        stats: {
          total,
          successCount,
          failedCount,
          successRate,
          avgLatency,
          channelStats,
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || '디스패치 로그 조회 실패' },
      { status: 500 }
    );
  }
}

// 실패 건 즉시 재시도(Retry) 또는 상태 변경 처리
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, logId } = body;

    if (action === 'retry' && logId) {
      const targetIndex = mockLogs.findIndex((l) => l.id === logId);
      if (targetIndex === -1) {
        return NextResponse.json({ success: false, error: '해당 로그를 찾을 수 없습니다.' }, { status: 404 });
      }

      // 재시도 시뮬레이션: 성공으로 전환 및 카운트 증가
      mockLogs[targetIndex] = {
        ...mockLogs[targetIndex],
        status: 'SUCCESS',
        statusCode: 200,
        errorMessage: undefined,
        retryCount: mockLogs[targetIndex].retryCount + 1,
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
        payloadSummary: `${mockLogs[targetIndex].payloadSummary} (관리자 원클릭 재시도 성공)`,
      };

      return NextResponse.json({
        success: true,
        message: '원클릭 재시도 디스패치가 성공적으로 완료되었습니다.',
        updatedLog: mockLogs[targetIndex],
      });
    }

    return NextResponse.json({ success: false, error: '유효하지 않은 액션입니다.' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || '재시도 처리 중 오류 발생' },
      { status: 500 }
    );
  }
}

// 로그 삭제
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
      mockLogs = mockLogs.filter((l) => l.id !== id);
      return NextResponse.json({ success: true, message: '로그가 삭제되었습니다.' });
    }

    return NextResponse.json({ success: false, error: '삭제할 로그 ID가 누락되었습니다.' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || '로그 삭제 실패' }, { status: 500 });
  }
}
