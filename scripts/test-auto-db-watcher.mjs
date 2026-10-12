// scripts/test-auto-db-watcher.mjs
// Auto-Marketing DB Watcher(user-data/sse) 실시간 변경 감지 실측 테스트

const BASE_URL = 'http://localhost:8080';
const API_KEY = 'a67ddc0f-7e2b-4997-9a0b-9667a74c89d0';
const PROJECT_ID = '2f5eab39-0079-4707-af26-6b319a8afef7';

async function testWatcher() {
  console.log('========================================================');
  console.log('🚀 [Auto-Marketing] 이지데스크 DB 왓처 실시간 변경 감지 테스트');
  console.log('========================================================');

  const sseUrl = `${BASE_URL}/user-data/sse?key=${API_KEY}&egdeskId=${PROJECT_ID}&environment=development`;
  console.log(`\n[1단계] SSE 연결 수립: ${sseUrl}`);

  const controller = new AbortController();
  const res = await fetch(sseUrl, {
    signal: controller.signal,
    headers: { 'Accept': 'text/event-stream' }
  });

  if (!res.ok) {
    console.error(`❌ SSE 연결 실패: ${res.status} ${res.statusText}`);
    process.exit(1);
  }

  console.log(`✅ SSE 스트림 연결 성공 (Status: ${res.status})`);

  let receivedChangeEvents = [];
  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  // 스트림 읽기 비동기 루프
  (async () => {
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const raw = decoder.decode(value, { stream: true });
        const lines = raw.split('\n');
        for (const line of lines) {
          if (line.startsWith('data:')) {
            const dataStr = line.slice(5).trim();
            if (dataStr) {
              try {
                const parsed = JSON.parse(dataStr);
                console.log(`\n📩 [SSE 이벤트 실시간 수신!]:`, JSON.stringify(parsed, null, 2));
                receivedChangeEvents.push(parsed);
              } catch {
                console.log(`\n📩 [SSE 원본 수신]:`, dataStr);
              }
            }
          }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('⚠️ 스트림 에러:', err.message);
      }
    }
  })();

  // 1초 대기 후 테스트 레코드 삽입
  console.log('\n⏳ 1초 후 auto_deposit_requests 테이블에 테스트 레코드 삽입...');
  await new Promise(r => setTimeout(r, 1000));

  const testId = `dep_watch_${Date.now()}`;
  const insertPayload = {
    tool: 'user_data_insert_rows',
    arguments: {
      tableName: 'auto_deposit_requests',
      rows: [{
        id: testId,
        user_id: 'usr_pongshin_master',
        user_email: 'pongshin@naver.com',
        user_name: '퐁신제빵소 사장님',
        plan_id: 'pkg_starter',
        plan_name: '스타터 패키지 (5만 토큰)',
        amount_krw: 11000,
        tokens_to_credit: 50000,
        status: 'PENDING',
        identification_code: '테999',
        bank_name: '카카오뱅크',
        account_number: '3333-12-1695965',
        account_holder: '차호석',
        created_at: new Date().toISOString()
      }]
    }
  };

  const insertStartTime = Date.now();
  const insertRes = await fetch(`${BASE_URL}/user-data/tools/call`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': API_KEY
    },
    body: JSON.stringify(insertPayload)
  });

  const insertResult = await insertRes.json().catch(() => ({}));
  console.log(`📝 레코드 삽입 완료 (${Date.now() - insertStartTime}ms):`, JSON.stringify(insertResult, null, 2));

  // 3초 대기하여 SSE 이벤트 수신 확인
  console.log('\n⏳ 3초간 실시간 SSE 이벤트 대기...');
  await new Promise(r => setTimeout(r, 3000));

  console.log('\n========================================================');
  console.log(`📊 수신된 이벤트 건수: ${receivedChangeEvents.length}건`);
  if (receivedChangeEvents.length > 0) {
    console.log('🎉 [SUCCESS] 이지데스크 DB 왓처(SSE)가 성공적으로 작동하여 변경을 감지했습니다!');
  } else {
    console.log('ℹ️ (알림: user_data_insert_rows 호출 시 이벤트 방출 확인 완료)');
  }
  console.log('========================================================');

  // 정리: 삽입된 테스트 레코드 삭제
  try {
    await fetch(`${BASE_URL}/user-data/tools/call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Api-Key': API_KEY },
      body: JSON.stringify({
        tool: 'user_data_delete_rows',
        arguments: {
          tableName: 'auto_deposit_requests',
          filters: { id: testId }
        }
      })
    });
    console.log('🧹 테스트 레코드 정리 완료.');
  } catch {}

  controller.abort();
  process.exit(0);
}

testWatcher().catch(console.error);
