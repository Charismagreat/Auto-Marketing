import { NextResponse } from 'next/server';
import { queryTable, insertRows, updateRows } from '@/lib/egdesk-helpers';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name,
      category,
      address,
      description,
      phone,
      place_url,
      sns_links,
      products,
      user_id = 'usr_pongshin_master'
    } = body;

    if (!name) {
      return NextResponse.json({ success: false, error: '상호명(매장명)은 필수입니다.' }, { status: 400 });
    }

    const businessId = `biz_${Date.now()}`;

    // 1. 비즈니스 프로필 등록
    const bizRow = {
      id: businessId,
      user_id: user_id,
      name: name,
      category: category || '베이커리/디저트',
      address: address || '',
      description: description || '',
      phone: phone || '',
      place_url: place_url || '',
      sns_links_json: JSON.stringify(sns_links || {}),
      theme_color: '#4F46E5',
      logo_url: 'https://ldb-phinf.pstatic.net/20250613_51/1749793026669I569w_JPEG/%C6%FE%BD%C5%BD%C9%BA%BC1.jpg',
    };

    await insertRows('auto_businesses', [bizRow]);

    // 2. 대표 상품 등록 (있을 경우)
    if (products && Array.isArray(products) && products.length > 0) {
      const prodRows = products.map((p: any, idx: number) => ({
        id: `prod_${Date.now()}_${idx}`,
        business_id: businessId,
        name: p.name || `대표 상품 ${idx + 1}`,
        price: Number(p.price) || 0,
        description: p.description || '',
        image_url: p.image_url || 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80',
        signature_badge: p.signature_badge || '시그니처',
        usp_tags_json: JSON.stringify(p.usp_tags || ['인기메뉴', '당일생산']),
      }));

      await insertRows('auto_products', prodRows);
    }

    // 3. 토큰 지급 확인
    try {
      const uRes = await queryTable('auto_users', { filters: { id: user_id }, limit: 1 }).catch(() => ({ rows: [] }));
      const user = uRes.rows?.[0];
      if (user) {
        const curBal = Number(user.token_balance || 0);
        await updateRows('auto_users', {
          token_balance: curBal + 50000,
          updated_at: new Date().toISOString(),
        }, {
          filters: { id: user_id },
        });
      }
    } catch (e) {
      console.warn('User token update error:', e);
    }

    return NextResponse.json({
      success: true,
      business_id: businessId,
      message: '비즈니스 등록이 성공적으로 완료되었습니다! 웰컴 토큰 50,000T가 충전되었습니다.'
    });
  } catch (error: any) {
    console.error('Business register error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
