/**
 * Auto-Marketing 깊이 있는 전 기능 C/U/D 실측 검증 스위트
 * Target: http://localhost:4002
 */

const BASE = 'http://localhost:4002';
const results = [];

async function test(name, fn) {
  const start = Date.now();
  try {
    const res = await fn();
    const duration = Date.now() - start;
    results.push({ name, passed: true, duration, details: res?.details });
    console.log(`  ✅ [PASS] ${name} (${duration}ms)`);
    if (res?.details) console.log(`     └─ ${res.details}`);
  } catch (err) {
    const duration = Date.now() - start;
    results.push({ name, passed: false, duration, error: err.message });
    console.error(`  ❌ [FAIL] ${name} (${duration}ms):`, err.message);
  }
}

async function main() {
  console.log('🔬 [Auto-Marketing] 심층 C/U/D 실측 전수 테스트 시작...\n');

  // 1. FAQ 등록 및 삭제 테스트
  let createdFaqId = '';
  await test('1. FAQ 등록 (POST /api/admin/faqs)', async () => {
    const res = await fetch(`${BASE}/api/admin/faqs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: '테스트 질문입니다',
        answer: '테스트 답변입니다',
        category: 'CONNECT',
        categoryLabel: '채널 연동'
      })
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'FAQ 등록 실패');
    createdFaqId = data.faq?.id;
    return { details: `생성된 FAQ ID: ${createdFaqId}` };
  });

  await test('2. FAQ 삭제 (DELETE /api/admin/faqs)', async () => {
    if (!createdFaqId) throw new Error('생성된 FAQ ID가 없습니다');
    const res = await fetch(`${BASE}/api/admin/faqs?id=${createdFaqId}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'FAQ 삭제 실패');
    return { details: 'FAQ 정상 삭제 완료' };
  });

  // 2. 푸터 및 사업자 정보 수정 (POST /api/admin/footer)
  await test('3. 푸터 정보 수정 (POST /api/admin/footer)', async () => {
    const res = await fetch(`${BASE}/api/admin/footer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyName: '(주)오토마케팅',
        ceoName: '차호석',
        depositBankName: '카카오뱅크',
        depositAccountNumber: '3333-12-1695965'
      })
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || '푸터 저장 실패');
    return { details: data.message };
  });

  // 3. 스마트 자동화 룰 토글 및 실행
  let testRuleId = 'rule-weather-rain';
  await test('4. 스마트 룰 토글 (POST /api/admin/smart-rules)', async () => {
    const res = await fetch(`${BASE}/api/admin/smart-rules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'toggle', ruleId: testRuleId })
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || '스마트 룰 토글 실패');
    return { details: data.message };
  });

  await test('5. 스마트 룰 1회 즉시 실행 (POST /api/admin/smart-rules)', async () => {
    const res = await fetch(`${BASE}/api/admin/smart-rules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'run_now', ruleId: testRuleId })
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || '스마트 룰 실행 실패');
    return { details: data.message };
  });

  // 4. 모델 원가 및 요금제 수정 (PUT /api/admin/pricing-cost)
  await test('6. 모델 원가/요금제 수정 (PUT /api/admin/pricing-cost)', async () => {
    const res = await fetch(`${BASE}/api/admin/pricing-cost`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        modelCosts: [{ id: 'cost-flux-image', unitCostKrw: 12, typicalCallsPerBundle: 2 }],
        plans: [{ id: 'plan-starter', monthlyPriceKrw: 29000, monthlyTokenQuota: 50000, estimatedBundles: 3, estimatedMonthlyCostKrw: 3200, marginRate: 88.9 }]
      })
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || '원가 수정 실패');
    return { details: data.message };
  });

  // 5. 프롬프트 튜닝 수정 (POST /api/admin/prompts)
  await test('7. 프롬프트 튜닝 수정 (POST /api/admin/prompts)', async () => {
    const res = await fetch(`${BASE}/api/admin/prompts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'p-karrot',
        temperature: 0.75,
        systemPrompt: '당신은 동네 소상공인을 위한 최고의 당근마켓 카피라이터입니다.'
      })
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || '프롬프트 수정 실패');
    return { details: data.message };
  });

  // 6. 전자세금계산서 승인 (POST /api/admin/tax-invoices)
  await test('8. 전자세금계산서 승인 (POST /api/admin/tax-invoices)', async () => {
    // 임의의 테스트 인보이스 승인
    const listRes = await fetch(`${BASE}/api/admin/tax-invoices`);
    const listData = await listRes.json();
    const targetInv = listData.invoices?.[0];
    if (!targetInv) return { details: '인보이스 목록 없음, 건너뜀' };

    const res = await fetch(`${BASE}/api/admin/tax-invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve', invoiceId: targetInv.id })
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || '계산서 승인 실패');
    return { details: `승인번호: ${data.ntsApprovalNumber}` };
  });

  // 7. CS 문의 상태 변경 (POST /api/admin/inquiries)
  await test('9. CS 문의 상태 변경 (POST /api/admin/inquiries)', async () => {
    const listRes = await fetch(`${BASE}/api/admin/inquiries`);
    const listData = await listRes.json();
    const targetInq = listData.inquiries?.[0];
    if (!targetInq) return { details: '문의 티켓 없음, 건너뜀' };

    const res = await fetch(`${BASE}/api/admin/inquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update_status',
        inquiryId: targetInq.id,
        newStatus: 'IN_PROGRESS',
        internalNote: '상담원 배정 완료'
      })
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || '문의 상태 변경 실패');
    return { details: data.message };
  });

  // 8. 무통장 입금 상태 변경 (PUT /api/wallet/direct-deposit)
  await test('10. 무통장 입금 보류 처리 (PUT /api/wallet/direct-deposit)', async () => {
    // 1건 신규 생성 후 보류 테스트
    const createRes = await fetch(`${BASE}/api/wallet/direct-deposit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userEmail: 'guest@automarketing.com',
        userName: '퐁신제빵소 사장님',
        packageId: 'pkg_starter',
        depositorName: '차호석',
      })
    });
    const createData = await createRes.json();
    const reqId = createData.depositRequest?.id;
    if (!reqId) throw new Error('입금 요청 생성 실패');

    const holdRes = await fetch(`${BASE}/api/wallet/direct-deposit`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requestId: reqId,
        action: 'HOLD',
        holdReason: '입금자명 불일치 확인 중'
      })
    });
    const holdData = await holdRes.json();
    if (!holdRes.ok || !holdData.success) throw new Error(holdData.error || '보류 처리 실패');
    return { details: `요청ID ${reqId} 보류 처리 완료` };
  });

  // 9. 점주 토큰 수동 지급 및 차감 실측 (POST /api/admin/overview)
  await test('11. 점주 토큰 지급 (POST /api/admin/overview)', async () => {
    const res = await fetch(`${BASE}/api/admin/overview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'adjust_token',
        userId: 'usr_pongshin_master',
        amount: 20000,
        reason: '심층 테스트 지급'
      })
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || '토큰 지급 실패');
    return { details: data.message };
  });

  await test('12. 점주 토큰 차감 (POST /api/admin/overview)', async () => {
    const res = await fetch(`${BASE}/api/admin/overview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'adjust_token',
        userId: 'usr_pongshin_master',
        amount: -20000,
        reason: '심층 테스트 차감'
      })
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || '토큰 차감 실패');
    return { details: data.message };
  });

  console.log('\n==========================================');
  console.log('📊 [Auto-Marketing] 심층 C/U/D 실측 테스트 결과');
  console.log('==========================================');
  const passed = results.filter(r => r.passed).length;
  console.log(`총 테스트: ${results.length}개`);
  console.log(`성공: ${passed}개`);
  console.log(`실패: ${results.length - passed}개`);
  console.log(`성공률: ${((passed / results.length) * 100).toFixed(1)}%`);
}

main().catch(console.error);
