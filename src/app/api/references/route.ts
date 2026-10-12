import { NextResponse } from 'next/server';
import { executeSQL, queryTable, insertRows, callAiCaller } from '@/lib/egdesk-helpers';

// 🍞 베이커리/디저트 업종 기본 AI 추천 큐레이션 레퍼런스 프리셋
const CURATED_BENCHMARKS = [
  {
    id: 'curated-1',
    channel: 'youtube',
    media_type: 'video',
    title: '조회수 120만! 대만 카스테라 커팅 탱글탱글 ASMR 숏폼',
    url: 'https://youtube.com/shorts/TaiwanCastellaJiggle',
    thumbnail_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80',
    tags: ['유튜브쇼츠', '카스테라', 'ASMR', '탱글탱글', '식감자극'],
    analysis: {
      hook: '단 0.5초 만에 시선 강탈하는 탱글한 흔들림 & 김 모락모락 모션',
      structure: '0~2초: 흔들림 훅 ➔ 3~8초: 생크림 주입 클로즈업 ➔ 9~15초: 매장 위치 & 당일 한정 수량 CTA',
      bgm_tempo: '경쾌한 로우파이 팝 (118 BPM)',
      color_palette: ['#FFD166', '#FFF3B0', '#333333'],
      marketing_tip: '첫 1초에 빵을 톡톡 쳤을 때 푸딩처럼 흔들리는 시각적 쾌감을 극대화하세요.'
    }
  },
  {
    id: 'curated-2',
    channel: 'instagram',
    media_type: 'image',
    title: '저장수 3.8만 대박난 베이커리 6컷 캐러셀 카드뉴스',
    url: 'https://instagram.com/p/BakeryStoryTellingCard',
    thumbnail_url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&auto=format&fit=crop&q=80',
    tags: ['인스타릴스', '카드뉴스', '스토리텔링', '동네빵집', '수제카스테라'],
    analysis: {
      hook: '프랜차이즈 빵 대신 동네 수제 카스테라를 찾는 3가지 이유',
      structure: '1컷: 질문형 훅 ➔ 2~4컷: 무방부제/신선한 계란 공정 ➔ 5컷: 보관 꿀팁 ➔ 6컷: 오늘 나온 빵 예약 안내',
      bgm_tempo: '어쿠스틱 감성 기타 멜로디',
      color_palette: ['#F4A261', '#E76F51', '#264653'],
      marketing_tip: '가격보다 장인의 정성과 아침마다 직접 굽는 신선함을 감성 톤으로 전달합니다.'
    }
  },
  {
    id: 'curated-3',
    channel: 'naver_blog',
    media_type: 'article',
    title: '네이버 스마트블록 1위 노출: 배곧 빵지순례 내돈내산 감성 리뷰',
    url: 'https://blog.naver.com/foodie_review/castella_paradise',
    thumbnail_url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop&q=80',
    tags: ['네이버블로그', '플레이스상위노출', '지역키워드', '배곧맛집', '선물추천'],
    analysis: {
      hook: '[시흥 배곧] 빵순이가 인정한 인생 카스테라 발견! 포장 패키지까지 완벽',
      structure: '외관/위치 안내 ➔ 시그니처 3종 실물 컷 ➔ 단면 자르는 움짤(GIF) ➔ 보관법 및 예약 꿀팁',
      bgm_tempo: '해당 없음 (가독성 높은 폰트와 볼드 강조)',
      color_palette: ['#E9C46A', '#2A9D8F', '#264653'],
      marketing_tip: '네이버 플레이스 지도 링크와 스마트스토어 주문 링크를 본문 중단 및 하단에 2회 자연스럽게 배치합니다.'
    }
  },
  {
    id: 'curated-4',
    channel: 'smartstore',
    media_type: 'detail',
    title: '스마트스토어 디저트 카테고리 1위! 구매전환율 8.4% 상세페이지',
    url: 'https://smartstore.naver.com/best_dessert/products/castella_master',
    thumbnail_url: 'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=600&auto=format&fit=crop&q=80',
    tags: ['상세페이지', '스마트스토어', '전환율8%', '860px', '선물세트'],
    analysis: {
      hook: '당일 반죽, 당일 구움 원칙! 갓 구운 대만 카스테라를 내일 아침 식탁에서',
      structure: '1. 인트로 훅 ➔ 2. 안심 원재료 ➔ 3. 3대 맛 비교 ➔ 4. 후기 5,000개 모음 ➔ 5. 안심 에어캡 패키징 ➔ 6. FAQ',
      bgm_tempo: '해당 없음',
      color_palette: ['#F77F00', '#D62828', '#003049'],
      marketing_tip: '택배 배송 시 부서지지 않는 특수 안심 에어팩 완충재 포장 사진을 전면에 배치하여 고객 불안을 해소합니다.'
    }
  },
  {
    id: 'curated-5',
    channel: 'print',
    media_type: 'print',
    title: '매출 30% 끌어올린 오픈 기념 전단지 & 픽업 명함 세트',
    url: 'https://example.com/print/bakery_open_flyer',
    thumbnail_url: 'https://images.unsplash.com/photo-1517433670267-08bbd4be890f?w=600&auto=format&fit=crop&q=80',
    tags: ['전단지', '명함', '오픈이벤트', '쿠폰동봉', '지역타겟팅'],
    analysis: {
      hook: '선착순 100명! 아메리카노 1,000원 + 오리지널 카스테라 1,000원 할인 쿠폰',
      structure: '상단: 대형 빵 비주얼 ➔ 중단: 3대 시그니처 소개 ➔ 하단: 절취선 할인 쿠폰 & 네이버 지도 QR코드',
      bgm_tempo: '해당 없음',
      color_palette: ['#E63946', '#F1FAEE', '#1D3557'],
      marketing_tip: '전단지 하단에 버리지 못하게 만드는 1,000원 즉시할인 쿠폰 절취선을 넣고 카카오 채널 추가 QR을 포함합니다.'
    }
  }
];

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || 'all';

    // DB에 등록된 사용자의 레퍼런스 조회
    let userReferences: any[] = [];
    try {
      const res = await queryTable('auto_references', { limit: 50 });
      if (res && res.rows) {
        userReferences = res.rows;
      }
    } catch (e) {
      console.warn('Could not query auto_references:', e);
    }

    return NextResponse.json({
      success: true,
      user_references: userReferences,
      curated_benchmarks: CURATED_BENCHMARKS,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { url, title, channel, notes, user_id, business_id } = body;

    if (!url) {
      return NextResponse.json({ success: false, error: 'URL is required' }, { status: 400 });
    }

    // AI를 통한 레퍼런스 DNA 자동 분석
    let aiAnalysis: any = {
      hook: '사용자 지정 벤치마크 콘텐츠',
      structure: '인트로 ➔ 바디 ➔ 콜투액션',
      bgm_tempo: '경쾌한 템포 (120 BPM)',
      color_palette: ['#F39C12', '#2C3E50', '#ECF0F1'],
      marketing_tip: '타깃 고객의 호기심을 유발하는 시각적 훅을 전면에 내세우세요.'
    };

    try {
      const prompt = `다음 마케팅 레퍼런스 링크 또는 콘텐츠를 분석하여 성공 요인 DNA를 JSON 형식으로만 추출해줘.
URL: ${url}
제목/설명: ${title || notes || '마케팅 레퍼런스'}
채널: ${channel || '기타'}

반드시 아래 JSON 형식으로만 한국어로 응답해:
{
  "hook": "핵심 훅 문구 및 시선 강탈 요소",
  "structure": "전체 콘텐츠 진행 구성",
  "bgm_tempo": "권장 BGM 분위기 및 템포",
  "color_palette": ["#색상코드1", "#색상코드2", "#색상코드3"],
  "marketing_tip": "소상공인이 바로 적용할 수 있는 1순위 실전 팁"
}`;

      const aiRes = await callAiCaller(prompt, 'gemini-3.8-flash');
      if (aiRes) {
        const jsonMatch = aiRes.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          aiAnalysis = JSON.parse(jsonMatch[0]);
        }
      }
    } catch (aiErr) {
      console.warn('AI analysis fallback used:', aiErr);
    }

    // DB에 레퍼런스 저장
    const refData = {
      user_id: user_id || 'usr_pongshin_master',
      business_id: business_id || 'biz_pongshin_001',
      channel: channel || 'custom',
      media_type: 'reference',
      title: title || `${channel?.toUpperCase() || '마케팅'} 벤치마크 레퍼런스`,
      url: url,
      thumbnail_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80',
      tags_json: JSON.stringify(['벤치마크', channel || 'custom', '마케팅']),
      metrics_json: JSON.stringify(aiAnalysis),
      notes: notes || '',
    };

    await insertRows('auto_references', [refData]);

    return NextResponse.json({
      success: true,
      reference: refData,
      analysis: aiAnalysis,
      message: '레퍼런스가 성공적으로 등록 및 분석되었습니다.'
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
