/**
 * Storefront Ops Database TypeScript Entity Definitions
 * Part 4: Complete Data Model
 */

import type { OrderStatus } from '@storefront-ops/core';

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
  organization_id: string; // Multi-tenant foreign key
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
  deleted_at?: string | null;
}

export interface Organization extends BaseEntity {
  name: string;
  slug: string;
  default_currency: string;
  reporting_currency: string;
  timezone: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Membership extends BaseEntity {
  user_id: string;
  role: UserRole;
}

export interface Store extends BaseEntity {
  name: string;
  platform: 'shopify' | 'woocommerce' | 'custom';
  currency: string;
  is_active: boolean;
  last_synced_at?: string | null;
}

export interface Location extends BaseEntity {
  name: string;
  code: string;
  is_warehouse: boolean;
  address_line1?: string | null;
  city?: string | null;
  country: string;
}

export interface Bin extends BaseEntity {
  location_id: string;
  code: string;
  zone?: string | null;
  shelf?: string | null;
}

export interface Product extends BaseEntity {
  title: string;
  description?: string | null;
  vendor?: string | null;
  product_type?: string | null;
  status: 'active' | 'draft' | 'archived';
  tags: string[];
}

export interface Variant extends BaseEntity {
  product_id: string;
  title: string;
  sku: string;
  barcode?: string | null;
  price_minor: number; // Integer minor units (e.g. cents)
  compare_at_price_minor?: number | null;
  cost_minor: number;
  currency: string;
  weight_grams: number;
  reorder_point: number;
}

export interface InventoryLevel extends BaseEntity {
  variant_id: string;
  location_id: string;
  bin_id?: string | null;
  on_hand: number;
  committed: number;
  incoming: number;
}

export interface InventoryMovement extends BaseEntity {
  variant_id: string;
  location_id: string;
  quantity_delta: number;
  reason: 'sale' | 'return' | 'damage' | 'loss' | 'found' | 'correction' | 'po_receipt' | 'transfer';
  reference_type: 'order' | 'purchase_order' | 'return' | 'manual' | 'transfer';
  reference_id?: string | null;
  created_by_user_id?: string | null;
}

export interface Customer extends BaseEntity {
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  total_spent_minor: number;
  orders_count: number;
  tags: string[];
  marketing_consent: boolean;
}

export interface Order extends BaseEntity {
  store_id?: string | null;
  customer_id: string;
  order_number: string;
  status: OrderStatus;
  currency: string;
  subtotal_minor: number;
  discount_minor: number;
  shipping_minor: number;
  tax_minor: number;
  total_minor: number;
  payment_status: 'unpaid' | 'authorized' | 'paid' | 'partially_refunded' | 'refunded' | 'voided';
  fulfillment_status: 'unfulfilled' | 'partially_fulfilled' | 'fulfilled';
  risk_level: 'low' | 'medium' | 'high';
  shipping_address: Record<string, unknown>;
  billing_address: Record<string, unknown>;
  tags: string[];
  notes?: string | null;
  assigned_user_id?: string | null;
  placed_at: string;
}

export interface OrderLine extends BaseEntity {
  order_id: string;
  variant_id: string;
  title: string;
  sku: string;
  quantity: number;
  fulfilled_quantity: number;
  returned_quantity: number;
  unit_price_minor: number;
  total_price_minor: number;
}

export interface Payment extends BaseEntity {
  order_id: string;
  gateway: string;
  external_transaction_id: string;
  amount_minor: number;
  fee_minor: number;
  currency: string;
  status: string;
  fraud_risk_score?: number | null;
}

export interface Shipment extends BaseEntity {
  order_id: string;
  carrier: string;
  service_level?: string | null;
  tracking_number?: string | null;
  tracking_url?: string | null;
  label_url?: string | null;
  cost_minor: number;
  status: string;
}

export interface PurchaseOrder extends BaseEntity {
  supplier_id: string;
  po_number: string;
  status: 'draft' | 'sent' | 'confirmed' | 'partially_received' | 'received' | 'closed' | 'cancelled';
  currency: string;
  subtotal_minor: number;
  landed_cost_minor: number;
  total_minor: number;
  destination_location_id: string;
  expected_delivery_date?: string | null;
}

export interface Ticket extends BaseEntity {
  customer_id?: string | null;
  order_id?: string | null;
  ticket_number: string;
  subject: string;
  channel: string;
  status: 'new' | 'open' | 'pending' | 'solved' | 'closed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  assigned_user_id?: string | null;
  sla_due_at?: string | null;
  tags: string[];
}

export interface Task extends BaseEntity {
  title: string;
  description?: string | null;
  status: 'todo' | 'in_progress' | 'blocked' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_user_id?: string | null;
  team?: string | null;
  due_date?: string | null;
  linked_entity_type?: string | null;
  linked_entity_id?: string | null;
}

export interface AuditLogEntry extends BaseEntity {
  user_id?: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  before_json?: Record<string, unknown> | null;
  after_json?: Record<string, unknown> | null;
  ip_address?: string | null;
}
