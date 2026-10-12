import { NextResponse } from 'next/server';
import { setupDatabase, queryTable, updateRows } from '@/lib/setup-db';

export interface PromptConfig {
  id: string;
  channel: 'karrot' | 'naver_place' | 'instagram' | 'naver_blog' | 'print_pdf' | 'video_short' | 'detail_page';
  name: string;
  category: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  systemPrompt: string;
  userPromptTemplate: string;
  variables: string[];
  version: string;
  updatedAt: string;
}

const DEFAULT_PROMPTS: PromptConfig[] = [
  {
    id: 'p-karrot',
    channel: 'karrot',
    name: '당근마켓 동네생활/비즈프로필 소식 엔진',
    category: '하이퍼로컬 커뮤니티',
    temperature: 0.7,
    maxTokens: 1024,
    topP: 0.9,
    systemPrompt: `당신은 대한민국 골목상권 로컬 마케팅 전문가입니다. 
당근마켓 동네생활 및 비즈프로필 소식글을 작성할 때는:
1. "안녕하세요 당근 이웃 여러분!"처럼 친근하고 따뜻한 이웃 화법을 사용합니다.
2. 매장의 정성과 당일 제조/입고/수제 특징을 생생하게 강조합니다.
3. [당근 단골 혜택]이나 [방문 인증 쿠폰]을 반드시 포함하여 즉시 방문을 유도합니다.
4. 이모지와 줄바꿈을 적절히 활용하여 스마트폰에서 읽기 쉽게 구성합니다.`,
    userPromptTemplate: `매장명: {storeName}
업종: {industry}
주요 메뉴/서비스: {coreItems}
오늘의 이벤트/혜택: {eventBenefit}
매장 위치/영업시간: {locationAndHours}

위 정보를 바탕으로 동네 주민들의 마음을 사로잡는 당근마켓 비즈프로필 소식글을 작성해주세요.`,
    variables: ['storeName', 'industry', 'coreItems', 'eventBenefit', 'locationAndHours'],
    version: '1.2.0',
    updatedAt: '2026-10-12 16:30:00',
  },
  {
    id: 'p-naver-place',
    channel: 'naver_place',
    name: '네이버 스마트플레이스 SEO & 새소식/쿠폰 엔진',
    category: '검색 지도 최적화',
    temperature: 0.5,
    maxTokens: 1024,
    topP: 0.85,
    systemPrompt: `당신은 네이버 플레이스 알고리즘과 로컬 검색 최적화(SEO) 수석 컨설턴트입니다.
1. 제목은 [지역명 + 핵심 키워드 + 이벤트] 형태로 검색 노출을 극대화합니다.
2. 네이버 '알림받기' 버튼 클릭을 유도하는 전용 웰컴 쿠폰 안내를 반드시 명시합니다.
3. 네이버 예약 및 스마트콜 유도 문구를 자연스럽게 삽입합니다.
4. 네이버 알고리즘이 선호하는 업종별 검색 태그 10개를 하단에 배치합니다.`,
    userPromptTemplate: `매장명: {storeName}
위치(동/역세권): {region}
대표 키워드: {keywords}
쿠폰/프로모션: {couponInfo}

네이버 플레이스 새소식 피드에 최적화된 검색 노출 극대화 소식을 작성해주세요.`,
    variables: ['storeName', 'region', 'keywords', 'couponInfo'],
    version: '1.1.0',
    updatedAt: '2026-10-12 16:20:00',
  },
  {
    id: 'p-instagram',
    channel: 'instagram',
    name: '인스타그램 바이럴 릴스 캡션 & 해시태그 엔진',
    category: '소셜 미디어 바이럴',
    temperature: 0.8,
    maxTokens: 1536,
    topP: 0.95,
    systemPrompt: `당신은 MZ세대 트렌드를 꿰뚫고 있는 인스타그램 인플루언서 마케터입니다.
1. 첫 문장에서 스크롤을 멈추게 하는 강력한 후킹(Hooking) 문구를 작성합니다.
2. 릴스 시청 유지율(Retention)을 높일 수 있는 꿀팁 또는 비주얼 포인트를 강조합니다.
3. 댓글 참여 유도(CTA: 친구 소환, 저장, DM 등)를 반드시 포함합니다.
4. 탐색 탭 노출을 위한 대형 태그 + 로컬 타겟 태그 20개를 엄선하여 출력합니다.`,
    userPromptTemplate: `매장명: {storeName}
콘텐츠 주제: {topic}
타겟 고객층: {targetAudience}
핵심 셀링포인트: {sellingPoint}

인스타그램 릴스 및 피드 캡션을 작성해주세요.`,
    variables: ['storeName', 'topic', 'targetAudience', 'sellingPoint'],
    version: '2.0.1',
    updatedAt: '2026-10-12 15:40:00',
  },
  {
    id: 'p-naver-blog',
    channel: 'naver_blog',
    name: '네이버 블로그 고품질 정보성 SEO 체험단 엔진',
    category: '검색 바이럴 저널',
    temperature: 0.6,
    maxTokens: 2048,
    topP: 0.9,
    systemPrompt: `당신은 네이버 C-Rank 및 DIA+ 검색 알고리즘에 최적화된 전문 블로그 에디터입니다.
1. 고객의 실제 방문 및 이용 경험 기반의 스토리텔링 화법으로 전개합니다.
2. 서론-본론(인테리어, 시그니처 메뉴, 이용 꿀팁)-결론(총평, 재방문의사)의 3단 구조를 갖춥니다.
3. 소제목(H2, H3)과 체크리스트 블록을 적극 활용하여 가독성을 극대화합니다.
4. 지도 위치, 주차 정보, 예약 팁을 마지막에 일목요연하게 요약합니다.`,
    userPromptTemplate: `매장명: {storeName}
지역 및 상권: {region}
메뉴/서비스 상세: {details}
방문 고객 장점: {merits}

네이버 블로그 상위 노출에 최적화된 상세 포스팅 원고를 작성해주세요.`,
    variables: ['storeName', 'region', 'details', 'merits'],
    version: '1.3.0',
    updatedAt: '2026-10-12 14:10:00',
  },
  {
    id: 'p-print-pdf',
    channel: 'print_pdf',
    name: '오프라인 A4 전단지 3초 시선강탈 카피 엔진',
    category: '오프라인 판촉 인쇄',
    temperature: 0.65,
    maxTokens: 1024,
    topP: 0.85,
    systemPrompt: `당신은 전단지 수거함에 버려지지 않는 골목상권 전단지 카피라이터입니다.
1. 상단 메인 헤드라인은 "이 동네 주민이라면 꼭 알아야 할 1가지" 류의 파격적 호기심을 유발합니다.
2. 중간 서브카피는 매장의 3대 장점을 직관적인 불렛포인트로 요약합니다.
3. 하단에는 '오려오면 2,000원 할인'과 같은 실물 쿠폰 바우처 박스를 배치합니다.`,
    userPromptTemplate: `매장명: {storeName}
핵심 혜택/할인: {discountBenefit}
대표 상품: {flagshipProduct}
찾아오시는 길: {directions}

A4 인쇄 전단지용 카피를 작성해주세요.`,
    variables: ['storeName', 'discountBenefit', 'flagshipProduct', 'directions'],
    version: '1.0.5',
    updatedAt: '2026-10-12 13:00:00',
  },
  {
    id: 'p-video-short',
    channel: 'video_short',
    name: '15초 숏폼 릴스/쇼츠 영상 타임라인 스크립트 엔진',
    category: '숏폼 영상 크리에이티브',
    temperature: 0.75,
    maxTokens: 1200,
    topP: 0.9,
    systemPrompt: `당신은 숏폼 떡상 전문 PD입니다.
15초 영상을 0-3초(충격 후킹), 3-10초(시각적 쾌감/제조 클로즈업), 10-15초(방문 촉구) 구간으로 정밀 분할하여 비주얼 연출 지시문과 나레이션 대사를 생성합니다.`,
    userPromptTemplate: `매장명: {storeName}
촬영 대상 메뉴: {menuName}
강조할 감각: {sensoryFocus}

15초 숏폼 영상 스크립트를 작성해주세요.`,
    variables: ['storeName', 'menuName', 'sensoryFocus'],
    version: '2.1.0',
    updatedAt: '2026-10-12 12:40:00',
  },
  {
    id: 'p-detail-page',
    channel: 'detail_page',
    name: '네이버 스마트스토어 860px 상세페이지 기획 엔진',
    category: 'E-커머스 전환 상세페이지',
    temperature: 0.55,
    maxTokens: 2500,
    topP: 0.85,
    systemPrompt: `당신은 스마트스토어 월 매출 1억을 만드는 전문 MD입니다.
인트로(문제제기) -> 왜 우리 매장인가(신뢰 구축) -> 제품 클로즈업(디테일) -> 안전 포장 및 배송 안내 -> 고객 후기 요약으로 이어지는 고전환 상세페이지 구조를 설계합니다.`,
    userPromptTemplate: `상품명: {productName}
원재료/특징: {features}
가격/구성: {pricePackage}
배송 방식: {shippingInfo}

네이버 스마트스토어 860px 상세페이지 섹션별 기획안을 작성해주세요.`,
    variables: ['productName', 'features', 'pricePackage', 'shippingInfo'],
    version: '1.4.0',
    updatedAt: '2026-10-12 11:15:00',
  },
];

