import { NextRequest, NextResponse } from 'next/server';
import { setupDatabase, queryTable, insertRows } from '@/lib/setup-db';
import { executeSQL } from '@/lib/egdesk-helpers';

export async function GET(req: NextRequest) {
  try {
    await setupDatabase();
    const result = await queryTable('auto_campaigns', {
      limit: 50,
      orderBy: 'scheduled_at',
      orderDirection: 'ASC',
    });

    return NextResponse.json({
      success: true,
      campaigns: result.rows || [],
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await setupDatabase();
    const body = await req.json();
    const id = `camp_${Date.now()}`;
    const now = new Date().toISOString();

    const campaign = {
      id,
      business_id: body.business_id || 'biz_pongshin_baegot',
      title: body.title || '새 마케팅 캠페인',
      platform: body.platform || 'instagram',
      channel_type: body.channel_type || 'SNS 콘텐츠',
      theme: body.theme || '',
      scheduled_at: body.scheduled_at || new Date().toISOString().slice(0, 10),
      time_slot: body.time_slot || '오전 11:00',
      tip: body.tip || '',
      status: body.status || 'scheduled',
      asset_id: body.asset_id || '',
      created_at: now,
    };

    await insertRows('auto_campaigns', [campaign]);

    return NextResponse.json({
      success: true,
      campaign,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await setupDatabase();
    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ success: false, error: 'id와 status가 필요합니다.' }, { status: 400 });
    }

    await executeSQL(`UPDATE auto_campaigns SET status = '${status}' WHERE id = '${id}'`);

    return NextResponse.json({
      success: true,
      message: '캠페인 상태가 성공적으로 변경되었습니다.',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
