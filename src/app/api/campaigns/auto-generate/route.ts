import { NextRequest, NextResponse } from 'next/server';
import { setupDatabase, queryTable, insertRows } from '@/lib/setup-db';
import { callAiCaller } from '@/lib/egdesk-helpers';

export async function POST(req: NextRequest) {
  try {
    await setupDatabase();
    const body = await req.json().catch(() => ({}));
    const businessId = body.businessId || 'biz_pongshin_baegot';

    // 1. 매장 및 상품 정보 로드
    const [bizResult, prodResult] = await Promise.all([
      queryTable('auto_businesses', { limit: 1 }),
      queryTable('auto_products', { limit: 5 }),
    ]);

    const business = bizResult.rows?.[0] || {
      id: businessId,
      name: '퐁신제빵소',
      category: '베이커리/디저트',
      address: '경기 시흥시 서울대학로 59-69 배곧테크노밸리 1층',
    };
    const products = prodResult.rows || [
      { name: '퐁신 오리지널 대만 카스테라', price: 11000 },
      { name: '시그니처 소금빵', price: 3200 },
      { name: '수제 생크림 카스테라', price: 13000 },
    ];

    // 2. 오늘부터 7일간의 날짜 배열 생성
    const today = new Date();
    const weekScheduleDates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      return d.toISOString().slice(0, 10);
    });

    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

    // 3. AI 기반 주간 골든 마케팅 캘린더 생성
    const prompt = `당신은 대한민국 골목상권 1등 매장을 만드는 15년 차 로컬 마케팅 총괄 디렉터입니다.
다음 매장과 상품 정보를 바탕으로, 사장님이 1주일 동안 요일별로 인스타, 블로그, 당근마켓, 네이버 플레이스에 빈틈없이 마케팅할 수 있는 [7일간의 주간 마케팅 골든 오토 캘린더]를 JSON으로 기획해 주세요.

[매장명]: ${business.name}
[업종]: ${business.category}
[대표 상품]: ${products.map((p: any) => `${p.name}(${p.price}원)`).join(', ')}

반드시 아래 JSON 포맷으로만 응답하세요:
{
  "campaigns": [
    {
      "dayIndex": 0,
      "title": "예: [당근마켓] 월요일 아침 갓 구운 폭신 카스테라 오픈 알림 🍞",
      "platform": "karrot",
      "channel_type": "당근 비즈프로필 소식",
      "theme": "갓 구운 빵 오픈 알림",
      "time_slot": "오전 10:00",
      "tip": "월요일 아침 출근길 직장인 및 아이 등원 후 엄마들 타겟팅"
    },
    {
      "dayIndex": 1,
      "title": "예: [네이버 블로그] 시흥 배곧 디저트 맛집 생생 후기 포스팅 📝",
      "platform": "blog",
      "channel_type": "네이버 블로그 롱폼",
      "theme": "스마트블록 상위노출",
      "time_slot": "오후 02:30",
      "tip": "네이버 검색 유입이 활발한 오후 나른한 티타임 시간대 공략"
    },
    {
      "dayIndex": 2,
      "title": "예: [인스타그램] 손끝으로 누르면 요동치는 카스테라 15초 ASMR 릴스 🎥",
      "platform": "instagram",
      "channel_type": "15초 숏폼 릴스",
      "theme": "촉감 극대화 ASMR",
      "time_slot": "오후 07:00",
      "tip": "퇴근길 스마트폰 탐색 피크 타임에 시각적 쾌감 자극"
    },
    {
      "dayIndex": 3,
      "title": "예: [네이버 플레이스] 첫 방문 고객 1,000원 알림받기 쿠폰 이벤트 🎟️",
      "platform": "naver_place",
      "channel_type": "플레이스 알림 쿠폰",
      "theme": "신규 단골 유치",
      "time_slot": "오전 11:30",
      "tip": "점심 식사 전 배곧 주변 맛집 검색 고객 즉각 흡수"
    },
    {
      "dayIndex": 4,
      "title": "예: [당근마켓] 불금 맞이 패밀리 세트 단골 특별 우유 증정 🥛",
      "platform": "karrot",
      "channel_type": "당근 비즈프로필 소식",
      "theme": "주말 가족 간식",
      "time_slot": "오후 04:30",
      "tip": "금요일 하교/퇴근 후 온 가족 주말 디저트 픽업 유도"
    },
    {
      "dayIndex": 5,
      "title": "예: [인스타그램] 빵 나오는 시간표 6컷 카드뉴스 캐러셀 📸",
      "platform": "card",
      "channel_type": "인스타 6컷 카드뉴스",
      "theme": "주말 웨이팅 안내",
      "time_slot": "오전 09:30",
      "tip": "주말 오전 브런치 및 나들이 고객을 위한 시간표 정보 제공"
    },
    {
      "dayIndex": 6,
      "title": "예: [오프라인/인쇄] 일요일 저녁 완판 감사 & 다음주 예약 전단지 📄",
      "platform": "print",
      "channel_type": "A4 매장 전단 & 배너",
      "theme": "다음 주 사전 예약",
      "time_slot": "오후 05:00",
      "tip": "매장 방문 고객 대상 네이버 예약 QR코드 스캔 및 재방문 유도"
    }
  ]
}`;

    const aiRes = await callAiCaller(prompt, 'gemini-3.8-flash');
    const aiText = typeof aiRes === 'string' ? aiRes : (aiRes?.text || aiRes?.content || '');

    let campaignList: any[] = [];
    try {
      const match = aiText.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        campaignList = parsed.campaigns || [];
      }
    } catch (e) {
      console.warn('AI Calendar Parse fallback:', e);
    }

    if (!campaignList || campaignList.length === 0) {
      // 폴백 7일치 캘린더
      campaignList = [
        { dayIndex: 0, title: '[당근마켓] 월요일 아침 갓 구운 폭신 카스테라 오픈 알림 🍞', platform: 'karrot', channel_type: '당근 비즈프로필 소식', theme: '갓 구운 빵 오픈', time_slot: '오전 10:00', tip: '월요일 아침 출근길 직장인 및 아이 등원 후 엄마들 타겟팅' },
        { dayIndex: 1, title: '[네이버 블로그] 시흥 배곧 디저트 맛집 생생 후기 포스팅 📝', platform: 'blog', channel_type: '네이버 블로그 롱폼', theme: '스마트블록 상위노출', time_slot: '오후 02:30', tip: '네이버 검색 유입이 활발한 오후 나른한 티타임 시간대 공략' },
        { dayIndex: 2, title: '[인스타그램] 손끝으로 누르면 요동치는 카스테라 15초 ASMR 릴스 🎥', platform: 'instagram', channel_type: '15초 숏폼 릴스', theme: '촉감 극대화 ASMR', time_slot: '오후 07:00', tip: '퇴근길 스마트폰 탐색 피크 타임에 시각적 쾌감 자극' },
        { dayIndex: 3, title: '[네이버 플레이스] 첫 방문 고객 1,000원 알림받기 쿠폰 이벤트 🎟️', platform: 'naver_place', channel_type: '플레이스 알림 쿠폰', theme: '신규 단골 유치', time_slot: '오전 11:30', tip: '점심 식사 전 배곧 주변 맛집 검색 고객 즉각 흡수' },
        { dayIndex: 4, title: '[당근마켓] 불금 맞이 패밀리 세트 단골 특별 우유 증정 🥛', platform: 'karrot', channel_type: '당근 비즈프로필 소식', theme: '주말 가족 간식', time_slot: '오후 04:30', tip: '금요일 하교/퇴근 후 온 가족 주말 디저트 픽업 유도' },
        { dayIndex: 5, title: '[인스타그램] 빵 나오는 시간표 6컷 카드뉴스 캐러셀 📸', platform: 'card', channel_type: '인스타 6컷 카드뉴스', theme: '주말 웨이팅 안내', time_slot: '오전 09:30', tip: '주말 오전 브런치 및 나들이 고객을 위한 시간표 정보 제공' },
        { dayIndex: 6, title: '[오프라인/인쇄] 일요일 저녁 완판 감사 & 다음주 예약 전단지 📄', platform: 'print', channel_type: 'A4 매장 전단 & 배너', theme: '다음 주 사전 예약', time_slot: '오후 05:00', tip: '매장 방문 고객 대상 네이버 예약 QR코드 스캔 및 재방문 유도' },
      ];
    }

    const now = new Date().toISOString();
    const rowsToInsert = campaignList.map((item: any, idx: number) => {
      const targetDate = weekScheduleDates[item.dayIndex % 7] || weekScheduleDates[0];
      const targetDay = new Date(targetDate).getDay();
      const dayName = dayNames[targetDay] || '';

      return {
        id: `camp_${Date.now()}_${idx + 1}`,
        business_id: business.id,
        title: item.title,
        platform: item.platform,
        channel_type: item.channel_type || item.platform,
        theme: item.theme || '',
        scheduled_at: `${targetDate} (${dayName})`,
        time_slot: item.time_slot || '오후 02:00',
        tip: item.tip || 'AI 분석 최적 발행 타임슬롯',
        status: 'scheduled',
        asset_id: '',
        created_at: now,
      };
    });

    await insertRows('auto_campaigns', rowsToInsert);

    return NextResponse.json({
      success: true,
      message: '7일간의 주간 마케팅 오토 파일럿 캘린더가 성공적으로 등록되었습니다!',
      count: rowsToInsert.length,
      campaigns: rowsToInsert,
    });
  } catch (error: any) {
    console.error('Auto generate calendar error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
