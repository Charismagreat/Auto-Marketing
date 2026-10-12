import { NextResponse } from 'next/server';
import { setupDatabase, queryTable, insertRows } from '@/lib/setup-db';
import { executeSQL } from '@/lib/egdesk-helpers';

export interface FaqItem {
  id: string;
  category: 'CONNECT' | 'BILLING' | 'QUALITY' | 'PRINT';
  categoryLabel: string;
  question: string;
  answer: string;
  isPublished: boolean;
  order: number;
}

export async function GET() {
  try {
    await setupDatabase();
    const res = await queryTable('auto_faqs', { limit: 100, orderBy: 'sort_order', orderDirection: 'ASC' }).catch(() => ({ rows: [] }));
    const rows = res.rows || [];

    const faqs: FaqItem[] = rows.map((r: any, idx: number) => ({
      id: r.id || `faq-${idx + 1}`,
      category: (r.category || 'CONNECT') as any,
      categoryLabel: r.category_label || (r.category === 'CONNECT' ? '채널 연동' : r.category === 'BILLING' ? '결제/토큰' : r.category === 'PRINT' ? '인쇄/배송' : '콘텐츠 품질'),
      question: r.question || '',
      answer: r.answer || '',
      isPublished: r.is_published === undefined ? true : Boolean(r.is_published),
      order: r.sort_order || idx + 1,
    }));

    return NextResponse.json({
      success: true,
      data: faqs,
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
    await setupDatabase();
    const body = await req.json();
    const id = `faq-${Date.now()}`;
    const newFaq: FaqItem = {
      id,
      category: body.category || 'CONNECT',
      categoryLabel: body.categoryLabel || '채널 연동',
      question: body.question,
      answer: body.answer,
      isPublished: true,
      order: Date.now() % 1000,
    };

    await insertRows('auto_faqs', [
      {
        id: newFaq.id,
        category: newFaq.category,
        category_label: newFaq.categoryLabel,
        question: newFaq.question,
        answer: newFaq.answer,
        is_published: 1,
        sort_order: newFaq.order,
        created_at: new Date().toISOString(),
      },
    ]);

    return NextResponse.json({
      success: true,
      message: 'FAQ가 DB에 성공적으로 등록되었습니다.',
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
    await setupDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (id) {
      await executeSQL(`DELETE FROM auto_faqs WHERE id = '${id}';`);
      return NextResponse.json({ success: true, message: 'FAQ가 DB에서 삭제되었습니다.' });
    }
    return NextResponse.json({ success: false, error: 'ID 누락' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'FAQ 삭제 실패' }, { status: 500 });
  }
}
