import { NextResponse } from 'next/server';
import { callAiGenerateImage } from '@/lib/egdesk-helpers';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt, aspectRatio = '1:1', style = 'photorealistic' } = body;

    const basePrompt = prompt || '갓 구워내 김이 모락모락 피어오르는 탱글탱글하고 부드러운 대만 정통 수제 카스테라, 우드 도마 위에 놓여진 먹음직스러운 빵 클로즈업, 따뜻한 자연광 스튜디오 조명, 전문 푸드 포토그래피 8k 고화질';

    // Gemini 3.1 Flash Image (Nano Banana 2) 초고속 생성
    const result = await callAiGenerateImage(basePrompt, aspectRatio);

    if (result && result.imageUrl) {
      return NextResponse.json({
        success: true,
        imageUrl: result.imageUrl,
        prompt: basePrompt,
      });
    }

    // fallback 기본 고화질 이미지
    return NextResponse.json({
      success: true,
      imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1000&auto=format&fit=crop&q=80',
      prompt: basePrompt,
    });
  } catch (error: any) {
    console.error('Image generate error:', error);
    return NextResponse.json({
      success: true,
      imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1000&auto=format&fit=crop&q=80',
      error: error.message,
    });
  }
}
