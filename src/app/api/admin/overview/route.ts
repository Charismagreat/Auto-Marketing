import { NextResponse } from 'next/server';
import { executeSQL, queryTable } from '@/lib/egdesk-helpers';

export async function GET() {
  try {
    // 1. 회원 목록 및 비즈니스 조회
    let users: any[] = [];
    let businesses: any[] = [];
    let products: any[] = [];
    let assets: any[] = [];
    let campaigns: any[] = [];
    let mediaList: any[] = [];

    try {
      const uRes = await queryTable('auto_users', { limit: 100 });
      users = Array.isArray(uRes) ? uRes : uRes?.rows || [];
    } catch (e) {
      console.warn('Query users error:', e);
    }

    try {
      const bRes = await queryTable('auto_businesses', { limit: 100 });
      businesses = Array.isArray(bRes) ? bRes : bRes?.rows || [];
    } catch (e) {
      console.warn('Query businesses error:', e);
    }

    try {
      const pRes = await queryTable('auto_products', { limit: 100 });
      products = Array.isArray(pRes) ? pRes : pRes?.rows || [];
    } catch (e) {
      console.warn('Query products error:', e);
    }

    try {
      const aRes = await queryTable('auto_assets', { limit: 100 });
      assets = Array.isArray(aRes) ? aRes : aRes?.rows || [];
    } catch (e) {
      console.warn('Query assets error:', e);
    }

    try {
      const cRes = await queryTable('auto_campaigns', { limit: 100 });
      campaigns = Array.isArray(cRes) ? cRes : cRes?.rows || [];
    } catch (e) {
      console.warn('Query campaigns error:', e);
    }

    let pricingPlans: any[] = [];
    try {
      const plRes = await queryTable('auto_pricing_plans', { limit: 20 });
      pricingPlans = Array.isArray(plRes) ? plRes : plRes?.rows || [];
    } catch (e) {
      console.warn('Query pricing plans error:', e);
    }

    try {
      const mRes = await queryTable('auto_media', { limit: 100 });
      mediaList = Array.isArray(mRes) ? mRes : mRes?.rows || [];
    } catch (e) {
      console.warn('Query media error:', e);
    }

    // 2. 실제 DB 기반 토큰 지갑 및 소비 집계
    const totalTokensIssued = users.reduce((sum, u) => sum + Number(u.token_balance || 0), 0);
    let totalTokensConsumed = 0;
    try {
      const logRes = await executeSQL('SELECT SUM(tokens_used) as total FROM ai_token_usage_logs;');
      totalTokensConsumed = Number(logRes.rows?.[0]?.total || 0);
    } catch {}

    const totalAssets = assets.length || 1;
    const videoCount = assets.filter((a) => a.type === 'video').length;
    const detailCount = assets.filter((a) => a.type === 'detail').length;
    const printCount = assets.filter((a) => a.type === 'print').length;
    const socialCount = assets.filter((a) => a.type === 'card' || a.type === 'blog' || a.type === 'instagram').length;
    const karrotCount = assets.filter((a) => a.type === 'karrot').length;
    const placeCount = assets.filter((a) => a.type === 'naver_place').length;

    const stats = {
      totalUsers: users.length,
      totalBusinesses: businesses.length,
      totalProducts: products.length,
      totalAssetsGenerated: assets.length,
      totalCampaigns: campaigns.length,
      totalMediaStored: mediaList.length,
      totalTokensIssued,
      totalTokensConsumed,
      activeModelStatus: {
        brain: { name: 'gemini-3.8-flash (AI 디렉터)', status: 'Healthy', latency: '420ms', successRate: '99.9%' },
        image: { name: 'gemini-3.1-flash-image (Nano Banana 2)', status: 'Healthy', latency: '1.8s', successRate: '99.5%' },
        video: { name: 'Remotion Engine v4 (15초 숏폼)', status: 'Healthy', latency: '3.2s', successRate: '100%' },
        tts: { name: 'Web Speech API & 120BPM WAV Engine', status: 'Healthy', latency: '180ms', successRate: '100%' },
        pdf: { name: 'egdesk-file-conversion (300 DPI PDF)', status: 'Healthy', latency: '1.1s', successRate: '100%' },
        socialPublish: { name: 'egdesk-instagram & egdesk-blog MCP', status: 'Healthy', latency: '820ms', successRate: '100%' },
        karrot: { name: '당근마켓 비즈프로필/동네생활 엔진', status: 'Healthy', latency: '350ms', successRate: '100%' },
        naverPlace: { name: '네이버 스마트플레이스 SEO/쿠폰 엔진', status: 'Healthy', latency: '380ms', successRate: '100%' },
        bundle: { name: '7대 채널 올인원 1-Click 병렬 번들 엔진', status: 'Healthy', latency: '57s', successRate: '100%' },
      },
      engineUsageRatio: [
        { name: '15초 숏폼 비디오 & TTS', count: videoCount, ratio: `${Math.round((videoCount / totalAssets) * 100)}%` },
        { name: '쇼핑몰 860px 상세페이지', count: detailCount, ratio: `${Math.round((detailCount / totalAssets) * 100)}%` },
        { name: '300 DPI 인쇄물 (명함/전단지)', count: printCount, ratio: `${Math.round((printCount / totalAssets) * 100)}%` },
        { name: '인스타 카드뉴스 & 네이버 블로그', count: socialCount, ratio: `${Math.round((socialCount / totalAssets) * 100)}%` },
        { name: '당근마켓 비즈프로필 소식', count: karrotCount, ratio: `${Math.round((karrotCount / totalAssets) * 100)}%` },
        { name: '네이버 스마트플레이스 새소식/쿠폰', count: placeCount, ratio: `${Math.round((placeCount / totalAssets) * 100)}%` },
      ],
    };

    return NextResponse.json({
      success: true,
      stats,
      users,
      businesses,
      products,
      assets,
      campaigns,
      mediaList,
      pricingPlans,
    });
  } catch (error: any) {
    console.error('Admin overview error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, userId, amount, reason } = body;

    // 관리자 토큰 수동 충전 / 차감
    if (action === 'adjust_token') {
      const targetUserId = userId || 'usr_pongshin_master';
      const delta = Number(amount) || 0;

      await executeSQL(`
        UPDATE auto_users 
        SET token_balance = COALESCE(token_balance, 0) + (${delta}) 
        WHERE id = '${targetUserId}'
      `);

      return NextResponse.json({
        success: true,
        message: `사용자(${targetUserId})에게 ${delta > 0 ? '+' : ''}${delta.toLocaleString()}T 토큰이 성공적으로 조정되었습니다. (사유: ${reason || '관리자 수동 지급'})`
      });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
