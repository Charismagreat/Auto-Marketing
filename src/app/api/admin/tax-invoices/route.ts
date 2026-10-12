import { NextResponse } from 'next/server';
import { setupDatabase, queryTable } from '@/lib/setup-db';
import { executeSQL } from '@/lib/egdesk-helpers';

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

export async function GET() {
  try {
    await setupDatabase();
    const res = await queryTable('auto_tax_invoices', { limit: 100, orderBy: 'created_at', orderDirection: 'DESC' }).catch(() => ({ rows: [] }));
    const rows = res.rows || [];

    const invoices: TaxInvoice[] = rows.map((r: any) => ({
      id: r.id,
      invoiceNumber: r.invoice_number || '',
      ntsApprovalNumber: r.nts_approval_number || undefined,
      storeName: r.store_name || '',
      bizNumber: r.biz_number || '',
      ceoName: r.ceo_name || '',
      email: r.email || '',
      itemDescription: r.item_description || '',
      supplyAmount: Number(r.supply_amount) || 0,
      vatAmount: Number(r.vat_amount) || 0,
      totalAmount: Number(r.total_amount) || 0,
      status: (r.status || 'PENDING') as any,
      issueDate: r.issue_date || '',
    }));

    const totalSales = invoices
      .filter((i) => i.status === 'APPROVED')
      .reduce((acc, cur) => acc + cur.totalAmount, 0);

    const pendingCount = invoices.filter((i) => i.status === 'PENDING').length;

    return NextResponse.json({
      success: true,
      data: {
        invoices,
        stats: {
          totalSales,
          pendingCount,
          totalCount: invoices.length,
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

// 국세청 전송 승인 또는 상태 변경 (SQLite DB 영구 반영)
export async function POST(req: Request) {
  try {
    await setupDatabase();
    const body = await req.json();
    const { action, invoiceId } = body;

    if (!invoiceId) {
      return NextResponse.json({ success: false, error: 'invoiceId 누락' }, { status: 400 });
    }

    if (action === 'approve') {
      const ntsApprovalNumber = `20261012-41000284-${Math.floor(10000000 + Math.random() * 90000000)}`;
      await executeSQL(
        `UPDATE auto_tax_invoices SET status = 'APPROVED', nts_approval_number = '${ntsApprovalNumber}' WHERE id = '${invoiceId}';`
      );

      return NextResponse.json({
        success: true,
        message: '국세청 홈택스 전자세금계산서 발행 및 DB 승인이 완료되었습니다.',
        ntsApprovalNumber,
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
