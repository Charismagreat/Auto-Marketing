/**
 * egdesk.schema.ts — committed seed schema
 *
 * COMMIT THIS FILE TO GIT.
 *
 * Auto-Marketing 포터블 데이터베이스 스키마 정의
 */

export const TABLES = {
  auto_users: {
    name: 'auto_users',
    displayName: 'Auto-Marketing 회원 대장',
    columns: ['id', 'email', 'name', 'avatar_url', 'token_balance', 'plan', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by'],
    columnCount: 14,
    rowCount: 0,
  },
  auto_businesses: {
    name: 'auto_businesses',
    displayName: 'Auto-Marketing 비즈니스 프로필 대장',
    columns: ['id', 'user_id', 'name', 'category', 'place_id', 'address', 'road_address', 'phone', 'business_hours', 'usp', 'target_audience', 'brand_tone', 'naver_place_url', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by'],
    columnCount: 21,
    rowCount: 0,
  },
  auto_products: {
    name: 'auto_products',
    displayName: 'Auto-Marketing 상품 카탈로그 대장',
    columns: ['id', 'business_id', 'name', 'price', 'description', 'image_url', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by'],
    columnCount: 14,
    rowCount: 0,
  },
  auto_references: {
    name: 'auto_references',
    displayName: 'Auto-Marketing 벤치마크 레퍼런스 대장',
    columns: ['id', 'business_id', 'title', 'url', 'platform', 'hook_dna', 'layout_dna', 'tags', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by'],
    columnCount: 16,
    rowCount: 0,
  },
  auto_assets: {
    name: 'auto_assets',
    displayName: 'Auto-Marketing 마케팅 에셋 대장',
    columns: ['id', 'business_id', 'type', 'title', 'spec', 'component_code', 'preview_url', 'status', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by'],
    columnCount: 16,
    rowCount: 0,
  },
  auto_campaigns: {
    name: 'auto_campaigns',
    displayName: 'Auto-Marketing 마케팅 캘린더 발행 대장',
    columns: ['id', 'business_id', 'title', 'platform', 'scheduled_at', 'status', 'asset_id', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by'],
    columnCount: 15,
    rowCount: 0,
  },
  auto_faqs: {
    name: 'auto_faqs',
    displayName: 'Auto-Marketing 자주 묻는 질문 FAQ 대장',
    columns: ['id', 'category', 'question', 'answer', 'sort_order', 'is_published', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by'],
    columnCount: 14,
    rowCount: 0,
  },
  ai_token_usage_logs: {
    name: 'ai_token_usage_logs',
    displayName: 'Auto-Marketing AI 토큰 소비 로그 대장',
    columns: ['id', 'user_id', 'model', 'prompt_tokens', 'completion_tokens', 'total_tokens', 'cost_points', 'endpoint', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by'],
    columnCount: 16,
    rowCount: 0,
  },
};
