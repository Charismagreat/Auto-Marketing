import { callPhoneTool, queryTable, executeSQL } from './egdesk-helpers';
import { parseBankDepositSms } from './bank-sms-parser';
import { creditTokens } from './token-wallet';
import { depositEvents } from './deposit-events';

// 주요 은행 대표번호 및 식별 키워드
const BANK_CONVERSATION_KEYWORDS = [
  '1599-3333', // 카카오뱅크
  '카카오뱅크',
  '15993333',
  '토스',
  '1544-7070', // 국민은행
  '1588-5000', // 우리은행
  '1588-1155', // 하나은행
  '1588-1900', // 농협
  '1588-2580', // 기업은행
  '1544-2100', // 신한은행
  '1544-7200',
  '1577-1006',
  '1577-8000',
  '1600-1522',
  '입금',
];

export interface BankSyncResult {
  matched: boolean;
  requestId?: string;
  userEmail?: string;
  amountKrw?: number;
  tokensCredited?: number;
  depositorName?: string;
  smsSnippet?: string;
  error?: string;
}

/**
 * 📲 Google Messages(구글 메시지 웹/스마트폰)를 통해 수신된 최근 은행 SMS를 동기화하고,
 * 대기 중인 입금 세션(PENDING)과 매칭하여 1초 만에 토큰을 자동 충전하는 Agent M 엔진
 */
