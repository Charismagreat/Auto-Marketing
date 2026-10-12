import {
  createTable,
  queryTable,
  insertRows,
  executeSQL,
  callUserDataTool,
} from './egdesk-helpers';

export { queryTable, insertRows };

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
    }
  }
}

/**
 * 퐁신제빵소 테스트 소상공인 및 기본 데이터 시드 주입
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
    // 기존 유저가 존재하면 이메일을 guest@automarketing.com으로 동기화
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
        category: '이용방법',
        question: '오토마케팅은 어떻게 시작하나요?',
        answer: '구글 계정으로 1초 만에 로그인한 뒤, 사업자등록증 사진이나 매장 소개 한 줄을 입력하시면 AI가 30초 만에 브랜드 아이덴티티와 첫 마케팅 콘텐츠를 자동으로 기획합니다.',
        sort_order: 1,
        is_published: 1,
        created_at: now,
      },
      {
        id: 'faq_2',
        category: '영상/이미지',
        question: 'AI가 만든 영상이나 카드뉴스의 글자/가격을 고칠 수 있나요?',
        answer: '네, 100% 가능합니다! 오토마케팅은 비디오와 이미지를 전부 코드로 렌더링하기 때문에, 채팅창에 "글자 색상 바꿔줘", "가격 11,000원으로 고쳐줘"라고 말씀하시면 0초 만에 실시간으로 수정됩니다.',
        sort_order: 2,
        is_published: 1,
        created_at: now,
      },
      {
        id: 'faq_3',
        category: '소셜발행',
        question: '인스타그램과 블로그에 자동 발행되기 전에 미리 검수할 수 있나요?',
        answer: '네! 완전 자동 발행 모드 외에도 사장님이 스마트폰에서 확인 후 [승인] 버튼을 눌러야만 배포되는 "안심 승인 큐"가 기본 지원됩니다.',
        sort_order: 3,
        is_published: 1,
        created_at: now,
      },
      {
        id: 'faq_4',
        category: '인쇄/상세페이지',
        question: '스마트스토어 상세페이지나 매장 X-배너 인쇄 파일도 나오나요?',
        answer: '네, 스마트스토어/쿠팡 규격에 맞춘 860px 고화질 분할 이미지팩과, 인쇄소(오프린트미, 비즈하우스 등)에 바로 접수 가능한 300 DPI 인쇄 전용 PDF가 원클릭으로 출력됩니다.',
        sort_order: 4,
        is_published: 1,
        created_at: now,
      },
      {
        id: 'faq_5',
        category: '과금/토큰',
        question: '토큰은 어떻게 차감되나요?',
        answer: '가입 즉시 50,000 웰컴 토큰이 무료 지급되어 마케팅 콘텐츠를 마음껏 체험해 보실 수 있습니다. 이후 이미지 생성(약 1,000T), 영상 생성(약 3,000T) 등 사용한 만큼만 투명하게 차감됩니다.',
        sort_order: 5,
        is_published: 1,
        created_at: now,
      }
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
      },
      {
        id: 'camp_4',
        business_id: 'biz_pongshin_baegot',
        title: '카스테라 냉동실에 얼려 먹으면 생기는 놀라운 일',
        platform: 'card',
        channel_type: '1:1 카드뉴스',
        theme: '인스타그램 6컷 카드뉴스 정보성 콘텐츠',
        scheduled_at: '2026-10-15',
        time_slot: '오후 08:30 (저녁 릴렉스 시간대)',
        tip: '저장수(Save)를 극대화하여 인스타 탐색 탭 노출을 노립니다.',
        status: 'scheduled',
        asset_id: '',
        created_at: now,
      },
      {
        id: 'camp_5',
        business_id: 'biz_pongshin_baegot',
        title: '주말 홈카페 선물세트 3종 한정 수량 오픈',
        platform: 'store',
        channel_type: '스마트스토어 860px',
        theme: '스마트스토어 주말 택배 발송 & 상세페이지 점검',
        scheduled_at: '2026-10-16',
        time_slot: '오전 10:00 (당일 발송 마감 전)',
        tip: '특수 에어팩 안심 배송 이미지를 강조하여 선물 구매율을 높입니다.',
        status: 'scheduled',
        asset_id: '',
        created_at: now,
      },
      {
        id: 'camp_6',
        business_id: 'biz_pongshin_baegot',
        title: '피크닉 갈 때 퐁신 카스테라 테이크아웃! 아메리카노 1,000원',
        platform: 'print',
        channel_type: '매장 앞 X배너',
        theme: '배곧 생명공원 피크닉 방문객 현장 이벤트',
        scheduled_at: '2026-10-17',
        time_slot: '오전 11:00',
        tip: '주말 가족 나들이 손님의 워크인(Walk-in) 방문을 유도합니다.',
        status: 'ready',
        asset_id: '',
        created_at: now,
      }
    ]).catch(console.error);
  }

  // 6. 매장 실물 미디어 스토리지 시드 (auto_media)
  const mediaCheck = await queryTable('auto_media', { limit: 1 }).catch(() => ({ rows: [] }));
  if (!mediaCheck.rows || mediaCheck.rows.length === 0) {
    await insertRows('auto_media', [
      {
        id: 'med_pongshin_original',
        business_id: 'biz_pongshin_baegot',
        name: '퐁신 오리지널 카스테라 갓 구운 실물 컷.jpg',
        type: 'image',
        mime_type: 'image/jpeg',
        url: 'https://ldb-phinf.pstatic.net/20250613_51/1749793026669I569w_JPEG/%C6%FE%BD%C5%BD%C9%BA%BC1.jpg',
        size_bytes: 425000,
        created_at: now,
      },
      {
        id: 'med_pongshin_cream',
        business_id: 'biz_pongshin_baegot',
        name: '생크림 폭탄 카스테라 단면 클로즈업.jpg',
        type: 'image',
        mime_type: 'image/jpeg',
        url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop&q=80',
        size_bytes: 580000,
        created_at: now,
      },
      {
        id: 'med_pongshin_cheese',
        business_id: 'biz_pongshin_baegot',
        name: '단짠 체다치즈 흘러내리는 순간.jpg',
        type: 'image',
        mime_type: 'image/jpeg',
        url: 'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=800&auto=format&fit=crop&q=80',
        size_bytes: 512000,
        created_at: now,
      }
    ]).catch(console.error);
  }
}

/**
 * ⚡ 오토마케팅 통합 데이터베이스 초기화 및 자동 스키마 마이그레이션
 */
export async function setupDatabase(force = false) {
  if (isDbInitialized && !force) return;
  if (dbInitPromise && !force) return dbInitPromise;

  dbInitPromise = (async () => {
    console.log('[Auto-Marketing] 🚀 Initializing Auto-Marketing Database...');

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

    // 시드 데이터 주입
    await seedInitialData();

    isDbInitialized = true;
    console.log('[Auto-Marketing] ✅ Database initialization and seed completed!');
  })();

  return dbInitPromise;
}
