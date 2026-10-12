import { NextResponse } from 'next/server';

export interface ProposalItem {
  id: string;
  name: string;
  specification: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface ProposalPackage {
  packageId: string;
  packageName: string;
  badge: string;
  description: string;
  items: ProposalItem[];
  discountRate: number; // %
}

// 공급자 기본 정보
export const DEFAULT_SUPPLIER = {
  companyName: '(주)오토마케팅',
  bizNumber: '123-86-09876',
  ceoName: '홍길동',
  address: '경기도 시흥시 배곧4로 32-27, 골든플라자 5층',
  tel: '1588-0000',
  email: 'contact@auto-marketing.kr',
  bankName: '기업은행',
  accountNumber: '010-1234-5678-01',
  accountHolder: '(주)오토마케팅',
};

// 소상공인 3대 마케팅 패키지 프리셋
export const MARKETING_PACKAGES: ProposalPackage[] = [
  {
    packageId: 'starter',
    packageName: '스타터 로컬 팩 (Starter Local)',
    badge: '추천: 신규 개업 / 골목 소형 매장',
    description: '당근마켓 및 네이버 스마트플레이스 검색 최적화로 지역 고객 첫 방문 유도',
    items: [
      { id: '1', name: '네이버 플레이스 SEO & 알림 쿠폰 세팅', specification: '검색 노출 최적화 + 새소식 4회 + 쿠폰 세팅', quantity: 1, unitPrice: 150000, amount: 150000 },
      { id: '2', name: '당근마켓 비즈프로필 단골 소식 발행', specification: '동네생활 소식글 4회 + 단골 쿠폰 발행', quantity: 1, unitPrice: 150000, amount: 150000 },
      { id: '3', name: 'A4 오프라인 전단지 3초 카피 & PDF 제작', specification: '300DPI 인쇄용 고해상도 그래픽 PDF 1종', quantity: 1, unitPrice: 90000, amount: 90000 },
    ],
    discountRate: 0,
  },
  {
    packageId: 'autopilot',
    packageName: '오토파일럿 프로 팩 (Autopilot Pro)',
    badge: '인기 1위: 매출 2배 성장 정기 구독',
    description: '7일 주간 오토파일럿으로 7대 온·오프라인 채널 매주 자동 발행 및 AI 분석',
    items: [
      { id: '1', name: '주간 7일 오토파일럿 정기 발행', specification: '인스타/블로그/당근/플레이스 요일별 자동 발행', quantity: 1, unitPrice: 350000, amount: 350000 },
      { id: '2', name: '15초 바이럴 숏폼 영상/릴스 제작', specification: 'AI 보이스오버 + 숏츠/릴스 규격 영상 4편', quantity: 4, unitPrice: 80000, amount: 320000 },
      { id: '3', name: '네이버 블로그 C-Rank 포스팅 원고', specification: '고품질 체험단 형식 검색 상위 포스팅 4편', quantity: 4, unitPrice: 50000, amount: 200000 },
      { id: '4', name: '인쇄용 A4 전단지 4,000매 인쇄 배송', specification: '150g 아트지 양면 풀컬러 인쇄 및 배송 포함', quantity: 1, unitPrice: 120000, amount: 120000 },
    ],
    discountRate: 15,
  },
  {
    packageId: 'enterprise',
    packageName: '골목대장 올인원 마스터 (All-in-One Master)',
    badge: '최고급: 지역 상권 1등 독점 플랜',
    description: '고전환 상세페이지부터 7대 채널 풀 패키지, 1:1 전담 마케팅 디렉터 매칭',
    items: [
      { id: '1', name: '고전환 상세페이지 풀 패키지 제작', specification: '기획 + 카피라이팅 + 비주얼 블록 10단 렌더링', quantity: 1, unitPrice: 600000, amount: 600000 },
      { id: '2', name: '주간 7일 오토파일럿 무제한 플랜', specification: '7대 채널 일일 무제한 디스패치 & 큐 관리', quantity: 1, unitPrice: 500000, amount: 500000 },
      { id: '3', name: '15초 고화질 숏폼 비디오 8편 패키지', specification: '시나리오 + AI 보이스 + 편집 완료본 8편', quantity: 8, unitPrice: 70000, amount: 560000 },
      { id: '4', name: '오프라인 전단지 8,000매 인쇄 및 배포 지원', specification: '상권 분석 기반 타겟 배포 기획 포함', quantity: 1, unitPrice: 240000, amount: 240000 },
      { id: '5', name: '1:1 전담 마케팅 디렉터 월간 성과 리포트', specification: '주간 전환율 분석 + 월간 오프라인 미팅 1회', quantity: 1, unitPrice: 300000, amount: 300000 },
    ],
    discountRate: 25,
  },
];

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const packageId = searchParams.get('packageId');

    return NextResponse.json({
      success: true,
      data: {
        supplier: DEFAULT_SUPPLIER,
        packages: MARKETING_PACKAGES,
        selectedPackage: MARKETING_PACKAGES.find((p) => p.packageId === packageId) || MARKETING_PACKAGES[1],
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || '견적서 정보 조회 실패' },
      { status: 500 }
    );
  }
}

// 견적서 저장 또는 PDF/메일 발송 시뮬레이션
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { clientInfo, packageId, items, totalPrice, discountAmount, vatAmount, finalAmount, memo } = body;

    const proposalNumber = `PROP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    return NextResponse.json({
      success: true,
      message: '맞춤형 마케팅 견적서가 성공적으로 발행되었습니다.',
      proposal: {
        proposalNumber,
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
        clientInfo,
        items,
        totalPrice,
        discountAmount,
        vatAmount,
        finalAmount,
        memo,
        supplier: DEFAULT_SUPPLIER,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || '견적서 발행 중 오류 발생' },
      { status: 500 }
    );
  }
}
