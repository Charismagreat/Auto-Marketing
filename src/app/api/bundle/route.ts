import { NextResponse } from 'next/server';
import { callAiCaller, insertRows, queryTable } from '@/lib/egdesk-helpers';

/**
 * 1-Click 마케팅 풀 패키지 일괄 생성 API (Auto Marketing 7-Channel Bundle)
 * 단 한 번의 요청으로 7대 온·오프라인 마케팅 에셋을 고속 병렬 생성하여 auto_assets에 자동 적재합니다:
 * 1. 860px 모바일 상세페이지 HTML
 * 2. 15초 세로형 숏폼 시나리오 & TTS 대본 JSON
 * 3. A4 상업 인쇄용 오픈/이벤트 전단지 HTML
 * 4. 인스타그램 1:1 정방형 6컷 카드뉴스 JSON
 * 5. 네이버 블로그 스마트블록 상위노출 최적화 원고
 * 6. 당근마켓 비즈프로필 & 동네생활 피드 소식글
 * 7. 네이버 스마트플레이스 새소식 & 알림받기 쿠폰 원고
 */

function toCleanText(res: any): string {
  if (typeof res === 'string') return res;
  if (res && typeof res === 'object') {
    return res.text || res.content || '';
  }
  return String(res || '');
}

export async function POST(req: Request) {
  const startTime = Date.now();
  try {
    const body = await req.json().catch(() => ({}));
    const {
      productId,
      businessId = 'biz_pongshin_baegot',
      customProduct,
      customBusiness,
    } = body;

    // 1. 비즈니스 및 상품 정보 획득
    let business = customBusiness;
    let product = customProduct;
    let isAllMode = productId === 'all' || body.mode === 'all';
    let isBundleMode = productId === 'bundle' || body.mode === 'bundle';

    if (!business) {
      const bizRows = await queryTable('auto_businesses', { limit: 1 });
      business = (bizRows && bizRows[0]) || {
        id: 'biz_pongshin_baegot',
        name: '퐁신제빵소',
        category: '베이커리/디저트',
        address: '경기 시흥시 서울대학로 59-69 배곧테크노밸리 1층',
        usp: '입안 가득 구름처럼 사르르 녹아내리는 부드러움, 매일 아침 당일 구워내는 신선한 수제 대만 카스테라',
      };
    }

    // 전체 등록 상품 로드
    const allProdRows = (await queryTable('auto_products', { limit: 10 })) || [];

    if (isAllMode) {
      // 📋 전체 메뉴 라인업 모드
      const productListSummary = allProdRows.map((p, i) => `${i + 1}. ${p.name} (${Number(p.price || 0).toLocaleString()}원): ${p.description || ''}`).join('\n');
      product = {
        id: 'prod_all_lineup',
        name: `${business.name || '퐁신제빵소'} 전 메뉴 라인업 (총 ${allProdRows.length}종)`,
        price: '전 메뉴 및 세트 패키지',
        description: `퐁신제빵소의 전체 수제 메뉴 라인업:\n${productListSummary}`,
        image_url: allProdRows[0]?.image_url || 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80',
        is_all: true,
      };
    } else if (isBundleMode) {
      // 🎁 시그니처 3종 묶음/세트 모드
      const top3 = allProdRows.slice(0, 3);
      const setList = top3.map((p) => p.name).join(' + ');
      const setOriginalPrice = top3.reduce((acc, p) => acc + (Number(p.price) || 0), 0);
      const setDiscountPrice = Math.max(setOriginalPrice - 2000, 10000);
      product = {
        id: 'prod_bundle_combo',
        name: `[세트/선물팩] 퐁신 시그니처 3종 베스트 세트 (${setList})`,
        price: setDiscountPrice,
        description: `퐁신 대표 메뉴 3종(${setList})을 한 번에! 정가 ${setOriginalPrice.toLocaleString()}원 ➔ 세트 특별가 ${setDiscountPrice.toLocaleString()}원 (선물 포장 무료)`,
        image_url: top3[0]?.image_url || 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80',
        is_bundle: true,
      };
    } else if (!product) {
      if (productId && productId !== 'all' && productId !== 'bundle') {
        const prodRows = await queryTable('auto_products', {
          where: `id = '${productId}'`,
          limit: 1,
        });
        product = (prodRows && prodRows[0]) || null;
      }
      if (!product) {
        product = allProdRows[0] || {
          id: 'prod_pongshin_original',
          name: '퐁신 오리지널 대만 카스테라',
          price: 11000,
          description: '신선한 무항생제 계란 듬뿍, 방부제 0%로 당일 아침 구워내는 정통 대만 수제 카스테라',
          image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80',
        };
      }
    }

    const bizName = business.name || '퐁신제빵소';
    const prodName = product.name || '퐁신 오리지널 대만 카스테라';
    const prodPrice = typeof product.price === 'number' ? `${product.price.toLocaleString()}원` : String(product.price);
    const prodDesc = product.description || '신선한 무항생제 계란으로 구워낸 수제 대만 카스테라';
    const imgUrl = product.image_url || 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80';

    // 2. 7대 마케팅 에셋 프롬프트 정의
    // 2-1. 상세페이지 프롬프트
    const detailPrompt = `당신은 대한민국 1등 이커머스 상세페이지 전문가입니다.
[매장]: ${bizName}, [홍보 대상]: ${prodName} (${prodPrice})
[상세 정보]: ${prodDesc}
${isAllMode ? '반드시 등록된 모든 메뉴 라인업의 사진, 가격, 맛 특징 그리드와 세트 주문 혜택을 상세히 구성하세요.' : isBundleMode ? '반드시 3종 세트 구성품 언박싱, 선물 패키지 비주얼, 2,000원 할인 혜택을 집중 강조하세요.' : ''}
반드시 max-w-[860px] mx-auto 규격의 반응형 HTML 코드를 Tailwind CSS로 작성하세요.
(훅 인트로, 장인의 비밀, 메뉴 쇼케이스, 리얼 리뷰, 맛있게 먹는 꿀팁, 배송안내 포함)
오직 HTML 코드만 출력하세요.`;

    // 2-2. 15초 숏폼 시나리오 프롬프트
    const videoPrompt = `당신은 수백만 뷰 숏폼 디렉터입니다.
[매장]: ${bizName}, [홍보 대상]: ${prodName}
${isAllMode ? '오늘 뭐 먹지? 퐁신제빵소 전 메뉴 라인업 랭킹과 취향별 추천 숏폼으로 기획하세요.' : isBundleMode ? '단품 말고 3종 세트로 사야 2,000원 이득! 꿀조합 선물세트 숏폼으로 기획하세요.' : ''}
15초 숏폼 릴스/쇼츠 구성안을 아래 순수 JSON 형식으로만 작성하세요:
{
  "title": "${prodName} 15초 릴스",
  "totalDuration": 15,
  "bgm": "120 BPM 경쾌한 베이커리 팝",
  "scenes": [
    { "sceneNumber": 1, "timeRange": "0~3초", "subtitle": "${isAllMode ? '퐁신제빵소 전 메뉴 총출동!' : isBundleMode ? '단품 고민 끝! 3종 세트 꿀조합' : '구름처럼 폭신한 비주얼!'}", "narration": "손끝에서 느껴지는 미친 탄력! 매일 아침 구워내는 ${bizName} 카스테라입니다.", "cameraMotion": "Zoom In" },
    { "sceneNumber": 2, "timeRange": "3~8초", "subtitle": "무항생제 계란 듬뿍, 사르르 녹아요", "narration": "방부제 0%로 당일 아침 구워내 입안 가득 부드러움이 퍼집니다.", "cameraMotion": "Pan Right" },
    { "sceneNumber": 3, "timeRange": "8~12초", "subtitle": "${isBundleMode ? '3종 묶음 구매 시 2,000원 즉시 할인!' : '우유에 콕 찍먹하면 극락!'}", "narration": "시원한 우유와 함께하면 아이들 안심 간식으로도 완벽합니다.", "cameraMotion": "Focus" },
    { "sceneNumber": 4, "timeRange": "12~15초", "subtitle": "시흥 배곧에서 오늘 만나요!", "narration": "배곧 ${bizName}에서 만나요! 네이버 예약 시 즉시 픽업 가능합니다.", "cameraMotion": "Bounce CTA" }
  ]
}`;

    // 2-3. A4 전단지 프롬프트
    const printPrompt = `당신은 상업 인쇄물 전문 시각 디자이너입니다.
[매장]: ${bizName}, [주소]: ${business.road_address || business.address || '배곧테크노밸리 1층'}, [연락처]: 0507-1234-5678
[홍보 대상]: ${prodName} (${prodPrice})
[상세 정보]: ${prodDesc}
${isAllMode ? '반드시 A4 앞면에 전체 메뉴판(각 메뉴명, 가격, 사진 자리, 특징 설명)과 1,000원 오픈 할인 쿠폰을 감각적인 베이커리 메뉴판 형식으로 디자인하세요.' : isBundleMode ? '반드시 3종 선물 세트 특별 할인(2,000원 즉시 할인)과 선물 포장 무료 혜택을 강조한 프로모션 전단지로 디자인하세요.' : 'A4 인쇄용 오픈 기념 1,000원 할인 쿠폰이 포함된 전단지 HTML 코드를 Tailwind CSS로 작성하세요.'}
오직 HTML 코드만 출력하세요.`;

    // 2-4. 인스타 6컷 카드뉴스 프롬프트
    const cardPrompt = `당신은 인스타그램 카드뉴스 디렉터입니다.
[매장]: ${bizName}, [홍보 대상]: ${prodName}
${isAllMode ? '퐁신제빵소 전 메뉴 라인업을 비교하고 취향별로 추천하는 6컷 카드뉴스로 기획하세요.' : isBundleMode ? '퐁신 시그니처 3종 세트를 사야 하는 3가지 이유와 할인 혜택을 다룬 6컷 카드뉴스로 기획하세요.' : ''}
1:1 정방형 6컷 카드뉴스 데이터를 아래 순수 JSON 형식으로만 작성하세요:
{
  "title": "${prodName} 6컷 카드뉴스",
  "slides": [
    { "slideNumber": 1, "badge": "${isAllMode ? '전 메뉴 총정리' : isBundleMode ? '선물세트 꿀조합' : '오늘의 빵'}", "headline": "구름을 베어 문 듯한\\n${prodName}", "subtext": "한 입 먹자마자 사르르 녹아내리는 극상의 부드러움", "bgColor": "#4338ca", "textColor": "#ffffff" },
    { "slideNumber": 2, "badge": "장인의 원칙", "headline": "무항생제 계란 듬뿍\\n방부제는 0%", "subtext": "우리 아이도 안심하고 먹을 수 있는 착한 재료", "bgColor": "#0f766e", "textColor": "#ffffff" },
    { "slideNumber": 3, "badge": "당일 생산", "headline": "매일 아침 10시\\n갓 구워내는 온기", "subtext": "냉동 생지가 아닌 매장에서 직접 반죽하여 구워냅니다", "bgColor": "#b45309", "textColor": "#ffffff" },
    { "slideNumber": 4, "badge": "꿀조합 팁", "headline": "우유에 콕 찍먹하면\\n여기가 바로 천국", "subtext": "전자레인지 20초 살짝 데우면 갓 구운 맛 그대로!", "bgColor": "#be123c", "textColor": "#ffffff" },
    { "slideNumber": 5, "badge": "메뉴 안내", "headline": "오리지널부터 생크림까지\\n취향대로 골라 즐기기", "subtext": "퐁신제빵소 3대 시그니처 카스테라를 만나보세요", "bgColor": "#334155", "textColor": "#ffffff" },
    { "slideNumber": 6, "badge": "방문 안내", "headline": "시흥 배곧 퐁신제빵소\\n지금 바로 픽업하세요!", "subtext": "네이버 지도에서 '퐁신제빵소' 검색 후 예약 주문 가능", "bgColor": "#1e1b4b", "textColor": "#ffffff" }
  ]
}`;

    // 2-5. 네이버 블로그 스마트블록 원고 프롬프트
    const blogPrompt = `당신은 네이버 인플루언서 1티어 푸드 블로거입니다.
[매장]: ${bizName} (시흥 배곧점)
[홍보 대상]: ${prodName} (${prodPrice})
[상세 정보]: ${prodDesc}
${isAllMode ? '퐁신제빵소의 전체 메뉴를 직접 다 먹어보고 가격과 식감을 솔직하게 비교하는 총정리 꿀팁 블로그 포스팅으로 작성하세요.' : isBundleMode ? '퐁신 시그니처 3종 선물세트를 포장 구매하여 가족들과 함께 나눠먹은 감동 후기로 작성하세요.' : ''}
네이버 스마트블록 상위노출 최적화 포스팅 원고를 작성하세요.
(제목, 서론, 매장 분위기, 메뉴별 비주얼 및 식감 후기, 보관 꿀팁, 매장 위치 및 영업시간 안내 포함)
친근하고 생생한 네이버 블로그 말투(~해요, ~했어요)로 작성하세요.`;

    // 2-6. 🥕 당근마켓 비즈프로필 소식글 프롬프트
    const karrotPrompt = `당신은 당근마켓 비즈프로필 동네 단골 1위 마케터입니다.
[매장]: ${bizName} (시흥 배곧점)
[홍보 대상]: ${prodName} (${prodPrice})
[혜택]: 당근 단골 맺기 시 1,000원 즉시 할인 쿠폰 ${isBundleMode ? '(3종 세트 구매 시 추가 할인)' : ''}
${isAllMode ? '배곧 동네 이웃들에게 오늘 아침 갓 구운 전 메뉴 라인업 입고 소식을 안내하세요.' : isBundleMode ? '배곧 이웃님들을 위한 3종 세트 단골 특별가 이벤트를 안내하세요.' : ''}
배곧 동네 이웃들에게 따뜻하고 친근한 어조(~했어요!, 이웃님들~)로 당근마켓 비즈프로필 소식글을 작성하세요.
(제목에 이모지 포함, 당일 아침 갓 구운 카스테라 소개, 단골 할인 혜택, 위치/무료 주차 안내 포함)
오직 본문 텍스트만 출력하세요.`;

    // 2-7. 🌿 네이버 스마트플레이스 새소식 및 알림 쿠폰 프롬프트
    const placePrompt = `당신은 네이버 스마트플레이스 로컬 마케팅 전문가입니다.
[매장]: ${bizName} (시흥 배곧점)
[홍보 대상]: ${prodName} (${prodPrice})
[혜택]: 네이버 지도 '알림받기' 누르면 1,000원 할인 쿠폰 즉시 지급
${isAllMode ? '네이버 지도 방문객을 위한 퐁신제빵소 전 메뉴 가격표 및 대표 라인업 가이드를 등록하세요.' : isBundleMode ? '가족/지인 선물로 딱 좋은 3종 세트 알림받기 쿠폰 혜택을 등록하세요.' : ''}
네이버 스마트플레이스 새소식 탭에 등록할 매력적인 공지글을 작성하세요.
(제목에 [배곧 맛집 이벤트] 등 임팩트 태그, 무항생제 수제 빵 소개, 알림받기 쿠폰 다운로드 안내, 네이버 예약 픽업 안내 포함)
오직 본문 텍스트만 출력하세요.`;

    // 3. 7대 에셋 동시 병렬 고속 생성 (Promise.all)
    const [detailRes, videoRes, printRes, cardRes, blogRes, karrotRes, placeRes] = await Promise.all([
      callAiCaller(detailPrompt, { model: 'gemini-3.8-flash' }).catch(() => ({ text: `<div class="p-8 max-w-[860px] mx-auto text-center font-sans"><h1>${prodName}</h1><p>${prodDesc}</p></div>` })),
      callAiCaller(videoPrompt, { model: 'gemini-3.8-flash' }).catch(() => ({ text: JSON.stringify({ title: `${prodName} 숏폼`, scenes: [] }) })),
      callAiCaller(printPrompt, { model: 'gemini-3.8-flash' }).catch(() => ({ text: `<div class="p-8 max-w-[800px] mx-auto"><h1>${bizName} 오픈 전단지</h1><p>${prodName}</p></div>` })),
      callAiCaller(cardPrompt, { model: 'gemini-3.8-flash' }).catch(() => ({ text: JSON.stringify({ title: `${prodName} 카드뉴스`, slides: [] }) })),
      callAiCaller(blogPrompt, { model: 'gemini-3.8-flash' }).catch(() => ({ text: `[${bizName}] ${prodName} 솔직 후기!\n\n안녕하세요! 오늘은 배곧의 자랑 ${bizName}에 다녀왔어요.` })),
      callAiCaller(karrotPrompt, { model: 'gemini-3.8-flash' }).catch(() => ({ text: `🍞 배곧 이웃님들! 오늘 아침 갓 구운 ${prodName} 나왔어요 🧡\n\n단골 맺기 시 1,000원 할인!` })),
      callAiCaller(placePrompt, { model: 'gemini-3.8-flash' }).catch(() => ({ text: `[배곧 맛집 혜택] 🌿 네이버 알림받기 시 1,000원 할인 쿠폰 지급!\n\n${bizName} ${prodName}을 만나보세요.` })),
    ]);

    const cleanDetailHtml = toCleanText(detailRes).replace(/```html/g, '').replace(/```/g, '').trim();
    const cleanVideoJson = toCleanText(videoRes).replace(/```json/g, '').replace(/```/g, '').trim();
    const cleanPrintHtml = toCleanText(printRes).replace(/```html/g, '').replace(/```/g, '').trim();
    const cleanCardJson = toCleanText(cardRes).replace(/```json/g, '').replace(/```/g, '').trim();
    const cleanBlogText = toCleanText(blogRes).replace(/```markdown/g, '').replace(/```/g, '').trim();
    const cleanKarrotText = toCleanText(karrotRes).replace(/```markdown/g, '').replace(/```/g, '').trim();
    const cleanPlaceText = toCleanText(placeRes).replace(/```markdown/g, '').replace(/```/g, '').trim();

    // 4. auto_assets 레코드 7종 구성
    const now = new Date().toISOString();
    const timestamp = Date.now();
    const createdAssets = [
      {
        id: `ast_detail_${timestamp}`,
        business_id: business.id || businessId,
        type: 'detail',
        title: `[상세페이지] ${bizName} - ${prodName} (860px)`,
        spec: '860px 모바일 최적화 이커머스 상세페이지 HTML',
        component_code: cleanDetailHtml,
        preview_url: imgUrl,
        status: 'ready',
        created_at: now,
      },
      {
        id: `ast_video_${timestamp}`,
        business_id: business.id || businessId,
        type: 'video',
        title: `[숏폼] ${bizName} - ${prodName} 15초 릴스`,
        spec: '9:16 모바일 세로형 15초 숏폼 릴스/쇼츠 시나리오',
        component_code: cleanVideoJson,
        preview_url: imgUrl,
        status: 'ready',
        created_at: now,
      },
      {
        id: `ast_print_${timestamp}`,
        business_id: business.id || businessId,
        type: 'print',
        title: `[인쇄물] ${bizName} - ${prodName} 오픈 전단지`,
        spec: 'A4 상업 인쇄용 300 DPI 규격 전단지 HTML',
        component_code: cleanPrintHtml,
        preview_url: imgUrl,
        status: 'ready',
        created_at: now,
      },
      {
        id: `ast_card_${timestamp}`,
        business_id: business.id || businessId,
        type: 'card',
        title: `[카드뉴스] ${bizName} - ${prodName} 6컷`,
        spec: '1:1 정방형 6컷 인스타그램 캐러셀 피드',
        component_code: cleanCardJson,
        preview_url: imgUrl,
        status: 'ready',
        created_at: now,
      },
      {
        id: `ast_blog_${timestamp}`,
        business_id: business.id || businessId,
        type: 'blog',
        title: `[블로그] ${bizName} - ${prodName} 스마트블록`,
        spec: '네이버 블로그 스마트블록 상위노출 최적화 원고',
        component_code: cleanBlogText,
        preview_url: imgUrl,
        status: 'ready',
        created_at: now,
      },
      {
        id: `ast_karrot_${timestamp}`,
        business_id: business.id || businessId,
        type: 'karrot',
        title: `[당근마켓] ${bizName} - ${prodName} 소식글`,
        spec: '당근마켓 비즈프로필 & 동네생활 피드 소식 규격',
        component_code: cleanKarrotText,
        preview_url: imgUrl,
        status: 'ready',
        created_at: now,
      },
      {
        id: `ast_place_${timestamp}`,
        business_id: business.id || businessId,
        type: 'naver_place',
        title: `[스마트플레이스] ${bizName} - ${prodName} 새소식/쿠폰`,
        spec: '네이버 지도 스마트플레이스 새소식 및 쿠폰 규격',
        component_code: cleanPlaceText,
        preview_url: imgUrl,
        status: 'ready',
        created_at: now,
      },
    ];

    // 5. auto_assets 일괄 INSERT
    await insertRows('auto_assets', createdAssets);

    const elapsedSeconds = ((Date.now() - startTime) / 1000).toFixed(1);

    return NextResponse.json({
      success: true,
      product: { id: product.id, name: prodName },
      business: { id: business.id, name: bizName },
      elapsedSeconds,
      count: createdAssets.length,
      assets: createdAssets.map((a) => ({
        id: a.id,
        type: a.type,
        title: a.title,
        spec: a.spec,
      })),
      libraryUrl: '/library',
      message: `🎉 [${prodName}] 7대 마케팅 에셋이 ${elapsedSeconds}초 만에 일괄 생성되어 에셋 보관함에 안전하게 저장되었습니다!`,
    });
  } catch (error: any) {
    console.error('Bundle generate error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
