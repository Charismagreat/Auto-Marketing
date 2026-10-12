/**
 * Auto-Marketing 전 기능 종합 테스트 러너 (Pure JS)
 * Target: http://localhost:4002
 */

const BASE_URL = 'http://localhost:4002';

const results = [];

async function runTest(suite, name, fn) {
  const start = Date.now();
  try {
    const res = await fn();
    const durationMs = Date.now() - start;
    results.push({
      suite,
      name,
      passed: true,
      status: res.status,
      durationMs,
      details: res.details,
    });
    console.log(`  ✅ [PASS] ${suite} > ${name} (${durationMs}ms)`);
    if (res.details) console.log(`     └─ ${res.details}`);
  } catch (err) {
    const durationMs = Date.now() - start;
    results.push({
      suite,
      name,
      passed: false,
      durationMs,
      error: err.message,
    });
    console.error(`  ❌ [FAIL] ${suite} > ${name} (${durationMs}ms):`, err.message);
  }
}

async function main() {
  console.log('🚀 [Auto-Marketing] 전 기능 종합 엔드포인트 테스트 시작...\n');

  // ==========================================
  // 시나리오 1: 초기 부트스트랩 & 푸터/사업자 정보
  // ==========================================
  await runTest('1. 부트스트랩 & 비즈니스', 'GET /api/bootstrap', async () => {
    const res = await fetch(`${BASE_URL}/api/bootstrap`);
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(`Status: ${res.status}, error: ${json.error}`);
    if (!json.bundle?.business) throw new Error('비즈니스 정보 누락');
    return { status: res.status, details: `매장명: ${json.bundle.business.name}, 에셋: ${json.bundle.assets?.length || 0}개` };
  });

  await runTest('1. 부트스트랩 & 비즈니스', 'GET /api/admin/footer', async () => {
    const res = await fetch(`${BASE_URL}/api/admin/footer`);
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(`Status: ${res.status}`);
    const data = json.data;
    if (!data.companyName || !data.termsOfService || !data.depositAccountNumber) {
      throw new Error('푸터/약관/계좌 필수 데이터 누락');
    }
    return {
      status: res.status,
      details: `상호: ${data.companyName}, 수령계좌: ${data.depositBankName} ${data.depositAccountNumber} (${data.depositAccountHolder}), SNS채널: ${data.sns_channels?.length || 0}개`
    };
  });

  // ==========================================
  // 시나리오 2: 100% SQLite 벤치마크 레퍼런스
  // ==========================================
  let createdRefId = '';
  await runTest('2. 벤치마크 레퍼런스', 'GET /api/references', async () => {
    const res = await fetch(`${BASE_URL}/api/references`);
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(`Status: ${res.status}`);
    if (!Array.isArray(json.curated_benchmarks) || json.curated_benchmarks.length === 0) {
      throw new Error('큐레이션 벤치마크 DB 데이터가 비어있음');
    }
    return { status: res.status, details: `큐레이션: ${json.curated_benchmarks.length}개, 점주등록: ${json.user_references?.length || 0}개` };
  });

  await runTest('2. 벤치마크 레퍼런스', 'POST /api/references (신규 등록)', async () => {
    const res = await fetch(`${BASE_URL}/api/references`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: 'https://youtube.com/shorts/TestCastellaViral',
        title: '[테스트] 2초 만에 주문 폭주한 꿀팁 숏폼 레퍼런스',
        channel: 'youtube',
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(`Status: ${res.status}, error: ${json.error}`);
    createdRefId = json.reference?.id;
    return { status: res.status, details: `생성된 레퍼런스 ID: ${createdRefId}` };
  });

  // ==========================================
  // 시나리오 3: 마케팅 에셋 보관함 (Asset Library)
  // ==========================================
  let createdAssetId = '';
  await runTest('3. 마케팅 에셋 보관함', 'GET /api/assets', async () => {
    const res = await fetch(`${BASE_URL}/api/assets`);
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(`Status: ${res.status}`);
    return { status: res.status, details: `현재 저장된 에셋: ${json.assets?.length || 0}개` };
  });

  await runTest('3. 마케팅 에셋 보관함', 'POST /api/assets (테스트 에셋 생성)', async () => {
    const res = await fetch(`${BASE_URL}/api/assets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        business_id: 'biz_pongshin_baegot',
        type: 'card',
        title: '[종합테스트] 인스타그램 6컷 카드뉴스 테스트 에셋',
        spec: '1080x1080px Square Carousel',
        component_code: JSON.stringify({ cuts: 6, hook: '테스트 훅 문구' }),
        preview_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600',
        status: 'published',
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(`Status: ${res.status}, error: ${json.error}`);
    createdAssetId = json.assetId || json.asset?.id;
    return { status: res.status, details: `에셋 ID: ${createdAssetId}` };
  });

  if (createdAssetId) {
    await runTest('3. 마케팅 에셋 보관함', `DELETE /api/assets?id=${createdAssetId} (에셋 정리)`, async () => {
      const res = await fetch(`${BASE_URL}/api/assets?id=${createdAssetId}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(`Status: ${res.status}`);
      return { status: res.status, details: '테스트 에셋 삭제 완료' };
    });
  }

  // ==========================================
  // 시나리오 4: 주간 오토파일럿 마케팅 캘린더
  // ==========================================
  let createdCampId = '';
  await runTest('4. 마케팅 캘린더', 'GET /api/campaigns', async () => {
    const res = await fetch(`${BASE_URL}/api/campaigns`);
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(`Status: ${res.status}`);
    return { status: res.status, details: `등록된 캠페인: ${json.campaigns?.length || 0}건` };
  });

  await runTest('4. 마케팅 캘린더', 'POST /api/campaigns (새 캠페인 등록)', async () => {
    const res = await fetch(`${BASE_URL}/api/campaigns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: '[테스트] 주말 단체 간식 주문 릴스 발행',
        platform: 'instagram',
        channelType: '15초 숏폼 릴스',
        scheduledAt: '2026-10-18',
        timeSlot: '오전 11:30',
        tip: '인근 학원/병원 단체 주문 타겟팅',
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(`Status: ${res.status}, error: ${json.error}`);
    createdCampId = json.campaign?.id;
    return { status: res.status, details: `신규 캠페인 ID: ${createdCampId}` };
  });

  if (createdCampId) {
    await runTest('4. 마케팅 캘린더', 'PUT /api/campaigns (상태 변경 -> 발행 승인)', async () => {
      const res = await fetch(`${BASE_URL}/api/campaigns`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: createdCampId, status: 'published' }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(`Status: ${res.status}`);
      return { status: res.status, details: '상태 published로 갱신 완료' };
    });
  }

  // ==========================================
  // 시나리오 5: 토큰 결제 & Agent M 무통장 입금 감지
  // ==========================================
  let testDepositAmount = 12000;
  let testDepositCode = '';
  await runTest('5. 토큰 결제 & Agent M', 'POST /api/wallet/direct-deposit (입금 요청 생성)', async () => {
    const res = await fetch(`${BASE_URL}/api/wallet/direct-deposit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        packageId: 'pkg_standard',
        depositorName: '테스트점주',
        userEmail: 'tester@automarketing.kr',
        userName: '테스트 사장님',
        phoneNumber: '010-1234-5678',
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(`Status: ${res.status}, error: ${json.error}`);
    const dep = json.deposit;
    testDepositAmount = dep.amountKrw;
    testDepositCode = dep.depositCode;
    return {
      status: res.status,
      details: `요청ID: ${dep.requestId}, 입금코드: ${testDepositCode}, 안내계좌: ${dep.bankName} ${dep.accountNumber} (${dep.accountHolder}), 실입금액: ${testDepositAmount}원`
    };
  });

  await runTest('5. 토큰 결제 & Agent M', 'POST /api/wallet/deposit-agent (Agent M SMS 자동 충전 시뮬레이션)', async () => {
    const smsText = `[카카오뱅크] 10/12 20:30 입금 ${testDepositAmount.toLocaleString()}원(${testDepositCode}) 잔액 3,500,000원`;
    const res = await fetch(`${BASE_URL}/api/wallet/deposit-agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'SIMULATE_SMS',
        simulatedSms: smsText,
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(`Status: ${res.status}, message: ${json.message || json.error}`);
    return {
      status: res.status,
      details: `${json.message}`
    };
  });

  // ==========================================
  // 시나리오 6: 슈퍼 관리자 10개 대장 API 전수 검증
  // ==========================================
  const adminEndpoints = [
    { name: '대시보드 KPI 실시간 집계', url: '/api/admin/overview' },
    { name: '요금제 및 모델 원가', url: '/api/admin/pricing-cost' },
    { name: '전자세금계산서 대장', url: '/api/admin/tax-invoices' },
    { name: '외부 디스패치 로그 대장', url: '/api/admin/dispatch-logs' },
    { name: 'AI 프롬프트 템플릿 대장', url: '/api/admin/prompts' },
    { name: '점주 CS 문의 티켓 대장', url: '/api/admin/inquiries' },
    { name: 'SMS 알림톡 발송 대장', url: '/api/admin/sms' },
    { name: '스마트 자동화 룰 대장', url: '/api/admin/smart-rules' },
    { name: '자주 묻는 질문 FAQ 대장', url: '/api/admin/faqs' },
    { name: '사업자 정보 및 푸터/약관', url: '/api/admin/footer' },
  ];

  for (const ep of adminEndpoints) {
    await runTest('6. 슈퍼 관리자 관제탑', `GET ${ep.url} (${ep.name})`, async () => {
      const res = await fetch(`${BASE_URL}${ep.url}`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(`Status: ${res.status}, error: ${json.error}`);
      return { status: res.status, details: '정상 200 OK 수신' };
    });
  }

  // ==========================================
  // 종합 결과 리포트 출력
  // ==========================================
  console.log('\n==========================================');
  console.log('📊 [Auto-Marketing] 전 기능 종합 테스트 결과 요약');
  console.log('==========================================');
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;
  console.log(`총 테스트 케이스: ${total}개`);
  console.log(`성공(PASS): ${passed}개`);
  console.log(`실패(FAIL): ${failed}개`);
  console.log(`성공률: ${((passed / total) * 100).toFixed(1)}%\n`);

  if (failed > 0) {
    console.log('❌ 실패한 항목:');
    results.filter((r) => !r.passed).forEach((r) => {
      console.log(` - [${r.suite}] ${r.name}: ${r.error}`);
    });
  }
}

main().catch(console.error);
