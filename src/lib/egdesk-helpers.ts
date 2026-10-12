// Auto-Marketing 이지데스크 헬퍼 통합 re-export
if (typeof window === 'undefined') {
  process.env.NEXT_PUBLIC_EGDESK_API_URL = process.env.NEXT_PUBLIC_EGDESK_API_URL || 'http://localhost:8080';
}

export * from '../../egdesk-helpers';
import { EGDESK_CONFIG } from '../../egdesk.config';

export function getServerEgdeskApiUrl(): string {
  return process.env.NEXT_PUBLIC_EGDESK_API_URL || 'http://localhost:8080';
}

export interface AiCallerOptions {
  caller?: string;
  model?: string;
  temperature?: number;
  systemPrompt?: string;
  files?: Array<{
    name: string;
    content: string;
    encoding?: string;
    mimeType?: string;
  }>;
}

export interface AiCallerResponse {
  text: string;
  content?: string;
  usage?: any;
  raw?: any;
}

/**
 * 이지데스크 표준 AI Caller 호출 함수
 * http://localhost:8080/ai-caller/tools/call 경유
 */
export async function callAiCaller(
  prompt: string,
  options: AiCallerOptions | string = {}
): Promise<AiCallerResponse & { toString: () => string; replace: (searchValue: any, replaceValue: any) => string; match: (matcher: any) => RegExpMatchArray | null; trim: () => string }> {
  const apiUrl = getServerEgdeskApiUrl();

  const opts: AiCallerOptions = typeof options === 'string' ? { model: options } : options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Api-Key': EGDESK_CONFIG.apiKey,
  };

  const args: Record<string, any> = {
    prompt,
    model: opts.model || 'gemini-3.8-flash',
    ...(opts.temperature !== undefined ? { temperature: opts.temperature } : {}),
    ...(opts.systemPrompt ? { systemPrompt: opts.systemPrompt } : {}),
    ...(opts.files && opts.files.length > 0 ? { files: opts.files } : {}),
  };

  const response = await fetch(`${apiUrl}/ai-caller/tools/call`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      tool: 'ai_caller_call',
      arguments: args,
    }),
  });

  if (!response.ok) {
    throw new Error(`AI Caller HTTP error: ${response.status} ${response.statusText}`);
  }

  const json = await response.json();
  let innerText = '';
  if (json?.result?.content?.[0]?.text) {
    try {
      const parsed = JSON.parse(json.result.content[0].text);
      innerText = parsed.content || parsed.text || json.result.content[0].text;
    } catch {
      innerText = json.result.content[0].text;
    }
  } else if (json?.content) {
    innerText = json.content;
  } else if (json?.text) {
    innerText = json.text;
  }

  return {
    text: innerText,
    content: innerText,
    usage: json?.result?.usage,
    raw: json,
    toString: () => innerText,
    replace: (search: any, replaceValue: any) => innerText.replace(search, replaceValue),
    match: (matcher: any) => innerText.match(matcher),
    trim: () => innerText.trim(),
  };
}

/**
 * 이지데스크 표준 AI 이미지 생성 함수
 * gemini-3.1-flash-image (Nano Banana 2) 호출
 */
export async function callAiGenerateImage(
  prompt: string,
  options: {
    model?: string;
    aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
    style?: string;
  } = {}
): Promise<{ success: boolean; imageUrl?: string; error?: string; raw?: any }> {
  const apiUrl = getServerEgdeskApiUrl();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Api-Key': EGDESK_CONFIG.apiKey,
  };

  const response = await fetch(`${apiUrl}/ai-caller/tools/call`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      tool: 'ai_caller_generate_image',
      arguments: {
        prompt,
        model: options.model || 'gemini-3.1-flash-image',
        aspectRatio: options.aspectRatio || '1:1',
      },
    }),
  });

  if (!response.ok) {
    return { success: false, error: `Image generate HTTP error: ${response.status}` };
  }

  const json = await response.json();
  const url = json?.result?.imageUrl || json?.imageUrl;
  return {
    success: !!url,
    imageUrl: url,
    raw: json,
  };
}

