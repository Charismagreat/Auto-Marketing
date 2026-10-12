import { NextResponse } from 'next/server';

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

let mockPrompts: PromptConfig[] = [
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
    systemPrompt: `당신은 전단지 수거함에 버려지지 않고 냉장고에 붙게 만드는 오프라인 다이렉트 마케팅 전문가입니다.
1. 보행자가 3초 만에 혜택을 인지할 수 있는 파격적인 메인 헤드라인을 구성합니다.
2. 3대 핵심 혜택(할인율, 1+1 증정, 한정 수량)을 불렛 포인트로 시인성 높게 정리합니다.
3. 전단지 하단 절취 쿠폰에 들어갈 한 줄 쿠폰 카피를 명확히 제시합니다.
4. 약도 안내 및 전화 주문/포장 예약 유도 문구를 포함합니다.`,
    userPromptTemplate: `매장명: {storeName}
전단지 배포 목적: {purpose}
파격 할인/프로모션: {offer}
매장 주소 및 전화번호: {contact}

오프라인 A4 전단지용 메인 헤드라인, 서브카피, 쿠폰 문구를 도출해주세요.`,
    variables: ['storeName', 'purpose', 'offer', 'contact'],
    version: '1.0.4',
    updatedAt: '2026-10-12 13:00:00',
  },
  {
    id: 'p-video-short',
    channel: 'video_short',
    name: '15초 숏폼 숏츠/릴스 초단기 대본 엔진',
    category: '비디오 숏폼',
    temperature: 0.75,
    maxTokens: 1024,
    topP: 0.9,
    systemPrompt: `당신은 유튜브 쇼츠 및 인스타 릴스 15초 전문 영상 시나리오 작가입니다.
0~3초: 시선 강탈 훅(Hooking) 장면과 내레이션
4~10초: 본론(감각적인 조리/시연/비포애프터 연출)
11~15초: 클라이맥스 및 즉각적인 행동 유도(CTA)
영상 촬영 가이드(카메라 앵글, BGM 템포, 자막 텍스트, AI 보이스 대본)를 타임코드별로 명시합니다.`,
    userPromptTemplate: `매장명: {storeName}
영상 주제: {topic}
비주얼 포인트: {visualPoint}
목표 반응: {goal}

15초 타임라인별 영상 씬(Scene) 가이드와 보이스오버(VO) 대본을 작성해주세요.`,
    variables: ['storeName', 'topic', 'visualPoint', 'goal'],
    version: '1.1.2',
    updatedAt: '2026-10-12 12:30:00',
  },
  {
    id: 'p-detail-page',
    channel: 'detail_page',
    name: '스마트스토어/배민 상세페이지 설득 전환 엔진',
    category: '상세페이지 전환',
    temperature: 0.55,
    maxTokens: 2048,
    topP: 0.9,
    systemPrompt: `당신은 구매 전환율(CVR) 20% 이상을 달성하는 상세페이지 카피라이터입니다.
1. 고객의 결핍(Pain Point)을 건드리는 공감형 인트로
2. 타사와 차별화되는 우리 매장만의 3대 절대 강점
3. 사장님의 철학과 위생/품질 보증 약속
4. 실제 고객들의 별점 5점 리얼 리뷰 하이라이트
5. 배송/포장 안내 및 자주 묻는 질문(FAQ)의 논리적인 설득 플로우를 구성합니다.`,
    userPromptTemplate: `상품/매장명: {productName}
원재료/제조 특장점: {specialPoints}
타겟 소비자의 고민: {customerPain}
가격 및 옵션: {priceOptions}

고객이 스크롤을 내리며 구매 버튼을 누르게 만드는 고전환 상세페이지 구조와 카피를 작성해주세요.`,
    variables: ['productName', 'specialPoints', 'customerPain', 'priceOptions'],
    version: '1.4.0',
    updatedAt: '2026-10-12 11:15:00',
  },
];

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const channel = searchParams.get('channel');

    let result = [...mockPrompts];
    if (channel && channel !== 'ALL') {
      result = result.filter((p) => p.channel === channel);
    }

    return NextResponse.json({
      success: true,
      data: {
        prompts: result,
        total: result.length,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || '프롬프트 목록 조회 실패' },
      { status: 500 }
    );
  }
}

// 프롬프트 수정 및 실시간 튜닝
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, systemPrompt, userPromptTemplate, temperature, maxTokens, topP } = body;

    const index = mockPrompts.findIndex((p) => p.id === id);
    if (index === -1) {
      return NextResponse.json({ success: false, error: '해당 프롬프트 설정을 찾을 수 없습니다.' }, { status: 404 });
    }

    const currentVersion = mockPrompts[index].version;
    const versionParts = currentVersion.split('.').map(Number);
    versionParts[2] = (versionParts[2] || 0) + 1; // 패치 버전 자동 증가
    const newVersion = versionParts.join('.');

    mockPrompts[index] = {
      ...mockPrompts[index],
      systemPrompt: systemPrompt ?? mockPrompts[index].systemPrompt,
      userPromptTemplate: userPromptTemplate ?? mockPrompts[index].userPromptTemplate,
      temperature: temperature !== undefined ? Number(temperature) : mockPrompts[index].temperature,
      maxTokens: maxTokens !== undefined ? Number(maxTokens) : mockPrompts[index].maxTokens,
      topP: topP !== undefined ? Number(topP) : mockPrompts[index].topP,
      version: newVersion,
      updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };

    return NextResponse.json({
      success: true,
      message: `${mockPrompts[index].name} 프롬프트 튜닝이 무배포 실시간 반영되었습니다 (v${newVersion}).`,
      data: mockPrompts[index],
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || '프롬프트 수정 실패' },
      { status: 500 }
    );
  }
}
