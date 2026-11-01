/**
 * Storefront Ops Core Database Entity Definitions
 * Part 4: All tables have organization_id, created_at, updated_at
 */

export type UserRole =
  | 'owner_admin'
  | 'manager'
  | 'fulfillment'
  | 'purchasing'
  | 'marketing'
  | 'support'
  | 'finance'
  | 'viewer';

export interface BaseEntity {
  id: string; // UUID v4
  organization_id: string; // Multi-tenant boundary
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
  deleted_at?: string | null; // Soft delete
}

export interface Organization extends BaseEntity {
  name: string;
  slug: string;
  default_currency: string;
  reporting_currency: string;
  timezone: string;
}

export interface Store extends BaseEntity {
  name: string;
  platform: 'shopify' | 'woocommerce' | 'custom';
  currency: string;
  is_active: boolean;
  last_synced_at?: string;
}

export interface Location extends BaseEntity {
  name: string;
  code: string;
  is_warehouse: boolean;
  address_line1: string;
  city: string;
  country: string;
}

export interface InventoryMovement extends BaseEntity {
  variant_id: string;
  location_id: string;
  quantity_delta: number; // positive = added, negative = deducted
  reason: 'sale' | 'return' | 'damage' | 'loss' | 'found' | 'correction' | 'po_receipt' | 'transfer';
  reference_type: 'order' | 'purchase_order' | 'return' | 'manual' | 'transfer';
  reference_id?: string;
  created_by_user_id: string;
}

export interface AuditLogEntry extends BaseEntity {
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  before_json?: Record<string, unknown>;
  after_json?: Record<string, unknown>;
  ip_address?: string;
}