export async function syncAndMatchBankDepositFromPhone(targetRequestId?: string): Promise<BankSyncResult> {
  try {
    // 1. PENDING 상태의 입금 요청 목록 조회
    const pendingRes = await executeSQL(
      `SELECT * FROM auto_deposit_requests WHERE status = 'PENDING' ${targetRequestId ? `AND id = '${targetRequestId}'` : ''} ORDER BY created_at DESC LIMIT 20;`
    ).catch(() => ({ rows: [] }));

    const pendingRequests = pendingRes.rows || [];
    if (pendingRequests.length === 0) {
      return { matched: false };
    }

    // 2. 연동된 스마트폰 기기 목록 조회
    const devicesRes: any = await callPhoneTool('phone_list_devices', {}).catch(() => null);
    let devices: any[] = [];
    if (Array.isArray(devicesRes)) devices = devicesRes;
    else if (devicesRes?.result?.content?.[0]?.text) {
      try {
        devices = JSON.parse(devicesRes.result.content[0].text);
      } catch {}
    } else if (Array.isArray(devicesRes?.devices)) {
      devices = devicesRes.devices;
    }

    const pairedDevices = devices.filter((d) => d.status === 'paired' || d.profile_path);
    if (pairedDevices.length === 0) {
      return { matched: false, error: '연동된 스마트폰 기기 없음' };
    }

    // 3. 각 기기의 구글 메시지 인박스 스캔
    for (const device of pairedDevices) {
      const deviceId = device.id;

      // 3-1. 인박스 대화 목록 동기화
      await callPhoneTool('phone_sync_conversations', { deviceId }).catch(() => null);

      // 3-2. 대화방 목록 가져오기
      const convsRes: any = await callPhoneTool('phone_list_conversations', { deviceId, limit: 30 }).catch(() => null);
      let conversations: any[] = [];
      if (Array.isArray(convsRes?.conversations)) conversations = convsRes.conversations;
      else if (convsRes?.result?.content?.[0]?.text) {
        try {
          const parsed = JSON.parse(convsRes.result.content[0].text);
          conversations = parsed.conversations || [];
        } catch {}
      }

      // 은행 관련 대화방 또는 최근 대화방 필터링
      const candidateConvs = conversations.filter((c: any) => {
        const title = String(c.title || '');
        const preview = String(c.preview || '');
        return BANK_CONVERSATION_KEYWORDS.some((kw) => title.includes(kw) || preview.includes(kw));
      });

      const targetConvs = candidateConvs.length > 0 ? candidateConvs : conversations.slice(0, 5);

      for (const conv of targetConvs) {
        const convKey = conv.convKey || conv.id;
        const convTitle = conv.title || '알 수 없음';
        if (!convKey) continue;

        // 3-3. 해당 대화방 스레드 동기화
        await callPhoneTool('phone_sync_conversation_thread', {
          deviceId,
          convKey,
          title: convTitle,
          preview: conv.preview || undefined,
        }).catch(() => null);

        // 3-4. 대화방 메시지 목록 가져오기
        const msgsRes: any = await callPhoneTool('phone_list_conversation_messages', {
          deviceId,
          convKey,
          limit: 15,
        }).catch(() => null);

        let messages: any[] = [];
        if (Array.isArray(msgsRes?.messages)) messages = msgsRes.messages;
        else if (msgsRes?.result?.content?.[0]?.text) {
          try {
            const parsed = JSON.parse(msgsRes.result.content[0].text);
            messages = parsed.messages || [];
          } catch {}
        }

        // 3-5. 각 메시지 파싱 및 대기 세션과 비교
        for (const msg of messages) {
          const body = String(msg.text || msg.body || msg.content || '');
          if (!body || body.length < 5) continue;

          const parsedSms = parseBankDepositSms(body);
          if (!parsedSms || !parsedSms.success) continue;

          const smsAmount = parsedSms.amountKrw;
          const smsDepositor = (parsedSms.depositorName || parsedSms.depositCode || '').toLowerCase().trim();

          // 대기 중인 세션들과 매칭
          for (const req of pendingRequests) {
            const reqAmount = Number(req.amount_krw);
            if (reqAmount !== smsAmount) continue;

            const reqDepositor = (req.depositor_name || '').toLowerCase().trim();
            const reqCode = (req.deposit_code || '').toLowerCase().trim();
            const reqUserName = (req.user_name || '').toLowerCase().trim();

            const isMatched =
              (reqDepositor && (smsDepositor.includes(reqDepositor) || reqDepositor.includes(smsDepositor))) ||
              (reqCode && (smsDepositor.includes(reqCode) || reqCode.includes(smsDepositor))) ||
              (reqUserName && (smsDepositor.includes(reqUserName) || reqUserName.includes(smsDepositor))) ||
              (reqAmount % 100 !== 0); // 1원 단위 고유 차등 금액인 경우 100% 매칭

            if (isMatched) {
              console.log(`[Auto-Marketing Agent M] 🎉 입금 문자 매칭 성공: ${req.user_email} (${reqAmount}원 / ${reqDepositor})`);

              const now = new Date().toISOString();

              // 1. 토큰 지급
              await creditTokens(
                req.user_email,
                Number(req.tokens_to_credit),
                `Agent M 무통장 입금 자동 감지 (${parsedSms.bankName || '은행'} ${reqAmount.toLocaleString()}원)`
              );

              // 2. 세션 상태 COMPLETED 업데이트
              const escapedRawSms = body.replace(/'/g, "''");
              await executeSQL(`
                UPDATE auto_deposit_requests 
                SET status = 'COMPLETED',
                    actual_amount_krw = ${reqAmount},
                    raw_sms = '${escapedRawSms}',
                    matched_at = '${now}',
                    updated_at = '${now}',
                    updated_by = 'agent_m_sync'
                WHERE id = '${req.id}';
              `);

              // 3. 전자세금계산서 대장에 입금 건 자동 발행 요청 연동
              await executeSQL(`
                INSERT INTO auto_tax_invoices (id, invoice_no, recipient_name, store_name, biz_number, supply_amount, vat_amount, total_amount, item_name, status, issue_date, created_at)
                VALUES ('inv_${Date.now()}', 'INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}', '${req.depositor_name || req.user_name}', '${req.user_name}', '123-86-09876', ${Math.round(reqAmount / 1.1)}, ${reqAmount - Math.round(reqAmount / 1.1)}, ${reqAmount}, '${req.package_name}', 'ISSUED', '${now.slice(0, 10)}', '${now}')
              `).catch(() => {});

              // 4. 실시간 웹 이벤트 브로드캐스트
              depositEvents.notify({
                type: 'DEPOSIT_COMPLETED',
                requestId: req.id,
                userEmail: req.user_email,
                amountKrw: reqAmount,
                tokensCredited: Number(req.tokens_to_credit),
                depositorName: req.depositor_name,
              });

              return {
                matched: true,
                requestId: req.id,
                userEmail: req.user_email,
                amountKrw: reqAmount,
                tokensCredited: Number(req.tokens_to_credit),
                depositorName: reqDepositor,
                smsSnippet: body.substring(0, 100),
              };
            }
          }
        }
      }
    }

    return { matched: false };
  } catch (err: any) {
    console.error('[Phone-Bank-Sync] Error:', err.message);
    return { matched: false, error: err.message };
  }
}
