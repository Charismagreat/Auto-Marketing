import { NextResponse } from 'next/server';
import { callAiCaller, callAiGenerateImage, insertRows } from '@/lib/egdesk-helpers';

function toText(res: any): string {
  if (typeof res === 'string') return res;
  if (res && typeof res === 'object') {
    return res.text || res.content || '';
  }
  return String(res || '');
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      type, // 'detail' | 'print' | 'video' | 'card' | 'tweak' | 'blog' | 'karrot' | 'naver_place'
      prompt,
      product,
      products,
      mode, // 'single' | 'all' | 'bundle'
      business,
      printFormat, // 'card' (명함), 'flyer' (전단지), 'banner' (X배너)
      existingCode,
      chatMessage,
    } = body;

    const isAllMode = mode === 'all' || product?.is_all;
    const isBundleMode = mode === 'bundle' || product?.is_bundle;

    // 상품 요약 텍스트 구성
    let targetName = product?.name || '퐁신 오리지널 대만 카스테라';
    let targetPrice = typeof product?.price === 'number' ? `${product.price.toLocaleString()}원` : String(product?.price || '11,000원');
    let targetDesc = product?.description || '매일 아침 갓 구워내는 구름처럼 부드러운 정통 대만 수제 카스테라';

    if (isAllMode && Array.isArray(products) && products.length > 0) {
      targetName = `${business?.name || '퐁신제빵소'} 전 메뉴 라인업 (총 ${products.length}종)`;
      targetPrice = '전 품목 및 세트 구성';
      targetDesc = products.map((p, i) => `${i + 1}. ${p.name} (${Number(p.price || 0).toLocaleString()}원): ${p.description || ''}`).join('\n');
    } else if (isBundleMode && Array.isArray(products) && products.length >= 2) {
      const topSet = products.slice(0, 3);
      targetName = `[세트 기획] 퐁신 시그니처 베스트 세트 (${topSet.map((p) => p.name).join(' + ')})`;
      const sumPrice = topSet.reduce((acc, p) => acc + (Number(p.price) || 0), 0);
      const discount = Math.max(sumPrice - 2000, 10000);
      targetPrice = `${discount.toLocaleString()}원 (2,000원 즉시 할인 세트가)`;
      targetDesc = `인기 메뉴 ${topSet.length}종을 한 번에 만나는 선물 패키지 (정가 ${sumPrice.toLocaleString()}원 ➔ 혜택가 ${discount.toLocaleString()}원)`;
    }

    // 1. 대화형 핀셋 수정 (Tweak)
    if (type === 'tweak') {
      const tweakPrompt = `당신은 웹 마케팅 프론트엔드 최고 전문가입니다.
사용자가 기존 마케팅 에셋 코드에 대해 자연어로 수정을 요청했습니다.
요청 사항을 완벽하게 반영하여 완성된 HTML/Tailwind CSS 코드를 반환하세요.

[기존 코드]:
${existingCode || ''}

[사용자 수정 요청]:
${chatMessage}

규칙:
1. 기존 디자인의 레이아웃과 감성을 유지하되, 요청된 부분(텍스트, 색상, 배치 등)을 정교하게 핀셋 수정할 것.
2. 부가 설명 없이 오직 코드 블록(HTML/Tailwind)만 반환하거나 깔끔한 마크다운 코드블록(\`\`\`html)으로 감싸서 출력할 것.
3. 한글로 작성할 것.`;

      const tweaked = await callAiCaller(tweakPrompt, 'gemini-3.8-flash');
      const cleanCode = toText(tweaked).replace(/```html/g, '').replace(/```/g, '').trim();

      return NextResponse.json({
        success: true,
        code: cleanCode,
        message: '요청하신 수정 사항이 실시간으로 반영되었습니다!'
      });
    }

    // 2. 쇼핑몰 860px 상세페이지 생성
    if (type === 'detail') {
      const detailPrompt = `당신은 쿠팡과 네이버 스마트스토어에서 100억원 이상의 매출을 기록한 1티어 이커머스 상세페이지 기획자이자 웹 디자이너입니다.
다음 상품과 매장 정보를 기반으로 스마트스토어/쿠팡 표준 규격인 860px 모바일 최적화 상세페이지 HTML 코드를 Tailwind CSS로 작성해 주세요.

[매장명]: ${business?.name || '퐁신제빵소'}
[홍보 대상]: ${targetName}
[가격]: ${targetPrice}
[상세 정보]: ${targetDesc}
[시그니처 특징]: 방부제 무첨가, 신선한 무항생제 계란 듬뿍, 당일 반죽/당일 생산
${isAllMode ? '반드시 퐁신제빵소의 전체 메뉴 라인업의 사진, 단면, 가격, 맛 특징 그리드와 세트 주문 혜택을 6대 섹션 중 메뉴 쇼케이스에 풍성하게 구성하세요.' : isBundleMode ? '반드시 3종 세트 구성품 언박싱 비주얼, 2,000원 즉시 할인 혜택, 선물 패키지 박스를 집중 조명하세요.' : ''}

반드시 다음 6대 필수 섹션을 포함하는 860px 너비(max-w-[860px] mx-auto)의 모던한 HTML 구조를 작성하세요:
1. [훅 인트로]: 침샘을 자극하는 타이틀, 탱글한 식감 강조, 먹음직스러운 비주얼
2. [장인의 비밀]: 좋은 계란과 우유, 방부제 0%, 정직한 베이킹 공정
3. [메뉴 쇼케이스]: ${isAllMode ? '전 메뉴 라인업 쇼케이스 그리드' : isBundleMode ? '3종 콤보 세트 구성 언박싱' : '3가지 맛(오리지널, 생크림 폭탄, 체다치즈)의 단면과 특징'}
4. [생생 후기]: 만족도 4.9/5점, 고객들의 리얼 찬사 리뷰 카드 3개
5. [맛있게 먹는 꿀팁]: 우유/커피 페어링, 전자레인지 20초 데우기, 냉장/냉동 보관법
6. [안심 배송 & FAQ]: 특수 에어 완충재 포장, 당일 발송 안내, 보관 기한 안내

규칙:
- 부가적인 인사말 없이 오직 HTML 코드(\`\`\`html)만 출력하세요.
- Tailwind CSS 클래스를 적극 활용하여 잡지처럼 유려하고 깔끔한 비주얼로 디자인하세요.
- 대표 이미지 URL은 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80' 등 고화질 푸드 사진을 활용하세요.`;

      const detailRes = await callAiCaller(detailPrompt, 'gemini-3.8-flash');
      const cleanHtml = toText(detailRes).replace(/```html/g, '').replace(/```/g, '').trim();

      return NextResponse.json({
        success: true,
        html: cleanHtml,
        sections: ['인트로 훅', '장인의 비밀', isAllMode ? '전 메뉴 라인업' : isBundleMode ? '3종 세트 언박싱' : '메뉴 쇼케이스', '리얼 리뷰', '맛있게 먹는 팁', '배송 안내'],
      });
    }

    // 3. 인쇄물 (명함, 전단지, X배너) 생성
    if (type === 'print') {
      const formatName = printFormat === 'card' ? '명함 (90x50mm)' : printFormat === 'banner' ? 'X배너 (600x1800mm 입간판)' : 'A4 오픈 전단지 (210x297mm)';
      
      const printPrompt = `당신은 오프라인 매장 인쇄물 전문 시각 디자이너입니다.
다음 매장 정보를 바탕으로 인쇄소 실출력 및 모바일 전송이 가능한 [${formatName}] HTML 코드를 Tailwind CSS로 작성하세요.

[매장명]: ${business?.name || '퐁신제빵소'}
[카테고리]: ${business?.category || '베이커리/디저트'}
[주소]: ${business?.address || '경기 시흥시 서울대학로 59-69 배곧테크노밸리 1층'}
[연락처]: ${business?.phone || '0507-1234-5678'}
[홍보 대상]: ${targetName} (${targetPrice})
[상세 정보]: ${targetDesc}
[포맷]: ${printFormat}

인쇄물 구성 요소:
- 눈에 확 들어오는 강렬한 메인 카피와 매장 로고
- ${isAllMode ? '★ 전체 메뉴판: 매장의 전 메뉴 이름, 가격, 대표 비주얼을 깔끔한 메뉴판 테이블/그리드로 배치' : isBundleMode ? '★ 3종 세트 기획: 3대 메뉴 구성 및 2,000원 할인 세트가 강조' : '대표 메뉴 사진과 가격'}
- 오픈 기념 선착순 이벤트 / 1,000원 할인 쿠폰 박스 (전단지/배너인 경우)
- 네이버 지도 QR코드 자리 및 위치 안내

규칙:
- ${printFormat === 'card' ? '가로세로 비율 약 9:5의 콤팩트하고 고급스러운 명함 카드' : printFormat === 'banner' ? '세로로 긴 1:3 비율의 시인성 높은 X배너 디자인' : 'A4 비율의 전단지 레이아웃'}
- 부가 설명 없이 오직 완성된 HTML/Tailwind 코드만 출력할 것.`;

      const printRes = await callAiCaller(printPrompt, 'gemini-3.8-flash');
      const cleanHtml = toText(printRes).replace(/```html/g, '').replace(/```/g, '').trim();

      return NextResponse.json({
        success: true,
        html: cleanHtml,
        format: printFormat,
      });
    }

    // 4. 15초 숏폼 비디오 시나리오 생성
    if (type === 'video') {
      const videoPrompt = `당신은 틱톡/릴스/유튜브 쇼츠에서 수백만 뷰를 기록한 숏폼 전문 디렉터입니다.
다음 상품의 15초 숏폼 비디오 구성안을 JSON 형식으로 작성해 주세요.

[매장명]: ${business?.name || '퐁신제빵소'}
[홍보 대상]: ${targetName}
[세부 정보]: ${targetDesc}
${isAllMode ? '오늘 뭐 먹지? 퐁신제빵소 전 메뉴 라인업 랭킹과 취향별 추천 숏폼으로 기획하세요.' : isBundleMode ? '단품 고민 끝! 3종 세트로 사야 2,000원 이득! 꿀조합 선물세트 숏폼으로 기획하세요.' : ''}

반드시 아래 JSON 형식으로만 한국어로 응답하세요:
{
  "title": "${targetName} 15초 릴스",
  "totalDuration": 15,
  "bgm": "경쾌한 어쿠스틱 팝 (120 BPM)",
  "scenes": [
    {
      "sceneNumber": 1,
      "timeRange": "0~3초",
      "visualDescription": "두 손으로 갓 구운 대만 카스테라를 톡톡 쳤을 때 푸딩처럼 탱글탱글 요동치는 극초근접 샷",
      "subtitle": "${isAllMode ? '퐁신제빵소 전 메뉴 총출동!' : isBundleMode ? '단품 고민 끝! 3종 세트 꿀조합' : '이 탱글함 실화? 구름을 베어 문 카스테라!'}",
      "narration": "손끝에서 느껴지는 미친 탄력! 매일 아침 구워내는 ${business?.name || '퐁신제빵소'} 카스테라입니다.",
      "cameraMotion": "Slow Motion Zoom In"
    },
    {
      "sceneNumber": 2,
      "timeRange": "3~8초",
      "visualDescription": "칼로 반을 쪼개자 김이 모락모락 나며 꽉 찬 부드러운 속살이 드러나는 장면",
      "subtitle": "당일 반죽, 당일 생산 원칙! 한 입 먹자마자 사르르 녹아내려요",
      "narration": "방부제는 0%! 무항생제 계란 듬뿍 넣어 한 입 베어 물면 입안 가득 사르르 녹아내려요.",
      "cameraMotion": "Pan Right"
    },
    {
      "sceneNumber": 3,
      "timeRange": "8~12초",
      "visualDescription": "새하얀 우유에 푹 찍어 먹으며 아이와 가족이 활짝 웃는 따뜻한 장면",
      "subtitle": "${isBundleMode ? '3종 묶음 구매 시 2,000원 즉시 할인!' : '우유에 콕 찍먹하면 극락! 아이들 안심 간식 1등'}",
      "narration": "시원한 우유에 찍어 먹으면 여기가 바로 천국! 아이들 안심 간식으로도 완벽합니다.",
      "cameraMotion": "Focus Pull"
    },
    {
      "sceneNumber": 4,
      "timeRange": "12~15초",
      "visualDescription": "퐁신제빵소 패키지 상자와 위치 텍스트 오버레이, 네이버 예약 안내",
      "subtitle": "시흥 배곧 퐁신제빵소에서 오늘 구운 카스테라를 만나보세요!",
      "narration": "배곧 ${business?.name || '퐁신제빵소'}에서 오늘 만나요! 네이버 예약 시 즉시 픽업 가능!",
      "cameraMotion": "Static with Bounce CTA"
    }
  ]
}`;

      const videoRes = await callAiCaller(videoPrompt, 'gemini-3.8-flash');
      const videoText = toText(videoRes);
      let scriptJson: any = null;
      try {
        const jsonMatch = videoText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          scriptJson = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.warn('Video JSON parse error:', e);
      }

      return NextResponse.json({
        success: true,
        script: scriptJson,
      });
    }

    // 5. 네이버 블로그 SEO 포스팅 생성
    if (type === 'blog') {
      const blogPrompt = `당신은 네이버 스마트블록과 뷰(VIEW) 탭 1위 노출을 전문으로 하는 파워블로거이자 카피라이터입니다.
다음 매장과 상품 정보를 바탕으로 검색 방문자들을 단골 고객으로 만드는 네이버 블로그 롱폼 포스팅을 작성해 주세요.

[매장명]: ${business?.name || '퐁신제빵소'}
[카테고리]: ${business?.category || '베이커리/디저트'}
[위치]: ${business?.address || '경기 시흥시 서울대학로 59-69 배곧테크노밸리 1층'}
[홍보 대상]: ${targetName} (${targetPrice})
[상세 정보]: ${targetDesc}
[핵심 키워드]: 시흥 배곧 맛집, 배곧 빵집, 배곧 디저트, 대만 카스테라, 퐁신제빵소, 배곧 선물세트
${isAllMode ? '퐁신제빵소의 전 메뉴를 직접 다 먹어보고 가격과 식감을 솔직하게 비교하는 총정리 꿀팁 블로그 포스팅으로 작성하세요.' : isBundleMode ? '퐁신 시그니처 3종 선물세트를 포장 구매하여 가족들과 함께 나눠먹은 감동 후기로 작성하세요.' : ''}

포스팅 구성:
1. [제목]: 클릭률(CTR)을 폭발시키는 매력적인 타이틀
2. [도입부]: 빵 굽는 냄새에 이끌려 들어간 생생한 방문 계기
3. [본문 1 - 매장 분위기]: 매장 위치, 깔끔한 인테리어, 빵 나오는 시간표 안내
4. [본문 2 - ${isAllMode ? '전 메뉴 라인업 실물 컷 및 비교' : isBundleMode ? '3종 선물세트 언박싱 및 가성비 혜택' : '시그니처 메뉴 실물 컷 설명'}]: 카스테라 단면 자를 때의 부드러움과 풍미 묘사
5. [본문 3 - 맛있게 먹는 꿀팁]: 우유 찍먹, 에어프라이어 굽기, 선물 포장 안내
6. [마무리]: 지도 위치 첨부 안내, 네이버 예약 링크 및 재방문 의사 200% 강조

반드시 완성된 마크다운 포맷으로 가독성 높게 작성하세요.`;

      const blogRes = await callAiCaller(blogPrompt, 'gemini-3.8-flash');
      return NextResponse.json({
        success: true,
        content: toText(blogRes),
      });
    }

    // 6. 인스타그램 1:1 카드뉴스 6컷 캐러셀 생성
    if (type === 'card') {
      const cardPrompt = `당신은 인스타그램 저장수 10만 이상을 달성하는 바이럴 카드뉴스 전문 디렉터입니다.
다음 상품을 주제로 인스타그램 1:1 비율(정사각형) 6컷 카드뉴스 기획안을 JSON으로 작성해 주세요.

[매장명]: ${business?.name || '퐁신제빵소'}
[홍보 대상]: ${targetName}
[세부 정보]: ${targetDesc}
${isAllMode ? '퐁신제빵소 전 메뉴 라인업을 비교하고 취향별로 추천하는 6컷 카드뉴스로 기획하세요.' : isBundleMode ? '퐁신 시그니처 3종 세트를 사야 하는 3가지 이유와 2,000원 할인 혜택을 다룬 6컷 카드뉴스로 기획하세요.' : ''}

반드시 아래 JSON 형식으로만 한국어로 응답하세요:
{
  "theme": "베이커리 감성 옐로우 & 브라운",
  "slides": [
    {
      "slideNumber": 1,
      "badge": "${isAllMode ? '전 메뉴 총정리' : isBundleMode ? '선물세트 꿀조합' : '🚨 빵순이 필수 저장'}",
      "headline": "프랜차이즈 빵 말고\\n동네 수제 카스테라를 찾는 이유",
      "subtext": "한 입 먹자마자 구름 속에 들어간 것 같은 퐁신함!",
      "bgColor": "#FFF9E6",
      "textColor": "#78350F"
    },
    {
      "slideNumber": 2,
      "badge": "POINT 1",
      "headline": "매일 아침 갓 구움!\\n방부제 0% 원칙",
      "subtext": "신선한 무항생제 계란을 아낌없이 넣어 당일 반죽하고 당일 구워냅니다.",
      "bgColor": "#FEF3C7",
      "textColor": "#92400E"
    },
    {
      "slideNumber": 3,
      "badge": "POINT 2",
      "headline": "푸딩처럼 탱글탱글\\n구름 같은 식감",
      "subtext": "손끝으로 톡톡 치면 흔들리는 극강의 부드러움. 씹을 필요 없이 사르르 녹아내려요.",
      "bgColor": "#FFFBEB",
      "textColor": "#B45309"
    },
    {
      "slideNumber": 4,
      "badge": "POINT 3",
      "headline": "${isAllMode ? '전 메뉴 라인업 총집합!' : isBundleMode ? '3종 세트 2,000원 할인' : '취향 저격 3대 맛!\\n골라 먹는 재미'}",
      "subtext": "${isBundleMode ? '오리지널 + 치즈 + 생크림 세트로 알차게 즐기세요' : '담백한 오리지널부터 달콤한 생크림 폭탄, 단짠 체다치즈까지!'}",
      "bgColor": "#FEF3C7",
      "textColor": "#78350F"
    },
    {
      "slideNumber": 5,
      "badge": "꿀팁 대방출",
      "headline": "카스테라 200% 더\\n맛있게 즐기는 법",
      "subtext": "차가운 우유에 찍먹하면 극락! 냉동실에 얼려 먹으면 부드러운 아이스크림 케이크로 변신!",
      "bgColor": "#FFF9E6",
      "textColor": "#92400E"
    },
    {
      "slideNumber": 6,
      "badge": "오늘 나온 빵 예약",
      "headline": "시흥 배곧 퐁신제빵소\\n지금 바로 예약하세요!",
      "subtext": "당일 한정 수량 생산! 프로필 링크에서 네이버 예약 시 즉시 픽업 가능합니다.",
      "bgColor": "#4F46E5",
      "textColor": "#FFFFFF"
    }
  ]
}`;

      const cardRes = await callAiCaller(cardPrompt, 'gemini-3.8-flash');
      const cardText = toText(cardRes);
      let cardJson: any = null;
      try {
        const jsonMatch = cardText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          cardJson = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.warn('Card JSON parse error:', e);
      }

      return NextResponse.json({
        success: true,
        cards: cardJson,
      });
    }

    // 6. 🥕 당근마켓 비즈프로필 & 동네생활 소식글 생성
    if (type === 'karrot') {
      const { template = 'fresh' } = body;
      
      const templateGuide =
        template === 'coupon'
          ? '선착순 단골 맺기 1,000원 할인 쿠폰 증정 이벤트'
          : template === 'rainy'
          ? '비 오는 날 방문 고객님께 시원한 우유 1팩 무료 증정 이벤트'
          : '매일 아침 10시 갓 구워낸 따끈따끈한 카스테라 오픈 소식';

      const karrotPrompt = `당신은 당근마켓 비즈프로필과 동네생활에서 수많은 단골을 보유한 동네 빵집 마케팅 최고수입니다.
다음 매장과 상품 정보를 바탕으로 당근마켓 이웃 주민들의 마음을 사로잡는 친근하고 따뜻한 [당근마켓 비즈프로필 소식글]을 작성해 주세요.

[매장명]: ${business?.name || '퐁신제빵소'} (시흥 배곧점)
[대표 상품 및 라인업]: ${targetName} (${targetPrice})
[세부 정보]: ${targetDesc}
[매장 위치]: ${business?.road_address || business?.address || '경기 시흥시 서울대학로 59-69 배곧테크노밸리 1층'}
[이벤트 테마]: ${templateGuide}
${isAllMode ? '배곧 동네 이웃들에게 오늘 아침 갓 구운 전 메뉴 라인업 입고 소식을 안내하세요.' : isBundleMode ? '배곧 이웃님들을 위한 3종 세트 단골 특별가 이벤트를 안내하세요.' : ''}

작성 규칙:
1. 제목: 당근마켓 피드에서 이웃들이 바로 눌러보고 싶게 이모지를 곁들인 친근하고 눈길 끄는 제목
2. 본문:
   - "안녕하세요 배곧 이웃님들! 퐁신제빵소입니다 ☺️" 로 시작
   - 오늘 아침 정성스럽게 무항생제 계란으로 구워낸 빵 이야기 (방부제 0%, 아이들도 안심)
   - ${templateGuide} 상세 혜택 안내
   - [단골 혜택]: "당근에서 [단골 맺기] 눌러주시고 매장 방문 시 1,000원 할인해 드려요!"
   - 위치 및 주차 안내 (배곧테크노밸리 지하 무료 주차 가능)
3. 부가 설명 없이 오직 완성된 당근마켓 소식글 본문 텍스트만 출력하세요.`;

      const karrotRes = await callAiCaller(karrotPrompt, 'gemini-3.8-flash');
      const cleanContent = toText(karrotRes).replace(/```markdown/g, '').replace(/```/g, '').trim();

      return NextResponse.json({
        success: true,
        content: cleanContent,
        template,
      });
    }

    // 7. 🌿 네이버 스마트플레이스 새소식 & 알림받기 쿠폰 소식 생성
    if (type === 'naver_place') {
      const { template = 'coupon' } = body;

      const templateGuide =
        template === 'coupon'
          ? '네이버 지도 플레이스 [알림받기] 설정 시 현장 즉시 1,000원 할인 쿠폰 증정'
          : template === 'time_sale'
          ? '평일 오후 2~5시 방문 고객 대상 갓 구운 빵 1+1 타임어택 세일'
          : '매일 아침 10시 당일 반죽 무항생제 계란 갓 구운 카스테라 오픈 소식';

      const placePrompt = `당신은 네이버 스마트플레이스 상위 1% 매장을 만든 로컬 SEO 및 마케팅 전문가입니다.
다음 매장과 상품 정보를 바탕으로, 네이버 지도 검색 고객의 시선을 사로잡고 '알림받기' 및 '길찾기/예약'으로 직결되는 [네이버 스마트플레이스 새소식]을 작성해 주세요.

[매장명]: ${business?.name || '퐁신제빵소'} (시흥 배곧점)
[대표 상품 및 라인업]: ${targetName} (${targetPrice})
[세부 정보]: ${targetDesc}
[매장 주소]: ${business?.road_address || business?.address || '경기 시흥시 서울대학로 59-69 배곧테크노밸리 1층'}
[이벤트 테마]: ${templateGuide}
${isAllMode ? '네이버 지도 방문객을 위한 퐁신제빵소 전 메뉴 가격표 및 대표 라인업 가이드를 등록하세요.' : isBundleMode ? '가족/지인 선물로 딱 좋은 3종 세트 알림받기 쿠폰 혜택을 등록하세요.' : ''}

작성 규칙:
1. 제목: 네이버 플레이스 소식 탭에서 눈에 띄는 대괄호 태그와 이모지가 들어간 임팩트 있는 한 줄
2. 본문 구성:
   - 따뜻한 첫인사 및 매장 소개
   - 방부제 0%, 무항생제 신선란 듬뿍 당일 생산 카스테라 시그니처 매력 어필
   - [${templateGuide}] 상세 참여 방법 안내
   - "네이버 플레이스에서 '알림받기'를 누르시면 쿠폰함에 바로 쏙 들어옵니다 🎟️"
   - 주차 안내 (배곧테크노밸리 지하 무료 주차 완비) 및 네이버 예약 픽업 안내
3. 부가 설명 없이 오직 완성된 네이버 스마트플레이스 새소식 본문 텍스트만 출력하세요.`;

      const placeRes = await callAiCaller(placePrompt, 'gemini-3.8-flash');
      const cleanContent = toText(placeRes).replace(/```markdown/g, '').replace(/```/g, '').trim();

      return NextResponse.json({
        success: true,
        content: cleanContent,
        template,
      });
    }

    return NextResponse.json({ success: false, error: 'Unknown type' }, { status: 400 });
  } catch (error: any) {
    console.error('Generate API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
