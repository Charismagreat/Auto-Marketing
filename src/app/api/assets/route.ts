import { NextResponse } from 'next/server';
import { queryTable, insertRows, updateRows, deleteRows } from '@/lib/egdesk-helpers';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId') || searchParams.get('business_id');
    const type = searchParams.get('type');

    const filters: any = {};
    if (businessId && businessId !== 'all') {
      filters.business_id = businessId;
    }
    if (type && type !== 'all') {
      filters.type = type;
    }

    let assets: any[] = [];
    try {
      const res = await queryTable('auto_assets', {
        filters: Object.keys(filters).length > 0 ? filters : undefined,
        limit: 100,
        orderBy: 'created_at',
        orderDirection: 'DESC',
      });
      assets = res?.rows || [];
    } catch (e) {
      console.warn('Query assets error:', e);
    }

    return NextResponse.json({
      success: true,
      assets,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      userId = 'usr_pongshin_master',
      businessId = 'biz_pongshin_baegot',
      business_id,
      title,
      type = 'detail', // 'video' | 'detail' | 'print' | 'blog' | 'card'
      spec = '',
      component_code,
      codeContent,
      preview_url,
      thumbnailUrl,
      status = 'ready',
      costTokens = type === 'video' ? 3000 : 2000,
    } = body;

    const assetId = `ast_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const effectiveBusinessId = business_id || businessId;
    const effectiveCode = component_code || (typeof codeContent === 'string' ? codeContent : JSON.stringify(codeContent || ''));
    const effectivePreview = preview_url || thumbnailUrl || 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80';
    const now = new Date().toISOString();

    // 1. auto_assets에 생성된 에셋 저장
    const assetRow = {
      id: assetId,
      business_id: effectiveBusinessId,
      title: title || `${type?.toUpperCase()} 마케팅 에셋`,
      type: type || 'detail',
      spec: spec || `${type.toUpperCase()} 규격 에셋`,
      component_code: effectiveCode,
      preview_url: effectivePreview,
      status: status || 'ready',
      created_at: now,
    };

    await insertRows('auto_assets', [assetRow]);

    // 2. auto_users 토큰 차감
    try {
      const uRes = await queryTable('auto_users', { filters: { id: userId }, limit: 1 }).catch(() => ({ rows: [] }));
      const user = uRes.rows?.[0];
      if (user) {
        const curBal = Number(user.token_balance || 0);
        const newBal = Math.max(0, curBal - costTokens);
        await updateRows('auto_users', {
          token_balance: newBal,
          updated_at: now,
        }, {
          filters: { id: userId },
        });
      }
    } catch (tokenErr) {
      console.warn('Token consume error:', tokenErr);
    }

    // 3. ai_token_usage_logs 기록
    try {
      const logRow = {
        id: `log_${Date.now()}`,
        user_id: userId,
        model_name: type === 'video' ? 'Remotion+TTS' : type === 'detail' ? 'gemini-3.8-flash' : 'gemini-3.1-flash-image',
        engine_type: type,
        tokens_used: costTokens,
      };
      await insertRows('ai_token_usage_logs', [logRow]);
    } catch (logErr) {
      console.warn('Log insert error:', logErr);
    }

    return NextResponse.json({
      success: true,
      assetId,
      consumedTokens: costTokens,
      message: '마케팅 에셋이 라이브러리에 안전하게 저장되었으며 토큰이 차감되었습니다.'
    });
  } catch (error: any) {
    console.error('Save asset error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: '삭제할 에셋 ID가 필요합니다.' }, { status: 400 });
    }

    await deleteRows('auto_assets', { filters: { id } });

    return NextResponse.json({
      success: true,
      message: '에셋이 성공적으로 삭제되었습니다.',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
