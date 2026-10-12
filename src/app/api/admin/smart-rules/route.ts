import { NextResponse } from 'next/server';

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

let mockRules: SmartRule[] = [
  {
    id: 'rule-01',
    name: '🌧️ 비 오는 날 따뜻한 갓구운 빵 & 부침개 긴급 프로모션',
    conditionType: 'WEATHER',
    conditionSummary: '기상청 강수 확률 70% 이상 또는 비 감지 시 (오전 10:30)',
    targetChannel: 'karrot',
    actionTemplate: '당근마켓 비즈프로필 소식 자동 등록: "비 오는 날 방문 고객 아메리카노 1잔 무료 쿠폰"',
    isActive: true,
    lastTriggeredAt: '2026-10-10 10:30:00',
    totalTriggeredCount: 14,
  },
  {
    id: 'rule-02',
    name: '🔥 불타는 금요일 주말 모임 예약 유도 릴스/블로그',
    conditionType: 'DAY_TIME',
    conditionSummary: '매주 금요일 오후 16:00 정기 트리거',
    targetChannel: 'instagram',
    actionTemplate: '인스타그램 릴스 캡션 & 네이버 블로그: 주말 단체 예약 혜택 콘텐츠 동시 디스패치',
    isActive: true,
    lastTriggeredAt: '2026-10-09 16:00:00',
    totalTriggeredCount: 28,
  },
  {
    id: 'rule-03',
    name: '🏷️ 당일 마감 2시간 전 깜짝 타임세일 자동 쿠폰',
    conditionType: 'STOCK',
    conditionSummary: '영업 종료 2시간 전 (매일 20:00)',
    targetChannel: 'naver_place',
    actionTemplate: '네이버 스마트플레이스 새소식 등록: "마감 세일 30% 즉시 할인 쿠폰" 자동 활성화',
    isActive: false,
    lastTriggeredAt: '2026-10-08 20:00:00',
    totalTriggeredCount: 8,
  },
  {
    id: 'rule-04',
    name: '🎈 법정 공휴일 & 기념일 축하 프로모션',
    conditionType: 'HOLIDAY',
    conditionSummary: '공휴일 D-1일 오전 11:00',
    targetChannel: 'all',
    actionTemplate: '7대 채널 1-Click 번들 생성 엔진 호출 ➔ 온·오프라인 에셋 동시 디스패치',
    isActive: true,
    lastTriggeredAt: '2026-10-02 11:00:00',
    totalTriggeredCount: 5,
  },
];

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: {
        rules: mockRules,
        total: mockRules.length,
        activeCount: mockRules.filter((r) => r.isActive).length,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || '스마트 규칙 조회 실패' },
      { status: 500 }
    );
  }
}

// 규칙 토글, 즉시 실행, 신규 등록
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, ruleId, newRule } = body;

    // 1. 활성/비활성 토글
    if (action === 'toggle' && ruleId) {
      const rule = mockRules.find((r) => r.id === ruleId);
      if (!rule) return NextResponse.json({ success: false, error: '규칙 없음' }, { status: 404 });
      rule.isActive = !rule.isActive;
      return NextResponse.json({
        success: true,
        message: `규칙이 ${rule.isActive ? '활성화' : '비활성화'}되었습니다.`,
        rule,
      });
    }

    // 2. 즉시 1회 실행(Run Now)
    if (action === 'run_now' && ruleId) {
      const rule = mockRules.find((r) => r.id === ruleId);
      if (!rule) return NextResponse.json({ success: false, error: '규칙 없음' }, { status: 404 });

      rule.lastTriggeredAt = new Date().toISOString().replace('T', ' ').substring(0, 19);
      rule.totalTriggeredCount += 1;

      return NextResponse.json({
        success: true,
        message: `[${rule.name}] 스마트 규칙이 즉시 수동 트리거되었습니다. 대상 채널로 디스패치 큐가 적재되었습니다.`,
        rule,
      });
    }

    // 3. 신규 규칙 등록
    if (action === 'create' && newRule) {
      const created: SmartRule = {
        id: `rule-${Date.now()}`,
        name: newRule.name || '새 마케팅 자동화 규칙',
        conditionType: newRule.conditionType || 'DAY_TIME',
        conditionSummary: newRule.conditionSummary || '지정 조건 충족 시',
        targetChannel: newRule.targetChannel || 'karrot',
        actionTemplate: newRule.actionTemplate || '콘텐츠 자동 발행',
        isActive: true,
        totalTriggeredCount: 0,
      };
      mockRules.push(created);
      return NextResponse.json({
        success: true,
        message: '새 스마트 규칙이 등록되었습니다.',
        rule: created,
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

// 규칙 삭제
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const ruleId = searchParams.get('id');

    if (ruleId) {
      mockRules = mockRules.filter((r) => r.id !== ruleId);
      return NextResponse.json({ success: true, message: '규칙이 삭제되었습니다.' });
    }

    return NextResponse.json({ success: false, error: '규칙 ID 누락' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || '규칙 삭제 실패' }, { status: 500 });
  }
}
