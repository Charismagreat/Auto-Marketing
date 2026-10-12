import { NextResponse } from 'next/server';

export interface TaxInvoice {
  id: string;
  invoiceNumber: string;
  ntsApprovalNumber?: string; // 국세청 승인번호
  storeName: string;
  bizNumber: string;
  ceoName: string;
  email: string;
  itemDescription: string;
  supplyAmount: number;
  vatAmount: number;
  totalAmount: number;
  status: 'PENDING' | 'APPROVED' | 'CANCELED';
  issueDate: string;
}

let mockTaxInvoices: TaxInvoice[] = [
  {
    id: 'tax-001',
    invoiceNumber: '20261012-AM-001',
    ntsApprovalNumber: '20261012-41000284-88912345',
    storeName: '배곧 피트니스 24',
    bizNumber: '134-87-99123',
    ceoName: '최관장',
    email: 'fit24@gym.com',
    itemDescription: '오토파일럿 프로 팩 1개월 정기 구독료',
    supplyAmount: 71818,
    vatAmount: 7182,
    totalAmount: 79000,
    status: 'APPROVED',
    issueDate: '2026-10-12',
  },
  {
    id: 'tax-002',
    invoiceNumber: '20261012-AM-002',
    storeName: '배곧 달콤베이커리',
    bizNumber: '214-12-65432',
    ceoName: '김점주',
    email: 'sweetbakery@naver.com',
    itemDescription: '골목대장 올인원 마스터 연간 라이선스 선납',
    supplyAmount: 1354545,
    vatAmount: 135455,
    totalAmount: 1490000,
    status: 'PENDING',
    issueDate: '2026-10-12',
  },
  {
    id: 'tax-003',
    invoiceNumber: '20261010-AM-003',
    ntsApprovalNumber: '20261010-41000284-77610012',
    storeName: '정왕동 불타는 쭈꾸미',
    bizNumber: '110-23-45678',
    ceoName: '박대표',
    email: 'hotjjukku@daum.net',
    itemDescription: '15초 숏폼 릴스 4편 제작 대행',
    supplyAmount: 320000,
    vatAmount: 32000,
    totalAmount: 352000,
    status: 'APPROVED',
    issueDate: '2026-10-10',
  },
];

export async function GET() {
  try {
    const totalSales = mockTaxInvoices
      .filter((i) => i.status === 'APPROVED')
      .reduce((acc, cur) => acc + cur.totalAmount, 0);

    const pendingCount = mockTaxInvoices.filter((i) => i.status === 'PENDING').length;

    return NextResponse.json({
      success: true,
      data: {
        invoices: mockTaxInvoices,
        stats: {
          totalSales,
          pendingCount,
          totalCount: mockTaxInvoices.length,
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || '세금계산서 목록 조회 실패' },
      { status: 500 }
    );
  }
}

// 국세청 전송 승인 또는 상태 변경
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, invoiceId } = body;

    const target = mockTaxInvoices.find((i) => i.id === invoiceId);
    if (!target) {
      return NextResponse.json({ success: false, error: '해당 계산서를 찾을 수 없습니다.' }, { status: 404 });
    }

    if (action === 'approve') {
      target.status = 'APPROVED';
      target.ntsApprovalNumber = `20261012-41000284-${Math.floor(10000000 + Math.random() * 90000000)}`;
      return NextResponse.json({
        success: true,
        message: '국세청 홈택스 전자세금계산서 발행 및 전송이 완료되었습니다.',
        invoice: target,
      });
    }

    return NextResponse.json({ success: false, error: '유효하지 않은 액션' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || '계산서 처리 중 오류' },
      { status: 500 }
    );
  }
}
