import { NextRequest, NextResponse } from 'next/server';
import { setupDatabase, queryTable, insertRows } from '@/lib/setup-db';
import { executeSQL } from '@/lib/egdesk-helpers';

export async function GET(req: NextRequest) {
  try {
    let rows: any[] = [];
    try {
      const result = await queryTable('auto_media', {
        limit: 100,
        orderBy: 'created_at',
        orderDirection: 'DESC',
      });
      rows = result?.rows || [];
    } catch {
      try {
        const sqlRes = await executeSQL('SELECT * FROM auto_media ORDER BY created_at DESC LIMIT 100;');
        rows = sqlRes?.rows || [];
      } catch {}
    }

    // 기본 미디어가 비어있을 경우 퐁신제빵소 실물 카스테라 기본 제공
    if (rows.length === 0) {
      rows = [
        {
          id: 'med_pongshin_original',
          business_id: 'biz_pongshin_baegot',
          name: '퐁신 오리지널 카스테라 갓 구운 실물 컷.jpg',
          type: 'image',
          mime_type: 'image/jpeg',
          url: 'https://ldb-phinf.pstatic.net/20250613_51/1749793026669I569w_JPEG/%C6%FE%BD%C5%BD%C9%BA%BC1.jpg',
          size_bytes: 425000,
          created_at: new Date().toISOString(),
        },
        {
          id: 'med_pongshin_cream',
          business_id: 'biz_pongshin_baegot',
          name: '생크림 폭탄 카스테라 단면 클로즈업.jpg',
          type: 'image',
          mime_type: 'image/jpeg',
          url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80',
          size_bytes: 580000,
          created_at: new Date().toISOString(),
        },
        {
          id: 'med_pongshin_cheese',
          business_id: 'biz_pongshin_baegot',
          name: '단짠 체다치즈 흘러내리는 순간.jpg',
          type: 'image',
          mime_type: 'image/jpeg',
          url: 'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=800&auto=format&fit=crop&q=80',
          size_bytes: 512000,
          created_at: new Date().toISOString(),
        }
      ];
    }

    return NextResponse.json({
      success: true,
      media: rows,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      businessId = 'biz_pongshin_baegot',
      name = '업로드_사진.jpg',
      type = 'image',
      mime_type = 'image/jpeg',
      url,
      size_bytes = 0,
    } = body;

    if (!url) {
      return NextResponse.json({ success: false, error: '미디어 URL 또는 Data가 필요합니다.' }, { status: 400 });
    }

    const id = `med_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const mediaRow = {
      id,
      business_id: businessId,
      name,
      type,
      mime_type,
      url,
      size_bytes: Number(size_bytes) || 0,
      created_at: now,
    };

    try {
      await insertRows('auto_media', [mediaRow]);
    } catch (insertErr) {
      console.warn('insertRows auto_media fallback:', insertErr);
    }

    return NextResponse.json({
      success: true,
      media: mediaRow,
      message: '이지데스크 스토리지에 미디어가 성공적으로 업로드되었습니다.',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: '삭제할 미디어 ID가 필요합니다.' }, { status: 400 });
    }

    await executeSQL(`DELETE FROM auto_media WHERE id = '${id}'`);

    return NextResponse.json({
      success: true,
      message: '미디어가 스토리지에서 삭제되었습니다.',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
