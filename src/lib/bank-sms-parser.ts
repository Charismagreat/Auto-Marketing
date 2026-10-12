/**
 * 🏦 금융(은행/카드사) 입출금 및 결제 알림 SMS 초고속 정밀 파서 (bank-sms-parser.ts)
 * 대한민국 주요 시중은행, 인터넷은행(카카오뱅크, 토스뱅크, 케이뱅크, 국민, 신한, 우리, 하나, 농협, 기업 등)의
 * 입금 통보 문자에서 금액(KRW), 입금자명, 은행명, 계좌번호 끝자리를 추출합니다.
 */

export interface ParsedDepositSms {
  success: boolean;
  bankName: string;
  accountNumber: string;
  amountKrw: number;
  depositCode: string;
  depositorName?: string;
  rawText: string;
  matchedRule: string;
}

// 스팸/광고 제외 키워드
const SPAM_EXCLUDE_KEYWORDS = ['광고', '대출', '금리인하', '한도조회', '이벤트', '마케팅동의', '인증번호'];

/**
 * 텍스트에서 계좌번호 또는 끝자리 추출
 */
export function extractAccountNumber(text: string): string {
  if (!text) return '-';
  const multiHyphenMatch = text.match(/\b([0-9]{2,6}(?:[-*]+[0-9*]+)+)\b/);
  if (multiHyphenMatch) return multiHyphenMatch[1].trim();

  const parenMatch = text.match(/(?:통장|계좌|성명|[가-힣A-Za-z]+)?\s*\(([0-9*]{4,6})\)/);
  if (parenMatch && !parenMatch[1].includes('잔액')) {
    return parenMatch[1];
  }
  return '-';
}

/**
 * 은행명 식별
 */
export function detectBankName(text: string): string {
  if (text.includes('카카오페이') || text.includes('페이머니')) return '카카오페이';
  if (text.includes('카카오뱅크') || text.includes('kakaobank')) return '카카오뱅크';
  if (text.includes('토스뱅크') || text.includes('토스') || text.includes('toss')) return '토스뱅크';
  if (text.includes('케이뱅크')) return '케이뱅크';
  if (text.includes('국민은행') || text.includes('KB국민') || text.includes('[KB]')) return 'KB국민은행';
  if (text.includes('신한은행')) return '신한은행';
  if (text.includes('우리은행')) return '우리은행';
  if (text.includes('하나은행')) return '하나은행';
  if (text.includes('농협') || text.includes('NH농협')) return 'NH농협은행';
  if (text.includes('기업은행') || text.includes('IBK기업')) return 'IBK기업은행';
  if (text.includes('우체국')) return '우체국';
  if (text.includes('새마을금고')) return '새마을금고';
  if (text.includes('신협')) return '신협';
  return '기타은행';
}

/**
 * 은행 SMS 입금 알림 파싱 엔진
 */
export function parseBankDepositSms(text: string): ParsedDepositSms {
  const defaultFail: ParsedDepositSms = {
    success: false,
    bankName: '',
    accountNumber: '',
    amountKrw: 0,
    depositCode: '',
    rawText: text || '',
    matchedRule: 'NONE',
  };

  if (!text || typeof text !== 'string') return defaultFail;

  // 스팸 필터링
  if (SPAM_EXCLUDE_KEYWORDS.some((kw) => text.includes(kw))) {
    return defaultFail;
  }

  // 출금 문자 제외
  if (text.includes('출금') || text.includes('체크카드승인') || text.includes('카드승인') || text.includes('결제완료')) {
    return defaultFail;
  }

  // 입금 키워드 확인
  const isDeposit = text.includes('입금') || text.includes('받음') || text.includes('송금받음') || text.includes('채우기') || text.includes('타행이체');
  if (!isDeposit) return defaultFail;

  const bankName = detectBankName(text);
  const accountNumber = extractAccountNumber(text);

  // 금액 추출 패턴: [0-9,]+원 입금 또는 입금 [0-9,]+원
  let amountKrw = 0;
  let depositorName = '';

  // 패턴 1: 카카오뱅크 형식: [카카오뱅크] 10/12 14:31 3333-12-1695965 입금 11,988원 홍길동 잔액
  const kakaoMatch = text.match(/입금\s*([0-9,]+)원?\s+([가-힣a-zA-Z0-9]+)/);
  if (kakaoMatch) {
    amountKrw = parseInt(kakaoMatch[1].replace(/,/g, ''), 10);
    depositorName = kakaoMatch[2].trim();
    if (depositorName === '잔액' || depositorName === '출금') depositorName = '';
  }

  // 패턴 2: 토스뱅크 형식: 토스뱅크 입금 홍길동 11,988원 또는 [토스] 홍길동님이 11,988원을 보냈어요
  if (!amountKrw) {
    const tossMatch = text.match(/([가-힣a-zA-Z]{2,10})님?(?:이|께서)?\s*([0-9,]+)원/);
    if (tossMatch) {
      depositorName = tossMatch[1].trim();
      amountKrw = parseInt(tossMatch[2].replace(/,/g, ''), 10);
    }
  }

  // 패턴 3: 시중은행 일반형: 입금 11,988원 또는 11,988원 입금
  if (!amountKrw) {
    const genMatch = text.match(/(?:입금|받음)\s*([0-9,]+)원|([0-9,]+)원\s*(?:입금|받음)/);
    if (genMatch) {
      const numStr = (genMatch[1] || genMatch[2]).replace(/,/g, '');
      amountKrw = parseInt(numStr, 10);
    }
  }

  // 보낸 사람 이름 추출 보완
  if (!depositorName) {
    const nameMatch = text.match(/(?:보낸분|입금자|송금자|의뢰인)?\s*[:：]?\s*([가-힣]{2,5})\b/);
    if (nameMatch && nameMatch[1] !== '잔액' && nameMatch[1] !== '입금') {
      depositorName = nameMatch[1];
    }
  }

  if (amountKrw > 0) {
    return {
      success: true,
      bankName,
      accountNumber,
      amountKrw,
      depositCode: depositorName ? `${depositorName.charAt(0)}${amountKrw % 1000}` : '',
      depositorName,
      rawText: text,
      matchedRule: 'REGEX_SMS_PARSER',
    };
  }

  return defaultFail;
}
