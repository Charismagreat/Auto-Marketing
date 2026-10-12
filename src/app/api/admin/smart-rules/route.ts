import { NextResponse } from 'next/server';
import { setupDatabase, queryTable, insertRows } from '@/lib/setup-db';
import { executeSQL } from '@/lib/egdesk-helpers';

export interface SmartRule {
  id: string;
  name: string;
  conditionType: 'WEATHER' | 'DAY_TIME' | 'STOCK' | 'HOLIDAY';
  conditionSummary: string;
  targetChannel: 'karrot' | 'naver_place' | 'instagram' | 'naver_blog' | 'print_pdf' | 'all';
  actionTemplate: string;
  isActive: boolean;
  lastTriggeredAt?: string;
  totalTriggeredCount: number;
}

export async function GET() {
  try {
    await setupDatabase();
    const res = await queryTable('auto_smart_rules', { limit: 50, orderBy: 'created_at', orderDirection: 'ASC' }).catch(() => ({ rows: [] }));

    const rules: SmartRule[] = (res.rows || []).map((r: any) => ({
      id: r.id,
      name: r.name || '',
      conditionType: (r.condition_type || 'DAY_TIME') as any,
      conditionSummary: r.condition_summary || '',
      targetChannel: (r.target_channel || 'karrot') as any,
      actionTemplate: r.action_template || '',
      isActive: Boolean(r.is_active),
      lastTriggeredAt: r.last_triggered_at || undefined,
      totalTriggeredCount: Number(r.total_triggered_count) || 0,
    }));

    return NextResponse.json({
      success: true,
      data: {
        rules,
        total: rules.length,
        activeCount: rules.filter((r) => r.isActive).length,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || '스마트 규칙 조회 실패' },
      { status: 500 }
    );
  }
}

// 규칙 토글, 즉시 실행, 신규 등록 (SQLite DB 영구 반영)
export async function POST(req: Request) {
  try {
    await setupDatabase();
    const body = await req.json();
    const { action, ruleId, newRule } = body;

    // 1. 활성/비활성 토글
    if (action === 'toggle' && ruleId) {
      await executeSQL(
        `UPDATE auto_smart_rules SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END WHERE id = '${ruleId}';`
      );

      return NextResponse.json({
        success: true,
        message: '규칙 활성화 상태가 SQLite DB에 성공적으로 변경되었습니다.',
      });
    }

    // 2. 즉시 1회 실행(Run Now)
    if (action === 'run_now' && ruleId) {
      const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
      await executeSQL(
        `UPDATE auto_smart_rules SET total_triggered_count = total_triggered_count + 1, last_triggered_at = '${now}' WHERE id = '${ruleId}';`
      );

      return NextResponse.json({
        success: true,
        message: '스마트 규칙이 즉시 수동 트리거되었으며 DB 실행 카운트가 갱신되었습니다.',
      });
    }

    // 3. 신규 규칙 등록
    if (action === 'create' && newRule) {
      const createdId = `rule-${Date.now()}`;
      const now = new Date().toISOString();

      await insertRows('auto_smart_rules', [
        {
          id: createdId,
          name: newRule.name || '새 마케팅 자동화 규칙',
          condition_type: newRule.conditionType || 'DAY_TIME',
          condition_summary: newRule.conditionSummary || '지정 조건 충족 시',
          target_channel: newRule.targetChannel || 'karrot',
          action_template: newRule.actionTemplate || '콘텐츠 자동 발행',
          is_active: 1,
          total_triggered_count: 0,
          created_at: now,
        },
      ]);

      return NextResponse.json({
        success: true,
        message: '새 스마트 규칙이 SQLite DB에 성공적으로 등록되었습니다.',
      });
    }

    return NextResponse.json({ success: false, error: '유효하지 않은 액션입니다.' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || '규칙 처리 중 오류 발생' },
      { status: 500 }
    );
  }
}

// 규칙 삭제 (SQLite DB 영구 반영)
export async function DELETE(req: Request) {
  try {
    await setupDatabase();
    const { searchParams } = new URL(req.url);
    const ruleId = searchParams.get('id');

    if (ruleId) {
      await executeSQL(`DELETE FROM auto_smart_rules WHERE id = '${ruleId}';`);
      return NextResponse.json({ success: true, message: '규칙이 DB에서 영구 삭제되었습니다.' });
    }

    return NextResponse.json({ success: false, error: '규칙 ID 누락' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || '규칙 삭제 실패' }, { status: 500 });
  }
}
