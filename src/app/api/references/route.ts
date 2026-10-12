import { NextResponse } from 'next/server';
import { executeSQL, queryTable, insertRows, callAiCaller } from '@/lib/egdesk-helpers';
import { setupDatabase } from '@/lib/setup-db';

export async function GET(req: Request) {
  try {
    await setupDatabase();
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || 'all';

    // DB에 등록된 레퍼런스 조회 (auto_references 테이블 100% 연동)
    let references: any[] = [];
    try {
      const res = await queryTable('auto_references', { limit: 50, orderBy: 'created_at', orderDirection: 'DESC' });
      if (res && res.rows) {
        references = res.rows.map((r: any) => ({
          id: r.id,
          channel: r.platform || 'youtube',
          media_type: r.platform === 'youtube' ? 'video' : r.platform === 'print' ? 'print' : r.platform === 'smartstore' ? 'detail' : 'image',
          title: r.title,
          url: r.url,
          thumbnail_url: r.thumbnail_url || 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80',
          tags: typeof r.tags === 'string' ? r.tags.split(',') : (r.tags || []),
          analysis: {
            hook: r.hook_dna || '핵심 훅 문구',
            structure: r.layout_dna || '인트로 ➔ 본문 ➔ 콜투액션',
            bgm_tempo: '경쾌한 템포 (120 BPM)',
            color_palette: ['#FFD166', '#FFF3B0', '#333333'],
            marketing_tip: r.hook_dna || '시각적 쾌감을 극대화하세요.',
          },
        }));
      }
    } catch (e) {
      console.warn('Could not query auto_references:', e);
    }

    return NextResponse.json({
      success: true,
      user_references: references,
      curated_benchmarks: references,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await setupDatabase();
    const body = await req.json();
    const { url, title, channel, notes, user_id, business_id } = body;

    if (!url) {
      return NextResponse.json({ success: false, error: 'URL is required' }, { status: 400 });
    }

    // AI를 통한 레퍼런스 DNA 자동 분석
    let aiAnalysis: any = {
      hook: '사용자 지정 벤치마크 콘텐츠',
      structure: '인트로 ➔ 바디 ➔ 콜투액션',
      bgm_tempo: '경쾌한 템포 (120 BPM)',
      color_palette: ['#F39C12', '#2C3E50', '#ECF0F1'],
      marketing_tip: '타깃 고객의 호기심을 유발하는 시각적 훅을 전면에 내세우세요.'
    };

    try {
      const prompt = `다음 마케팅 레퍼런스 링크 또는 콘텐츠를 분석하여 성공 요인 DNA를 JSON 형식으로만 추출해줘.
URL: ${url}
제목/설명: ${title || notes || '마케팅 레퍼런스'}
채널: ${channel || '기타'}

반드시 아래 JSON 형식으로만 한국어로 응답해:
{
  "hook": "핵심 훅 문구 및 시선 강탈 요소",
  "structure": "전체 콘텐츠 진행 구성",
  "bgm_tempo": "권장 BGM 분위기 및 템포",
  "color_palette": ["#색상코드1", "#색상코드2", "#색상코드3"],
  "marketing_tip": "소상공인이 바로 적용할 수 있는 1순위 실전 팁"
}`;

      const aiRes = await callAiCaller(prompt, 'gemini-3.8-flash');
      if (aiRes) {
        const text = typeof aiRes === 'string' ? aiRes : aiRes.text || '';
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          aiAnalysis = JSON.parse(jsonMatch[0]);
        }
      }
    } catch (aiErr) {
      console.warn('AI analysis fallback used:', aiErr);
    }

    // DB에 레퍼런스 저장
    const now = new Date().toISOString();
    const refData = {
      id: `ref_${Date.now()}`,
      business_id: business_id || 'biz_pongshin_baegot',
      title: title || `${channel?.toUpperCase() || '마케팅'} 벤치마크 레퍼런스`,
      url: url,
      platform: channel || 'custom',
      hook_dna: aiAnalysis.hook || '',
      layout_dna: aiAnalysis.structure || '',
      tags: typeof aiAnalysis.tags === 'string' ? aiAnalysis.tags : '벤치마크,마케팅',
      thumbnail_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80',
      created_at: now,
    };

    await insertRows('auto_references', [refData]);

    return NextResponse.json({
      success: true,
      reference: refData,
      analysis: aiAnalysis,
      message: '레퍼런스가 성공적으로 등록 및 분석되었습니다.'
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
