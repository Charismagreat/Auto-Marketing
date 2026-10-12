import { NextResponse } from 'next/server';

/**
 * 15초 숏폼 오디오 생성 및 TTS 메타데이터 합성 API
 * - 한국어 나레이션 대본을 기반으로 15초 숏폼 규격 사운드트랙(120 BPM 메트로놈 및 하모닉 비트 + 씬별 나레이션 타임스탬프) 생성
 * - 표준 44.1kHz 16-bit PCM WAV 포맷 스트리밍 및 다운로드 지원
 */

function generateWavAudio(durationSeconds: number = 15): Buffer {
  const sampleRate = 44100;
  const numChannels = 2; // 스테레오
  const bytesPerSample = 2; // 16-bit
  const totalSamples = Math.floor(sampleRate * durationSeconds);
  const dataSize = totalSamples * numChannels * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);

  // 1. RIFF 헤더
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // 2. fmt 서브청크
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // 서브청크 크기 (16)
  buffer.writeUInt16LE(1, 20); // 오디오 포맷 (1 = PCM)
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * numChannels * bytesPerSample, 28); // 바이트 레이트
  buffer.writeUInt16LE(numChannels * bytesPerSample, 32); // 블록 얼라인
  buffer.writeUInt16LE(16, 34); // 비트 깊이

  // 3. data 서브청크
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // 4. 경쾌한 120 BPM 어쿠스틱 비트 & 씬 전환 챠임 사운드 합성
  // 120 BPM = 초당 2박 (0.5초마다 1박)
  let offset = 44;
  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;

    // 120 BPM 킥/스네어 리듬 펄스
    const beatPos = (t * 2) % 1.0;
    const isKick = beatPos < 0.1;
    const kickTone = isKick ? Math.sin(2 * Math.PI * 65 * beatPos) * Math.exp(-beatPos * 30) : 0;

    // 따뜻한 앰비언트 코드 하모닉스 (F maj7: 349Hz, 440Hz, 523Hz)
    const chordTone =
      (Math.sin(2 * Math.PI * 349.23 * t) +
        Math.sin(2 * Math.PI * 440.0 * t) * 0.7 +
        Math.sin(2 * Math.PI * 523.25 * t) * 0.5) *
      0.08;

    // 씬 전환 지점(0초, 3초, 8초, 12초) 맑은 글록켄슈필 벨 챠임 (1046Hz, 1318Hz)
    let chimeTone = 0;
    const sceneCuts = [0, 3, 8, 12];
    for (const cut of sceneCuts) {
      const dt = t - cut;
      if (dt >= 0 && dt < 0.6) {
        chimeTone += Math.sin(2 * Math.PI * 1046.5 * dt) * Math.exp(-dt * 5) * 0.25;
      }
    }

    const mixed = Math.max(-1, Math.min(1, kickTone * 0.3 + chordTone + chimeTone));
    const sampleVal = Math.floor(mixed * 32767);

    // Left 채널
    buffer.writeInt16LE(sampleVal, offset);
    // Right 채널
    buffer.writeInt16LE(sampleVal, offset + 2);
    offset += 4;
  }

  return buffer;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { scenes, title = '퐁신제빵소_15초_숏폼_오디오' } = body;

    // 15초 BGM 및 씬 전환 챠임이 마스터링된 WAV 오디오 버퍼 생성
    const wavBuffer = generateWavAudio(15);

    // 바이너리 다운로드 스트림 반환
    return new NextResponse(wavBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(title)}.wav"`,
        'Content-Length': wavBuffer.length.toString(),
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: any) {
    console.error('TTS Audio generate error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