export async function GET(req: Request) {
  try {
    await setupDatabase();
    const { searchParams } = new URL(req.url);
    const channel = searchParams.get('channel');

    const res = await queryTable('auto_prompt_templates', { limit: 50 }).catch(() => ({ rows: [] }));
    let list: PromptConfig[] = (res.rows && res.rows.length > 0)
      ? res.rows.map((r: any) => ({
          id: r.id,
          channel: r.channel as any,
          name: r.name || '',
          category: r.category || '',
          temperature: Number(r.temperature) || 0.7,
          maxTokens: Number(r.max_tokens) || 1024,
          topP: Number(r.top_p) || 0.9,
          systemPrompt: r.system_prompt || '',
          userPromptTemplate: r.user_prompt_template || '',
          variables: typeof r.variables === 'string' ? r.variables.split(',').map((s: string) => s.trim()) : [],
          version: r.version || '1.0.0',
          updatedAt: r.updated_at || '',
        }))
      : DEFAULT_PROMPTS;

    if (channel && channel !== 'ALL') {
      list = list.filter((p) => p.channel === channel);
    }

    return NextResponse.json({
      success: true,
      data: {
        prompts: list,
        total: list.length,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || '프롬프트 목록 조회 실패' },
      { status: 500 }
    );
  }
}

// 프롬프트 수정 및 실시간 튜닝 (SQLite DB 영구 반영)
export async function PUT(req: Request) {
  try {
    await setupDatabase();
    const body = await req.json();
    const { id, systemPrompt, userPromptTemplate, temperature, maxTokens, topP } = body;

    const res = await queryTable('auto_prompt_templates', { limit: 50 }).catch(() => ({ rows: [] }));
    const current = (res.rows || []).find((r: any) => r.id === id);

    const currentVersion = current?.version || '1.0.0';
    const versionParts = currentVersion.split('.').map(Number);
    versionParts[2] = (versionParts[2] || 0) + 1; // 패치 버전 자동 증가
    const newVersion = versionParts.join('.');
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const safeTemp = temperature !== undefined ? Number(temperature) : Number(current?.temperature || 0.7);
    const safeMaxTokens = maxTokens !== undefined ? Number(maxTokens) : Number(current?.max_tokens || 1024);
    const safeTopP = topP !== undefined ? Number(topP) : Number(current?.top_p || 0.9);

    await updateRows('auto_prompt_templates', {
      system_prompt: systemPrompt ?? current?.system_prompt ?? '',
      user_prompt_template: userPromptTemplate ?? current?.user_prompt_template ?? '',
      temperature: safeTemp,
      max_tokens: safeMaxTokens,
      top_p: safeTopP,
      version: newVersion,
      updated_at: now,
    }, {
      filters: { id },
    });

    return NextResponse.json({
      success: true,
      message: `프롬프트 튜닝이 SQLite DB에 영구 저장되었으며 실시간 무배포 반영되었습니다 (v${newVersion}).`,
      data: { id, version: newVersion, updatedAt: now },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || '프롬프트 수정 실패' },
      { status: 500 }
    );
  }
}

export const POST = PUT;
