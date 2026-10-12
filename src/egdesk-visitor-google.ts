// Central re-export of root egdesk-visitor-google
export * from '../egdesk-visitor-google';

// 기본 비민감 구글 로그인 권한 (단순 원클릭 구글 로그인)
export const VISITOR_BASIC_SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'openid',
] as const;
