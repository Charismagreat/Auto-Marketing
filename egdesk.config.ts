/**
 * EGDesk User Data Configuration
 * Generated at: 2026-10-12T13:53:11.808Z
 *
 * This file contains type-safe definitions for your EGDesk tables.
 */

export const EGDESK_CONFIG = {
  apiUrl: 'http://localhost:8080',
  tunnelUrl: 'https://tunneling-service.onrender.com/t/mcp-server-fxkud1',
  apiKey: 'a67ddc0f-7e2b-4997-9a0b-9667a74c89d0',
} as const;

export interface TableDefinition {
  name: string;
  displayName: string;
  description?: string;
  /** Omitted or unknown until synced / counted */
  rowCount?: number;
  columnCount: number;
  columns: string[];
}

export const TABLES = {
  table1: {
    name: 'auto_token_logs',
    displayName: 'Auto-Marketing 토큰 지급차감 감사 대장',
    rowCount: 8,
    columnCount: 17,
    columns: ['id', '_version', 'user_id', 'user_name', 'type', 'amount', 'balance_after', 'reason', 'admin_name', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table2: {
    name: 'auto_deposit_requests',
    displayName: 'Auto-Marketing 무통장 입금 자동 감지 및 충전 대장',
    rowCount: 12,
    columnCount: 33,
    columns: ['id', '_version', 'deposit_code', 'depositor_name', 'user_email', 'user_name', 'package_id', 'package_name', 'original_amount_krw', 'discount_krw', 'amount_krw', 'tokens_to_credit', 'bank_name', 'account_number', 'account_holder', 'phone_number', 'receipt_sent', 'receipt_sent_at', 'status', 'actual_amount_krw', 'hold_reason', 'tx_hash', 'expires_at', 'raw_sms', 'matched_at', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table3: {
    name: 'auto_footer_configs',
    displayName: 'Auto-Marketing 사업자 정보 및 법무 약관 대장',
    rowCount: 1,
    columnCount: 22,
    columns: ['id', '_version', 'company_name', 'ceo_name', 'biz_number', 'mail_order_number', 'address', 'tel', 'email', 'hosting_provider', 'privacy_manager', 'copyright_text', 'terms_of_service', 'privacy_policy', 'refund_policy', 'updated_at', 'uuid', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table4: {
    name: 'auto_smart_rules',
    displayName: 'Auto-Marketing 스마트 자동화 규칙 대장',
    rowCount: 4,
    columnCount: 18,
    columns: ['id', '_version', 'name', 'condition_type', 'condition_summary', 'target_channel', 'action_template', 'is_active', 'last_triggered_at', 'total_triggered_count', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table5: {
    name: 'auto_sms_logs',
    displayName: 'Auto-Marketing SMS 알림톡 발송 대장',
    rowCount: 2,
    columnCount: 19,
    columns: ['id', '_version', 'type', 'recipient_store', 'recipient_phone', 'sender_number', 'content', 'bytes', 'status', 'cost', 'sent_at', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table6: {
    name: 'auto_inquiry_replies',
    displayName: 'Auto-Marketing 점주 CS 문의 답변 대장',
    rowCount: 1,
    columnCount: 14,
    columns: ['id', '_version', 'inquiry_id', 'author', 'content', 'is_ai_draft', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table7: {
    name: 'auto_inquiries',
    displayName: 'Auto-Marketing 점주 CS 문의 티켓 대장',
    rowCount: 2,
    columnCount: 22,
    columns: ['id', '_version', 'store_id', 'store_name', 'author_name', 'contact', 'category', 'category_label', 'title', 'content', 'status', 'priority', 'sentiment', 'internal_note', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table8: {
    name: 'auto_prompt_templates',
    displayName: 'Auto-Marketing AI 프롬프트 템플릿 대장',
    rowCount: 3,
    columnCount: 20,
    columns: ['id', '_version', 'channel', 'name', 'category', 'temperature', 'max_tokens', 'top_p', 'system_prompt', 'user_prompt_template', 'variables', 'version', 'updated_at', 'created_at', 'uuid', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table9: {
    name: 'auto_dispatch_logs',
    displayName: 'Auto-Marketing 외부 채널 디스패치 로그 대장',
    rowCount: 3,
    columnCount: 21,
    columns: ['id', '_version', 'channel', 'store_id', 'store_name', 'title', 'status', 'status_code', 'latency_ms', 'payload_summary', 'error_message', 'retry_count', 'external_url', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table10: {
    name: 'auto_tax_invoices',
    displayName: 'Auto-Marketing 전자세금계산서 대장',
    rowCount: 9,
    columnCount: 22,
    columns: ['id', '_version', 'invoice_number', 'nts_approval_number', 'store_name', 'biz_number', 'ceo_name', 'email', 'item_description', 'supply_amount', 'vat_amount', 'total_amount', 'status', 'issue_date', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table11: {
    name: 'auto_model_costs',
    displayName: 'Auto-Marketing AI 모델 원가 대장',
    rowCount: 4,
    columnCount: 15,
    columns: ['id', '_version', 'name', 'provider', 'type', 'unit_cost', 'typical_calls', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table12: {
    name: 'auto_pricing_plans',
    displayName: 'Auto-Marketing SaaS 요금제 대장',
    rowCount: 3,
    columnCount: 16,
    columns: ['id', '_version', 'name', 'monthly_price', 'token_quota', 'estimated_bundles', 'estimated_cost', 'margin_rate', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table13: {
    name: 'auto_media',
    displayName: 'Auto-Marketing 미디어 스토리지 대장',
    rowCount: 3,
    columnCount: 16,
    columns: ['id', '_version', 'business_id', 'name', 'type', 'mime_type', 'url', 'size_bytes', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table14: {
    name: 'ai_token_usage_logs',
    displayName: 'Auto-Marketing AI 토큰 소비 로그 대장',
    rowCount: 22,
    columnCount: 17,
    columns: ['id', '_version', 'user_id', 'model', 'prompt_tokens', 'completion_tokens', 'total_tokens', 'cost_points', 'endpoint', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table15: {
    name: 'auto_faqs',
    displayName: 'Auto-Marketing 자주 묻는 질문 FAQ 대장',
    rowCount: 5,
    columnCount: 15,
    columns: ['id', '_version', 'category', 'question', 'answer', 'sort_order', 'is_published', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table16: {
    name: 'auto_campaigns',
    displayName: 'Auto-Marketing 마케팅 캘린더 발행 대장',
    rowCount: 17,
    columnCount: 16,
    columns: ['id', '_version', 'business_id', 'title', 'platform', 'scheduled_at', 'status', 'asset_id', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table17: {
    name: 'auto_assets',
    displayName: 'Auto-Marketing 마케팅 에셋 대장',
    rowCount: 15,
    columnCount: 17,
    columns: ['id', '_version', 'business_id', 'type', 'title', 'spec', 'component_code', 'preview_url', 'status', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table18: {
    name: 'auto_references',
    displayName: 'Auto-Marketing 벤치마크 레퍼런스 대장',
    rowCount: 13,
    columnCount: 17,
    columns: ['id', '_version', 'business_id', 'title', 'url', 'platform', 'hook_dna', 'layout_dna', 'tags', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table19: {
    name: 'auto_products',
    displayName: 'Auto-Marketing 상품 카탈로그 대장',
    rowCount: 3,
    columnCount: 15,
    columns: ['id', '_version', 'business_id', 'name', 'price', 'description', 'image_url', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table20: {
    name: 'auto_businesses',
    displayName: 'Auto-Marketing 비즈니스 프로필 대장',
    rowCount: 1,
    columnCount: 22,
    columns: ['id', '_version', 'user_id', 'name', 'category', 'place_id', 'address', 'road_address', 'phone', 'business_hours', 'usp', 'target_audience', 'brand_tone', 'naver_place_url', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition,
  table21: {
    name: 'auto_users',
    displayName: 'Auto-Marketing 회원 대장',
    rowCount: 2,
    columnCount: 15,
    columns: ['id', '_version', 'email', 'name', 'avatar_url', 'token_balance', 'plan', 'created_at', 'uuid', 'updated_at', 'updated_by', 'deleted_at', 'deleted_by', 'restored_at', 'restored_by']
  } as TableDefinition
} as const;


// Main table (first table by default)
export const MAIN_TABLE = TABLES.table1;


// Helper to get table by name
export function getTableByName(tableName: string): TableDefinition | undefined {
  return Object.values(TABLES).find(t => t.name === tableName);
}

// Export table names for easy access
export const TABLE_NAMES = {
  table1: 'auto_token_logs',
  table2: 'auto_deposit_requests',
  table3: 'auto_footer_configs',
  table4: 'auto_smart_rules',
  table5: 'auto_sms_logs',
  table6: 'auto_inquiry_replies',
  table7: 'auto_inquiries',
  table8: 'auto_prompt_templates',
  table9: 'auto_dispatch_logs',
  table10: 'auto_tax_invoices',
  table11: 'auto_model_costs',
  table12: 'auto_pricing_plans',
  table13: 'auto_media',
  table14: 'ai_token_usage_logs',
  table15: 'auto_faqs',
  table16: 'auto_campaigns',
  table17: 'auto_assets',
  table18: 'auto_references',
  table19: 'auto_products',
  table20: 'auto_businesses',
  table21: 'auto_users'
} as const;
