import { NextResponse } from 'next/server';
import { setupDatabase, queryTable, insertRows, updateRows } from '@/lib/setup-db';

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

export async function GET(req: Request) {
  try {
    await setupDatabase();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const search = searchParams.get('search')?.toLowerCase();

    const [inqRes, repRes] = await Promise.all([
      queryTable('auto_inquiries', { limit: 100, orderBy: 'created_at', orderDirection: 'DESC' }).catch(() => ({ rows: [] })),
      queryTable('auto_inquiry_replies', { limit: 500, orderBy: 'created_at', orderDirection: 'ASC' }).catch(() => ({ rows: [] })),
    ]);

    const repliesByInq: Record<string, any[]> = {};
    for (const r of repRes.rows || []) {
      const inqId = r.inquiry_id;
      if (!repliesByInq[inqId]) repliesByInq[inqId] = [];
      repliesByInq[inqId].push({
        id: r.id,
        author: r.author || '관리자',
        content: r.content || '',
        createdAt: r.created_at || '',
        isAiDraft: Boolean(r.is_ai_draft),
      });
    }

    let allInquiries: Inquiry[] = (inqRes.rows || []).map((r: any) => ({
      id: r.id,
      storeId: r.store_id || '',
      storeName: r.store_name || '',
      authorName: r.author_name || '',
      contact: r.contact || '',
      category: (r.category || 'CHANNEL_CONNECT') as any,
      categoryLabel: r.category_label || '채널 연동',
      title: r.title || '',
      content: r.content || '',
      status: (r.status || 'PENDING') as any,
      priority: (r.priority || 'NORMAL') as any,
      sentiment: (r.sentiment || 'NEUTRAL') as any,
      createdAt: r.created_at || '',
      replies: repliesByInq[r.id] || [],
      internalNote: r.internal_note || '',
    }));

    let filtered = [...allInquiries];

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
      total: allInquiries.length,
      pending: allInquiries.filter((i) => i.status === 'PENDING').length,
      inProgress: allInquiries.filter((i) => i.status === 'IN_PROGRESS').length,
      resolved: allInquiries.filter((i) => i.status === 'RESOLVED').length,
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

// 답변 등록, 상태 변경, AI 답변 초안 생성 (SQLite DB 영구 반영)
export async function POST(req: Request) {
  try {
    await setupDatabase();
    const body = await req.json();
    const { action, inquiryId, replyContent, newStatus, internalNote } = body;

    // 1. AI 자동 답변 초안 생성 액션
    if (action === 'ai_draft') {
      const inqRes = await queryTable('auto_inquiries', { limit: 100 }).catch(() => ({ rows: [] }));
      const inquiry = (inqRes.rows || []).find((i: any) => i.id === inquiryId) || {
        store_name: body.storeName || '사장님',
        title: body.title || '',
        content: body.content || '',
      };

      const storeName = inquiry.store_name || inquiry.storeName || '사장님';
      const title = inquiry.title || '';
      const content = inquiry.content || '';

      const aiDraft = `안녕하세요 ${storeName} 사장님! 오토마케팅 고객 성공팀입니다.\n\n문의해 주신 "${title}" 건과 관련하여 안내해 드립니다.\n${content.includes('인증') || content.includes('토큰') ? '네이버 스마트플레이스 연동 보안 정책에 따라 90일 주기로 파트너 재인증이 필요합니다. 관리자 화면 상단의 [채널 연동 관리]에서 1-Click 재인증을 진행해 주시면 즉시 정상 가동됩니다.' : '요청해 주신 내용을 반영하여 맞춤형 최적화를 즉시 적용해 드렸습니다.'}\n\n추가로 궁금하신 사항이 있으시면 언제든 말씀해 주세요. 사장님의 골목상권 1등 매장 성장을 항상 응원합니다! 감사합니다.`;

      return NextResponse.json({
        success: true,
        aiDraft,
      });
    }

    // 2. 답변 등록
    if (action === 'reply' && replyContent && inquiryId) {
      const repId = `rep-${Date.now()}`;
      const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

      await insertRows('auto_inquiry_replies', [
        {
          id: repId,
          inquiry_id: inquiryId,
          author: 'Auto-Marketing 슈퍼관리자',
          content: replyContent,
          is_ai_draft: 0,
          created_at: now,
        },
      ]);

      const updatedStatus = newStatus || 'RESOLVED';
      const updates: Record<string, any> = { status: updatedStatus };
      if (internalNote !== undefined) {
        updates.internal_note = internalNote;
      }

      await updateRows('auto_inquiries', updates, {
        filters: { id: inquiryId },
      });

      return NextResponse.json({
        success: true,
        message: '답변이 SQLite DB에 성공적으로 등록되었습니다.',
      });
    }

    // 3. 상태 또는 내부 메모 변경
    if (action === 'update_status' && inquiryId) {
      const updates: Record<string, any> = {};
      if (newStatus) updates.status = newStatus;
      if (internalNote !== undefined) updates.internal_note = internalNote;

      if (Object.keys(updates).length > 0) {
        await updateRows('auto_inquiries', updates, {
          filters: { id: inquiryId },
        });
      }

      return NextResponse.json({
        success: true,
        message: '문의 상태가 DB에 성공적으로 업데이트되었습니다.',
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
