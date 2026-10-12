import { NextResponse } from 'next/server';
import { setupDatabase, executeSQL } from '@/lib/setup-db';
import { callPhoneTool } from '@/lib/egdesk-helpers';
import { syncAndMatchBankDepositFromPhone } from '@/lib/phone-bank-sync';
import { parseBankDepositSms } from '@/lib/bank-sms-parser';
import { creditTokens } from '@/lib/token-wallet';
import { depositEvents } from '@/lib/deposit-events';

export async function GET() {
  try {
    await setupDatabase();

    // 1. 등록된 폰 기기 목록
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

    // 2. 최근 입금 대장 현황
    const statsRes = await executeSQL(`
      SELECT 
        COUNT(*) as total_count,
        SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_count,
        SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN status = 'HOLD' THEN 1 ELSE 0 END) as hold_count,
        SUM(CASE WHEN status = 'COMPLETED' THEN amount_krw ELSE 0 END) as total_revenue_krw
      FROM auto_deposit_requests;
    `).catch(() => ({ rows: [{}] }));

    const stats = statsRes.rows?.[0] || {};

    return NextResponse.json({
      success: true,
      agentStatus: {
        engine: 'Agent M (무통장 입금 자동 감지 엔진)',
        version: '2.4.0',
        isOnline: devices.length > 0,
        pairedDevices: devices,
        stats: {
          totalCount: Number(stats.total_count || 0),
          completedCount: Number(stats.completed_count || 0),
          pendingCount: Number(stats.pending_count || 0),
          holdCount: Number(stats.hold_count || 0),
          totalRevenueKrw: Number(stats.total_revenue_krw || 0),
        },
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * 즉시 동기화 트리거 또는 가상 테스트 입금 수신 시뮬레이션
 */
export async function POST(request: Request) {
  try {
    await setupDatabase();
    const body = await request.json().catch(() => ({}));
    const { action, simulatedSms } = body;

    // 1. 가상 테스트 입금 SMS 시뮬레이션 (개발 및 관리자 검증용)
    if (action === 'SIMULATE_SMS' && simulatedSms) {
      const parsed = parseBankDepositSms(simulatedSms);
      if (!parsed.success) {
        return NextResponse.json({
          success: false,
          error: '문자 형식에서 은행 입금 정보를 추출할 수 없습니다.',
          parsed,
        });
      }

      // 대기 중인 PENDING 건 조회
      const pendingRes = await executeSQL(
        `SELECT * FROM auto_deposit_requests WHERE status = 'PENDING' AND amount_krw = ${parsed.amountKrw} LIMIT 1;`
      );

      const req = (pendingRes.rows || [])[0];
      if (!req) {
        return NextResponse.json({
          success: false,
          message: `입금 금액(${parsed.amountKrw.toLocaleString()}원)과 일치하는 대기 세션(PENDING)이 없습니다.`,
          parsed,
        });
      }

      const now = new Date().toISOString();

      // 토큰 지급
      await creditTokens(
        req.user_email,
        Number(req.tokens_to_credit),
        `Agent M 가상 시뮬레이션 감지 (${parsed.bankName} ${parsed.amountKrw.toLocaleString()}원)`
      );

      // 세션 완료 업데이트
      const escapedSms = simulatedSms.replace(/'/g, "''");
      await executeSQL(`
        UPDATE auto_deposit_requests 
        SET status = 'COMPLETED',
            actual_amount_krw = ${parsed.amountKrw},
            raw_sms = '${escapedSms}',
            matched_at = '${now}',
            updated_at = '${now}',
            updated_by = 'simulated_sms'
        WHERE id = '${req.id}';
      `);

      // 세금계산서 대장 기록
      await executeSQL(`
        INSERT INTO auto_tax_invoices (id, invoice_no, recipient_name, store_name, biz_number, supply_amount, vat_amount, total_amount, item_name, status, issue_date, created_at)
        VALUES ('inv_${Date.now()}', 'INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}', '${req.depositor_name || req.user_name}', '${req.user_name}', '123-86-09876', ${Math.round(parsed.amountKrw / 1.1)}, ${parsed.amountKrw - Math.round(parsed.amountKrw / 1.1)}, ${parsed.amountKrw}, '${req.package_name}', 'ISSUED', '${now.slice(0, 10)}', '${now}')
      `).catch(() => {});

      depositEvents.notify({
        type: 'DEPOSIT_COMPLETED',
        requestId: req.id,
        userEmail: req.user_email,
        amountKrw: parsed.amountKrw,
        tokensCredited: Number(req.tokens_to_credit),
        depositorName: req.depositor_name,
      });

      return NextResponse.json({
        success: true,
        message: `🎉 가상 입금 문자 감지 성공! 토큰 ${Number(req.tokens_to_credit).toLocaleString()}T가 즉시 충전되었습니다.`,
        matchedRequest: req,
        parsed,
      });
    }

    // 2. 기본: 연동 스마트폰 즉시 동기화 실행
    const syncResult = await syncAndMatchBankDepositFromPhone();

    return NextResponse.json({
      success: true,
      syncResult,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
