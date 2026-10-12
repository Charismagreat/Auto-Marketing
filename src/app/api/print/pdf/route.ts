import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { getServerEgdeskApiUrl } from '@/lib/egdesk-helpers';
import { EGDESK_CONFIG } from '@/../egdesk.config';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      html,
      format = 'flyer', // 'card' | 'flyer' | 'banner'
      title = '퐁신제빵소_인쇄물',
    } = body;

    if (!html) {
      return NextResponse.json({ success: false, error: '인쇄할 HTML 코드가 필요합니다.' }, { status: 400 });
    }

    // 포맷별 인쇄 규격 설정
    let pageSize = 'A4';
    let landscape = false;
    let formatLabel = 'A4전단지';

    if (format === 'card') {
      pageSize = 'A5'; // 명함 규격 출력용 (또는 90x50 비율)
      landscape = true;
      formatLabel = '명함_90x50';
    } else if (format === 'banner') {
      pageSize = 'A3'; // X배너 비율 인쇄용
      landscape = false;
      formatLabel = 'X배너_입간판';
    }

    // 300 DPI 상업 인쇄소 최적화 래퍼 CSS 주입
    const wrappedHtml = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <title>${title} - 300 DPI 상업 인쇄용</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
    * {
      font-family: Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      box-sizing: border-box;
    }
    @page {
      margin: 0;
      size: ${pageSize} ${landscape ? 'landscape' : 'portrait'};
    }
    body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    .print-container {
      width: 100%;
      height: 100%;
      page-break-inside: avoid;
    }
  </style>
</head>
<body>
  <div class="print-container">
    ${html}
  </div>
</body>
</html>`;

    // 임시 PDF 경로 생성
    const tempFileName = `print_${Date.now()}_${Math.random().toString(36).substring(2, 6)}.pdf`;
    const tempFilePath = path.join(os.tmpdir(), tempFileName);

    const apiUrl = getServerEgdeskApiUrl();
    const egdeskRes = await fetch(`${apiUrl}/file-conversion/tools/call`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': EGDESK_CONFIG.apiKey,
      },
      body: JSON.stringify({
        tool: 'html_to_pdf',
        arguments: {
          html: wrappedHtml,
          outputPath: tempFilePath,
          pageSize,
          landscape,
          printBackground: true,
          margins: { top: 0, bottom: 0, left: 0, right: 0 },
        },
      }),
    });

    if (!egdeskRes.ok) {
      throw new Error(`이지데스크 PDF 변환 실패: ${egdeskRes.statusText}`);
    }

    const egdeskJson = await egdeskRes.json();
    if (!egdeskJson.success) {
      throw new Error(egdeskJson.error || 'PDF 생성 실패');
    }

    // 생성된 PDF 바이너리 읽기
    const fileBuffer = await fs.readFile(tempFilePath);

    // 임시 파일 비동기 정리
    fs.unlink(tempFilePath).catch(() => {});

    // UTF-8 파일명 인코딩
    const downloadFileName = encodeURIComponent(`${title}_${formatLabel}_300DPI.pdf`);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${downloadFileName}"; filename*=UTF-8''${downloadFileName}`,
        'Content-Length': fileBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error('PDF export error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
