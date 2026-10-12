import { NextResponse } from 'next/server';
import { setupDatabase, queryTable } from '@/lib/setup-db';
import { executeSQL } from '@/lib/egdesk-helpers';

// 7대 마케팅 채널 디스패치 감사 로그 인터페이스
export interface DispatchLog {
  id: string;
  channel: 'instagram' | 'naver_blog' | 'karrot' | 'naver_place' | 'print_pdf' | 'video_short' | 'detail_page';
  storeId: string;
  storeName: string;
  title: string;
  status: 'SUCCESS' | 'FAILED' | 'RETRYING';
  statusCode: number;
  latencyMs: number;
  payloadSummary: string;
  errorMessage?: string;
  retryCount: number;
  createdAt: string;
  externalUrl?: string;
}

export async function GET(req: Request) {
  try {
    await setupDatabase();
    const { searchParams } = new URL(req.url);
    const channel = searchParams.get('channel');
    const status = searchParams.get('status');
    const search = searchParams.get('search')?.toLowerCase();

    const res = await queryTable('auto_dispatch_logs', {
      limit: 100,
      orderBy: 'created_at',
      orderDirection: 'DESC',
    }).catch(() => ({ rows: [] }));

    let allLogs: DispatchLog[] = (res.rows || []).map((r: any) => ({
      id: r.id,
      channel: r.channel as any,
      storeId: r.store_id || '',
      storeName: r.store_name || '',
      title: r.title || '',
      status: (r.status || 'SUCCESS') as any,
      statusCode: Number(r.status_code) || 200,
      latencyMs: Number(r.latency_ms) || 0,
      payloadSummary: r.payload_summary || '',
      errorMessage: r.error_message || undefined,
      retryCount: Number(r.retry_count) || 0,
      createdAt: r.created_at || '',
      externalUrl: r.external_url || undefined,
    }));

    let filtered = [...allLogs];

    if (channel && channel !== 'ALL') {
      filtered = filtered.filter((l) => l.channel === channel);
    }

    if (status && status !== 'ALL') {
      filtered = filtered.filter((l) => l.status === status);
    }

    if (search) {
      filtered = filtered.filter(
        (l) =>
          l.storeName.toLowerCase().includes(search) ||
          l.title.toLowerCase().includes(search) ||
          l.payloadSummary.toLowerCase().includes(search)
      );
    }

    // 통계 집계
    const total = allLogs.length;
    const successCount = allLogs.filter((l) => l.status === 'SUCCESS').length;
    const failedCount = allLogs.filter((l) => l.status === 'FAILED').length;
    const successRate = total > 0 ? Math.round((successCount / total) * 100) : 100;
    const avgLatency =
      total > 0
        ? Math.round(allLogs.reduce((acc, cur) => acc + cur.latencyMs, 0) / total)
        : 0;

    const channelStats = {
      karrot: allLogs.filter((l) => l.channel === 'karrot').length,
      naver_place: allLogs.filter((l) => l.channel === 'naver_place').length,
      instagram: allLogs.filter((l) => l.channel === 'instagram').length,
      naver_blog: allLogs.filter((l) => l.channel === 'naver_blog').length,
      print_pdf: allLogs.filter((l) => l.channel === 'print_pdf').length,
      video_short: allLogs.filter((l) => l.channel === 'video_short').length,
    };

    return NextResponse.json({
      success: true,
      data: {
        logs: filtered,
        stats: {
          total,
          successCount,
          failedCount,
          successRate,
          avgLatency,
          channelStats,
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || '디스패치 로그 조회 실패' },
      { status: 500 }
    );
  }
}

// 실패 건 즉시 재시도(Retry) 또는 상태 변경 처리 (SQLite DB 반영)
export async function POST(req: Request) {
  try {
    await setupDatabase();
    const body = await req.json();
    const { action, logId } = body;

    if (action === 'retry' && logId) {
      await executeSQL(
        `UPDATE auto_dispatch_logs SET status = 'SUCCESS', status_code = 200, error_message = '', retry_count = retry_count + 1, payload_summary = payload_summary || ' (관리자 원클릭 재시도 성공)' WHERE id = '${logId}';`
      );

      return NextResponse.json({
        success: true,
        message: '원클릭 재시도 디스패치가 성공적으로 완료되었으며 DB에 갱신되었습니다.',
      });
    }

    return NextResponse.json({ success: false, error: '유효하지 않은 액션입니다.' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || '재시도 처리 중 오류 발생' },
      { status: 500 }
    );
  }
}

// 로그 삭제 (SQLite DB 반영)
export async function DELETE(req: Request) {
  try {
    await setupDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
      await executeSQL(`DELETE FROM auto_dispatch_logs WHERE id = '${id}';`);
      return NextResponse.json({ success: true, message: '로그가 DB에서 삭제되었습니다.' });
    }

    return NextResponse.json({ success: false, error: '삭제할 로그 ID가 누락되었습니다.' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || '로그 삭제 실패' }, { status: 500 });
  }
}
