import {
  createTable,
  queryTable,
  insertRows,
  executeSQL,
  callUserDataTool,
} from './egdesk-helpers';

export { queryTable, insertRows, executeSQL };

let isDbInitialized = false;
let dbInitPromise: Promise<void> | null = null;

// 공통 7종 감사 컬럼
const AUDIT_COLUMNS = [
  { name: 'uuid', type: 'TEXT' },
  { name: 'updated_at', type: 'TEXT' },
  { name: 'updated_by', type: 'TEXT' },
  { name: 'deleted_at', type: 'TEXT' },
  { name: 'deleted_by', type: 'TEXT' },
  { name: 'restored_at', type: 'TEXT' },
  { name: 'restored_by', type: 'TEXT' },
];

/**
 * 실제 SQLite 물리 테이블 존재 여부를 검사하고 감사 컬럼을 주입하여 멱등성 있게 생성
 */
export async function safeCreateTable(displayName: string, columns: any[], options: { tableName: string }) {
  const tableName = options.tableName;

  for (const aCol of AUDIT_COLUMNS) {
    const exists = columns.some((c) => c.name.toLowerCase() === aCol.name.toLowerCase());
    if (!exists) {
      columns.push({ ...aCol });
    }
  }

  const sanitizedColumns = columns.map((c) => {
    const { primaryKey, ...rest } = c;
    return rest;
  });

  let physicalExists = false;
  try {
    const masterRes = await executeSQL(`SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}';`);
    physicalExists = (masterRes.rows || []).length > 0;
  } catch {
    physicalExists = false;
  }

  if (!physicalExists) {
    try {
      await callUserDataTool('user_data_delete_table', { tableName });
    } catch {}

    try {
      await createTable(displayName, sanitizedColumns, options);
      console.log(`[Auto-Marketing] ✅ Created table: "${tableName}"`);
    } catch (createErr: any) {
      console.warn(`[Auto-Marketing] Table create warning "${tableName}":`, createErr.message);
      try {
        const colDefs = sanitizedColumns.map((c: any) => `"${c.name}" ${c.type || 'TEXT'}`).join(', ');
        await executeSQL(`CREATE TABLE IF NOT EXISTS "${tableName}" (${colDefs});`);
      } catch {}
    }
  }
}

/**
 * 기본 시드 데이터 주입 (퐁신제빵소 소상공인 및 관리자 관제 초기 데이터)
 */