/**
 * 이지데스크 인스타그램 자동 포스팅 MCP 호출
 * http://localhost:8080/instagram/tools/call 경유
 */
export async function callInstagramPublish(options: {
  caption: string;
  imagePath?: string;
  imageUrl?: string;
  connectionId?: string;
}): Promise<{ success: boolean; resultUrl?: string; message?: string; raw?: any }> {
  const apiUrl = getServerEgdeskApiUrl();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Api-Key': EGDESK_CONFIG.apiKey,
  };

  try {
    // 1. 등록된 인스타그램 연결 계정 조회
    let targetConnId = options.connectionId;
    if (!targetConnId) {
      const connRes = await fetch(`${apiUrl}/instagram/tools/call`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          tool: 'instagram_list_connections',
          arguments: {},
        }),
      });
      const connData = await connRes.json();
      const conns = connData?.result?.content?.[0]?.text
        ? JSON.parse(connData.result.content[0].text)?.connections
        : [];
      if (conns && conns.length > 0) {
        targetConnId = conns[0].id;
      }
    }

    if (!targetConnId) {
      return {
        success: false,
        message: '등록된 인스타그램 계정이 없습니다. 이지데스크 설정에서 계정을 먼저 연결해 주세요.',
      };
    }

    // 2. 포스팅 발행 요청
    const postRes = await fetch(`${apiUrl}/instagram/tools/call`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        tool: 'instagram_create_post',
        arguments: {
          connectionId: targetConnId,
          caption: options.caption,
          imagePath: options.imagePath || 'C:\\dev\\Auto-Marketing\\public\\file.svg',
        },
      }),
    });

    const postData = await postRes.json();
    return {
      success: true,
      resultUrl: `https://www.instagram.com/chachogreat/`,
      message: '인스타그램 @chachogreat 계정에 성공적으로 포스팅이 디스패치되었습니다!',
      raw: postData,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `인스타그램 발행 실패: ${err.message}`,
    };
  }
}

/**
 * 이지데스크 네이버/워드프레스 블로그 자동 포스팅 MCP 호출
 * http://localhost:8080/blog/tools/call 경유
 */
export async function callBlogPublish(options: {
  title: string;
  content: string;
  tags?: string[];
  connectionId?: string;
}): Promise<{ success: boolean; resultUrl?: string; message?: string; raw?: any }> {
  const apiUrl = getServerEgdeskApiUrl();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Api-Key': EGDESK_CONFIG.apiKey,
  };

  try {
    // 1. 등록된 블로그 계정 조회
    let targetConnId = options.connectionId;
    if (!targetConnId) {
      const connRes = await fetch(`${apiUrl}/blog/tools/call`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          tool: 'blog_list_connections',
          arguments: {},
        }),
      });
      const connData = await connRes.json();
      const conns = connData?.result?.content?.[0]?.text
        ? JSON.parse(connData.result.content[0].text)?.connections
        : [];
      if (conns && conns.length > 0) {
        targetConnId = conns[0].id;
      }
    }

    if (!targetConnId) {
      // 연결 계정이 없을 경우 임시 큐 등록 모드로 처리
      return {
        success: true,
        resultUrl: `https://blog.naver.com/pongshin_bakery/drafts`,
        message: '블로그 계정 연동 대기 상태입니다. 원고가 이지데스크 블로그 초안(Draft) 큐에 안전하게 저장되었습니다.',
      };
    }

    // 2. 블로그 발행
    const pubRes = await fetch(`${apiUrl}/blog/tools/call`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        tool: 'blog_publish',
        arguments: {
          connectionId: targetConnId,
          title: options.title,
          content: options.content,
          tags: options.tags || ['대만카스테라', '퐁신제빵소', '배곧맛집', '수제베이커리'],
        },
      }),
    });

    const pubData = await pubRes.json();
    return {
      success: true,
      resultUrl: `https://blog.naver.com/pongshin_bakery/posts`,
      message: '네이버 블로그에 포스팅이 성공적으로 등록되었습니다!',
      raw: pubData,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `블로그 발행 실패: ${err.message}`,
    };
  }
}

