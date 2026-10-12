import { NextResponse } from 'next/server';
import { TOKEN_PACKAGES, creditTokens } from '@/lib/token-wallet';
import { setupDatabase, executeSQL } from '@/lib/setup-db';
import { syncAndMatchBankDepositFromPhone } from '@/lib/phone-bank-sync';
import { depositEvents } from '@/lib/deposit-events';

// 대표 운영사 입금 기본 계좌 정보
export const DEFAULT_BANK_INFO = {
  bankName: '카카오뱅크',
  accountNumber: '3333-12-1695965',
  accountHolder: '차호석',
};

export async function GET(request: Request) {
  try {
    await setupDatabase();
    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('requestId');
    const userEmail = searchParams.get('userEmail');

    // 1. 단일 세션 조회 (사용자 결제 모달 1초 폴링)
    if (requestId) {
      // 폰 동기화 1회 시도 (백그라운드 매칭 트리거)
      syncAndMatchBankDepositFromPhone(requestId).catch(() => {});

      const res = await executeSQL(`SELECT * FROM auto_deposit_requests WHERE id = '${requestId}' LIMIT 1;`);
      const row = (res.rows || [])[0];
      if (!row) {
        return NextResponse.json({ success: false, error: '요청을 찾을 수 없습니다.' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        deposit: row,
        isCompleted: row.status === 'COMPLETED',
      });
    }

    // 2. 전체 또는 유저별 입금 대장 조회 (관리자 콘솔용)
    let sql = `SELECT * FROM auto_deposit_requests WHERE 1=1 `;
    if (userEmail) {
      sql += `AND user_email = '${userEmail.toLowerCase().trim()}' `;
    }
    sql += `ORDER BY created_at DESC LIMIT 50;`;

    const res = await executeSQL(sql);
    return NextResponse.json({
      success: true,
      deposits: res.rows || [],
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await setupDatabase();
    const body = await request.json();
    const { userEmail, userName, packageId, depositorName, phoneNumber } = body;

    const email = (userEmail || 'guest@automarketing.com').toLowerCase().trim();
    const cleanDepositorName = (depositorName || userName || '홍길동').trim();

    if (!cleanDepositorName || cleanDepositorName.length < 2) {
      return NextResponse.json(
        { success: false, error: '실제 송금하실 분의 성함(입금자명)을 2글자 이상 입력해 주세요.' },
        { status: 400 }
      );
    }

    const pkg = TOKEN_PACKAGES.find((p) => p.id === packageId) || TOKEN_PACKAGES[1];

    // 1원 단위 난수 할인 금액 계산 (1~99원 할인 혜택 + 고유 입금 감지용)
    let discountKrw = Math.floor(1 + Math.random() * 99);
    let finalAmountKrw = pkg.priceKrw - discountKrw;

    // 최근 30분 내 중복 방지
    for (let attempt = 0; attempt < 5; attempt++) {
      const checkRes = await executeSQL(
        `SELECT id FROM auto_deposit_requests WHERE status = 'PENDING' AND amount_krw = ${finalAmountKrw} LIMIT 1;`
      ).catch(() => ({ rows: [] }));

      if (!checkRes.rows || checkRes.rows.length === 0) break;
      discountKrw = Math.floor(1 + Math.random() * 99);
      finalAmountKrw = pkg.priceKrw - discountKrw;
    }

    const requestId = `dep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const depositCode = `${cleanDepositorName.charAt(0)}${finalAmountKrw % 1000}`;
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1시간 유효

    // 관리자 페이지(auto_footer_configs)에서 설정한 무통장 수령 계좌 우선 조회
    let bankInfo = DEFAULT_BANK_INFO;
    try {
      const footerRes = await queryTable('auto_footer_configs', { limit: 1 }).catch(() => ({ rows: [] }));
      const fRow = footerRes.rows?.[0];
      if (fRow && fRow.deposit_account_number) {
        bankInfo = {
          bankName: fRow.deposit_bank_name || DEFAULT_BANK_INFO.bankName,
          accountNumber: fRow.deposit_account_number || DEFAULT_BANK_INFO.accountNumber,
          accountHolder: fRow.deposit_account_holder || DEFAULT_BANK_INFO.accountHolder,
        };
      }
    } catch (e) {
      console.warn('Load deposit bank info error:', e);
    }

    const insertSql = `
      INSERT INTO auto_deposit_requests (
        id, deposit_code, depositor_name, user_email, user_name,
        package_id, package_name, original_amount_krw, discount_krw, amount_krw,
        tokens_to_credit, bank_name, account_number, account_holder, phone_number,
        receipt_sent, status, actual_amount_krw, expires_at, created_at, updated_at
      ) VALUES (
        '${requestId}', '${depositCode}', '${cleanDepositorName}', '${email}', '${userName || cleanDepositorName}',
        '${pkg.id}', '${pkg.name}', ${pkg.priceKrw}, ${discountKrw}, ${finalAmountKrw},
        ${pkg.tokens}, '${bankInfo.bankName}', '${bankInfo.accountNumber}', '${bankInfo.accountHolder}', '${phoneNumber || ''}',
        0, 'PENDING', 0, '${expiresAt}', '${now}', '${now}'
      );
    `;

    await executeSQL(insertSql);

    // 신규 생성 직후 백그라운드 폰 동기화 1회 즉시 호출
    syncAndMatchBankDepositFromPhone(requestId).catch(() => {});

    return NextResponse.json({
      success: true,
      deposit: {
        requestId,
        depositCode,
        depositorName: cleanDepositorName,
        packageId: pkg.id,
        packageName: pkg.name,
        tokensToCredit: pkg.tokens,
        originalAmountKrw: pkg.priceKrw,
        discountKrw,
        amountKrw: finalAmountKrw,
        bankName: bankInfo.bankName,
        accountNumber: bankInfo.accountNumber,
        accountHolder: bankInfo.accountHolder,
        expiresAt,
      },
    });
  } catch (err: any) {
    console.error('[DirectDeposit POST] Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * 관리자 수동 승인 / 보류 / 취소 처리
 */
export async function PATCH(request: Request) {
  try {
    await setupDatabase();
    const body = await request.json();
    const { requestId, action, holdReason } = body;

    if (!requestId || !action) {
      return NextResponse.json({ success: false, error: 'requestId 및 action 파라미터가 필요합니다.' }, { status: 400 });
    }

    const checkRes = await executeSQL(`SELECT * FROM auto_deposit_requests WHERE id = '${requestId}' LIMIT 1;`);
    const req = (checkRes.rows || [])[0];
    if (!req) {
      return NextResponse.json({ success: false, error: '해당 입금 요청을 찾을 수 없습니다.' }, { status: 404 });
    }

    const now = new Date().toISOString();

    if (action === 'APPROVE') {
      // 1. 토큰 지급
      await creditTokens(
        req.user_email,
        Number(req.tokens_to_credit),
        `관리자 수동 입금 승인 (${req.package_name || '토큰 패키지'})`
      );

      // 2. 상태 COMPLETED 변경
      await executeSQL(`
        UPDATE auto_deposit_requests 
        SET status = 'COMPLETED',
            actual_amount_krw = ${req.amount_krw},
            matched_at = '${now}',
            updated_at = '${now}',
            updated_by = 'admin_manual'
        WHERE id = '${requestId}';
      `);

      // 3. 전자세금계산서 대장에 발행 내역 자동 기록
      await executeSQL(`
        INSERT INTO auto_tax_invoices (id, invoice_no, recipient_name, store_name, biz_number, supply_amount, vat_amount, total_amount, item_name, status, issue_date, created_at)
        VALUES ('inv_${Date.now()}', 'INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}', '${req.depositor_name || req.user_name}', '${req.user_name}', '123-86-09876', ${Math.round(req.amount_krw / 1.1)}, ${req.amount_krw - Math.round(req.amount_krw / 1.1)}, ${req.amount_krw}, '${req.package_name}', 'ISSUED', '${now.slice(0, 10)}', '${now}')
      `).catch(() => {});

      depositEvents.notify({
        type: 'DEPOSIT_COMPLETED',
        requestId: req.id,
        userEmail: req.user_email,
        amountKrw: req.amount_krw,
        tokensCredited: Number(req.tokens_to_credit),
        depositorName: req.depositor_name,
      });

      return NextResponse.json({ success: true, message: '수동 입금 승인이 완료되었습니다.' });
    }

    if (action === 'HOLD') {
      await executeSQL(`
        UPDATE auto_deposit_requests 
        SET status = 'HOLD',
            hold_reason = '${(holdReason || '관리자 수동 보류').replace(/'/g, "''")}',
            updated_at = '${now}',
            updated_by = 'admin_manual'
        WHERE id = '${requestId}';
      `);
      return NextResponse.json({ success: true, message: '입금 보류 처리되었습니다.' });
    }

    if (action === 'CANCEL') {
      await executeSQL(`
        UPDATE auto_deposit_requests 
        SET status = 'CANCELLED',
            updated_at = '${now}',
            updated_by = 'admin_manual'
        WHERE id = '${requestId}';
      `);
      return NextResponse.json({ success: true, message: '입금 요청이 취소되었습니다.' });
    }

    return NextResponse.json({ success: false, error: '유효하지 않은 action입니다.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