async function seedInitialData() {
  const now = new Date().toISOString();

  // 1. 기본 유저 (퐁신제빵소 대표님 - guest@automarketing.com)
  const userCheck = await queryTable('auto_users', { limit: 1 }).catch(() => ({ rows: [] }));
  if (!userCheck.rows || userCheck.rows.length === 0) {
    await insertRows('auto_users', [
      {
        id: 'usr_pongshin_master',
        email: 'guest@automarketing.com',
        name: '퐁신제빵소 사장님',
        avatar_url: 'https://ldb-phinf.pstatic.net/20250613_51/1749793026669I569w_JPEG/%C6%FE%BD%C5%BD%C9%BA%BC1.jpg',
        token_balance: 50000,
        plan: 'PRO',
        created_at: now,
      }
    ]).catch(console.error);
  } else {
    await executeSQL(`UPDATE auto_users SET email = 'guest@automarketing.com' WHERE id = 'usr_pongshin_master' OR email = 'pongshin.bakery@gmail.com'`).catch(() => {});
  }

  // 2. 비즈니스 프로필 (퐁신제빵소)
  const bizCheck = await queryTable('auto_businesses', { limit: 1 }).catch(() => ({ rows: [] }));
  if (!bizCheck.rows || bizCheck.rows.length === 0) {
    await insertRows('auto_businesses', [
      {
        id: 'biz_pongshin_baegot',
        user_id: 'usr_pongshin_master',
        name: '퐁신제빵소',
        category: '베이커리 / 수제 디저트',
        place_id: '2096233072',
        address: '경기 시흥시 배곧동 292-3',
        road_address: '경기 시흥시 서울대학로 59-69 1층 138호, 139호',
        phone: '0507-1300-0000',
        business_hours: '10:00 - 21:00 (20:30 라스트오더)',
        usp: '입안 가득 구름처럼 사르르 녹아내리는 부드러움, 매일 아침 당일 구워내는 신선한 수제 대만 카스테라',
        target_audience: '배곧 신도시 3040 주부 및 학부모, 배곧테크노밸리 직장인, 주말 선물용 디저트 고객',
        brand_tone: '따뜻하고 달콤하며 신선한 친근한 장인 톤앤매너',
        naver_place_url: 'https://naver.me/FJIPv54p',
        created_at: now,
      }
    ]).catch(console.error);
  }

  // 3. 상품 카탈로그 (카스테라 3종)
  const prodCheck = await queryTable('auto_products', { limit: 1 }).catch(() => ({ rows: [] }));
  if (!prodCheck.rows || prodCheck.rows.length === 0) {
    await insertRows('auto_products', [
      {
        id: 'prod_castella_orig',
        business_id: 'biz_pongshin_baegot',
        name: '퐁신 오리지널 대만 카스테라',
        price: 11000,
        description: '계란의 깊은 풍미와 퐁신퐁신 구름 같은 촉촉한 식감의 시그니처 정통 카스테라',
        image_url: 'https://ldb-phinf.pstatic.net/20250613_51/1749793026669I569w_JPEG/%C6%FE%BD%C5%BD%C9%BA%BC1.jpg',
        created_at: now,
      },
      {
        id: 'prod_castella_cream',
        business_id: 'biz_pongshin_baegot',
        name: '생크림 폭탄 카스테라',
        price: 13000,
        description: '부드러운 카스테라 속을 달콤하고 신선한 우유 생크림으로 가득 채운 베스트셀러',
        image_url: 'https://ldb-phinf.pstatic.net/20250613_51/1749793026669I569w_JPEG/%C6%FE%BD%C5%BD%C9%BA%BC1.jpg',
        created_at: now,
      },
      {
        id: 'prod_castella_cheese',
        business_id: 'biz_pongshin_baegot',
        name: '단짠 체다치즈 카스테라',
        price: 12500,
        description: '따뜻할 때 흘러내리는 진한 체다치즈와 부드러운 빵의 환상적인 단짠 조화',
        image_url: 'https://ldb-phinf.pstatic.net/20250613_51/1749793026669I569w_JPEG/%C6%FE%BD%C5%BD%C9%BA%BC1.jpg',
        created_at: now,
      }
    ]).catch(console.error);
  }

  // 4. 동적 FAQ
  const faqCheck = await queryTable('auto_faqs', { limit: 1 }).catch(() => ({ rows: [] }));
  if (!faqCheck.rows || faqCheck.rows.length === 0) {
    await insertRows('auto_faqs', [
      {
        id: 'faq_1',
        category: 'CONNECT',
        category_label: '채널 연동',
        question: '당근마켓 비즈프로필 연동 시 개인 계정으로도 가능한가요?',
        answer: '당근마켓 마케팅 자동 발행은 당근 비즈프로필(전문 판매자 계정)과 연동됩니다. 개인 계정이시라면 당근 앱 내에서 무료로 1분 만에 비즈프로필로 전환하신 후 연동하실 수 있습니다.',
        sort_order: 1,
        is_published: 1,
        created_at: now,
      },
      {
        id: 'faq_2',
        category: 'CONNECT',
        category_label: '채널 연동',
        question: '네이버 스마트플레이스 새소식 쿠폰은 어떻게 자동 연동되나요?',
        answer: '네이버 스마트플레이스 파트너센터 API 권한을 1회 승인해 주시면, 오토마케팅 엔진이 생성한 이벤트 소식글과 함께 [알림받기 전용 웰컴 쿠폰]이 플레이스 매장에 즉시 등록됩니다.',
        sort_order: 2,
        is_published: 1,
        created_at: now,
      },
      {
        id: 'faq_3',
        category: 'BILLING',
        category_label: '결제/토큰',
        question: '남은 마케팅 토큰은 다음 달로 이월되나요?',
        answer: '네, 정기 구독 회원의 경우 사용하지 않고 남은 토큰은 다음 달로 자동 이월되어 소멸되지 않습니다.',
        sort_order: 3,
        is_published: 1,
        created_at: now,
      },
      {
        id: 'faq_4',
        category: 'PRINT',
        category_label: '인쇄/배송',
        question: '생성된 A4 전단지는 어떻게 인쇄하나요?',
        answer: '에셋 보관함에서 [인쇄용 고해상도 PDF 다운로드] 버튼을 누르시면 300DPI 인쇄소 규격 CMYK 파일이 다운로드됩니다. 가까운 인쇄소에 바로 맡기시거나 매장 프린터로 즉시 출력하실 수 있습니다.',
        sort_order: 4,
        is_published: 1,
        created_at: now,
      },
    ]).catch(console.error);
  }

  // 4-1. 벤치마크 레퍼런스 시드 (auto_references)
  const refCheck = await queryTable('auto_references', { limit: 1 }).catch(() => ({ rows: [] }));
  if (!refCheck.rows || refCheck.rows.length === 0) {
    await insertRows('auto_references', [
      {
        id: 'ref_1',
        business_id: 'biz_pongshin_baegot',
        title: '조회수 120만! 대만 카스테라 커팅 탱글탱글 ASMR 숏폼',
        url: 'https://youtube.com/shorts/TaiwanCastellaJiggle',
        platform: 'youtube',
        hook_dna: '단 0.5초 만에 시선 강탈하는 탱글한 흔들림 & 김 모락모락 모션',
        layout_dna: '0~2초: 흔들림 훅 ➔ 3~8초: 생크림 주입 클로즈업 ➔ 9~15초: 매장 위치 & 당일 한정 수량 CTA',
        tags: '유튜브쇼츠,카스테라,ASMR,탱글탱글,식감자극',
        thumbnail_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80',
        created_at: now,
      },
      {
        id: 'ref_2',
        business_id: 'biz_pongshin_baegot',
        title: '저장수 3.8만 대박난 베이커리 6컷 캐러셀 카드뉴스',
        url: 'https://instagram.com/p/BakeryStoryTellingCard',
        platform: 'instagram',
        hook_dna: '프랜차이즈 빵 대신 동네 수제 카스테라를 찾는 3가지 이유',
        layout_dna: '1컷: 질문형 훅 ➔ 2~4컷: 무방부제/신선한 계란 공정 ➔ 5컷: 보관 꿀팁 ➔ 6컷: 오늘 나온 빵 예약 안내',
        tags: '인스타릴스,카드뉴스,스토리텔링,동네빵집,수제카스테라',
        thumbnail_url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&auto=format&fit=crop&q=80',
        created_at: now,
      },
      {
        id: 'ref_3',
        business_id: 'biz_pongshin_baegot',
        title: '네이버 스마트블록 1위 노출: 배곧 빵지순례 내돈내산 감성 리뷰',
        url: 'https://blog.naver.com/foodie_review/castella_paradise',
        platform: 'naver_blog',
        hook_dna: '[시흥 배곧] 빵순이가 인정한 인생 카스테라 발견! 포장 패키지까지 완벽',
        layout_dna: '외관/위치 안내 ➔ 시그니처 3종 실물 컷 ➔ 단면 자르는 움짤(GIF) ➔ 보관법 및 예약 꿀팁',
        tags: '네이버블로그,플레이스상위노출,지역키워드,배곧맛집,선물추천',
        thumbnail_url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop&q=80',
        created_at: now,
      },
      {
        id: 'ref_4',
        business_id: 'biz_pongshin_baegot',
        title: '스마트스토어 디저트 1위! 구매전환율 8.4% 상세페이지',
        url: 'https://smartstore.naver.com/best_dessert/products/castella_master',
        platform: 'smartstore',
        hook_dna: '택배 배송 시 부서지지 않는 특수 안심 에어팩 완충재 포장 사진을 전면에 배치하여 고객 불안을 해소합니다.',
        layout_dna: '상단 3초 구매전환 훅 ➔ 안심 에어캡 3중 포장 인증 ➔ 당일 생산 발송 스케줄표 ➔ 단체주문 혜택',
        tags: '상세페이지,스마트스토어,전환율최적화,카스테라택배',
        thumbnail_url: 'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=600&auto=format&fit=crop&q=80',
        created_at: now,
      },
      {
        id: 'ref_5',
        business_id: 'biz_pongshin_baegot',
        title: '매출 30% 끌어올린 오픈 기념 전단지 & 픽업 명함 세트',
        url: 'https://example.com/print/bakery_open_flyer',
        platform: 'print',
        hook_dna: '선착순 100명! 아메리카노 1,000원 + 오리지널 카스테라 1,000원 할인 쿠폰',
        layout_dna: '상단: 대형 빵 비주얼 ➔ 중단: 3대 시그니처 소개 ➔ 하단: 절취선 할인 쿠폰 & 네이버 지도 QR코드',
        tags: '전단지,명함,오픈이벤트,쿠폰동봉,지역타겟팅',
        thumbnail_url: 'https://images.unsplash.com/photo-1517433670267-08bbd4be890f?w=600&auto=format&fit=crop&q=80',
        created_at: now,
      },
    ]).catch(console.error);
  }

  // 5. 마케팅 캘린더 주간 스케줄 시드
  const campCheck = await queryTable('auto_campaigns', { limit: 1 }).catch(() => ({ rows: [] }));
  if (!campCheck.rows || campCheck.rows.length === 0) {
    await insertRows('auto_campaigns', [
      {
        id: 'camp_1',
        business_id: 'biz_pongshin_baegot',
        title: '월요병 극복! 퐁신 카스테라 갓 구운 모락모락 ASMR',
        platform: 'instagram',
        channel_type: '15초 숏폼 릴스',
        theme: '활기찬 한 주 시작 & 당일 구운 빵 릴스',
        scheduled_at: '2026-10-12',
        time_slot: '오전 11:30 (점심시간 직전 노출)',
        tip: '직장인들이 점심 메뉴 고를 때 달콤한 디저트 욕구를 자극하세요.',
        status: 'scheduled',
        asset_id: '',
        created_at: now,
      },
      {
        id: 'camp_2',
        business_id: 'biz_pongshin_baegot',
        title: '배곧테크노밸리 직장인 단체간식 1,000원 할인 이벤트',
        platform: 'print',
        channel_type: 'A4 전단지 & X배너',
        theme: '동네 주민 타겟팅 오픈 전단지 배포',
        scheduled_at: '2026-10-13',
        time_slot: '오후 02:00',
        tip: '오후 티타임 회의용 단체 간식 주문을 유도합니다.',
        status: 'scheduled',
        asset_id: '',
        created_at: now,
      },
      {
        id: 'camp_3',
        business_id: 'biz_pongshin_baegot',
        title: '[시흥 배곧 맛집] 생크림 폭탄 카스테라 내돈내산 솔직 리뷰',
        platform: 'blog',
        channel_type: '네이버 블로그 롱폼',
        theme: '네이버 블로그 빵지순례 스마트블록 상위노출',
        scheduled_at: '2026-10-14',
        time_slot: '오후 05:00 (퇴근길 검색 피크)',
        tip: '네이버 플레이스 지도 링크를 삽입해 주말 방문을 유도합니다.',
        status: 'draft',
        asset_id: '',
        created_at: now,
      }
    ]).catch(console.error);
  }

  // 6. SaaS 요금제 시드 (auto_pricing_plans)
  const planCheck = await queryTable('auto_pricing_plans', { limit: 1 }).catch(() => ({ rows: [] }));
  if (!planCheck.rows || planCheck.rows.length === 0) {
    await insertRows('auto_pricing_plans', [
      {
        id: 'plan-starter',
        name: '스타터 로컬 팩 (Starter)',
        monthly_price: 39000,
        token_quota: 50000,
        estimated_bundles: 15,
        estimated_cost: 2650,
        margin_rate: 93.2,
        created_at: now,
      },
      {
        id: 'plan-autopilot',
        name: '오토파일럿 프로 팩 (Pro)',
        monthly_price: 79000,
        token_quota: 150000,
        estimated_bundles: 45,
        estimated_cost: 7950,
        margin_rate: 89.9,
        created_at: now,
      },
      {
        id: 'plan-master',
        name: '골목대장 올인원 마스터 (Master)',
        monthly_price: 149000,
        token_quota: 400000,
        estimated_bundles: 120,
        estimated_cost: 21200,
        margin_rate: 85.8,
        created_at: now,
      },
    ]).catch(console.error);
  }

  // 7. AI 모델 원가 시드 (auto_model_costs)
  const costCheck = await queryTable('auto_model_costs', { limit: 1 }).catch(() => ({ rows: [] }));
  if (!costCheck.rows || costCheck.rows.length === 0) {
    await insertRows('auto_model_costs', [
      { id: 'gemini-flash', name: 'Gemini 2.5 Flash', provider: 'Google Cloud', type: 'TEXT', unit_cost: 3.5, typical_calls: 7, created_at: now },
      { id: 'flux-image', name: 'Flux 1.1 Pro (고화질)', provider: 'Black Forest Labs', type: 'IMAGE', unit_cost: 42.0, typical_calls: 3, created_at: now },
      { id: 'tts-voice', name: 'Google Cloud TTS Neural2', provider: 'Google Cloud', type: 'AUDIO', unit_cost: 12.0, typical_calls: 1, created_at: now },
      { id: 'video-render', name: 'Capacitor 숏폼 합성 렌더러', provider: 'Auto-Marketing Local', type: 'VIDEO', unit_cost: 15.0, typical_calls: 1, created_at: now },
    ]).catch(console.error);
  }

  // 8. 전자세금계산서 시드 (auto_tax_invoices)
  const taxCheck = await queryTable('auto_tax_invoices', { limit: 1 }).catch(() => ({ rows: [] }));
  if (!taxCheck.rows || taxCheck.rows.length === 0) {
    await insertRows('auto_tax_invoices', [
      {
        id: 'tax-001',
        invoice_number: '20261012-AM-001',
        nts_approval_number: '20261012-41000284-88912345',
        store_name: '배곧 피트니스 24',
        biz_number: '134-87-99123',
        ceo_name: '최관장',
        email: 'fit24@gym.com',
        item_description: '오토파일럿 프로 팩 1개월 정기 구독료',
        supply_amount: 71818,
        vat_amount: 7182,
        total_amount: 79000,
        status: 'APPROVED',
        issue_date: '2026-10-12',
        created_at: now,
      },
      {
        id: 'tax-002',
        invoice_number: '20261012-AM-002',
        nts_approval_number: '',
        store_name: '배곧 달콤베이커리',
        biz_number: '214-12-65432',
        ceo_name: '김점주',
        email: 'sweetbakery@naver.com',
        item_description: '골목대장 올인원 마스터 연간 라이선스 선납',
        supply_amount: 1354545,
        vat_amount: 135455,
        total_amount: 1490000,
        status: 'PENDING',
        issue_date: '2026-10-12',
        created_at: now,
      },
      {
        id: 'tax-003',
        invoice_number: '20261010-AM-003',
        nts_approval_number: '20261010-41000284-77610012',
        store_name: '정왕동 불타는 쭈꾸미',
        biz_number: '110-23-45678',
        ceo_name: '박대표',
        email: 'hotjjukku@daum.net',
        item_description: '15초 숏폼 릴스 4편 제작 대행',
        supply_amount: 320000,
        vat_amount: 32000,
        total_amount: 352000,
        status: 'APPROVED',
        issue_date: '2026-10-10',
        created_at: now,
      },
    ]).catch(console.error);
  }

  // 9. 외부 채널 디스패치 로그 시드 (auto_dispatch_logs)
  const dispCheck = await queryTable('auto_dispatch_logs', { limit: 1 }).catch(() => ({ rows: [] }));
  if (!dispCheck.rows || dispCheck.rows.length === 0) {
    await insertRows('auto_dispatch_logs', [
      {
        id: 'disp-001',
        channel: 'karrot',
        store_id: 'store-1',
        store_name: '배곧 달콤베이커리',
        title: '갓 구운 소금빵 1+1 이웃 단골 쿠폰 발행',
        status: 'SUCCESS',
        status_code: 200,
        latency_ms: 342,
        payload_summary: '당근 비즈프로필 소식글 게시 (단골 1,000원 쿠폰 포함, 이미지 2장 첨부)',
        error_message: '',
        retry_count: 0,
        external_url: 'https://town.daangn.com/biz/sweet-bakery-1',
        created_at: '2026-10-12 16:45:12',
      },
      {
        id: 'disp-002',
        channel: 'naver_place',
        store_id: 'store-1',
        store_name: '배곧 달콤베이커리',
        title: '[배곧 맛집] 네이버 스마트플레이스 알림받기 쿠폰 이벤트',
        status: 'SUCCESS',
        status_code: 201,
        latency_ms: 512,
        payload_summary: '스마트플레이스 새소식 등록 (알림받기 시 소금빵 1개 증정 쿠폰 연동)',
        error_message: '',
        retry_count: 0,
        external_url: 'https://m.place.naver.com/restaurant/12345678/feed',
        created_at: '2026-10-12 15:30:00',
      },
      {
        id: 'disp-003',
        channel: 'instagram',
        store_id: 'store-2',
        store_name: '정왕동 불타는 쭈꾸미',
        title: '신메뉴 치즈폭탄 쭈꾸미 릴스 & 카드뉴스 발행',
        status: 'FAILED',
        status_code: 429,
        latency_ms: 1205,
        payload_summary: 'Instagram Graph API 릴스 업로드 (video/mp4, 15초, 해시태그 18개)',
        error_message: 'OAuthRateLimitException: Application request limit reached for Instagram Content Publishing API',
        retry_count: 2,
        external_url: '',
        created_at: '2026-10-12 14:15:22',
      },
    ]).catch(console.error);
  }

  // 10. AI 프롬프트 튜닝 템플릿 시드 (auto_prompt_templates)
  const promptCheck = await queryTable('auto_prompt_templates', { limit: 1 }).catch(() => ({ rows: [] }));
  if (!promptCheck.rows || promptCheck.rows.length === 0) {
    await insertRows('auto_prompt_templates', [
      {
        id: 'p-karrot',
        channel: 'karrot',
        name: '당근마켓 동네생활/비즈프로필 소식 엔진',
        category: '하이퍼로컬 커뮤니티',
        temperature: 0.7,
        max_tokens: 1024,
        top_p: 0.9,
        system_prompt: '당신은 대한민국 골목상권 로컬 마케팅 전문가입니다. 당근마켓 동네생활 및 비즈프로필 소식글을 작성할 때 친근하고 따뜻한 이웃 화법을 사용하고 당근 단골 혜택 쿠폰을 반드시 포함합니다.',
        user_prompt_template: '매장명: {storeName}\n업종: {industry}\n주요 메뉴/서비스: {coreItems}\n오늘의 이벤트/혜택: {eventBenefit}\n매장 위치/영업시간: {locationAndHours}\n\n위 정보를 바탕으로 동네 주민들의 마음을 사로잡는 당근마켓 비즈프로필 소식글을 작성해주세요.',
        variables: 'storeName,industry,coreItems,eventBenefit,locationAndHours',
        version: '1.2.0',
        updated_at: '2026-10-12 16:30:00',
        created_at: now,
      },
      {
        id: 'p-naver-place',
        channel: 'naver_place',
        name: '네이버 스마트플레이스 SEO & 새소식/쿠폰 엔진',
        category: '검색 지도 최적화',
        temperature: 0.5,
        max_tokens: 1024,
        top_p: 0.85,
        system_prompt: '당신은 네이버 플레이스 알고리즘과 로컬 검색 최적화(SEO) 수석 컨설턴트입니다. 지역명+핵심 키워드로 노출을 극대화하고 알림받기 쿠폰을 안내합니다.',
        user_prompt_template: '매장명: {storeName}\n위치(동/역세권): {region}\n대표 키워드: {keywords}\n쿠폰/프로모션: {couponInfo}\n영업시간 및 주차: {hoursAndParking}\n\n스마트플레이스 방문자 전환율을 극대화하는 새소식 본문과 상위노출 태그 10개를 생성해주세요.',
        variables: 'storeName,region,keywords,couponInfo,hoursAndParking',
        version: '1.1.4',
        updated_at: '2026-10-11 18:00:00',
        created_at: now,
      },
      {
        id: 'p-instagram',
        channel: 'instagram',
        name: '인스타그램 릴스 & 피드 카드뉴스 엔진',
        category: 'SNS 비주얼 바이럴',
        temperature: 0.8,
        max_tokens: 1536,
        top_p: 0.95,
        system_prompt: '당신은 인스타그램 트렌드 바이럴 마케터입니다. 첫 3초 시선 강탈 후킹과 1:1 카드뉴스 슬라이드별 카피, 25개 해시태그를 생성합니다.',
        user_prompt_template: '브랜드/매장: {brandName}\n타겟 고객: {targetAudience}\n핵심 소구점(USP): {usp}\n시각적 무드: {visualMood}\n\n릴스 캡션과 5슬라이드 카드뉴스 기획안을 작성해주세요.',
        variables: 'brandName,targetAudience,usp,visualMood',
        version: '2.0.1',
        updated_at: '2026-10-12 10:15:00',
        created_at: now,
      },
    ]).catch(console.error);
  }

  // 11. 점주 CS 문의 시드 (auto_inquiries & auto_inquiry_replies)
  const inqCheck = await queryTable('auto_inquiries', { limit: 1 }).catch(() => ({ rows: [] }));
  if (!inqCheck.rows || inqCheck.rows.length === 0) {
    await insertRows('auto_inquiries', [
      {
        id: 'inq-101',
        store_id: 'store-1',
        store_name: '배곧 달콤베이커리',
        author_name: '김점주 사장님',
        contact: '010-9876-5432',
        category: 'CHANNEL_CONNECT',
        category_label: '채널 연동',
        title: '네이버 스마트플레이스 새소식 연동 시 권한 오류가 발생합니다.',
        content: '플레이스 새소식 발행을 시도했는데 "인증 토큰 유효기간 만료" 오류가 뜹니다. 어떻게 재연동해야 하나요?',
        status: 'PENDING',
        priority: 'HIGH',
        sentiment: 'NEGATIVE',
        internal_note: '스마트플레이스 API 연동 가이드 SMS 발송 예정',
        created_at: '2026-10-12 15:40:00',
      },
      {
        id: 'inq-102',
        store_id: 'store-2',
        store_name: '정왕동 불타는 쭈꾸미',
        author_name: '박대표 사장님',
        contact: '010-1234-5678',
        category: 'BILLING',
        category_label: '결제/세무',
        title: '9월분 정기 구독 전자세금계산서 발행 내역 확인 부탁드립니다.',
        content: '국세청 홈택스에서 9월 결제 건 전자세금계산서가 아직 조회가 안 되어서요. 사업자등록번호 재확인 부탁드립니다.',
        status: 'RESOLVED',
        priority: 'NORMAL',
        sentiment: 'NEUTRAL',
        internal_note: '홈택스 재발행 완료 및 승인번호 문자 통보 완료',
        created_at: '2026-10-11 11:20:00',
      },
    ]).catch(console.error);

    await insertRows('auto_inquiry_replies', [
      {
        id: 'rep-01',
        inquiry_id: 'inq-102',
        author: '오토마케팅 고객성공팀',
        content: '사장님 안녕하세요! 확인 결과 9월 30일 자로 국세청 승인 완료(승인번호: 20261010-41000284-77610012) 처리되어 현재 홈택스에서 정상 조회되십니다. 번거롭게 해 드려 죄송합니다.',
        is_ai_draft: 0,
        created_at: '2026-10-11 13:00:00',
      }
    ]).catch(console.error);
  }

  // 12. SMS / 알림톡 발송 대장 시드 (auto_sms_logs)
  const smsCheck = await queryTable('auto_sms_logs', { limit: 1 }).catch(() => ({ rows: [] }));
  if (!smsCheck.rows || smsCheck.rows.length === 0) {
    await insertRows('auto_sms_logs', [
      {
        id: 'sms-001',
        type: 'LMS',
        recipient_store: '전체 점주 (3개 매장)',
        recipient_phone: '010-9876-**** 외 2건',
        sender_number: '1588-0000',
        content: '[오토마케팅 공지]\n사장님 안녕하세요! 가을 시즌 대비 당근마켓/플레이스 7대 채널 올인원 자동 생성 엔진이 런칭되었습니다.',
        bytes: 142,
        status: 'SENT',
        cost: 40,
        sent_at: '2026-10-12 14:00:00',
        created_at: now,
      },
      {
        id: 'sms-002',
        type: 'SMS',
        recipient_store: '배곧 달콤베이커리',
        recipient_phone: '010-9876-5432',
        sender_number: '1588-0000',
        content: '[오토마케팅] 내일 오전 10시 당근 단골 소식 예약 발행이 대기 중입니다.',
        bytes: 72,
        status: 'SENT',
        cost: 15,
        sent_at: '2026-10-12 12:30:15',
        created_at: now,
      },
    ]).catch(console.error);
  }

  // 13. 스마트 자동화 룰 시드 (auto_smart_rules)
  const ruleCheck = await queryTable('auto_smart_rules', { limit: 1 }).catch(() => ({ rows: [] }));
  if (!ruleCheck.rows || ruleCheck.rows.length === 0) {
    await insertRows('auto_smart_rules', [
      {
        id: 'rule-01',
        name: '🌧️ 비 오는 날 따뜻한 갓구운 빵 & 부침개 긴급 프로모션',
        condition_type: 'WEATHER',
        condition_summary: '기상청 강수 확률 70% 이상 또는 비 감지 시 (오전 10:30)',
        target_channel: 'karrot',
        action_template: '당근마켓 비즈프로필 소식 자동 등록: "비 오는 날 방문 고객 아메리카노 1잔 무료 쿠폰"',
        is_active: 1,
        last_triggered_at: '2026-10-10 10:30:00',
        total_triggered_count: 14,
        created_at: now,
      },
      {
        id: 'rule-02',
        name: '🔥 불타는 금요일 주말 모임 예약 유도 릴스/블로그',
        condition_type: 'DAY_TIME',
        condition_summary: '매주 금요일 오후 16:00 정기 트리거',
        target_channel: 'instagram',
        action_template: '인스타그램 릴스 캡션 & 네이버 블로그: 주말 단체 예약 혜택 콘텐츠 동시 디스패치',
        is_active: 1,
        last_triggered_at: '2026-10-09 16:00:00',
        total_triggered_count: 28,
        created_at: now,
      },
      {
        id: 'rule-03',
        name: '🏷️ 당일 마감 2시간 전 깜짝 타임세일 자동 쿠폰',
        condition_type: 'STOCK',
        condition_summary: '영업 종료 2시간 전 (매일 20:00)',
        target_channel: 'naver_place',
        action_template: '네이버 스마트플레이스 새소식 등록: "마감 세일 30% 즉시 할인 쿠폰" 자동 활성화',
        is_active: 0,
        last_triggered_at: '2026-10-08 20:00:00',
        total_triggered_count: 8,
        created_at: now,
      },
      {
        id: 'rule-04',
        name: '🎈 법정 공휴일 & 기념일 축하 프로모션',
        condition_type: 'HOLIDAY',
        condition_summary: '공휴일 D-1일 오전 11:00',
        target_channel: 'all',
        action_template: '7대 채널 1-Click 번들 생성 엔진 호출 ➔ 온·오프라인 에셋 동시 디스패치',
        is_active: 1,
        last_triggered_at: '2026-10-02 11:00:00',
        total_triggered_count: 5,
        created_at: now,
      },
    ]).catch(console.error);
  }

  // 14. 사업자 정보 및 법무 약관 시드 (auto_footer_configs)
  const TERMS_OF_SERVICE_FULL = `제1조 (목적)
본 약관은 (주)오토마케팅(이하 "회사")이 제공하는 소상공인 마케팅 자동화 서비스 'Auto-Marketing'(이하 "서비스")의 이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.

제2조 (용어의 정의)
1. "서비스"란 회사가 제공하는 AI 기반 소상공인 마케팅 에셋 생성(숏폼 대본/영상, 카드뉴스, 스마트스토어 상세페이지, 300DPI 인쇄용 PDF 등), 주간 오토파일럿 마케팅 캘린더, 외부 채널 자동 디스패치 및 관련 제반 기능을 의미합니다.
2. "회원(점주)"이란 본 약관에 동의하고 사업자 또는 개인 명의로 회원가입을 완료하여 서비스를 이용하는 소상공인 및 자영업자를 의미합니다.
3. "토큰(Token)"이란 서비스 내에서 AI 마케팅 에셋 생성, 외부 SNS 채널 자동 발행, SMS/알림톡 발송 등 유료 기능을 이용할 때 차감되는 디지털 결제 수단을 의미합니다.
4. "1-Click 번들"이란 1회의 명령으로 7대 온·오프라인 채널(인스타그램, 유튜브 쇼츠, 네이버 블로그, 당근마켓, 스마트플레이스, 스마트스토어, 인쇄물)용 마케팅 에셋을 일괄 생성하는 통합 패키지를 의미합니다.

제3조 (약관의 효력 및 개정)
1. 본 약관은 회원이 서비스 가입 시 동의함으로써 효력이 발생합니다.
2. 회사는 「약관의 규제에 관한 법률」, 「전자상거래 등에서의 소비자보호에 관한 법률」 등 관련 법령을 위배하지 않는 범위에서 본 약관을 개정할 수 있습니다.
3. 약관이 변경될 경우 최소 7일 전(중대한 불리한 변경의 경우 30일 전) 공지사항 또는 등록된 이메일/SMS를 통해 고지합니다.

제4조 (서비스의 내용 및 제공)
1. 회사는 회원에게 다음과 같은 서비스를 제공합니다:
   - 멀티모달 AI를 활용한 업종 맞춤형 마케팅 콘텐츠 기획 및 자동 생성
   - 주간 마케팅 오토파일럿 스케줄 캘린더 및 발행 큐 관리
   - 외부 마케팅 채널(인스타그램, 당근마켓, 네이버 플레이스 등) 자동 배포
   - 고해상도 인쇄물(명함, 전단지, 배너) 300DPI 규격 PDF 자동 조판
2. 서비스는 연중무휴 24시간 제공을 원칙으로 하되, 시스템 정기 점검 또는 외부 AI 모델 API 장애 시 사전 공지 후 일시 중단될 수 있습니다.

제5조 (토큰 충전 및 유효기간)
1. 회원은 다이렉트 무통장 입금(Agent M 자동 감지) 또는 신용카드 결제를 통해 마케팅 토큰을 유상 충전할 수 있습니다.
2. 유료로 충전한 토큰의 유효기간은 최종 충전일로부터 5년이며, 상법상 상사소멸시효가 적용됩니다.
3. 정기 구독 플랜 회원의 미사용 기본 지급 토큰은 구독 유지 기간 동안 다음 달로 자동 이월됩니다.

제6조 (AI 생성 에셋의 저작권 및 상업적 이용권)
1. 회원이 입력한 매장 고유 정보, 상호, 상품 사진 등의 원본 저작권은 회원에게 있습니다.
2. 서비스를 통해 생성된 AI 마케팅 에셋(이미지, 카피, 숏폼 영상, 상세페이지, 인쇄물)은 회원의 매장 홍보, 판매 촉진, 광고 집행 등 모든 상업적 목적에 전 세계 영구적으로 자유롭게 이용할 수 있습니다.
3. 단, 회원은 타인의 상표권, 초상권, 저작권을 침해하거나 공서양속을 해치는 불법 콘텐츠 제작에 서비스를 이용해서는 안 됩니다.

제7조 (회원의 의무 및 책임)
1. 회원은 서비스 이용 시 정확한 사업자 정보 및 연락처를 유지해야 합니다.
2. 회원은 계정 접속 정보(이메일, 비밀번호 등)를 제3자에게 양도하거나 대여할 수 없으며, 관리 소홀로 인한 책임은 회원 본인에게 있습니다.

제8조 (면책 조항)
1. 회사는 천재지변, 외부 AI 모델(Google Gemini, Flux 등)의 일시적 장애, 국가 네트워크 마비 등 불가항력으로 인한 서비스 지연이나 중단에 대해 책임을 지지 않습니다.
2. AI가 생성한 마케팅 콘텐츠의 매출 증대 효과나 법적 표현 적절성에 대한 최종 검토 및 게시 책임은 점주 회원 본인에게 있습니다.

제9조 (준거법 및 관할법원)
본 약관은 대한민국 법률에 따라 규율되며, 서비스 이용과 관련하여 회사와 회원 간 분쟁 발생 시 회사의 본사 소재지를 관할하는 법원을 전속 관할법원으로 합니다.`;

  const PRIVACY_POLICY_FULL = `(주)오토마케팅(이하 "회사")은 「개인정보 보호법」 제30조에 따라 정보주체의 개인정보를 보호하고 이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 다음과 같이 개인정보 처리방침을 수립·공개합니다.

제1조 (개인정보의 처리 목적)
회사는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 관련 법률에 따라 별도의 동의를 받는 등 필요한 조치를 이행합니다.
1. 회원 가입 및 관리: 회원 식별, 본인 확인, 서비스 부정 이용 방지, 각종 고지·통지.
2. 마케팅 자동화 서비스 제공: AI 콘텐츠 맞춤 생성, 매장 위치/업종 기반 타겟팅, 외부 SNS 채널 자동 배포.
3. 유료 결제 및 정산: 마케팅 토큰 충전 결제, 무통장 입금 확인(Agent M), 전자세금계산서 발급 및 국세청 전송.
4. 고객 지원: 점주 1:1 CS 문의 접수, AI 기반 자동 답변, SMS/알림톡 발송.

제2조 (처리하는 개인정보의 항목)
회사는 서비스 제공을 위해 다음의 개인정보 항목을 수집·처리합니다.
1. 필수 항목:
   - 점주 성명, 대표자명, 로그인 이메일, 휴대전화번호, 비밀번호
   - 매장명(상호), 사업자등록번호, 매장 주소, 대표 업종
   - 무통장 입금 송금자 성명, 은행명, 입금액, 입금 일시
2. 선택 항목:
   - 통신판매업신고번호, 네이버 스마트플레이스 연동 URL, 인스타그램 계정 ID, 당근마켓 비즈프로필 정보, 매장 대표 이미지
3. 서비스 이용 과정에서 자동 수집되는 항목:
   - IP 주소, 쿠키, 서비스 이용 기록, 접속 로그, AI 에셋 생성 이력

제3조 (개인정보의 보유 및 이용 기간)
1. 회사는 법령에 따른 개인정보 보유·이용 기간 또는 정보주체로부터 수집 시에 동의받은 기간 내에서 개인정보를 처리·보유합니다.
2. 관련 법령에 따른 의무 보존 기간:
   - 계약 또는 청약철회 등에 관한 기록: 5년 (전자상거래법)
   - 대금결제 및 재화 등의 공급에 관한 기록: 5년 (전자상거래법)
   - 소비자의 불만 또는 분쟁처리에 관한 기록: 3년 (전자상거래법)
   - 웹사이트 방문 기록: 3개월 (통신비밀보호법)

제4조 (개인정보의 제3자 제공)
회사는 정보주체의 동의가 있거나 법률의 특별한 규정에 해당하는 경우를 제외하고는 개인정보를 제3자에게 제공하지 않습니다. 단, 유료 서비스 정산 및 법적 의무 이행을 위해 다음과 같이 제공됩니다:
- 국세청 홈택스: 전자세금계산서 발행 및 세무 신고 (상호, 사업자번호, 대표자명, 공급가액, 이메일)
- 통신사/SMS 중계사: 입금 확인 및 주간 마케팅 알림 발송 (휴대전화번호)

제5조 (개인정보처리의 위탁)
회사는 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보 처리업무를 위탁하고 있습니다:
- 클라우드 인프라 호스팅: Google Cloud Platform (데이터 보관 및 백업)
- 결제 및 무통장 감지 엔진: 이지데스크(EGDesk) 보안 터널

제6조 (정보주체의 권리·의무 및 행사방법)
1. 정보주체는 회사에 대해 언제든지 개인정보 열람·정정·삭제·처리정지 요구 등의 권리를 행사할 수 있습니다.
2. 권리 행사는 마이페이지, 고객센터 문의, 또는 개인정보 보호책임자에게 서면, 전자우편을 통해 하실 수 있으며 회사는 이에 대해 지체 없이 조치합니다.

제7조 (개인정보의 안전성 확보 조치)
회사는 개인정보의 분실·도난·유출·위조·변조 또는 훼손을 방지하기 위하여 다음과 같은 안전성 확보 조치를 취하고 있습니다:
1. 비밀번호 및 고유 식별 정보의 단방향 암호화 저장
2. SSL/TLS 보안 프로토콜을 적용한 전송 구간 암호화
3. 침입 차단 시스템을 이용한 외부 해킹 방지 및 24시간 시스템 접근 감사 로그 기록

제8조 (개인정보 보호책임자)
회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
- 성명: 김보안 이사
- 직책: 최고보안책임자 (CPO)
- 연락처: 1588-0000 / privacy@auto-marketing.kr`;

  const REFUND_POLICY_FULL = `(주)오토마케팅(이하 "회사")은 「전자상거래 등에서의 소비자보호에 관한 법률」 및 「콘텐츠산업 진흥법」에 따라 다음과 같이 마케팅 토큰 및 유료 서비스의 청약철회 및 환불 규정을 명확히 안내합니다.

제1조 (환불 기본 원칙)
1. 회원은 유상으로 충전한 마케팅 토큰에 대해 관련 법령 및 본 규정에 따라 청약철회 및 환불을 요청할 수 있습니다.
2. 무료 체험 토큰(가입 축하 웰컴 토큰 50,000T 등), 프로모션 및 이벤트 보너스로 무상 지급된 토큰은 현금 환불 대상에서 제외됩니다.

제2조 (미사용 토큰의 7일 이내 전액 환불)
1. 회원이 다이렉트 무통장 입금 또는 신용카드로 토큰 패키지를 충전한 후, 충전일로부터 7일 이내에 충전된 토큰을 일체 사용하지 않은 경우 결제 수수료 공제 없이 결제 금액 100% 전액을 환불해 드립니다.
2. 무통장 입금으로 결제된 건은 환불 접수일로부터 1영업일(은행 영업일 기준) 이내에 고객이 지정한 본인 명의 계좌로 입금 반환됩니다.

제3조 (일부 사용 토큰의 중도 해지 및 잔여분 환불)
1. 충전된 토큰의 일부를 사용한 후 잔여 토큰에 대해 환불을 요청하는 경우, 다음 산식에 따라 정산하여 환불합니다:
   - [환불 가능 금액] = 실 결제금액 - (실제 사용 토큰 수량 × 정규 단가) - 결제 취소/송금 수수료(결제금액의 10% 또는 1,000원 중 큰 금액)
2. 정기 구독 플랜의 경우, 결제 주기의 시작일로부터 7일 이내이고 서비스를 이용하지 않은 경우 전액 환불되며, 이미 에셋 생성이나 발행 서비스를 1회 이상 이용한 경우에는 해당 월 구독료는 환불되지 않고 다음 결제 주기부터 해지 처리됩니다.

제4조 (AI 생성 에셋의 청약철회 제한)
1. 「전자상거래법」 제17조 제2항 제5호에 따라 회원의 개별 요청에 의해 이미 연산 및 생성이 완료된 디지털 콘텐츠(숏폼 비디오, 이미지 카드뉴스, 상세페이지 HTML, 300DPI 인쇄 PDF 등)는 콘텐츠 제공이 개시된 것으로 간주되어 해당 에셋 생성에 소모된 토큰은 청약철회 및 환불이 불가능합니다.
2. 단, 시스템 장애나 AI 서버 오류로 인하여 에셋이 비정상적으로 왜곡 생성되거나 실패한 경우, 고객센터 문의를 통해 즉시 해당 소모 토큰을 100% 재적립(원복)해 드립니다.

제5조 (오송금 및 과오납금 처리)
1. 회원이 다이렉트 무통장 입금 시 지정된 감지 금액을 초과하여 입금하거나 중복 송금한 경우(과오납금), 회사는 확인 즉시 초과분을 회원의 원래 송금 계좌로 1영업일 이내에 수수료 없이 반환합니다.
2. 송금자 성명 불일치 등으로 자동 감지가 보류된 입금 건은 관리자 승인 대기열에서 1영업일 이내에 수동 매칭하거나 전액 반환 처리됩니다.

제6조 (환불 신청 방법 및 고객센터 접수)
환불 및 청약철회를 희망하시는 점주님께서는 아래 접수처로 신청해 주시면 신속히 처리해 드립니다:
- 고객센터 문의: 서비스 내 [점주 CS 1:1 문의] 게시판
- 대표 고객지원 이메일: support@auto-marketing.kr
- 고객센터 유선 연락처: 1588-0000 (평일 09:30 ~ 18:00, 주말/공휴일 휴무)
- 접수 시 기재사항: 가입 이메일, 점주 성함, 환불 사유, 환불받으실 본인 명의 계좌번호(은행명, 예금주)`;

  const footerCheck = await queryTable('auto_footer_configs', { limit: 1 }).catch(() => ({ rows: [] }));
  if (!footerCheck.rows || footerCheck.rows.length === 0) {
    await insertRows('auto_footer_configs', [
      {
        id: 'default_footer',
        company_name: '(주)오토마케팅',
        ceo_name: '홍길동',
        biz_number: '123-86-09876',
        mail_order_number: '제 2026-경기시흥-0412호',
        address: '경기도 시흥시 배곧4로 32-27, 골든플라자 5층 501호',
        tel: '1588-0000',
        email: 'support@auto-marketing.kr',
        hosting_provider: 'Google Cloud Platform (GCP)',
        privacy_manager: '김보안 (privacy@auto-marketing.kr)',
        copyright_text: 'Copyright © 2026 Auto-Marketing Corp. All Rights Reserved.',
        deposit_bank_name: '카카오뱅크',
        deposit_account_number: '3333-12-1695965',
        deposit_account_holder: '차호석',
        sns_channels: JSON.stringify([
          { id: 'sns_youtube', type: 'youtube', name: '유튜브 공식 채널', url: 'https://youtube.com/@auto-marketing', enabled: true },
          { id: 'sns_instagram', type: 'instagram', name: '인스타그램 공식 계정', url: 'https://instagram.com/auto_marketing_kr', enabled: true },
          { id: 'sns_blog', type: 'blog', name: '네이버 공식 블로그', url: 'https://blog.naver.com/auto_marketing', enabled: true },
          { id: 'sns_kakao', type: 'kakao', name: '카카오톡 1:1 상담 채널', url: 'https://pf.kakao.com/_auto_marketing', enabled: true }
        ]),
        terms_of_service: TERMS_OF_SERVICE_FULL,
        privacy_policy: PRIVACY_POLICY_FULL,
        refund_policy: REFUND_POLICY_FULL,
        updated_at: now,
      }
    ]).catch(console.error);
  } else {
    // 기존 레코드에 전문, 계좌 정보, SNS 채널 업데이트
    try {
      const { executeSQL } = await import('@/lib/egdesk-helpers');
      const escapedTerms = TERMS_OF_SERVICE_FULL.replace(/'/g, "''");
      const escapedPrivacy = PRIVACY_POLICY_FULL.replace(/'/g, "''");
      const escapedRefund = REFUND_POLICY_FULL.replace(/'/g, "''");
      const defaultSns = JSON.stringify([
        { id: 'sns_youtube', type: 'youtube', name: '유튜브 공식 채널', url: 'https://youtube.com/@auto-marketing', enabled: true },
        { id: 'sns_instagram', type: 'instagram', name: '인스타그램 공식 계정', url: 'https://instagram.com/auto_marketing_kr', enabled: true },
        { id: 'sns_blog', type: 'blog', name: '네이버 공식 블로그', url: 'https://blog.naver.com/auto_marketing', enabled: true },
        { id: 'sns_kakao', type: 'kakao', name: '카카오톡 1:1 상담 채널', url: 'https://pf.kakao.com/_auto_marketing', enabled: true }
      ]).replace(/'/g, "''");

      // 컬럼 존재 여부 안전 보장
      try {
        await executeSQL('ALTER TABLE auto_footer_configs ADD COLUMN sns_channels TEXT;');
      } catch (_) {}

      await executeSQL(`
        UPDATE auto_footer_configs 
        SET terms_of_service = '${escapedTerms}',
            privacy_policy = '${escapedPrivacy}',
            refund_policy = '${escapedRefund}',
            deposit_bank_name = COALESCE(deposit_bank_name, '카카오뱅크'),
            deposit_account_number = COALESCE(deposit_account_number, '3333-12-1695965'),
            deposit_account_holder = COALESCE(deposit_account_holder, '차호석'),
            sns_channels = CASE 
              WHEN sns_channels IS NULL OR sns_channels = '' OR sns_channels = '[]' 
              THEN '${defaultSns}' 
              ELSE sns_channels 
            END
        WHERE id = 'default_footer';
      `);
    } catch (e) {
      console.warn('Update footer text error:', e);
    }
  }

  // 15. 무통장 입금 요청 대장 시드 (auto_deposit_requests)
  const depositCheck = await queryTable('auto_deposit_requests', { limit: 1 }).catch(() => ({ rows: [] }));
  if (!depositCheck.rows || depositCheck.rows.length === 0) {
    await insertRows('auto_deposit_requests', [
      {
        id: 'dep_sample_01',
        deposit_code: '홍108',
        depositor_name: '홍길동',
        user_email: 'guest@automarketing.com',
        user_name: '퐁신제빵소 사장님',
        package_id: 'pkg_standard',
        package_name: '스탠다드 성장팩 (150,000T)',
        original_amount_krw: 12000,
        discount_krw: 12,
        amount_krw: 11988,
        tokens_to_credit: 150000,
        bank_name: '카카오뱅크',
        account_number: '3333-12-1695965',
        account_holder: '차호석',
        phone_number: '010-1234-5678',
        receipt_sent: 1,
        receipt_sent_at: '2026-10-12 14:32:05',
        status: 'COMPLETED',
        actual_amount_krw: 11988,
        hold_reason: '',
        tx_hash: 'tx_kakao_10121432',
        expires_at: '2026-10-12 15:30:00',
        raw_sms: '[카카오뱅크] 10/12 14:31 3333-12-1695965 입금 11,988원 홍길동 잔액 1,234,000원',
        matched_at: '2026-10-12 14:31:45',
        created_at: '2026-10-12 14:28:10',
      },
      {
        id: 'dep_sample_02',
        deposit_code: '김429',
        depositor_name: '김철수',
        user_email: 'kim@bread.kr',
        user_name: '달콤베이커리 점주',
        package_id: 'pkg_pro',
        package_name: '프로 바이럴팩 (450,000T)',
        original_amount_krw: 30000,
        discount_krw: 24,
        amount_krw: 29976,
        tokens_to_credit: 450000,
        bank_name: '카카오뱅크',
        account_number: '3333-12-1695965',
        account_holder: '차호석',
        phone_number: '010-9876-5432',
        receipt_sent: 0,
        receipt_sent_at: '',
        status: 'PENDING',
        actual_amount_krw: 0,
        hold_reason: '',
        tx_hash: '',
        expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
        raw_sms: '',
        matched_at: '',
        created_at: new Date().toISOString(),
      }
    ]).catch(console.error);
  }
}

/**
 * ⚡ 오토마케팅 통합 데이터베이스 초기화 및 자동 스키마 마이그레이션 (18대 SQLite 테이블)
 */
export async function setupDatabase(force = false) {
  if (isDbInitialized && !force) return;
  if (dbInitPromise && !force) return dbInitPromise;

  dbInitPromise = (async () => {
    console.log('[Auto-Marketing] 🚀 Initializing Auto-Marketing Database (18-Table Engine)...');

    // 1. auto_users
    await safeCreateTable('Auto-Marketing 회원 대장', [
      { name: 'id', type: 'TEXT' },
      { name: 'email', type: 'TEXT' },
      { name: 'name', type: 'TEXT' },
      { name: 'avatar_url', type: 'TEXT' },
      { name: 'token_balance', type: 'INTEGER' },
      { name: 'plan', type: 'TEXT' },
      { name: 'created_at', type: 'TEXT' },
    ], { tableName: 'auto_users' });

    // 2. auto_businesses
    await safeCreateTable('Auto-Marketing 비즈니스 프로필 대장', [
      { name: 'id', type: 'TEXT' },
      { name: 'user_id', type: 'TEXT' },
      { name: 'name', type: 'TEXT' },
      { name: 'category', type: 'TEXT' },
      { name: 'place_id', type: 'TEXT' },
      { name: 'address', type: 'TEXT' },
      { name: 'road_address', type: 'TEXT' },
      { name: 'phone', type: 'TEXT' },
      { name: 'business_hours', type: 'TEXT' },
      { name: 'usp', type: 'TEXT' },
      { name: 'target_audience', type: 'TEXT' },
      { name: 'brand_tone', type: 'TEXT' },
      { name: 'naver_place_url', type: 'TEXT' },
      { name: 'created_at', type: 'TEXT' },
    ], { tableName: 'auto_businesses' });

    // 3. auto_products
    await safeCreateTable('Auto-Marketing 상품 카탈로그 대장', [
      { name: 'id', type: 'TEXT' },
      { name: 'business_id', type: 'TEXT' },
      { name: 'name', type: 'TEXT' },
      { name: 'price', type: 'INTEGER' },
      { name: 'description', type: 'TEXT' },
      { name: 'image_url', type: 'TEXT' },
      { name: 'created_at', type: 'TEXT' },
    ], { tableName: 'auto_products' });

    // 4. auto_references
    await safeCreateTable('Auto-Marketing 벤치마크 레퍼런스 대장', [
      { name: 'id', type: 'TEXT' },
      { name: 'business_id', type: 'TEXT' },
      { name: 'title', type: 'TEXT' },
      { name: 'url', type: 'TEXT' },
      { name: 'platform', type: 'TEXT' },
      { name: 'hook_dna', type: 'TEXT' },
      { name: 'layout_dna', type: 'TEXT' },
      { name: 'tags', type: 'TEXT' },
      { name: 'thumbnail_url', type: 'TEXT' },
      { name: 'created_at', type: 'TEXT' },
    ], { tableName: 'auto_references' });

    // 5. auto_assets
    await safeCreateTable('Auto-Marketing 마케팅 에셋 대장', [
      { name: 'id', type: 'TEXT' },
      { name: 'business_id', type: 'TEXT' },
      { name: 'type', type: 'TEXT' },
      { name: 'title', type: 'TEXT' },
      { name: 'spec', type: 'TEXT' },
      { name: 'component_code', type: 'TEXT' },
      { name: 'preview_url', type: 'TEXT' },
      { name: 'status', type: 'TEXT' },
      { name: 'created_at', type: 'TEXT' },
    ], { tableName: 'auto_assets' });

    // 6. auto_campaigns
    await safeCreateTable('Auto-Marketing 마케팅 캘린더 발행 대장', [
      { name: 'id', type: 'TEXT' },
      { name: 'business_id', type: 'TEXT' },
      { name: 'title', type: 'TEXT' },
      { name: 'platform', type: 'TEXT' },
      { name: 'channel_type', type: 'TEXT' },
      { name: 'theme', type: 'TEXT' },
      { name: 'scheduled_at', type: 'TEXT' },
      { name: 'time_slot', type: 'TEXT' },
      { name: 'tip', type: 'TEXT' },
      { name: 'status', type: 'TEXT' },
      { name: 'asset_id', type: 'TEXT' },
      { name: 'created_at', type: 'TEXT' },
    ], { tableName: 'auto_campaigns' });

    // 7. auto_faqs
    await safeCreateTable('Auto-Marketing 자주 묻는 질문 FAQ 대장', [
      { name: 'id', type: 'TEXT' },
      { name: 'category', type: 'TEXT' },
      { name: 'category_label', type: 'TEXT' },
      { name: 'question', type: 'TEXT' },
      { name: 'answer', type: 'TEXT' },
      { name: 'sort_order', type: 'INTEGER' },
      { name: 'is_published', type: 'INTEGER' },
      { name: 'created_at', type: 'TEXT' },
    ], { tableName: 'auto_faqs' });

    // 8. ai_token_usage_logs
    await safeCreateTable('Auto-Marketing AI 토큰 소비 로그 대장', [
      { name: 'id', type: 'TEXT' },
      { name: 'user_id', type: 'TEXT' },
      { name: 'model', type: 'TEXT' },
      { name: 'prompt_tokens', type: 'INTEGER' },
      { name: 'completion_tokens', type: 'INTEGER' },
      { name: 'total_tokens', type: 'INTEGER' },
      { name: 'cost_points', type: 'INTEGER' },
      { name: 'endpoint', type: 'TEXT' },
      { name: 'created_at', type: 'TEXT' },
    ], { tableName: 'ai_token_usage_logs' });

    // 9. auto_media (스토리지 미디어 라이브러리)
    await safeCreateTable('Auto-Marketing 미디어 스토리지 대장', [
      { name: 'id', type: 'TEXT' },
      { name: 'business_id', type: 'TEXT' },
      { name: 'name', type: 'TEXT' },
      { name: 'type', type: 'TEXT' },
      { name: 'mime_type', type: 'TEXT' },
      { name: 'url', type: 'TEXT' },
      { name: 'size_bytes', type: 'INTEGER' },
      { name: 'created_at', type: 'TEXT' },
    ], { tableName: 'auto_media' });

    // 10. auto_pricing_plans
    await safeCreateTable('Auto-Marketing SaaS 요금제 대장', [
      { name: 'id', type: 'TEXT' },
      { name: 'name', type: 'TEXT' },
      { name: 'monthly_price', type: 'INTEGER' },
      { name: 'token_quota', type: 'INTEGER' },
      { name: 'estimated_bundles', type: 'INTEGER' },
      { name: 'estimated_cost', type: 'INTEGER' },
      { name: 'margin_rate', type: 'REAL' },
      { name: 'created_at', type: 'TEXT' },
    ], { tableName: 'auto_pricing_plans' });

    // 11. auto_model_costs
    await safeCreateTable('Auto-Marketing AI 모델 원가 대장', [
      { name: 'id', type: 'TEXT' },
      { name: 'name', type: 'TEXT' },
      { name: 'provider', type: 'TEXT' },
      { name: 'type', type: 'TEXT' },
      { name: 'unit_cost', type: 'REAL' },
      { name: 'typical_calls', type: 'INTEGER' },
      { name: 'created_at', type: 'TEXT' },
    ], { tableName: 'auto_model_costs' });

    // 12. auto_tax_invoices
    await safeCreateTable('Auto-Marketing 전자세금계산서 대장', [
      { name: 'id', type: 'TEXT' },
      { name: 'invoice_number', type: 'TEXT' },
      { name: 'nts_approval_number', type: 'TEXT' },
      { name: 'store_name', type: 'TEXT' },
      { name: 'biz_number', type: 'TEXT' },
      { name: 'ceo_name', type: 'TEXT' },
      { name: 'email', type: 'TEXT' },
      { name: 'item_description', type: 'TEXT' },
      { name: 'supply_amount', type: 'INTEGER' },
      { name: 'vat_amount', type: 'INTEGER' },
      { name: 'total_amount', type: 'INTEGER' },
      { name: 'status', type: 'TEXT' },
      { name: 'issue_date', type: 'TEXT' },
      { name: 'created_at', type: 'TEXT' },
    ], { tableName: 'auto_tax_invoices' });

    // 13. auto_dispatch_logs
    await safeCreateTable('Auto-Marketing 외부 채널 디스패치 로그 대장', [
      { name: 'id', type: 'TEXT' },
      { name: 'channel', type: 'TEXT' },
      { name: 'store_id', type: 'TEXT' },
      { name: 'store_name', type: 'TEXT' },
      { name: 'title', type: 'TEXT' },
      { name: 'status', type: 'TEXT' },
      { name: 'status_code', type: 'INTEGER' },
      { name: 'latency_ms', type: 'INTEGER' },
      { name: 'payload_summary', type: 'TEXT' },
      { name: 'error_message', type: 'TEXT' },
      { name: 'retry_count', type: 'INTEGER' },
      { name: 'external_url', type: 'TEXT' },
      { name: 'created_at', type: 'TEXT' },
    ], { tableName: 'auto_dispatch_logs' });

    // 14. auto_prompt_templates
    await safeCreateTable('Auto-Marketing AI 프롬프트 템플릿 대장', [
      { name: 'id', type: 'TEXT' },
      { name: 'channel', type: 'TEXT' },
      { name: 'name', type: 'TEXT' },
      { name: 'category', type: 'TEXT' },
      { name: 'temperature', type: 'REAL' },
      { name: 'max_tokens', type: 'INTEGER' },
      { name: 'top_p', type: 'REAL' },
      { name: 'system_prompt', type: 'TEXT' },
      { name: 'user_prompt_template', type: 'TEXT' },
      { name: 'variables', type: 'TEXT' },
      { name: 'version', type: 'TEXT' },
      { name: 'updated_at', type: 'TEXT' },
      { name: 'created_at', type: 'TEXT' },
    ], { tableName: 'auto_prompt_templates' });

    // 15. auto_inquiries
    await safeCreateTable('Auto-Marketing 점주 CS 문의 티켓 대장', [
      { name: 'id', type: 'TEXT' },
      { name: 'store_id', type: 'TEXT' },
      { name: 'store_name', type: 'TEXT' },
      { name: 'author_name', type: 'TEXT' },
      { name: 'contact', type: 'TEXT' },
      { name: 'category', type: 'TEXT' },
      { name: 'category_label', type: 'TEXT' },
      { name: 'title', type: 'TEXT' },
      { name: 'content', type: 'TEXT' },
      { name: 'status', type: 'TEXT' },
      { name: 'priority', type: 'TEXT' },
      { name: 'sentiment', type: 'TEXT' },
      { name: 'internal_note', type: 'TEXT' },
      { name: 'created_at', type: 'TEXT' },
    ], { tableName: 'auto_inquiries' });

    // 16. auto_inquiry_replies
    await safeCreateTable('Auto-Marketing 점주 CS 문의 답변 대장', [
      { name: 'id', type: 'TEXT' },
      { name: 'inquiry_id', type: 'TEXT' },
      { name: 'author', type: 'TEXT' },
      { name: 'content', type: 'TEXT' },
      { name: 'is_ai_draft', type: 'INTEGER' },
      { name: 'created_at', type: 'TEXT' },
    ], { tableName: 'auto_inquiry_replies' });

    // 17. auto_sms_logs
    await safeCreateTable('Auto-Marketing SMS 알림톡 발송 대장', [
      { name: 'id', type: 'TEXT' },
      { name: 'type', type: 'TEXT' },
      { name: 'recipient_store', type: 'TEXT' },
      { name: 'recipient_phone', type: 'TEXT' },
      { name: 'sender_number', type: 'TEXT' },
      { name: 'content', type: 'TEXT' },
      { name: 'bytes', type: 'INTEGER' },
      { name: 'status', type: 'TEXT' },
      { name: 'cost', type: 'INTEGER' },
      { name: 'sent_at', type: 'TEXT' },
      { name: 'created_at', type: 'TEXT' },
    ], { tableName: 'auto_sms_logs' });

    // 18. auto_smart_rules
    await safeCreateTable('Auto-Marketing 스마트 자동화 규칙 대장', [
      { name: 'id', type: 'TEXT' },
      { name: 'name', type: 'TEXT' },
      { name: 'condition_type', type: 'TEXT' },
      { name: 'condition_summary', type: 'TEXT' },
      { name: 'target_channel', type: 'TEXT' },
      { name: 'action_template', type: 'TEXT' },
      { name: 'is_active', type: 'INTEGER' },
      { name: 'last_triggered_at', type: 'TEXT' },
      { name: 'total_triggered_count', type: 'INTEGER' },
      { name: 'created_at', type: 'TEXT' },
    ], { tableName: 'auto_smart_rules' });

    // 19. auto_footer_configs
    await safeCreateTable('Auto-Marketing 사업자 정보 및 법무 약관 대장', [
      { name: 'id', type: 'TEXT' },
      { name: 'company_name', type: 'TEXT' },
      { name: 'ceo_name', type: 'TEXT' },
      { name: 'biz_number', type: 'TEXT' },
      { name: 'mail_order_number', type: 'TEXT' },
      { name: 'address', type: 'TEXT' },
      { name: 'tel', type: 'TEXT' },
      { name: 'email', type: 'TEXT' },
      { name: 'hosting_provider', type: 'TEXT' },
      { name: 'privacy_manager', type: 'TEXT' },
      { name: 'copyright_text', type: 'TEXT' },
      { name: 'deposit_bank_name', type: 'TEXT' },
      { name: 'deposit_account_number', type: 'TEXT' },
      { name: 'deposit_account_holder', type: 'TEXT' },
      { name: 'sns_channels', type: 'TEXT' },
      { name: 'terms_of_service', type: 'TEXT' },
      { name: 'privacy_policy', type: 'TEXT' },
      { name: 'refund_policy', type: 'TEXT' },
      { name: 'updated_at', type: 'TEXT' },
    ], { tableName: 'auto_footer_configs' });

    // 20. auto_deposit_requests (무통장 입금 감지 & 토큰 자동 충전 대장)
    await safeCreateTable('Auto-Marketing 무통장 입금 자동 감지 및 충전 대장', [
      { name: 'id', type: 'TEXT', notNull: true, primaryKey: true },
      { name: 'deposit_code', type: 'TEXT', notNull: true },
      { name: 'depositor_name', type: 'TEXT' },
      { name: 'user_email', type: 'TEXT', notNull: true },
      { name: 'user_name', type: 'TEXT' },
      { name: 'package_id', type: 'TEXT', notNull: true },
      { name: 'package_name', type: 'TEXT', notNull: true },
      { name: 'original_amount_krw', type: 'INTEGER' },
      { name: 'discount_krw', type: 'INTEGER' },
      { name: 'amount_krw', type: 'INTEGER', notNull: true },
      { name: 'tokens_to_credit', type: 'INTEGER', notNull: true },
      { name: 'bank_name', type: 'TEXT' },
      { name: 'account_number', type: 'TEXT' },
      { name: 'account_holder', type: 'TEXT' },
      { name: 'phone_number', type: 'TEXT' },
      { name: 'receipt_sent', type: 'INTEGER' },
      { name: 'receipt_sent_at', type: 'TEXT' },
      { name: 'status', type: 'TEXT', notNull: true }, // 'PENDING', 'COMPLETED', 'HOLD', 'CANCELLED'
      { name: 'actual_amount_krw', type: 'INTEGER' },
      { name: 'hold_reason', type: 'TEXT' },
      { name: 'tx_hash', type: 'TEXT' },
      { name: 'expires_at', type: 'TEXT' },
      { name: 'raw_sms', type: 'TEXT' },
      { name: 'matched_at', type: 'TEXT' },
      { name: 'created_at', type: 'TEXT' },
    ], { tableName: 'auto_deposit_requests' });

    // 시드 데이터 주입
    await seedInitialData();

    isDbInitialized = true;
    console.log('[Auto-Marketing] ✅ 19대 통합 데이터베이스 초기화 및 시드 주입 완료!');
  })();

  return dbInitPromise;
}
