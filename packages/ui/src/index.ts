/**
 * Storefront Ops UI Design Tokens & Visual Primitives
 * Part 6: Dense, calm, readable data UI. Semantic status colors with icon + text.
 */

export type StatusVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export interface StatusPillConfig {
  label: string;
  variant: StatusVariant;
  iconName: string;
}

export const ORDER_STATUS_CONFIGS: Record<string, StatusPillConfig> = {
  pending_payment: { label: 'Pending Payment', variant: 'warning', iconName: 'Clock' },
  paid: { label: 'Paid', variant: 'success', iconName: 'CheckCircle2' },
  on_hold: { label: 'On Hold', variant: 'danger', iconName: 'AlertOctagon' },
  ready_to_pack: { label: 'Ready to Pack', variant: 'info', iconName: 'PackageOpen' },
  packing: { label: 'Packing', variant: 'warning', iconName: 'Box' },
  packed: { label: 'Packed', variant: 'info', iconName: 'PackageCheck' },
  shipped: { label: 'Shipped', variant: 'info', iconName: 'Truck' },
  delivered: { label: 'Delivered', variant: 'success', iconName: 'CheckCheck' },
  cancelled: { label: 'Cancelled', variant: 'neutral', iconName: 'Ban' },
  returned: { label: 'Returned', variant: 'warning', iconName: 'RotateCcw' },
  partially_fulfilled: { label: 'Partial', variant: 'warning', iconName: 'Boxes' },
};

export const STOCK_STATUS_CONFIGS: Record<string, StatusPillConfig> = {
  ok: { label: 'In Stock', variant: 'success', iconName: 'Check' },
  low: { label: 'Low Stock', variant: 'warning', iconName: 'AlertTriangle' },
  out: { label: 'Stockout', variant: 'danger', iconName: 'AlertCircle' },
  overstock: { label: 'Overstock', variant: 'neutral', iconName: 'Layers' },
};
